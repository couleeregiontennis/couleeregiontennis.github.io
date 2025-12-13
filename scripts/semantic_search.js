import 'dotenv/config';
import { QdrantClient } from '@qdrant/js-client-rest';

// Configuration
const OLLAMA_URL = 'http://192.168.1.88:11434/api/embeddings';
const EMBEDDING_MODEL = 'nomic-embed-text:latest';
const COLLECTION_NAME = 'codebase_context';

// Qdrant Config
const QDRANT_URL = process.env.QDRANT_URL;
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;

if (!QDRANT_URL || !QDRANT_API_KEY) {
    console.error('Error: QDRANT_URL and QDRANT_API_KEY must be set in the environment or .env file.');
    process.exit(1);
}

const qdrant = new QdrantClient({
    url: QDRANT_URL,
    headers: { 'api-key': QDRANT_API_KEY },
    port: 443,
    checkCompatibility: false, // Disable version check
});

async function getEmbedding(text) {
    try {
        const response = await fetch(OLLAMA_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: EMBEDDING_MODEL,
                prompt: text
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama API Error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.embedding;
    } catch (error) {
        console.error('Failed to generate embedding:', error);
        process.exit(1);
    }
}

async function search(query) {
    console.log(`🔍 Generating embedding for: "${query}"...`);
    const vector = await getEmbedding(query);

    console.log('📡 Querying Qdrant...');
    const results = await qdrant.search(COLLECTION_NAME, {
        vector: vector,
        limit: 3,
        with_payload: true
    });

    console.log(`
--- Top 3 Results for: "${query}" ---
`);
    results.forEach((result, index) => {
        console.log(`#${index + 1} [Score: ${result.score.toFixed(4)}]`);
        console.log(`📄 File: ${result.payload.filepath}`);
        console.log(`📝 Type: ${result.payload.type}`);
        console.log(`ℹ️  Summary: ${result.payload.summary}`);
        console.log('-'.repeat(40));
    });
}

const query = process.argv[2];
if (!query) {
    console.log('Usage: node scripts/semantic_search.js "Your query here"');
    process.exit(1);
}

search(query);
