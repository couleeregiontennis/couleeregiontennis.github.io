import { QdrantClient } from '@qdrant/js-client-rest';

throw new Error('Qdrant client is tooling-only and must not be imported by the web app bundle. Use scripts/ with QDRANT_URL/QDRANT_API_KEY instead.');

const qdrantClient = new QdrantClient({
  url: '',
  apiKey: '',
});

export default qdrantClient;
