export const collectionTools = [
  {
    name: "manage_collections",
    description: "Create collections and manage document groupings",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          description: "Action to perform",
          enum: ["create", "list", "add_document"]
        },
        name: {
          type: "string",
          description: "Collection name (required for create)"
        },
        description: {
          type: "string",
          description: "Collection description (optional for create)"
        },
        partition: {
          type: "string",
          description: "Partition name (optional for create/list, defaults to 'default')"
        },
        collection_id: {
          type: "string",
          description: "Collection ID (required for add_document)"
        },
        document_id: {
          type: "string",
          description: "Document ID (required for add_document)"
        }
      },
      required: ["action"]
    }
  }
]; 