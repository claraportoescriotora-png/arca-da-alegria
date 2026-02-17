
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper: Fetch folder HTML
async function fetchFolderHtml(url: string): Promise<string> {
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch folder. Status: ${response.status}`);
    }

    return await response.text();
}

// Helper: Extract folder IDs from HTML
function extractSubfolderIds(html: string): Array<{ id: string, name: string }> {
    const folders = [];
    // Google Drive uses format like: ["FOLDER_ID", "FOLDER_NAME", null, "application/vnd.google-apps.folder"]
    const folderRegex = /"([\w-]{15,})"\s*,\s*"([^"]+)"\s*,\s*[^,]*\s*,\s*"application\/vnd\.google-apps\.folder"/g;

    let match;
    while ((match = folderRegex.exec(html)) !== null) {
        const [_, id, name] = match;
        if (id.length > 20) {
            folders.push({ id, name });
        }
    }

    return folders;
}

// Helper: Extract PDF files from HTML
function extractPdfFiles(html: string): Array<{ id: string, name: string }> {
    const files = [];

    // Multiple strategies to find PDFs
    const strategies = [
        /"([\w-]{15,})"\s*,\s*"([^"]+)"\s*,\s*[^,]*\s*,\s*"application\/pdf"/g,
        /"([\w-]{15,})".{1,200}?"([^"]+\.pdf)".{1,200}?"application\/pdf"/g,
        /\["([\w-]{15,})","([^"]+)",[^\]]*"application\/pdf"/g
    ];

    for (const regex of strategies) {
        let match;
        while ((match = regex.exec(html)) !== null) {
            const [_, id, name] = match;
            if (id.length > 20 && !id.includes(' ') && !files.find(f => f.id === id)) {
                files.push({ id, name });
            }
        }
    }

    return files;
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

        console.log(`Starting RECURSIVE import for: ${folderUrl}`);

        // 1. Fetch main folder
        const mainHtml = await fetchFolderHtml(folderUrl);

        // 2. Extract subfolders
        const subfolders = extractSubfolderIds(mainHtml);
        console.log(`Found ${subfolders.length} subfolders`);

        // 3. Extract files from main folder (if any)
        let allFiles = extractPdfFiles(mainHtml);

        // 4. Process each subfolder
        for (const folder of subfolders) {
            try {
                const subfolderUrl = `https://drive.google.com/drive/folders/${folder.id}`;
                console.log(`Fetching subfolder: ${folder.name}`);

                const subHtml = await fetchFolderHtml(subfolderUrl);
                const subFiles = extractPdfFiles(subHtml);

                // Tag files with their category (folder name)
                subFiles.forEach(file => {
                    file.category = folder.name;
                });

                allFiles = [...allFiles, ...subFiles];
            } catch (error) {
                console.error(`Error in subfolder ${folder.name}:`, error);
                // Continue with other folders
            }
        }

        console.log(`Total PDFs found across all folders: ${allFiles.length}`);

        // 5. DB Insertion
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
                    description: `Importado do Google Drive`,
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
            subfoldersProcessed: subfolders.length,
            message: `Processado ${subfolders.length} pastas. Encontrados: ${allFiles.length} PDFs. Importados: ${importedCount}.`
        });

    } catch (error: any) {
        console.error('CRITICAL HANDLER ERROR:', error);
        return res.status(200).json({
            success: false,
            error: error.message || 'Unknown server error',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}
