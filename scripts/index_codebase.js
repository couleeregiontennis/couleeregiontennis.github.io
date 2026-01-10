import 'dotenv/config';
import { QdrantClient } from '@qdrant/js-client-rest';
import fs from 'fs/promises';
import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Load .env.local manually
dotenv.config({ path: '.env.local' });

// Configuration
const COLLECTION_NAME = 'codebase_context';
const VECTOR_SIZE = 768; // text-embedding-004 uses 768 dimensions
const NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341'; // Deterministic namespace for file IDs

// Qdrant Config
const QDRANT_URL = process.env.QDRANT_URL;
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;

// Gemini Config
const GEMINI_API_KEY = process.env.UMPIRE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;


if (!QDRANT_URL || !QDRANT_API_KEY) {
    console.error('Error: QDRANT_URL and QDRANT_API_KEY must be set in the environment or .env file.');
    process.exit(1);
}

if (!GEMINI_API_KEY) {
    console.error('Error: GEMINI_API_KEY must be set in the environment or .env file.');
    process.exit(1);
}

console.log(`Using Qdrant URL: ${QDRANT_URL}`);
console.log(`Using API Key: ${QDRANT_API_KEY.substring(0, 10)}...`);

const qdrant = new QdrantClient({
    url: QDRANT_URL,
    apiKey: QDRANT_API_KEY,
    port: 443,
});

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

async function getEmbedding(text) {
    try {
        const result = await model.embedContent(text);
        return result.embedding.values;
    } catch (error) {
        console.error('Failed to generate embedding:', error);
        process.exit(1);
    }
}

async function main() {
    const inputFile = process.argv[2];
    if (!inputFile) {
        console.log('Usage: node scripts/index_codebase.js <json_file>');
        process.exit(1);
    }

    console.log(`📖 Reading ${inputFile}...`);
    const content = await fs.readFile(inputFile, 'utf-8');
    const chunks = JSON.parse(content);

    let forceUpdate = false;
    try {
        await qdrant.getCollection(COLLECTION_NAME);
        console.log(`✅ Collection '${COLLECTION_NAME}' exists.`);
    } catch (e) {
        console.log(`⚠️  Collection '${COLLECTION_NAME}' not found. Creating...`);
        await qdrant.createCollection(COLLECTION_NAME, {
            vectors: {
                size: VECTOR_SIZE,
                distance: 'Cosine'
            }
        });
        forceUpdate = true;
    }

    console.log(`🧬 Processing ${chunks.length} chunks...`);
    const points = [];
    let skipped = 0;

    for (const chunk of chunks) {
        // If we are forcing an update (new collection) OR the file changed, we index.
        if (forceUpdate || chunk.changed) {
            process.stdout.write('U'); // Update
            // Add a small delay to avoid hitting rate limits too quickly if many chunks
            await new Promise(resolve => setTimeout(resolve, 200));

            const vector = await getEmbedding(chunk.summary);

            // Use deterministic ID so we can overwrite existing entries for this file
            const id = uuidv5(chunk.filepath, NAMESPACE);

            points.push({
                id: id,
                vector: vector,
                payload: {
                    filepath: chunk.filepath,
                    code: chunk.code,
                    summary: chunk.summary,
                    type: chunk.type
                }
            });
        } else {
            // process.stdout.write('.'); // Skip
            skipped++;
        }
    }
    console.log('\n');

    if (points.length > 0) {
        console.log(`🚀 Uploading ${points.length} new/updated vectors to Qdrant...`);
        await qdrant.upsert(COLLECTION_NAME, {
            points: points
        });
        console.log('✅ Indexing complete!');
    } else {
        console.log('✨ No changes to index.');
    }

    console.log(`(Skipped ${skipped} unchanged files)`);
}

main();
