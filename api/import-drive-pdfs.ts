
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: any, res: any) {
    // 1. Method Check
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    // Global Guard for JSON Response
    try {
        const { folderUrl } = req.body;

        // 2. Input Validation
        if (!folderUrl) {
            return res.status(400).json({ success: false, error: 'Folder URL is required' });
        }

        console.log(`Starting import for folder: ${folderUrl}`);

        // 3. Native Fetch (No Dependencies)
        const response = await fetch(folderUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
            }
        });

        if (!response.ok) {
            return res.status(response.status).json({
                success: false,
                error: `Failed to fetch Drive folder. Status: ${response.status}`
            });
        }

        const html = await response.text();

        // 4. Pure Regex Parsing (No Cheerio)
        // Matches roughly: "ID", "Name", "mimetype"
        // We look for the specific sequence that Google uses for files.
        // Pattern: "ID" (15+ chars), "Name" (anything), "application/pdf"
        // The regex is permissive to allow for variations in the JSON structure.
        const pdfRegex = /"([\w-]{15,})".{1,300}?"([^"]{3,})".{1,300}?"application\/pdf"/g;

        const filesToImport: any[] = [];
        let match;
        let matchCount = 0;

        while ((match = pdfRegex.exec(html)) !== null) {
            matchCount++;
            const [_, id, name] = match;

            // Basic filtering to ensure it's a valid file ID and not some UI element ID
            // Drive IDs are usually long alphanumeric strings without spaces
            // We also filter out names that look like URLs or HTML tags
            if (id.length > 20 && !id.includes(' ') && !name.includes('<') && !name.startsWith('http')) {
                filesToImport.push({
                    id,
                    name,
                    type: 'coloring',
                    category: 'Geral'
                });
            }
        }

        console.log(`Regex matches: ${matchCount}`);

        // 5. Deduplicate
        const uniqueFiles = Array.from(new Map(filesToImport.map(item => [item.id, item])).values());

        // 6. DB Insertion
        let importedCount = 0;
        let skippedCount = 0;

        for (const file of uniqueFiles) {
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
                    category: file.category,
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

        // 7. Success Response (Always JSON)
        return res.status(200).json({
            success: true,
            imported: importedCount,
            totalFound: uniqueFiles.length,
            skipped: skippedCount,
            message: `Processado. Encontrados: ${uniqueFiles.length}. Importados: ${importedCount}.`,
            debug: {
                matchesTotal: matchCount,
                matchesUnique: uniqueFiles.length,
                htmlLength: html.length,
                // Return a safe snippet of HTML for debugging logic without breaking JSON
                htmlSnippet: html.substring(0, 1000).replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
            }
        });

    } catch (error: any) {
        console.error('CRITICAL HANDLER ERROR:', error);

        // 8. Error Response (Always JSON)
        // Ensure we never break the JSON structure, even for stack traces
        return res.status(200).json({
            success: false,
            error: error.message || 'Unknown server error',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}
