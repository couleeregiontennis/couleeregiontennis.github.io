import 'dotenv/config';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { QdrantClient } from '@qdrant/js-client-rest';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

// Load .env.local if it exists
dotenv.config({ path: '.env.local' });

// Config
const GEMINI_API_KEY = process.env.UMPIRE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const QDRANT_URL = process.env.QDRANT_URL;
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;
const COLLECTION_NAME = 'rules_context';

if (!GEMINI_API_KEY || !QDRANT_URL) {
    console.error('Error: Missing required environment variables.');
    console.error('Ensure GEMINI_API_KEY (or UMPIRE_GEMINI_API_KEY) and QDRANT_URL are set.');
    console.error('Local: Check your .env.local file.');
    console.error('CI: Check your GitHub Repository Secrets.');
    process.exit(1);
}

console.log(`Using Gemini API Key: ${GEMINI_API_KEY.substring(0, 5)}...`);
console.log(`Using Qdrant URL: ${QDRANT_URL}`);

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const qdrant = new QdrantClient({ 
    url: QDRANT_URL, 
    apiKey: QDRANT_API_KEY,
    port: 443 
});

async function indexFile(filePath, model) {
    console.log(`📖 Reading ${filePath}...`);
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        
        // Robust Chunking Strategy:
        // 1. Split by SINGLE newline (since the file lacks paragraphs)
        // 2. Combine lines until they reach ~1000 characters
        
        const rawLines = content.split(/\n/);
        const chunks = [];
        let currentChunk = "";

        for (const line of rawLines) {
            const cleanLine = line.trim();
            if (!cleanLine) continue;

            if ((currentChunk.length + cleanLine.length) > 1000) {
                chunks.push(currentChunk);
                currentChunk = cleanLine;
            } else {
                currentChunk = currentChunk ? currentChunk + "\n" + cleanLine : cleanLine;
            }
        }
        if (currentChunk) chunks.push(currentChunk);

        const points = [];

        console.log(`   Found ${chunks.length} chunks.`);
        
        for (const chunk of chunks) {
            process.stdout.write('.');
            // Optional: Add a small delay to avoid rate limits if on free tier
            await new Promise(r => setTimeout(r, 500)); 
            
            const result = await model.embedContent(chunk);
            const vector = result.embedding.values;

            points.push({
                id: uuidv4(),
                vector: vector,
                payload: {
                    content: chunk,
                    source: filePath
                }
            });
        }
        console.log(' Done.');
        return points;
    } catch (e) {
        console.warn(`   Skipping ${filePath}: ${e.message}`);
        return [];
    }
}

async function main() {
    console.log('🗑️  Recreating collection...');
    await qdrant.deleteCollection(COLLECTION_NAME).catch(() => { }); 
    await qdrant.createCollection(COLLECTION_NAME, {
        vectors: {
            size: 768, // Gemini text-embedding-004 size
            distance: 'Cosine'
        }
    });

    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    
    let allPoints = [];
    allPoints = allPoints.concat(await indexFile('public/rules_context.md', model));
    allPoints = allPoints.concat(await indexFile('public/friend_at_court.md', model));

    console.log(`🚀 Uploading ${allPoints.length} vectors to Qdrant at ${QDRANT_URL}...`);
    if (allPoints.length > 0) {
        await qdrant.upsert(COLLECTION_NAME, {
            points: allPoints
        });
    }

    console.log('✅ Indexing complete!');
}

main();
