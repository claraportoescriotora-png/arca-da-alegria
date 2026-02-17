
import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface DriveFile {
    id: string;
    name: string;
    category?: string;
}

// Helper: Create JWT for Google Service Account
function createJWT(serviceAccount: any): string {
    const now = Math.floor(Date.now() / 1000);

    const header = {
        alg: 'RS256',
        typ: 'JWT'
    };

    const payload = {
        iss: serviceAccount.client_email,
        scope: 'https://www.googleapis.com/auth/drive.readonly',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now
    };

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');

    const signatureInput = `${encodedHeader}.${encodedPayload}`;

    const sign = crypto.createSign('RSA-SHA256');
    sign.update(signatureInput);
    sign.end();

    const signature = sign.sign(serviceAccount.private_key, 'base64url');

    return `${signatureInput}.${signature}`;
}

// Helper: Exchange JWT for access token
async function getAccessToken(serviceAccount: any): Promise<string> {
    const jwt = createJWT(serviceAccount);

    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: jwt
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get access token: ${error}`);
    }

    const data = await response.json();
    return data.access_token;
}

// Helper: Extract folder ID from URL
function extractFolderId(url: string): string | null {
    const match = url.match(/folders\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
}

// Helper: List files in a folder using authenticated API call
async function listFilesInFolder(folderId: string, accessToken: string): Promise<{ files: DriveFile[], subfolders: Array<{ id: string, name: string }> }> {
    const url = `https://www.googleapis.com/drive/v3/files?` + new URLSearchParams({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(id, name, mimeType)',
        pageSize: '1000'
    });

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Google Drive API error: ${response.statusText} - ${error}`);
    }

    const data = await response.json();

    const files: DriveFile[] = [];
    const subfolders: Array<{ id: string, name: string }> = [];

    for (const file of data.files || []) {
        if (file.mimeType === 'application/vnd.google-apps.folder') {
            subfolders.push({ id: file.id, name: file.name });
        } else if (file.mimeType === 'application/pdf') {
            files.push({ id: file.id, name: file.name });
        }
    }

    return { files, subfolders };
}

// Recursive: Process folder and all subfolders
async function processFolder(folderId: string, accessToken: string, category?: string): Promise<DriveFile[]> {
    const { files, subfolders } = await listFilesInFolder(folderId, accessToken);

    // Tag files with category
    const taggedFiles = files.map(f => ({ ...f, category: category || 'Geral' }));

    // Process subfolders recursively
    const subfolderFiles: DriveFile[] = [];
    for (const subfolder of subfolders) {
        const nestedFiles = await processFolder(subfolder.id, accessToken, subfolder.name);
        subfolderFiles.push(...nestedFiles);
    }

    return [...taggedFiles, ...subfolderFiles];
}

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const { folderUrl } = req.body;

        if (!folderUrl) {
            return res.status(400).json({ success: false, error: 'Folder URL is required' });
        }

        // Get service account credentials
        const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS;
        if (!credentials) {
            return res.status(500).json({
                success: false,
                error: 'GOOGLE_SERVICE_ACCOUNT_CREDENTIALS not configured in environment variables'
            });
        }

        const serviceAccount = JSON.parse(credentials);

        const folderId = extractFolderId(folderUrl);
        if (!folderId) {
            return res.status(400).json({
                success: false,
                error: 'Invalid Google Drive folder URL. Expected format: https://drive.google.com/drive/folders/[FOLDER_ID]'
            });
        }

        console.log(`Starting recursive import for folder: ${folderId}`);

        // Get access token
        const accessToken = await getAccessToken(serviceAccount);

        // Process folder recursively
        const allFiles = await processFolder(folderId, accessToken);

        console.log(`Found ${allFiles.length} PDF files across all folders`);

        // DB Insertion
        let importedCount = 0;
        let skippedCount = 0;

        for (const file of allFiles) {
            const { data: existing } = await supabase
                .from('activities')
                .select('id')
                .eq('file_id', file.id)
                .single();

            if (!existing) {
                const downloadUrl = `https://drive.google.com/uc?export=download&id=${file.id}`;
                const title = file.name.replace('.pdf', '').replace(/[-_]/g, ' ');

                const { error } = await supabase.from('activities').insert({
                    title: title,
                    description: `Importado do Google Drive - ${file.category}`,
                    type: 'coloring',
                    category: file.category || 'Geral',
                    file_id: file.id,
                    pdf_url: downloadUrl,
                    image_url: null,
                    is_active: true
                });

                if (error) {
                    console.error(`DB Error ${file.name}:`, error);
                } else {
                    importedCount++;
                }
            } else {
                skippedCount++;
            }
        }

        return res.status(200).json({
            success: true,
            imported: importedCount,
            totalFound: allFiles.length,
            skipped: skippedCount,
            message: `✅ Importação concluída! Encontrados: ${allFiles.length} PDFs. Novos: ${importedCount}. Já existentes: ${skippedCount}.`
        });

    } catch (error: any) {
        console.error('CRITICAL HANDLER ERROR:', error);
        return res.status(200).json({
            success: false,
            error: error.message || 'Unknown server error',
            hint: error.message?.includes('GOOGLE_SERVICE_ACCOUNT') ?
                'Configure GOOGLE_SERVICE_ACCOUNT_CREDENTIALS na Vercel com o JSON da Service Account' :
                error.message?.includes('access token') ?
                    'Verifique se as credenciais da Service Account estão corretas' :
                    'Verifique se a Service Account tem permissão de leitura na pasta do Drive (compartilhe a pasta com o email da Service Account)'
        });
    }
}
