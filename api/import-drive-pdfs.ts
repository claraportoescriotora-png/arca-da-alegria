
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const { folderUrl } = req.body;

        if (!folderUrl) {
            return res.status(400).json({ success: false, error: 'Folder URL is required' });
        }

        console.log(`Starting import for folder: ${folderUrl}`);

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

        // MULTI-STRATEGY PARSING
        // We try strictly from most specific to least specific.

        let filesToImport: any[] = [];
        let matchCount = 0;

        // Strategy 1: Look for the specific JSON structure Google uses for file lists
        // e.g. ["ID", "Name", null, "application/pdf"]
        // We match strict quoted strings for ID and Name
        const strictRegex = /"([\w-]{15,})"\s*,\s*"([^"]+)"\s*,\s*[^,]*\s*,\s*"application\/pdf"/g;

        // Strategy 2: Relaxed "Proximity" Regex
        // Looks for ID ... Name ... application/pdf within a reasonable distance (200 chars)
        const relaxedRegex = /"([\w-]{15,})".{1,200}?"([^"]{3,})".{1,200}?"application\/pdf"/g;

        // Strategy 3: "Array-like" fallback
        // ["[ID]","[Name]", ... "application/pdf"]
        const arrayRegex = /\["([\w-]{15,})","([^"]+)",[^\]]*"application\/pdf"/g;

        const strategies = [strictRegex, relaxedRegex, arrayRegex];

        for (const regex of strategies) {
            let match;
            // We reset lastIndex for new loop if needed, but creating new regex literals in loop does that.
            while ((match = regex.exec(html)) !== null) {
                const [_, id, name] = match;

                // Filter garbage
                if (id.length > 20 && !id.includes(' ') && !name.includes('<') && !name.startsWith('http')) {
                    // Avoid duplicates
                    if (!filesToImport.find(f => f.id === id)) {
                        matchCount++;
                        filesToImport.push({
                            id,
                            name,
                            type: 'coloring',
                            category: 'Geral'
                        });
                    }
                }
            }
        }

        console.log(`Regex matches: ${matchCount}`);

        // DB Insertion
        let importedCount = 0;
        let skippedCount = 0;

        for (const file of filesToImport) {
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

        // Context Debugging
        // If we found nothing, let's grab the text around "application/pdf" to see what the actual structure is
        const pdfContexts = [];
        if (matchCount === 0) {
            const mimeRegex = /application\/pdf/g;
            let m;
            let safety = 0;
            while ((m = mimeRegex.exec(html)) !== null && safety < 5) {
                safety++;
                const start = Math.max(0, m.index - 150);
                const end = Math.min(html.length, m.index + 50);
                // Clean up newlines for log readability
                pdfContexts.push(html.substring(start, end).replace(/\s+/g, ' '));
            }
        }

        return res.status(200).json({
            success: true,
            imported: importedCount,
            totalFound: matchCount,
            skipped: skippedCount,
            message: `Processado. Encontrados: ${matchCount}. Importados: ${importedCount}.`,
            debug: {
                matchesTotal: matchCount,
                htmlLength: html.length,
                // Provide contexts if no files found
                pdfContexts: pdfContexts,
                htmlSnippet: html.substring(0, 500)
            }
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
