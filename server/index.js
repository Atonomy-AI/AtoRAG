#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Import utilities
import { logger } from "./utils/logger.js";
import { atoragPath, getBackupPath } from "./utils/paths.js";
  
// Import database
import { VectorKnowledgeBase } from "./database/VectorKnowledgeBase.js";

// Import tools
import { documentTools } from "./tools/documentTools.js";
import { partitionTools } from "./tools/partitionTools.js";
import { collectionTools } from "./tools/collectionTools.js";
import { backupTools } from "./tools/backupTools.js";
    
// Import handlers
import { handleDocumentTools } from "./handlers/documentHandlers.js";
import { handlePartitionTools } from "./handlers/partitionHandlers.js";
import { handleCollectionTools } from "./handlers/collectionHandlers.js";
import { handleBackupTools } from "./handlers/backupHandlers.js";

// Initialize knowledge base
const knowledgeBase = new VectorKnowledgeBase();

// Combine all tools
const allTools = [
  ...documentTools,
  ...partitionTools,
  ...collectionTools,
  ...backupTools
];

// Create server
const server = new Server(
  {
    name: "atorag",
    version: "0.1.0",
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
    tools: allTools
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

  try {
    // Route to appropriate handler based on tool name
    if (documentTools.find(tool => tool.name === name)) {
      return await handleDocumentTools(name, args, knowledgeBase);
    } else if (partitionTools.find(tool => tool.name === name)) {
      return await handlePartitionTools(name, args, knowledgeBase);
    } else if (collectionTools.find(tool => tool.name === name)) {
      return await handleCollectionTools(name, args, knowledgeBase);
    } else if (backupTools.find(tool => tool.name === name)) {
      return await handleBackupTools(name, args, knowledgeBase);
        } else {
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

    // Using all-MiniLM-L6-v2 embeddings with lazy loading
    logger.info("Using all-MiniLM-L6-v2 embeddings (lazy loaded)");

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