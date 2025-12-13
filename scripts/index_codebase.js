import 'dotenv/config';
import { QdrantClient } from '@qdrant/js-client-rest';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

// Configuration
const OLLAMA_URL = 'http://192.168.1.88:11434/api/embeddings';
const EMBEDDING_MODEL = 'nomic-embed-text:latest';
const COLLECTION_NAME = 'codebase_context';
const VECTOR_SIZE = 768; // Nomic-embed-text uses 768 dimensions (vs 384 for MiniLM)

// Qdrant Config
const QDRANT_URL = process.env.QDRANT_URL;
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;

if (!QDRANT_URL || !QDRANT_API_KEY) {
    console.error('Error: QDRANT_URL and QDRANT_API_KEY must be set in the environment or .env file.');
    process.exit(1);
}

console.log(`Using Qdrant URL: ${QDRANT_URL}`);
console.log(`Using API Key: ${QDRANT_API_KEY.substring(0, 10)}...`);

const qdrant = new QdrantClient({
    url: QDRANT_URL,
    headers: { 'api-key': QDRANT_API_KEY },
    port: 443,
    checkCompatibility: false, // Disable version check
});

async function getEmbedding(text) {
    const response = await fetch(OLLAMA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: EMBEDDING_MODEL,
            prompt: text
        })
    });
    const data = await response.json();
    return data.embedding;
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

    console.log('🗑️  Recreating collection...');
    await qdrant.deleteCollection(COLLECTION_NAME).catch(() => { }); // Ignore if doesn't exist
    await qdrant.createCollection(COLLECTION_NAME, {
        vectors: {
            size: VECTOR_SIZE,
            distance: 'Cosine'
        }
    });

    console.log(`🧬 Generating embeddings for ${chunks.length} chunks via Ollama...`);
    const points = [];

    for (const chunk of chunks) {
        process.stdout.write('.'); // Progress indicator
        const vector = await getEmbedding(chunk.summary);
        points.push({
            id: uuidv4(),
            vector: vector,
            payload: {
                filepath: chunk.filepath,
                code: chunk.code,
                summary: chunk.summary,
                type: chunk.type
            }
        });
    }
    console.log('\n');

    console.log('🚀 Uploading to Qdrant...');
    await qdrant.upsert(COLLECTION_NAME, {
        points: points
    });

    console.log('✅ Indexing complete!');
}

main();
