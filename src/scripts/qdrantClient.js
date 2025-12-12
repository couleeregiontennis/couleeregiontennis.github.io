import { QdrantClient } from '@qdrant/js-client-rest';

const qdrantClient = new QdrantClient({
  url: import.meta.env.VITE_QDRANT_URL,
  apiKey: import.meta.env.VITE_QDRANT_API_KEY,
});

export default qdrantClient;
