export async function handlePartitionTools(name, args, knowledgeBase) {
  switch (name) {
    case "manage_partitions":
      switch (args.action) {
        case "create":
          if (!args.name) {
            return {
              content: [
                {
                  type: "text",
                  text: "❌ **Error:** name parameter is required for create action"
                }
              ]
            };
          }

          const createResult = await knowledgeBase.createPartition(args.name, args.description);
          
          if (createResult.success) {
            return {
              content: [
                {
                  type: "text",
                  text: `✅ **Partition Created Successfully!**\n\n📁 **Name:** ${createResult.name}\n📝 **Description:** ${createResult.description || 'None'}\n🆔 **ID:** ${createResult.id}`
                }
              ]
            };
          } else {
            return {
              content: [
                {
                  type: "text",
                  text: `❌ **Failed to create partition:** ${createResult.error}`
                }
              ]
            };
          }

        case "list":
          const partitions = await knowledgeBase.listPartitions();
          
          if (partitions.length === 0) {
            return {
              content: [
                {
                  type: "text",
                  text: "📁 No partitions found."
                }
              ]
            };
          }
          
          const partitionsList = partitions.map((partition, index) => {
            const created = new Date(partition.created_at).toLocaleDateString();
            return `${index + 1}. **${partition.name}**\n   📝 ${partition.description || 'No description'}\n   📊 ${partition.document_count} documents, ${partition.collection_count} collections\n   📅 Created: ${created}\n   🆔 ${partition.id}\n`;
          }).join('\n');
          
          return {
            content: [
              {
                type: "text",
                text: `📁 **Partitions (${partitions.length}):**\n\n${partitionsList}`
              }
            ]
          };

        case "delete":
          if (!args.name) {
            return {
              content: [
                {
                  type: "text",
                  text: "❌ **Error:** name parameter is required for delete action"
                }
              ]
            };
          }

          const deleteResult = await knowledgeBase.deletePartition(args.name);
          
          if (deleteResult.success) {
            return {
              content: [
                {
                  type: "text",
                  text: `✅ Partition '${args.name}' deleted successfully`
                }
              ]
            };
          } else {
            return {
              content: [
                {
                  type: "text",
                  text: `❌ **Failed to delete partition:** ${deleteResult.error}`
                }
              ]
            };
          }

        default:
          throw new Error(`Unknown partition action: ${args.action}`);
      }

    default:
      throw new Error(`Unknown partition tool: ${name}`);
  }
} 