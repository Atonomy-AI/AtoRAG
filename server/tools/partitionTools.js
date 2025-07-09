export const partitionTools = [
  {
    name: "manage_partitions",
    description: "Create, list, or delete partitions for organizing documents",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          description: "Action to perform",
          enum: ["create", "list", "delete"]
        },
        name: {
          type: "string",
          description: "Partition name (required for create/delete)"
        },
        description: {
          type: "string",
          description: "Partition description (optional for create)"
        }
      },
      required: ["action"]
    }
  }
]; 