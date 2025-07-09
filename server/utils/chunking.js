// Text chunking utilities for better embedding performance

export const CHUNK_SIZE = 500; // words per chunk
export const CHUNK_OVERLAP = 50; // words overlap between chunks

/**
 * Split text into chunks by sentences with word count limits
 */
export function chunkBySentences(text, maxWords = CHUNK_SIZE, overlapWords = CHUNK_OVERLAP) {
  // Split into sentences
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const chunks = [];
  let currentChunk = [];
  let currentWordCount = 0;
  
  for (const sentence of sentences) {
    const sentenceWords = sentence.trim().split(/\s+/).length;
    
    // If adding this sentence would exceed limit, start new chunk
    if (currentWordCount + sentenceWords > maxWords && currentChunk.length > 0) {
      chunks.push(currentChunk.join('. ').trim() + '.');
      
      // Start new chunk with overlap
      const overlapSentences = getOverlapSentences(currentChunk, overlapWords);
      currentChunk = [...overlapSentences, sentence.trim()];
      currentWordCount = countWords(currentChunk.join('. '));
    } else {
      currentChunk.push(sentence.trim());
      currentWordCount += sentenceWords;
    }
  }
  
  // Add final chunk if it has content
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('. ').trim() + '.');
  }
  
  return chunks.filter(chunk => chunk.trim().length > 0);
}

/**
 * Split text into chunks by paragraphs with word count limits
 */
export function chunkByParagraphs(text, maxWords = CHUNK_SIZE, overlapWords = CHUNK_OVERLAP) {
  // Split into paragraphs
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const chunks = [];
  let currentChunk = [];
  let currentWordCount = 0;
  
  for (const paragraph of paragraphs) {
    const paragraphWords = countWords(paragraph);
    
    // If paragraph alone exceeds limit, split it by sentences
    if (paragraphWords > maxWords) {
      // Add current chunk if it has content
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join('\n\n').trim());
        currentChunk = [];
        currentWordCount = 0;
      }
      
      // Split large paragraph by sentences
      const sentenceChunks = chunkBySentences(paragraph, maxWords, overlapWords);
      chunks.push(...sentenceChunks);
      continue;
    }
    
    // If adding this paragraph would exceed limit, start new chunk
    if (currentWordCount + paragraphWords > maxWords && currentChunk.length > 0) {
      chunks.push(currentChunk.join('\n\n').trim());
      
      // Start new chunk with overlap
      const overlapText = getOverlapText(currentChunk.join('\n\n'), overlapWords);
      currentChunk = overlapText ? [overlapText, paragraph.trim()] : [paragraph.trim()];
      currentWordCount = countWords(currentChunk.join('\n\n'));
    } else {
      currentChunk.push(paragraph.trim());
      currentWordCount += paragraphWords;
    }
  }
  
  // Add final chunk if it has content
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('\n\n').trim());
  }
  
  return chunks.filter(chunk => chunk.trim().length > 0);
}

/**
 * Smart chunking that detects document structure
 */
export function smartChunk(text, title = '', maxWords = CHUNK_SIZE, overlapWords = CHUNK_OVERLAP) {
  // Detect document type and structure
  const hasHeaders = /^#+\s+/m.test(text) || /^\d+\.\s+/m.test(text);
  const hasMultipleParagraphs = text.split(/\n\s*\n/).length > 2;
  const isStructured = hasHeaders || text.includes('SECTION') || text.includes('CHAPTER');
  
  let chunks = [];
  
  if (isStructured) {
    // For structured documents, try to preserve sections
    chunks = chunkByStructure(text, maxWords, overlapWords);
  } else if (hasMultipleParagraphs) {
    // For multi-paragraph documents, chunk by paragraphs
    chunks = chunkByParagraphs(text, maxWords, overlapWords);
  } else {
    // For simple text, chunk by sentences
    chunks = chunkBySentences(text, maxWords, overlapWords);
  }
  
  // Add title context to each chunk if provided
  if (title) {
    chunks = chunks.map(chunk => `${title}\n\n${chunk}`);
  }
  
  return chunks;
}

/**
 * Chunk by document structure (headers, sections, etc.)
 */
export function chunkByStructure(text, maxWords = CHUNK_SIZE, overlapWords = CHUNK_OVERLAP) {
  // Split by headers or numbered sections
  const sections = text.split(/(?=^#+\s+|^\d+\.\s+|^[A-Z\s]+:)/m).filter(s => s.trim().length > 0);
  const chunks = [];
  let currentChunk = [];
  let currentWordCount = 0;
  
  for (const section of sections) {
    const sectionWords = countWords(section);
    
    // If section alone exceeds limit, split it further
    if (sectionWords > maxWords) {
      // Add current chunk if it has content
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join('\n').trim());
        currentChunk = [];
        currentWordCount = 0;
      }
      
      // Split large section by paragraphs
      const paragraphChunks = chunkByParagraphs(section, maxWords, overlapWords);
      chunks.push(...paragraphChunks);
      continue;
    }
    
    // If adding this section would exceed limit, start new chunk
    if (currentWordCount + sectionWords > maxWords && currentChunk.length > 0) {
      chunks.push(currentChunk.join('\n').trim());
      
      // Start new chunk with overlap
      const overlapText = getOverlapText(currentChunk.join('\n'), overlapWords);
      currentChunk = overlapText ? [overlapText, section.trim()] : [section.trim()];
      currentWordCount = countWords(currentChunk.join('\n'));
    } else {
      currentChunk.push(section.trim());
      currentWordCount += sectionWords;
    }
  }
  
  // Add final chunk if it has content
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('\n').trim());
  }
  
  return chunks.filter(chunk => chunk.trim().length > 0);
}

/**
 * Get overlap sentences from the end of current chunk
 */
function getOverlapSentences(sentences, overlapWords) {
  const overlap = [];
  let wordCount = 0;
  
  for (let i = sentences.length - 1; i >= 0; i--) {
    const sentenceWords = countWords(sentences[i]);
    if (wordCount + sentenceWords <= overlapWords) {
      overlap.unshift(sentences[i]);
      wordCount += sentenceWords;
    } else {
      break;
    }
  }
  
  return overlap;
}

/**
 * Get overlap text from the end of current chunk
 */
function getOverlapText(text, overlapWords) {
  const words = text.split(/\s+/);
  if (words.length <= overlapWords) return text;
  
  const overlapStart = words.length - overlapWords;
  return words.slice(overlapStart).join(' ');
}

/**
 * Count words in text
 */
function countWords(text) {
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Create chunk metadata
 */
export function createChunkMetadata(chunk, index, total, originalTitle) {
  return {
    chunkIndex: index,
    totalChunks: total,
    wordCount: countWords(chunk),
    charCount: chunk.length,
    originalTitle,
    isChunk: true
  };
} 