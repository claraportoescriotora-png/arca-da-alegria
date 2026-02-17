
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const GOOGLE_API_KEY = process.env.GOOGLE_DRIVE_API_KEY || '';

interface DriveFile {
    id: string;
    name: string;
    category?: string;
}

// Helper: Extract folder ID from URL
function extractFolderId(url: string): string | null {
    const match = url.match(/folders\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
}

// Helper: List files in a folder using Google Drive API (fetch-based, no googleapis dependency)
async function listFilesInFolder(folderId: string, apiKey: string): Promise<{ files: DriveFile[], subfolders: Array<{ id: string, name: string }> }> {
    const url = `https://www.googleapis.com/drive/v3/files?` + new URLSearchParams({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(id, name, mimeType)',
        pageSize: '1000',
        key: apiKey
    });

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Google Drive API error: ${response.statusText}`);
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
async function processFolder(folderId: string, apiKey: string, category?: string): Promise<DriveFile[]> {
    const { files, subfolders } = await listFilesInFolder(folderId, apiKey);

    // Tag files with category
    const taggedFiles = files.map(f => ({ ...f, category: category || 'Geral' }));

    // Process subfolders recursively
    const subfolderFiles: DriveFile[] = [];
    for (const subfolder of subfolders) {
        const nestedFiles = await processFolder(subfolder.id, apiKey, subfolder.name);
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

        if (!GOOGLE_API_KEY || GOOGLE_API_KEY === 'YOUR_API_KEY_HERE') {
            return res.status(500).json({
                success: false,
                error: 'Google Drive API key not configured. Please add your API key to .env.local as GOOGLE_DRIVE_API_KEY'
            });
        }

        const folderId = extractFolderId(folderUrl);
        if (!folderId) {
            return res.status(400).json({
                success: false,
                error: 'Invalid Google Drive folder URL. Expected format: https://drive.google.com/drive/folders/[FOLDER_ID]'
            });
        }

        console.log(`Starting recursive API import for folder: ${folderId}`);

        // Process folder recursively
        const allFiles = await processFolder(folderId, GOOGLE_API_KEY);

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
            hint: error.message?.includes('API') ? 'Verifique se a API do Google Drive está habilitada e a chave está correta' : undefined
        });
    }
}
