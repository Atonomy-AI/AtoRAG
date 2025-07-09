#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
// Using built-in crypto for reliable embeddings
import initSqlJs from "sql.js";
import fs from "fs";
import path from "path";
import os from "os";
import { randomUUID, createHash } from "crypto";

// Initialize logging
const logger = {
  info: (msg) => console.error(`[INFO] ${msg}`),
  error: (msg) => console.error(`[ERROR] ${msg}`),
  warn: (msg) => console.error(`[WARN] ${msg}`)
};

// Initialize AtoRAG knowledge base directory
const atoragPath = path.join(os.homedir(), ".atorag", "knowledge_base");
if (!fs.existsSync(atoragPath)) {
  fs.mkdirSync(atoragPath, { recursive: true });
}

// Initialize backup directory - use custom path if provided, otherwise default
const getBackupPath = () => {
  const customBackupPath = process.env.ATORAG_BACKUP_PATH;
  // Check if it's a valid path and not a template string
  if (customBackupPath && 
      customBackupPath.trim() && 
      !customBackupPath.includes('${') && 
      customBackupPath !== 'undefined') {
    const resolvedPath = path.resolve(customBackupPath.trim());
    logger.info(`Using custom backup path: ${resolvedPath}`);
    return resolvedPath;
  }
  const defaultPath = path.join(atoragPath, 'backups');
  logger.info(`Using default backup path: ${defaultPath}`);
  return defaultPath;
};

// Simple but effective text embedding using TF-IDF style approach
const generateEmbedding = (text) => {
  // Normalize text
  const normalized = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Extract words and create frequency map
  const words = normalized.split(' ').filter(w => w.length > 2);
  const wordFreq = {};
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });
  
  // Get top 50 most frequent words for embedding
  const topWords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([word]) => word);
  
  // Create a 128-dimensional embedding vector
  const embedding = new Array(128).fill(0);
  
  topWords.forEach((word, index) => {
    const hash = createHash('sha256').update(word).digest();
    for (let i = 0; i < 128; i++) {
      embedding[i] += (hash[i % hash.length] / 255) * wordFreq[word];
    }
  });
  
  // Normalize the vector
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= magnitude;
    }
  }
  
  return embedding;
};

// Vector similarity function
const cosineSimilarity = (a, b) => {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
};

// SQLite Vector Knowledge Base
class VectorKnowledgeBase {
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
        VALUES (?, ?, ?)
      `, ['default', 'default', 'Default partition for all documents']);
      this.saveDatabase();
    } catch (error) {
      // Ignore if already exists
    }
  }

  async generateEmbedding(text) {
    return generateEmbedding(text);
  }

  // Document type detection
  detectDocumentType(content, title = '') {
    const text = (title + ' ' + content).toLowerCase();
    
    if (text.includes('csv') || text.includes(',') && text.split('\n').length > 3) return 'csv';
    if (text.includes('policy') || text.includes('procedure')) return 'policy';
    if (text.includes('meeting') || text.includes('agenda')) return 'meeting';
    if (text.includes('report') || text.includes('analysis')) return 'report';
    if (text.includes('research') || text.includes('study')) return 'research';
    if (text.includes('manual') || text.includes('guide')) return 'guide';
    if (text.includes('contract') || text.includes('agreement')) return 'contract';
    if (text.includes('invoice') || text.includes('receipt')) return 'financial';
    
    return 'document';
  }

  // Extract meaningful tags from content
  extractTags(content) {
    const text = content.toLowerCase();
    const commonTags = [
      'policy', 'procedure', 'guide', 'manual', 'report', 'research',
      'meeting', 'notes', 'summary', 'analysis', 'data', 'csv',
      'financial', 'legal', 'technical', 'business', 'strategy',
      'project', 'proposal', 'contract', 'agreement', 'invoice',
      'customer', 'client', 'vendor', 'supplier', 'partner'
    ];
    
    return commonTags.filter(tag => text.includes(tag));
  }

  // Generate a smart summary of content
  generateSummary(content, maxLength = 200) {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    if (sentences.length <= 2) return content.substring(0, maxLength);
    
    const summary = sentences[0];
    if (summary.length < maxLength) {
      const remaining = maxLength - summary.length - 3;
      if (sentences.length > 1) {
        return summary + "... " + sentences[Math.floor(sentences.length / 2)].substring(0, remaining);
      }
    }
    
    return summary.substring(0, maxLength);
  }

  // Partition management
  async createPartition(name, description = '') {
    await this.initialize();
    
    const id = randomUUID();
    
    try {
      this.db.run(`
        INSERT INTO partitions (id, name, description) 
        VALUES (?, ?, ?)
      `, [id, name, description]);
      this.saveDatabase();
      return { id, name, description };
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        throw new Error(`Partition '${name}' already exists`);
      }
      throw error;
    }
  }

  async listPartitions() {
    await this.initialize();
    
    const stmt = this.db.prepare(`
      SELECT p.*, 
             COUNT(DISTINCT d.id) as document_count,
             COUNT(DISTINCT c.id) as collection_count
      FROM partitions p
      LEFT JOIN documents d ON p.name = d.partition
      LEFT JOIN collections c ON p.name = c.partition
      GROUP BY p.id
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
    await this.initialize();
    
    if (partitionName === 'default') {
      throw new Error('Cannot delete the default partition');
    }

    // Delete all documents in the partition
    this.db.run('DELETE FROM documents WHERE partition = ?', [partitionName]);
    // Delete all collections in the partition
    this.db.run('DELETE FROM collections WHERE partition = ?', [partitionName]);
    // Delete the partition
    this.db.run('DELETE FROM partitions WHERE name = ?', [partitionName]);
    
    this.saveDatabase();
  }

  // Document operations
  async addDocument(title, content, type = null, metadata = {}, partition = 'default') {
    await this.initialize();
    
    const id = randomUUID();
    const detectedType = type || this.detectDocumentType(content, title);
    const embedding = await this.generateEmbedding(title + ' ' + content);
    const embeddingString = JSON.stringify(embedding);
    
    const wordCount = content.split(/\s+/).length;
    const charCount = content.length;
    
    // Insert document
    this.db.run(`
      INSERT INTO documents (id, partition, title, content, type, embedding, word_count, char_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, partition, title, content, detectedType, embeddingString, wordCount, charCount]);
    
    // Insert tags
    const tags = this.extractTags(content);
    for (const tag of tags) {
      this.db.run(`
        INSERT INTO tags (document_id, tag) VALUES (?, ?)
      `, [id, tag]);
    }
    
    this.saveDatabase();
    
    return {
      id,
      partition,
      title,
      content,
      type: detectedType,
      wordCount,
      charCount,
      tags,
      summary: this.generateSummary(content)
    };
  }

  async searchDocuments(query, filters = {}, limit = 10) {
    await this.initialize();
    
    const queryEmbedding = await this.generateEmbedding(query);
    
    // Build SQL query with filters
    let sql = `
      SELECT d.*, GROUP_CONCAT(t.tag) as tags
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
    
    if (filters.tags && filters.tags.length > 0) {
      sql += ` AND d.id IN (
        SELECT document_id FROM tags 
        WHERE tag IN (${filters.tags.map(() => '?').join(',')})
      )`;
      params.push(...filters.tags);
    }
    
    sql += ` GROUP BY d.id ORDER BY d.created_at DESC`;
    
    const stmt = this.db.prepare(sql);
    stmt.bind(params);
    const documents = [];
    
    while (stmt.step()) {
      documents.push(stmt.getAsObject());
    }
    stmt.free();
    
    // Calculate similarity scores
    const scoredResults = documents.map(doc => {
      const docEmbedding = JSON.parse(doc.embedding);
      const similarity = cosineSimilarity(queryEmbedding, docEmbedding);
      
      return {
        ...doc,
        similarity,
        tags: doc.tags ? doc.tags.split(',') : [],
        summary: this.generateSummary(doc.content)
      };
    });
    
    // Sort by similarity and return top results
    return scoredResults
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  async getDocument(id) {
    await this.initialize();
    
    const stmt = this.db.prepare(`
      SELECT d.*, GROUP_CONCAT(t.tag) as tags
      FROM documents d
      LEFT JOIN tags t ON d.id = t.document_id
      WHERE d.id = ?
      GROUP BY d.id
    `);
    
    stmt.bind([id]);
    let doc = null;
    
    if (stmt.step()) {
      doc = stmt.getAsObject();
    }
    stmt.free();
    
    if (!doc) return null;
    
    return {
      ...doc,
      tags: doc.tags ? doc.tags.split(',') : [],
      summary: this.generateSummary(doc.content)
    };
  }

  async deleteDocument(id) {
    await this.initialize();
    
    this.db.run('DELETE FROM documents WHERE id = ?', [id]);
    this.db.run('DELETE FROM tags WHERE document_id = ?', [id]);
    this.saveDatabase();
    return true;
  }

  async listDocuments(filters = {}, limit = 50) {
    await this.initialize();
    
    let sql = `
      SELECT d.*, GROUP_CONCAT(t.tag) as tags
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
    
    sql += ` GROUP BY d.id ORDER BY d.created_at DESC LIMIT ?`;
    params.push(limit);
    
    const stmt = this.db.prepare(sql);
    stmt.bind(params);
    const documents = [];
    
    while (stmt.step()) {
      documents.push(stmt.getAsObject());
    }
    stmt.free();
    
    return documents.map(doc => ({
      ...doc,
      tags: doc.tags ? doc.tags.split(',') : [],
      summary: this.generateSummary(doc.content)
    }));
  }

  // Collection operations
  async createCollection(name, description = '', partition = 'default') {
    await this.initialize();
    
    const id = randomUUID();
    this.db.run(`
      INSERT INTO collections (id, partition, name, description)
      VALUES (?, ?, ?, ?)
    `, [id, partition, name, description]);
    
    this.saveDatabase();
    return { id, partition, name, description };
  }

  async addToCollection(collectionId, documentId) {
    await this.initialize();
    
    this.db.run(`
      INSERT OR IGNORE INTO collection_documents (collection_id, document_id)
      VALUES (?, ?)
    `, [collectionId, documentId]);
    
    this.saveDatabase();
    return true;
  }

  async getCollections(partition = null) {
    await this.initialize();
    
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
    stmt.bind(params);
    
    const collections = [];
    while (stmt.step()) {
      collections.push(stmt.getAsObject());
    }
    stmt.free();
    
    return collections;
  }

  // Backup operations
  async createBackup(backupPath = null) {
    await this.initialize();
    
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = backupPath || getBackupPath();
      
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      const backupFile = path.join(backupDir, `atorag-backup-${timestamp}.db`);
      
      // Export database and save to backup file
      const data = this.db.export();
      fs.writeFileSync(backupFile, Buffer.from(data));
      
      return {
        success: true,
        backupFile,
        size: fs.statSync(backupFile).size,
        timestamp
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
        throw new Error('Backup file not found');
      }
      
      // Create restore point
      const restorePoint = await this.createBackup(path.join(getBackupPath(), 'restore-points'));
      
      // Close current database
      if (this.db) {
        this.db.close();
      }
      
      // Copy backup over current database
      fs.copyFileSync(backupFile, this.dbPath);
      
      // Reinitialize
      this.initialized = false;
      await this.initialize();
      
      return {
        success: true,
        restorePoint: restorePoint.backupFile
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
      const dir = backupDir || getBackupPath();
      
      if (!fs.existsSync(dir)) {
        return [];
      }
      
      const files = fs.readdirSync(dir)
        .filter(file => file.startsWith('atorag-backup-') && file.endsWith('.db'))
        .map(file => {
          const filePath = path.join(dir, file);
          const stats = fs.statSync(filePath);
          return {
            filename: file,
            path: filePath,
            size: stats.size,
            created: stats.birthtime.toISOString(),
            modified: stats.mtime.toISOString()
          };
        })
        .sort((a, b) => new Date(b.created) - new Date(a.created));
      
      return files;
    } catch (error) {
      logger.error(`Failed to list backups: ${error.message}`);
      return [];
    }
  }

  analyzeContent(content, title = '') {
    const wordCount = content.split(/\s+/).length;
    const charCount = content.length;
    const type = this.detectDocumentType(content, title);
    const tags = this.extractTags(content);
    const summary = this.generateSummary(content);
    
    // Extract key topics
    const words = content.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const wordFreq = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    const topics = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
    
    return {
      wordCount,
      charCount,
      type,
      tags,
      summary,
      topics,
      estimatedReadTime: Math.ceil(wordCount / 200)
    };
  }
}

// Initialize the knowledge base
const knowledgeBase = new VectorKnowledgeBase();

// Initialize MCP server
const server = new Server(
  {
    name: "atorag-extension",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "store_document",
        description: "Store any document, text, or data in the knowledge base",
        inputSchema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "Title or name of the document"
            },
            content: {
              type: "string",
              description: "The full content of the document"
            },
            type: {
              type: "string",
              description: "Optional document type (auto-detected if not provided)",
              enum: ["document", "policy", "meeting", "report", "research", "guide", "contract", "financial", "csv"]
            },
            partition: {
              type: "string",
              description: "Partition name to store the document in (default: 'default')",
              default: "default"
            },
            metadata: {
              type: "object",
              description: "Optional metadata object with additional information"
            }
          },
          required: ["title", "content"]
        },
      },
      {
        name: "smart_search",
        description: "Search the knowledge base using natural language with advanced filtering",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Natural language search query"
            },
            partition: {
              type: "string",
              description: "Filter by partition name"
            },
            type: {
              type: "string",
              description: "Filter by document type",
              enum: ["document", "policy", "meeting", "report", "research", "guide", "contract", "financial", "csv"]
            },
            tags: {
              type: "array",
              items: { type: "string" },
              description: "Filter by tags"
            },
            limit: {
              type: "number",
              description: "Maximum number of results",
              default: 10
            }
          },
          required: ["query"]
        },
      },
      {
        name: "list_documents",
        description: "Browse all stored documents with filtering options",
        inputSchema: {
          type: "object",
          properties: {
            partition: {
              type: "string",
              description: "Filter by partition name"
            },
            type: {
              type: "string",
              description: "Filter by document type"
            },
            limit: {
              type: "number",
              description: "Maximum number of documents to return",
              default: 20
            }
          }
        },
      },
      {
        name: "get_document",
        description: "Retrieve full details of a specific document",
        inputSchema: {
          type: "object",
          properties: {
            document_id: {
              type: "string",
              description: "ID of the document to retrieve"
            }
          },
          required: ["document_id"]
        },
      },
      {
        name: "delete_document",
        description: "Remove a document from the knowledge base",
        inputSchema: {
          type: "object",
          properties: {
            document_id: {
              type: "string",
              description: "ID of the document to delete"
            }
          },
          required: ["document_id"]
        },
      },
      {
        name: "analyze_content",
        description: "Analyze content before storing to show summary and insights",
        inputSchema: {
          type: "object",
          properties: {
            content: {
              type: "string",
              description: "Content to analyze"
            },
            title: {
              type: "string",
              description: "Optional title for context"
            }
          },
          required: ["content"]
        },
      },
      {
        name: "manage_partitions",
        description: "Create, list, or delete knowledge base partitions",
        inputSchema: {
          type: "object",
          properties: {
            action: {
              type: "string",
              enum: ["create", "list", "delete"],
              description: "Action to perform"
            },
            partition_name: {
              type: "string",
              description: "Name of the partition (for create/delete actions)"
            },
            description: {
              type: "string",
              description: "Description of the partition (for create action)"
            }
          },
          required: ["action"]
        },
      },
      {
        name: "manage_collections",
        description: "Create and manage document collections within partitions",
        inputSchema: {
          type: "object",
          properties: {
            action: {
              type: "string",
              enum: ["create", "list", "add_document"],
              description: "Action to perform"
            },
            collection_name: {
              type: "string",
              description: "Name of the collection (for create action)"
            },
            description: {
              type: "string",
              description: "Description of the collection (for create action)"
            },
            partition: {
              type: "string",
              description: "Partition name (for create action)",
              default: "default"
            },
            collection_id: {
              type: "string",
              description: "ID of the collection (for add_document action)"
            },
            document_id: {
              type: "string",
              description: "ID of the document to add (for add_document action)"
            }
          },
          required: ["action"]
        },
      },
      {
        name: "backup_restore",
        description: "Create backups, restore from backups, or list available backups. Uses configurable backup directory set during installation.",
        inputSchema: {
          type: "object",
          properties: {
            action: {
              type: "string",
              enum: ["create_backup", "restore_backup", "list_backups"],
              description: "Action to perform"
            },
            backup_path: {
              type: "string",
              description: "Custom backup directory path (optional for create_backup and list_backups). If not provided, uses the configured backup directory."
            },
            backup_file: {
              type: "string",
              description: "Path to backup file (required for restore_backup)"
            }
          },
          required: ["action"]
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "store_document":
        const doc = await knowledgeBase.addDocument(
          args.title,
          args.content,
          args.type,
          args.metadata || {},
          args.partition || 'default'
        );
        
        return {
          content: [
            {
              type: "text",
              text: `✅ Successfully stored document!\n\n📄 **${doc.title}**\n📂 Partition: ${doc.partition}\n📝 Type: ${doc.type}\n🏷️ Tags: ${doc.tags.join(', ') || 'None'}\n📊 ${doc.wordCount} words, ${doc.charCount} characters\n📋 Summary: ${doc.summary}\n🆔 ID: ${doc.id}`
            }
          ]
        };

      case "smart_search":
        const results = await knowledgeBase.searchDocuments(
          args.query,
          {
            partition: args.partition,
            type: args.type,
            tags: args.tags
          },
          args.limit || 10
        );
        
        if (results.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `🔍 No documents found matching: "${args.query}"`
              }
            ]
          };
        }

        const searchResults = results.map((doc, index) => {
          const score = Math.round(doc.similarity * 100);
          const date = new Date(doc.created_at).toLocaleDateString();
          return `${index + 1}. **${doc.title}** (${score}% match)\n   📂 ${doc.partition} | 📝 ${doc.type} | 📅 ${date}\n   🏷️ ${doc.tags.join(', ') || 'No tags'}\n   📋 ${doc.summary}\n   🆔 ID: ${doc.id}\n`;
        }).join('\n');

        return {
          content: [
            {
              type: "text",
              text: `🔍 Search results for: "${args.query}"\n\n${searchResults}`
            }
          ]
        };

      case "list_documents":
        const allDocs = await knowledgeBase.listDocuments(
          {
            partition: args.partition,
            type: args.type
          },
          args.limit || 20
        );
        
        if (allDocs.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "📚 No documents found in the knowledge base."
              }
            ]
          };
        }

        const docsList = allDocs.map((doc, index) => {
          const date = new Date(doc.created_at).toLocaleDateString();
          return `${index + 1}. **${doc.title}** (${doc.type})\n   📂 ${doc.partition} | 📅 ${date} | 📊 ${doc.word_count} words\n   🏷️ ${doc.tags.join(', ') || 'No tags'}\n   🆔 ID: ${doc.id}\n`;
        }).join('\n');

        return {
          content: [
            {
              type: "text",
              text: `📚 Knowledge Base (${allDocs.length} documents):\n\n${docsList}`
            }
          ]
        };

      case "get_document":
        const document = await knowledgeBase.getDocument(args.document_id);
        
        if (!document) {
          return {
            content: [
              {
                type: "text",
                text: `❌ Document not found: ${args.document_id}`
              }
            ]
          };
        }

        const date = new Date(document.created_at).toLocaleDateString();
        return {
          content: [
            {
              type: "text",
              text: `📄 **${document.title}**\n\n📂 Partition: ${document.partition}\n📝 Type: ${document.type}\n📅 Created: ${date}\n🏷️ Tags: ${document.tags.join(', ') || 'None'}\n📊 ${document.word_count} words, ${document.char_count} characters\n\n📋 **Summary:**\n${document.summary}\n\n📖 **Full Content:**\n${document.content}`
            }
          ]
        };

      case "delete_document":
        const deleted = await knowledgeBase.deleteDocument(args.document_id);
        
        if (deleted) {
          return {
            content: [
              {
                type: "text",
                text: `✅ Successfully deleted document: ${args.document_id}`
              }
            ]
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: `❌ Document not found: ${args.document_id}`
              }
            ]
          };
        }

      case "analyze_content":
        const analysis = knowledgeBase.analyzeContent(args.content, args.title);
        
        return {
          content: [
            {
              type: "text",
              text: `🔍 **Content Analysis**\n\n📊 **Statistics:**\n- ${analysis.wordCount} words\n- ${analysis.charCount} characters\n- ~${analysis.estimatedReadTime} min read time\n\n📝 **Detected Type:** ${analysis.type}\n\n🏷️ **Suggested Tags:** ${analysis.tags.join(', ') || 'None'}\n\n🎯 **Key Topics:** ${analysis.topics.join(', ')}\n\n📋 **Summary:**\n${analysis.summary}`
            }
          ]
        };

      case "manage_partitions":
        switch (args.action) {
          case "create":
            const partition = await knowledgeBase.createPartition(args.partition_name, args.description);
            return {
              content: [
                {
                  type: "text",
                  text: `✅ Created partition "${partition.name}"\n🆔 ID: ${partition.id}\n📝 Description: ${partition.description || 'None'}`
                }
              ]
            };

          case "list":
            const partitions = await knowledgeBase.listPartitions();
            if (partitions.length === 0) {
              return {
                content: [
                  {
                    type: "text",
                    text: "📂 No partitions found."
                  }
                ]
              };
            }

            const partitionsList = partitions.map((p, index) => {
              const date = new Date(p.created_at).toLocaleDateString();
              return `${index + 1}. **${p.name}** (${p.document_count} docs, ${p.collection_count} collections)\n   📝 ${p.description || 'No description'}\n   📅 Created: ${date}\n   🆔 ID: ${p.id}\n`;
            }).join('\n');

            return {
              content: [
                {
                  type: "text",
                  text: `📂 Knowledge Base Partitions:\n\n${partitionsList}`
                }
              ]
            };

          case "delete":
            try {
              await knowledgeBase.deletePartition(args.partition_name);
              return {
                content: [
                  {
                    type: "text",
                    text: `✅ Deleted partition "${args.partition_name}" and all its contents`
                  }
                ]
              };
            } catch (error) {
              return {
                content: [
                  {
                    type: "text",
                    text: `❌ Error deleting partition: ${error.message}`
                  }
                ]
              };
            }

          default:
            throw new Error(`Unknown partition action: ${args.action}`);
        }

      case "manage_collections":
        switch (args.action) {
          case "create":
            const collection = await knowledgeBase.createCollection(
              args.collection_name, 
              args.description, 
              args.partition || 'default'
            );
            return {
              content: [
                {
                  type: "text",
                  text: `✅ Created collection "${collection.name}"\n📂 Partition: ${collection.partition}\n🆔 ID: ${collection.id}`
                }
              ]
            };

          case "list":
            const collections = await knowledgeBase.getCollections(args.partition);
            if (collections.length === 0) {
              return {
                content: [
                  {
                    type: "text",
                    text: "📁 No collections found."
                  }
                ]
              };
            }

            const collectionsList = collections.map((col, index) => {
              const date = new Date(col.created_at).toLocaleDateString();
              return `${index + 1}. **${col.name}** (${col.document_count} documents)\n   📂 Partition: ${col.partition}\n   📝 ${col.description || 'No description'}\n   📅 Created: ${date}\n   🆔 ID: ${col.id}\n`;
            }).join('\n');

            return {
              content: [
                {
                  type: "text",
                  text: `📁 Collections:\n\n${collectionsList}`
                }
              ]
            };

          case "add_document":
            const added = await knowledgeBase.addToCollection(args.collection_id, args.document_id);
            return {
              content: [
                {
                  type: "text",
                  text: added ? 
                    `✅ Added document to collection` :
                    `❌ Failed to add document to collection (check IDs)`
                }
              ]
            };

          default:
            throw new Error(`Unknown collection action: ${args.action}`);
        }

      case "backup_restore":
        switch (args.action) {
          case "create_backup":
            const backupResult = await knowledgeBase.createBackup(args.backup_path);
            
            if (backupResult.success) {
              const sizeKB = Math.round(backupResult.size / 1024);
              return {
                content: [
                  {
                    type: "text",
                    text: `✅ **Backup Created Successfully!**\n\n📁 **File:** ${backupResult.backupFile}\n📊 **Size:** ${sizeKB} KB\n📅 **Created:** ${backupResult.timestamp}\n\n💡 **Tip:** Save this backup file path for future restoration if needed.`
                  }
                ]
              };
            } else {
              return {
                content: [
                  {
                    type: "text",
                    text: `❌ **Backup Failed:** ${backupResult.error}`
                  }
                ]
              };
            }

          case "restore_backup":
            if (!args.backup_file) {
              return {
                content: [
                  {
                    type: "text",
                    text: `❌ **Error:** backup_file parameter is required for restore_backup action`
                  }
                ]
              };
            }

            const restoreResult = await knowledgeBase.restoreFromBackup(args.backup_file);
            
            if (restoreResult.success) {
              return {
                content: [
                  {
                    type: "text",
                    text: `✅ **Restore Completed Successfully!**\n\n🔄 **Restore Point Created:** ${restoreResult.restorePoint}\n\n💡 **Note:** A restore point was automatically created before the restoration in case you need to revert.`
                  }
                ]
              };
            } else {
              return {
                content: [
                  {
                    type: "text",
                    text: `❌ **Restore Failed:** ${restoreResult.error}`
                  }
                ]
              };
            }

          case "list_backups":
            const backups = await knowledgeBase.listBackups(args.backup_path);
            
            if (backups.length === 0) {
              return {
                content: [
                  {
                    type: "text",
                    text: "📁 No backups found. Use 'create_backup' action to create your first backup."
                  }
                ]
              };
            }

            const backupsList = backups.map((backup, index) => {
              const date = new Date(backup.created).toLocaleDateString();
              const time = new Date(backup.created).toLocaleTimeString();
              const sizeKB = Math.round(backup.size / 1024);
              return `${index + 1}. **${backup.filename}**\n   📅 ${date} at ${time}\n   📊 ${sizeKB} KB\n   📁 ${backup.path}\n`;
            }).join('\n');

            return {
              content: [
                {
                  type: "text",
                  text: `📁 **Available Backups (${backups.length}):**\n\n${backupsList}\n💡 **Tip:** Copy the full path to use with restore_backup action.`
                }
              ]
            };

          default:
            throw new Error(`Unknown backup action: ${args.action}`);
        }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    logger.error(`Error in tool call: ${error.message}`);
    return {
      content: [
        {
          type: "text",
          text: `❌ Error: ${error.message}`
        }
      ]
    };
  }
});

// Start the server
async function runServer() {
  try {
    logger.info("Starting AtoRAG Universal Knowledge Base MCP Server by AtonomyAI");
    logger.info(`Node.js version: ${process.version}`);
    logger.info(`Working directory: ${process.cwd()}`);
    logger.info(`Knowledge base directory: ${atoragPath}`);
    logger.info(`Backup directory: ${getBackupPath()}`);

    // Initialize knowledge base first
    logger.info("Initializing knowledge base...");
    await knowledgeBase.initialize();
    logger.info("Knowledge base initialized successfully");

    // Using built-in crypto-based embeddings for reliability
    logger.info("Using built-in text embeddings (TF-IDF style with crypto hashing)");

    logger.info("Starting MCP server transport...");
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logger.info("🚀 AtoRAG by AtonomyAI MCP Server connected successfully!");
  } catch (error) {
    logger.error(`Server initialization failed: ${error.message}`);
    logger.error(`Stack trace: ${error.stack}`);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  if (knowledgeBase && knowledgeBase.db) {
    knowledgeBase.saveDatabase();
    knowledgeBase.db.close();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  if (knowledgeBase && knowledgeBase.db) {
    knowledgeBase.saveDatabase();
    knowledgeBase.db.close();
  }
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  logger.error(`Stack trace: ${reason.stack}`);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`);
  logger.error(`Stack trace: ${error.stack}`);
  process.exit(1);
});

// Start the server
runServer().catch((error) => {
  logger.error(`Failed to start server: ${error.message}`);
  process.exit(1);
}); 