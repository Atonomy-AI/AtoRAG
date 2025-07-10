import initSqlJs from "sql.js";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { generateEmbedding, cosineSimilarity, enhancedSimilarity } from "../utils/embeddings.js";
import { atoragPath, getBackupPath } from "../utils/paths.js";
import { logger } from "../utils/logger.js";
import { smartChunk, createChunkMetadata } from "../utils/chunking.js";

// SQLite Vector Knowledge Base
export class VectorKnowledgeBase {
  constructor() {
    this.dbPath = path.join(atoragPath, "knowledge_base.db");
    this.db = null;
    this.SQL = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    this.SQL = await initSqlJs();
    
    // Load existing database or create new one
    if (fs.existsSync(this.dbPath)) {
      const fileBuffer = fs.readFileSync(this.dbPath);
      this.db = new this.SQL.Database(fileBuffer);
    } else {
      this.db = new this.SQL.Database();
    }
    
    this.initializeDatabase();
    this.initializePartitions();
    this.initialized = true;
  }

  saveDatabase() {
    if (this.db) {
      const data = this.db.export();
      fs.writeFileSync(this.dbPath, Buffer.from(data));
    }
  }

  initializeDatabase() {
    // Create documents table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        partition TEXT NOT NULL DEFAULT 'default',
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        type TEXT NOT NULL,
        embedding TEXT NOT NULL,
        word_count INTEGER,
        char_count INTEGER,
        parent_id TEXT,
        chunk_index INTEGER DEFAULT 0,
        total_chunks INTEGER DEFAULT 1,
        is_chunk BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        modified_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create tags table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        document_id TEXT NOT NULL,
        tag TEXT NOT NULL
      )
    `);

    // Create collections table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS collections (
        id TEXT PRIMARY KEY,
        partition TEXT NOT NULL DEFAULT 'default',
        name TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create collection_documents junction table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS collection_documents (
        collection_id TEXT NOT NULL,
        document_id TEXT NOT NULL,
        PRIMARY KEY (collection_id, document_id)
      )
    `);

    // Create partitions table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS partitions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_documents_partition ON documents (partition)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_documents_type ON documents (type)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_documents_created ON documents (created_at)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_tags_document ON tags (document_id)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_tags_tag ON tags (tag)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_collections_partition ON collections (partition)`);

    logger.info("Database initialized successfully");
  }



  initializePartitions() {
    // Create default partition if it doesn't exist
    try {
      this.db.run(`
        INSERT OR IGNORE INTO partitions (id, name, description) 
        VALUES ('default', 'default', 'Default partition for general documents')
      `);
    } catch (error) {
      logger.warn(`Failed to create default partition: ${error.message}`);
    }
  }

  async generateEmbedding(text) {
    return await generateEmbedding(text);
  }

  detectDocumentType(content, title = '') {
    const fullText = (title + ' ' + content).toLowerCase();
    
    if (fullText.includes('policy') || fullText.includes('procedure') || fullText.includes('guideline')) {
      return 'policy';
    } else if (fullText.includes('research') || fullText.includes('study') || fullText.includes('analysis')) {
      return 'research';
    } else if (fullText.includes('manual') || fullText.includes('instructions') || fullText.includes('how to')) {
      return 'manual';
    } else if (fullText.includes('report') || fullText.includes('summary') || fullText.includes('findings')) {
      return 'report';
    } else {
      return 'document';
    }
  }

  extractTags(content) {
    const text = content.toLowerCase();
    const tags = [];
    
    // Simple keyword-based tagging
    const tagPatterns = {
      'urgent': /urgent|priority|asap|immediate/,
      'confidential': /confidential|secret|private|restricted/,
      'financial': /financial|budget|cost|revenue|profit/,
      'technical': /technical|engineering|development|code/,
      'meeting': /meeting|conference|discussion|agenda/,
      'project': /project|milestone|deadline|deliverable/
    };
    
    Object.entries(tagPatterns).forEach(([tag, pattern]) => {
      if (pattern.test(text)) {
        tags.push(tag);
      }
    });
    
    return tags;
  }

  generateSummary(content, maxLength = 200) {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length === 0) return '';
    
    let summary = sentences[0].trim();
    
    for (let i = 1; i < sentences.length && summary.length < maxLength; i++) {
      const nextSentence = sentences[i].trim();
      if (summary.length + nextSentence.length + 2 <= maxLength) {
        summary += '. ' + nextSentence;
      } else {
        break;
      }
    }
    
    return summary + (summary.length < content.length ? '...' : '');
  }

  async createPartition(name, description = '') {
    const id = randomUUID();
    
    try {
      this.db.run(`
        INSERT INTO partitions (id, name, description) 
        VALUES (?, ?, ?)
      `, [id, name, description]);
      
      this.saveDatabase();
      return { success: true, id, name, description };
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        return { success: false, error: `Partition '${name}' already exists` };
      }
      return { success: false, error: error.message };
    }
  }

  async listPartitions() {
    const stmt = this.db.prepare(`
      SELECT p.*, 
             COUNT(d.id) as document_count,
             COUNT(c.id) as collection_count
      FROM partitions p
      LEFT JOIN documents d ON p.name = d.partition
      LEFT JOIN collections c ON p.name = c.partition
      GROUP BY p.id, p.name, p.description, p.created_at
      ORDER BY p.created_at DESC
    `);
    
    const partitions = [];
    while (stmt.step()) {
      partitions.push(stmt.getAsObject());
    }
    stmt.free();
    
    return partitions;
  }

  async deletePartition(partitionName) {
    if (partitionName === 'default') {
      return { success: false, error: "Cannot delete the default partition" };
    }

    try {
      // Check if partition has documents or collections
      const docCount = this.db.prepare(`SELECT COUNT(*) as count FROM documents WHERE partition = ?`).get([partitionName]);
      const collCount = this.db.prepare(`SELECT COUNT(*) as count FROM collections WHERE partition = ?`).get([partitionName]);
      
      if (docCount.count > 0 || collCount.count > 0) {
        return { success: false, error: `Cannot delete partition '${partitionName}' - it contains ${docCount.count} documents and ${collCount.count} collections` };
      }

      this.db.run(`DELETE FROM partitions WHERE name = ?`, [partitionName]);
      this.saveDatabase();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async addDocument(title, content, type = null, metadata = {}, partition = 'default') {
    const detectedType = type || this.detectDocumentType(content, title);
    const wordCount = content.split(/\s+/).length;
    const charCount = content.length;
    
    try {
      // Determine if we need to chunk the document
      const shouldChunk = wordCount > 500; // Chunk if more than 500 words
      
      if (shouldChunk) {
        return await this.addDocumentWithChunks(title, content, detectedType, metadata, partition);
      } else {
        return await this.addSingleDocument(title, content, detectedType, metadata, partition);
      }
    } catch (error) {
      logger.error(`Failed to add document: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async addSingleDocument(title, content, type, metadata, partition) {
    const id = randomUUID();
    const embedding = await this.generateEmbedding(content);
    const embeddingStr = JSON.stringify(embedding);
    const wordCount = content.split(/\s+/).length;
    const charCount = content.length;
    
    this.db.run(`
      INSERT INTO documents (id, partition, title, content, type, embedding, word_count, char_count, is_chunk)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, partition, title, content, type, embeddingStr, wordCount, charCount, false]);
    
    // Add auto-generated tags
    const tags = this.extractTags(content);
    tags.forEach(tag => {
      this.db.run(`INSERT INTO tags (document_id, tag) VALUES (?, ?)`, [id, tag]);
    });
    
    this.saveDatabase();
    return { success: true, id, type, tags, wordCount, charCount, chunks: 1 };
  }

  async addDocumentWithChunks(title, content, type, metadata, partition) {
    const parentId = randomUUID();
    const chunks = smartChunk(content, title);
    const tags = this.extractTags(content);
    const addedChunks = [];
    
    logger.info(`Chunking document "${title}" into ${chunks.length} chunks`);
    
    // Add parent document (metadata only, no embedding)
    this.db.run(`
      INSERT INTO documents (id, partition, title, content, type, embedding, word_count, char_count, total_chunks, is_chunk)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [parentId, partition, title, content, type, '[]', content.split(/\s+/).length, content.length, chunks.length, false]);
    
    // Add tags for parent document
    tags.forEach(tag => {
      this.db.run(`INSERT INTO tags (document_id, tag) VALUES (?, ?)`, [parentId, tag]);
    });
    
    // Add each chunk as a separate document
    for (let i = 0; i < chunks.length; i++) {
      const chunkId = randomUUID();
      const chunk = chunks[i];
      const chunkEmbedding = await this.generateEmbedding(chunk);
      const chunkEmbeddingStr = JSON.stringify(chunkEmbedding);
      const chunkWordCount = chunk.split(/\s+/).length;
      const chunkCharCount = chunk.length;
      
      this.db.run(`
        INSERT INTO documents (id, partition, title, content, type, embedding, word_count, char_count, parent_id, chunk_index, total_chunks, is_chunk)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [chunkId, partition, `${title} (Chunk ${i + 1}/${chunks.length})`, chunk, type, chunkEmbeddingStr, chunkWordCount, chunkCharCount, parentId, i, chunks.length, true]);
      
      // Add tags for chunk
      tags.forEach(tag => {
        this.db.run(`INSERT INTO tags (document_id, tag) VALUES (?, ?)`, [chunkId, tag]);
      });
      
      addedChunks.push({
        id: chunkId,
        index: i,
        wordCount: chunkWordCount,
        charCount: chunkCharCount
      });
    }
    
    this.saveDatabase();
    return { 
      success: true, 
      id: parentId, 
      type, 
      tags, 
      wordCount: content.split(/\s+/).length, 
      charCount: content.length,
      chunks: chunks.length,
      chunkIds: addedChunks.map(c => c.id)
    };
  }

  async searchDocuments(query, filters = {}, limit = 10) {
    try {
      // Build SQL query with filters - search both parent documents and chunks
      let sql = `
        SELECT d.*, GROUP_CONCAT(t.tag) as tags
        FROM documents d
        LEFT JOIN tags t ON d.id = t.document_id
        WHERE d.embedding != '[]'
      `;
      
      const params = [];
      
      if (filters.partition) {
        sql += ` AND d.partition = ?`;
        params.push(filters.partition);
      }
      
      if (filters.type) {
        sql += ` AND d.type = ?`;
        params.push(filters.type);
      }
      
      if (filters.tag) {
        sql += ` AND d.id IN (SELECT document_id FROM tags WHERE tag = ?)`;
        params.push(filters.tag);
      }
      
      sql += ` GROUP BY d.id ORDER BY d.created_at DESC`;
      
      const stmt = this.db.prepare(sql);
      const documents = [];
      
      stmt.bind(params);
      while (stmt.step()) {
        const doc = stmt.getAsObject();
        // Use enhanced similarity that combines TF-IDF and string similarity
        const similarity = await enhancedSimilarity(query, doc.content);
        
        documents.push({
          ...doc,
          similarity,
          tags: doc.tags ? doc.tags.split(',') : []
        });
      }
      stmt.free();
      
      // Sort by similarity and limit results
      const sortedDocs = documents
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);
      
      // Group chunks by parent document and return best matches
      const resultMap = new Map();
      
      for (const doc of sortedDocs) {
        if (doc.is_chunk) {
          // This is a chunk - group with parent or show as chunk
          const parentId = doc.parent_id;
          if (!resultMap.has(parentId)) {
            resultMap.set(parentId, {
              ...doc,
              isChunkResult: true,
              bestChunkSimilarity: doc.similarity
            });
          } else {
            // Update if this chunk has better similarity
            const existing = resultMap.get(parentId);
            if (doc.similarity > existing.bestChunkSimilarity) {
              resultMap.set(parentId, {
                ...doc,
                isChunkResult: true,
                bestChunkSimilarity: doc.similarity
              });
            }
          }
        } else {
          // This is a parent document or single document
          if (!resultMap.has(doc.id)) {
            resultMap.set(doc.id, doc);
          }
        }
      }
      
      return Array.from(resultMap.values())
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
        .map(doc => {
          const { embedding, ...docWithoutEmbedding } = doc;
          return docWithoutEmbedding;
        });
        
    } catch (error) {
      logger.error(`Search failed: ${error.message}`);
      return [];
    }
  }

  async getDocument(id) {
    try {
      const stmt = this.db.prepare(`
        SELECT d.*, GROUP_CONCAT(t.tag) as tags
        FROM documents d
        LEFT JOIN tags t ON d.id = t.document_id
        WHERE d.id = ?
        GROUP BY d.id
      `);
      
      stmt.bind([id]);
      if (stmt.step()) {
        const doc = stmt.getAsObject();
        stmt.free();
        
        const { embedding, ...docWithoutEmbedding } = doc;
        return {
          ...docWithoutEmbedding,
          tags: doc.tags ? doc.tags.split(',') : []
        };
      }
      stmt.free();
      return null;
    } catch (error) {
      logger.error(`Failed to get document: ${error.message}`);
      return null;
    }
  }

  async deleteDocument(id) {
    try {
      this.db.run(`DELETE FROM documents WHERE id = ?`, [id]);
      this.db.run(`DELETE FROM tags WHERE document_id = ?`, [id]);
      this.db.run(`DELETE FROM collection_documents WHERE document_id = ?`, [id]);
      this.saveDatabase();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async listDocuments(filters = {}, limit = 50) {
    let sql = `
      SELECT d.id, d.partition, d.title, d.type, d.word_count, d.char_count, d.created_at, d.modified_at,
             GROUP_CONCAT(t.tag) as tags
      FROM documents d
      LEFT JOIN tags t ON d.id = t.document_id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (filters.partition) {
      sql += ` AND d.partition = ?`;
      params.push(filters.partition);
    }
    
    if (filters.type) {
      sql += ` AND d.type = ?`;
      params.push(filters.type);
    }
    
    if (filters.tag) {
      sql += ` AND d.id IN (SELECT document_id FROM tags WHERE tag = ?)`;
      params.push(filters.tag);
    }
    
    sql += ` GROUP BY d.id ORDER BY d.created_at DESC LIMIT ?`;
    params.push(limit);
    
    const stmt = this.db.prepare(sql);
    const documents = [];
    
    stmt.bind(params);
    while (stmt.step()) {
      const doc = stmt.getAsObject();
      documents.push({
        ...doc,
        tags: doc.tags ? doc.tags.split(',') : []
      });
    }
    stmt.free();
    
    return documents;
  }

  async createCollection(name, description = '', partition = 'default') {
    const id = randomUUID();
    
    try {
      this.db.run(`
        INSERT INTO collections (id, partition, name, description)
        VALUES (?, ?, ?, ?)
      `, [id, partition, name, description]);
      
      this.saveDatabase();
      return { success: true, id, name, description, partition };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async addToCollection(collectionId, documentId) {
    try {
      this.db.run(`
        INSERT OR IGNORE INTO collection_documents (collection_id, document_id)
        VALUES (?, ?)
      `, [collectionId, documentId]);
      
      this.saveDatabase();
      return true;
    } catch (error) {
      logger.error(`Failed to add to collection: ${error.message}`);
      return false;
    }
  }

  async getCollections(partition = null) {
    let sql = `
      SELECT c.*, COUNT(cd.document_id) as document_count
      FROM collections c
      LEFT JOIN collection_documents cd ON c.id = cd.collection_id
    `;
    
    const params = [];
    if (partition) {
      sql += ` WHERE c.partition = ?`;
      params.push(partition);
    }
    
    sql += ` GROUP BY c.id ORDER BY c.created_at DESC`;
    
    const stmt = this.db.prepare(sql);
    const collections = [];
    
    stmt.bind(params);
    while (stmt.step()) {
      collections.push(stmt.getAsObject());
    }
    stmt.free();
    
    return collections;
  }

  async createBackup(backupPath = null) {
    try {
      const backupDir = backupPath || getBackupPath();
      
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(backupDir, `atorag-backup-${timestamp}.db`);
      
      // Copy the database file
      const data = this.db.export();
      fs.writeFileSync(backupFile, Buffer.from(data));
      
      const stats = fs.statSync(backupFile);
      
      return {
        success: true,
        backupFile,
        timestamp: new Date().toISOString(),
        size: stats.size
      };
    } catch (error) {
      logger.error(`Backup failed: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async restoreFromBackup(backupFile) {
    try {
      if (!fs.existsSync(backupFile)) {
        return {
          success: false,
          error: `Backup file not found: ${backupFile}`
        };
      }
      
      // Create a restore point before restoring
      const restorePointResult = await this.createBackup();
      if (!restorePointResult.success) {
        return {
          success: false,
          error: `Failed to create restore point: ${restorePointResult.error}`
        };
      }
      
      // Close current database
      if (this.db) {
        this.db.close();
      }
      
      // Copy backup file to current database location
      fs.copyFileSync(backupFile, this.dbPath);
      
      // Reinitialize database
      const fileBuffer = fs.readFileSync(this.dbPath);
      this.db = new this.SQL.Database(fileBuffer);
      
      return {
        success: true,
        restorePoint: restorePointResult.backupFile
      };
    } catch (error) {
      logger.error(`Restore failed: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async listBackups(backupDir = null) {
    try {
      const backupPath = backupDir || getBackupPath();
      
      if (!fs.existsSync(backupPath)) {
        return [];
      }
      
      const files = fs.readdirSync(backupPath)
        .filter(file => file.startsWith('atorag-backup-') && file.endsWith('.db'))
        .map(file => {
          const filePath = path.join(backupPath, file);
          const stats = fs.statSync(filePath);
          return {
            filename: file,
            path: filePath,
            size: stats.size,
            created: stats.birthtime
          };
        })
        .sort((a, b) => b.created - a.created);
      
      return files;
    } catch (error) {
      logger.error(`Failed to list backups: ${error.message}`);
      return [];
    }
  }

  analyzeContent(content, title = '') {
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
    const charCount = content.length;
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const avgWordsPerSentence = sentences > 0 ? Math.round(wordCount / sentences) : 0;
    
    // Readability score (simplified Flesch Reading Ease)
    const avgSentenceLength = avgWordsPerSentence;
    const avgSyllablesPerWord = 1.5; // Rough estimate
    const readabilityScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
    
    let readabilityLevel;
    if (readabilityScore >= 90) readabilityLevel = 'Very Easy';
    else if (readabilityScore >= 80) readabilityLevel = 'Easy';
    else if (readabilityScore >= 70) readabilityLevel = 'Fairly Easy';
    else if (readabilityScore >= 60) readabilityLevel = 'Standard';
    else if (readabilityScore >= 50) readabilityLevel = 'Fairly Difficult';
    else if (readabilityScore >= 30) readabilityLevel = 'Difficult';
    else readabilityLevel = 'Very Difficult';
    
    // Extract key phrases (simple approach)
    const words = content.toLowerCase().match(/\b\w+\b/g) || [];
    const wordFreq = {};
    words.forEach(word => {
      if (word.length > 3) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
    
    const keyPhrases = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, freq]) => ({ word, frequency: freq }));
    
    const type = this.detectDocumentType(content, title);
    const tags = this.extractTags(content);
    const summary = this.generateSummary(content);
    
    return {
      wordCount,
      charCount,
      sentences,
      avgWordsPerSentence,
      readabilityScore: Math.round(readabilityScore),
      readabilityLevel,
      keyPhrases,
      type,
      tags,
      summary
    };
  }
} 