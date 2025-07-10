// Lightweight embedding implementation using popular npm packages
// Uses calculate-string-similarity and Natural.js for reliable text similarity

import { getSimilarity } from 'calculate-string-similarity';
import natural from 'natural';

// Get TfIdf from natural package - handle different export patterns
const TfIdf = natural.default?.TfIdf || natural.TfIdf;

if (!TfIdf) {
  throw new Error('Could not find TfIdf in natural package. Available: ' + Object.keys(natural));
}

// Global TF-IDF instance and document tracking
let tfidfModel = new TfIdf();
let documentTexts = [];
let documentMap = new Map(); // Maps document text to index

// Generate embedding using TF-IDF with Natural.js
const generateEmbedding = async (text) => {
  try {
    // Ensure text is a string and handle null/undefined
    if (text === null || text === undefined) {
      console.warn('generateEmbedding: text is null or undefined');
      return new Array(100).fill(0);
    }
    
    // Convert to string if not already a string
    const textStr = typeof text === 'string' ? text : String(text);
    
    // Clean and normalize text
    const cleanText = textStr.toLowerCase().trim();
    
    // Handle empty text
    if (cleanText.length === 0) {
      console.warn('generateEmbedding: empty text provided');
      return new Array(100).fill(0);
    }
    
    // Add document to TF-IDF model if not already present
    if (!documentMap.has(cleanText)) {
      tfidfModel.addDocument(cleanText);
      const docIndex = documentTexts.length;
      documentTexts.push(cleanText);
      documentMap.set(cleanText, docIndex);
    }
    
    const docIndex = documentMap.get(cleanText);
    
    // Get TF-IDF vector for this document
    const terms = tfidfModel.listTerms(docIndex);
    
    // Create a standardized vector of top 100 terms across all documents
    const globalTerms = getAllTerms().slice(0, 100); // Limit to top 100 terms for performance
    const vector = [];
    
    // Create term-to-score map for fast lookup
    const termScores = new Map();
    terms.forEach(term => {
      termScores.set(term.term, term.tfidf);
    });
    
    // Build vector based on global terms
    for (const term of globalTerms) {
      vector.push(termScores.get(term) || 0);
    }
    
    // Pad vector to consistent size (100 dimensions)
    while (vector.length < 100) {
      vector.push(0);
    }
    
    return vector.slice(0, 100); // Ensure exactly 100 dimensions
    
  } catch (error) {
    console.error('Error generating TF-IDF embedding:', error);
    console.error('Input text type:', typeof text);
    console.error('Input text value:', text);
    // Return zero vector with 100 dimensions
    return new Array(100).fill(0);
  }
};

// Get all unique terms across all documents
const getAllTerms = () => {
  const termSet = new Set();
  
  for (let i = 0; i < documentTexts.length; i++) {
    const terms = tfidfModel.listTerms(i);
    terms.forEach(term => termSet.add(term.term));
  }
  
  return Array.from(termSet).sort();
};

// Calculate cosine similarity between two vectors
const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB) {
    console.warn('cosineSimilarity: null vectors provided');
    return 0;
  }
  
  if (vecA.length !== vecB.length) {
    console.warn(`Vector dimension mismatch: ${vecA.length} vs ${vecB.length}`);
    return 0;
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// Enhanced similarity that combines TF-IDF with basic string similarity
const enhancedSimilarity = async (text1, text2) => {
  try {
    // Ensure both inputs are strings
    const str1 = typeof text1 === 'string' ? text1 : String(text1 || '');
    const str2 = typeof text2 === 'string' ? text2 : String(text2 || '');
    
    if (str1.length === 0 || str2.length === 0) {
      return 0;
    }
    
    // Get basic string similarity using calculate-string-similarity
    const stringSim = getSimilarity(str1, str2) / 100; // Convert percentage to 0-1 scale
    
    // Get TF-IDF embeddings
    const embedding1 = await generateEmbedding(str1);
    const embedding2 = await generateEmbedding(str2);
    
    // Calculate TF-IDF cosine similarity
    const tfidfSim = cosineSimilarity(embedding1, embedding2);
    
    // Combine both similarities (weighted average)
    // String similarity gets 30% weight, TF-IDF gets 70% weight
    const combinedSim = (stringSim * 0.3) + (tfidfSim * 0.7);
    
    return combinedSim;
    
  } catch (error) {
    console.error('Error in enhanced similarity:', error);
    // Fallback to basic string similarity
    try {
      const str1 = String(text1 || '');
      const str2 = String(text2 || '');
      return getSimilarity(str1, str2) / 100;
    } catch (fallbackError) {
      console.error('Fallback similarity also failed:', fallbackError);
      return 0;
    }
  }
};

// Clear all stored data
const clearModel = () => {
  tfidfModel = new TfIdf();
  documentTexts.length = 0;
  documentMap.clear();
};

// Get model information
const getModelInfo = () => {
  return {
    documentsProcessed: documentTexts.length,
    dimensions: 100,
    model: 'Natural.js TF-IDF + String Similarity',
    vocabularySize: getAllTerms().length,
    library: 'natural + calculate-string-similarity'
  };
};

export {
  generateEmbedding,
  cosineSimilarity,
  enhancedSimilarity,
  clearModel,
  getModelInfo
}; 