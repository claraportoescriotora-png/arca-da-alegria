
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as cheerio from 'cheerio';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // Must use service role key for admin inserts
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { folderUrl } = req.body;

    if (!folderUrl) {
        return res.status(400).json({ error: 'Folder URL is required' });
    }

    try {
        console.log(`Starting import for folder: ${folderUrl}`);

        // 1. Fetch the main folder HTML
        const response = await axios.get(folderUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const html = response.data;
        const $ = cheerio.load(html);

        // 2. Extract the hidden JSON data
        // Google Drive stores initial data in a script tag starting with 'window._DRIVE_IV_INITIAL_DATA'
        // or sometimes straightforward JSON in script tags. 
        // We look for the pattern that contains the file structure.

        // Note: Google's structure changes. A robust way is to look for the script containing the data.
        let driveData = null;

        $('script').each((i: number, el: any) => {
            const content = $(el).html();
            if (content && content.includes('window._DRIVE_IV_INITIAL_DATA')) {
                try {
                    // Extract the JSON object
                    const jsonStr = content.split('window._DRIVE_IV_INITIAL_DATA = ')[1].split(';')[0];
                    driveData = JSON.parse(jsonStr);
                } catch (e) {
                    console.error("Error parsing drive data", e);
                }
            }
        });

        // 3. Fallback: If strict parsing fails, try regex for file IDs and names in the raw HTML
        // This is often more resilient for public folders which expose file lists in the DOM or JSON.

        // Let's implement a logical flow:
        // A. Identify Subfolders (Categories)
        // B. Identify Files within those folders (or root)

        // Since parsing minified dynamic JSON from Google is complex and brittle, 
        // we will use a simplified heuristic for this "Ninja" scraper:
        // We will look for sequences that look like file metadata.

        // However, a better approach for "Recursive" scraping without API is:
        // 1. Convert the input URL to a proper ID.
        // 2. Use a recursive function to fetch content.

        // SIMPLIFIED APPROACH:
        // We will assume the user provides a folder that contains files directly or subfolders.
        // We will try to extract `[id, name, mimetype]` tuples from the HTML.

        // Regex to find file-like objects in the big JSON blob
        // Google often represents files as arrays: [id, name, mimeType, ...]
        // We look for strings starting with "1..." (common drive ID length) and associated PDF mime types.

        const filesToImport: any[] = [];

        // Naive Regex to find PDF files and their names
        // Pattern: "file-id", "file-name", "application/pdf"
        // This is a heuristic.
        const pdfRegex = /"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"application\/pdf"/g;
        let match;

        while ((match = pdfRegex.exec(html)) !== null) {
            const [_, id, name] = match;
            if (id.length > 20) { // filter out short garbage
                filesToImport.push({
                    id,
                    name,
                    type: 'coloring', // Default
                    category: 'Geral' // Default if we can't determine subfolder easily
                });
            }
        }

        // Remove duplicates from our list
        const uniqueFiles = Array.from(new Map(filesToImport.map(item => [item.id, item])).values());

        console.log(`Found ${uniqueFiles.length} PDF files.`);

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
            message: `Importação concluída. ${importedCount} importados, ${skippedCount} já existiam.`,
            totalFound: uniqueFiles.length,
            imported: importedCount,
            skipped: skippedCount
        });

    } catch (error: any) {
        console.error('Import Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
