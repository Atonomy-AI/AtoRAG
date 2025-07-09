export async function handleCollectionTools(name, args, knowledgeBase) {
  switch (name) {
    case "manage_collections":
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

          const createResult = await knowledgeBase.createCollection(
            args.name,
            args.description,
            args.partition
          );
          
          if (createResult.success) {
            return {
              content: [
                {
                  type: "text",
                  text: `✅ **Collection Created Successfully!**\n\n📁 **Name:** ${createResult.name}\n📝 **Description:** ${createResult.description || 'None'}\n🏷️ **Partition:** ${createResult.partition}\n🆔 **ID:** ${createResult.id}`
                }
              ]
            };
          } else {
            return {
              content: [
                {
                  type: "text",
                  text: `❌ **Failed to create collection:** ${createResult.error}`
                }
              ]
            };
          }

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
          
          const collectionsList = collections.map((collection, index) => {
            const created = new Date(collection.created_at).toLocaleDateString();
            return `${index + 1}. **${collection.name}**\n   📝 ${collection.description || 'No description'}\n   🏷️ Partition: ${collection.partition}\n   📊 ${collection.document_count} documents\n   📅 Created: ${created}\n   🆔 ${collection.id}\n`;
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

    default:
      throw new Error(`Unknown collection tool: ${name}`);
  }
}
 