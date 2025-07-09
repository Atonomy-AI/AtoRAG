export const backupTools = [
  {
    name: "backup_restore",
    description: "Create backups, restore from backups, or list available backups",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          description: "Action to perform",
          enum: ["create_backup", "restore_backup", "list_backups"]
        },
        backup_path: {
          type: "string",
          description: "Custom backup directory path (optional)"
        },
        backup_file: {
          type: "string",
          description: "Full path to backup file (required for restore_backup)"
        }
      },
      required: ["action"]
    }
  }
]; 