export const documentTools = [
  {
    name: "add_document",
    description: "Add a new document to the knowledge base with automatic analysis",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Title of the document"
        },
        content: {
          type: "string",
          description: "Content of the document"
        },
        type: {
          type: "string",
          description: "Document type (optional, will be auto-detected)",
          enum: ["policy", "research", "manual", "report", "document"]
        },
        partition: {
          type: "string",
          description: "Partition name (optional, defaults to 'default')"
        }
      },
      required: ["title", "content"]
    }
  },
  {
    name: "search_documents",
    description: "Search for documents using semantic similarity",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query"
        },
        partition: {
          type: "string",
          description: "Limit search to specific partition"
        },
        type: {
          type: "string",
          description: "Filter by document type"
        },
        tag: {
          type: "string",
          description: "Filter by tag"
        },
        limit: {
          type: "integer",
          description: "Maximum number of results (default: 10)"
        }
      },
      required: ["query"]
    }
  },
  {
    name: "get_document",
    description: "Retrieve a specific document by ID",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Document ID"
        }
      },
      required: ["id"]
    }
  },
  {
    name: "list_documents",
    description: "List all documents with optional filters",
    inputSchema: {
      type: "object",
      properties: {
        partition: {
          type: "string",
          description: "Filter by partition"
        },
        type: {
          type: "string",
          description: "Filter by document type"
        },
        tag: {
          type: "string",
          description: "Filter by tag"
        },
        limit: {
          type: "integer",
          description: "Maximum number of results (default: 50)"
        }
      }
    }
  },
  {
    name: "delete_document",
    description: "Delete a document from the knowledge base",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Document ID to delete"
        }
      },
      required: ["id"]
    }
  },
  {
    name: "analyze_content",
    description: "Analyze content for readability, key phrases, and insights",
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
    }
  }
]; 