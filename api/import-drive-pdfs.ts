
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Global Try-Catch to prevent 500 HTML responses
    try {
        const { folderUrl } = req.body;

        if (!folderUrl) {
            return res.status(400).json({ error: 'Folder URL is required' });
        }

        console.log(`Starting import for folder: ${folderUrl}`);

        // 1. Fetch the main folder HTML using native fetch
        const response = await fetch(folderUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch Drive folder. Status: ${response.status}`);
        }

        const html = await response.text();

        let $;
        try {
            $ = cheerio.load(html);
        } catch (e: any) {
            console.error("Cheerio load failed", e);
            throw new Error("Failed to parse HTML with Cheerio: " + e.message);
        }

        // Improved Regex to be more flexible with whitespace and potential JSON variations
        // Look for pattern: "ID", "NAME", "application/pdf"
        const pdfRegex = /"([^"]{10,100})"\s*,\s*"([^"]+)"\s*,\s*"application\/pdf"/g;

        const filesToImport: any[] = [];
        let match;
        let matchCount = 0;

        while ((match = pdfRegex.exec(html)) !== null) {
            matchCount++;
            const [_, id, name] = match;
            if (id.length > 15) {
                filesToImport.push({ id, name, type: 'coloring', category: 'Geral' });
            }
        }

        console.log(`Regex matches found: ${matchCount}`);

        // Remove duplicates
        const uniqueFiles = Array.from(new Map(filesToImport.map(item => [item.id, item])).values());
        console.log(`Unique files to process: ${uniqueFiles.length}`);

        // 4. Insert into Supabase
        let importedCount = 0;
        let skippedCount = 0;

        for (const file of uniqueFiles) {
            // Check if exists
            const { data: existing } = await supabase
                .from('activities')
                .select('id')
                .eq('file_id', file.id)
                .single();

            if (!existing) {
                const downloadUrl = `https://drive.google.com/uc?export=download&id=${file.id}`;

                // Generate a clean title
                const title = file.name.replace('.pdf', '').replace(/[-_]/g, ' ');

                const { error } = await supabase.from('activities').insert({
                    title: title,
                    description: `Importado do Google Drive`,
                    type: 'coloring', // Default type
                    category: file.category,
                    file_id: file.id,
                    pdf_url: downloadUrl,
                    image_url: null, // We don't have a cover yet
                    is_active: true
                });

                if (error) {
                    console.error(`Error importing ${file.name}:`, error);
                } else {
                    importedCount++;
                }
            } else {
                skippedCount++;
            }
        }

        return res.status(200).json({
            success: true,
            message: `Processado. Encontrados: ${matchCount}. Importados: ${importedCount}. Já existiam: ${skippedCount}. (HTML: ${html.length} bytes)`,
            debug: { matches: matchCount, htmlLength: html.length }
        });

    } catch (error: any) {
        console.error('CRITICAL IMPORT ERROR:', error);
        return res.status(200).json({
            success: false,
            error: error.message || 'Unknown error',
            stack: error.stack
        });
    }
}
