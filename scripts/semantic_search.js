import 'dotenv/config';
import { QdrantClient } from '@qdrant/js-client-rest';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Load .env.local manually
dotenv.config({ path: '.env.local' });

// Configuration
const COLLECTION_NAME = 'codebase_context';

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

async function search(query) {
    console.log(`🔍 Generating embedding for: "${query}"...`);
    const vector = await getEmbedding(query);

    console.log('📡 Querying Qdrant...');
    try {
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
    } catch (error) {
        console.error('Qdrant Search Error:', error);
    }
}

const query = process.argv[2];
if (!query) {
    console.log('Usage: node scripts/semantic_search.js "Your query here"');
    process.exit(1);
}

search(query);
