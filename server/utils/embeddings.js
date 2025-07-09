// Global model instance - starts as null, only loaded when needed
let embedder = null;
let isLoading = false;

// Model configuration - using Xenova/all-MiniLM-L6-v2 (small, fast, guaranteed ONNX support)
const MODEL_CONFIG = {
  name: 'Xenova/all-MiniLM-L6-v2',
  dimensions: 384,
  maxLength: 512,
  type: 'all-MiniLM-L6-v2'
};

// Lazy load the embedding model only when needed
const getEmbedder = async () => {
  if (embedder) {
    return embedder;
  }
  
  if (isLoading) {
    // Wait for the current loading to complete
    while (isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return embedder;
  }
  
  isLoading = true;
  
  try {
    console.error(`[INFO] Loading ${MODEL_CONFIG.name} model...`);
    
    // Dynamic import to avoid loading at module level
    const { pipeline, env } = await import('@xenova/transformers');
    
    // Configure transformers environment
    env.allowLocalModels = false;
    env.allowRemoteModels = true;
    env.useBrowserCache = false;
    env.useFS = true;
    
    embedder = await pipeline('feature-extraction', MODEL_CONFIG.name, {
      quantized: true,
      device: 'cpu',
      dtype: 'fp32'
    });
    
    console.error(`[INFO] Model ${MODEL_CONFIG.name} loaded successfully`);
    return embedder;
    
  } catch (error) {
    console.error(`[ERROR] Failed to load model: ${error.message}`);
    throw error;
  } finally {
    isLoading = false;
  }
};

// Generate embedding using the all-MiniLM-L6-v2 model
export const generateEmbedding = async (text) => {
  try {
    const model = await getEmbedder();
    
    // Generate embedding
    const output = await model(text, {
      pooling: 'mean',
      normalize: true,
    });
    
    // Convert to regular array
    const embedding = Array.from(output.data);
    
    return embedding;
    
  } catch (error) {
    console.error(`[ERROR] Embedding generation failed: ${error.message}`);
    // Return a zero vector as fallback
    return new Array(MODEL_CONFIG.dimensions).fill(0);
  }
};

// Calculate cosine similarity between two embeddings
export const cosineSimilarity = (embedding1, embedding2) => {
  if (!embedding1 || !embedding2) return 0;
  
  const len = Math.min(embedding1.length, embedding2.length);
  if (len === 0) return 0;
  
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (let i = 0; i < len; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }
  
  if (norm1 === 0 || norm2 === 0) return 0;
  
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
};

// Get model information
export const getModelInfo = () => {
  return {
    name: MODEL_CONFIG.name,
    type: MODEL_CONFIG.type,
    dimensions: MODEL_CONFIG.dimensions,
    maxLength: MODEL_CONFIG.maxLength,
    runtime: 'transformers.js',
    quantized: true,
    semantic: 'high-quality',
    loaded: embedder !== null
  };
};

// Preload model (optional - for warming up)
export const preloadModel = async () => {
  try {
    await getEmbedder();
    return true;
  } catch (error) {
    console.error(`[ERROR] Failed to preload model: ${error.message}`);
    return false;
  }
};

// Clear model (for cleanup)
export const clearModel = () => {
  embedder = null;
  isLoading = false;
};

// Get embedding statistics
export const getEmbeddingStats = () => {
  return {
    modelLoaded: embedder !== null,
    modelName: MODEL_CONFIG.name,
    dimensions: MODEL_CONFIG.dimensions,
    type: 'semantic-embeddings',
    isLoading: isLoading
  };
}; 