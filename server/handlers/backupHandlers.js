export async function handleBackupTools(name, args, knowledgeBase) {
  switch (name) {
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
      throw new Error(`Unknown backup tool: ${name}`);
  }
} 