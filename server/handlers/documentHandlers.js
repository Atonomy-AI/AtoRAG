export async function handleDocumentTools(name, args, knowledgeBase) {
  switch (name) {
    case "add_document":
      const result = await knowledgeBase.addDocument(
        args.title,
        args.content,
        args.type,
        {},
        args.partition
      );
      
      if (result.success) {
        return {
          content: [
            {
              type: "text",
              text: `✅ **Document Added Successfully!**\n\n📄 **Title:** ${args.title}\n🏷️ **Type:** ${result.type}\n📊 **Stats:** ${result.wordCount} words, ${result.charCount} characters\n🔖 **Auto-tags:** ${result.tags.join(', ') || 'None'}\n🆔 **ID:** ${result.id}`
            }
          ]
        };
      } else {
        return {
          content: [
            {
              type: "text",
              text: `❌ **Failed to add document:** ${result.error}`
            }
          ]
        };
      }

    case "search_documents":
      const searchResults = await knowledgeBase.searchDocuments(args.query, {
        partition: args.partition,
        type: args.type,
        tag: args.tag
      }, args.limit || 10);
      
      if (searchResults.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `🔍 No documents found matching: "${args.query}"`
            }
          ]
        };
      }
      
      const resultsList = searchResults.map((doc, index) => {
        const similarity = Math.round(doc.similarity * 100);
        const preview = doc.content.substring(0, 200) + (doc.content.length > 200 ? '...' : '');
        const tags = doc.tags.length > 0 ? doc.tags.join(', ') : 'None';
        
        return `**${index + 1}. ${doc.title}** (${similarity}% match)\n🏷️ Type: ${doc.type} | Tags: ${tags}\n📝 Preview: ${preview}\n🆔 ID: ${doc.id}\n`;
      }).join('\n');
      
      return {
        content: [
          {
            type: "text",
            text: `🔍 **Search Results for "${args.query}"** (${searchResults.length} found):\n\n${resultsList}`
          }
        ]
      };

    case "get_document":
      const doc = await knowledgeBase.getDocument(args.id);
      
      if (!doc) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Document not found with ID: ${args.id}`
            }
          ]
        };
      }
      
      const tags = doc.tags.length > 0 ? doc.tags.join(', ') : 'None';
      const created = new Date(doc.created_at).toLocaleDateString();
      
      return {
        content: [
          {
            type: "text",
            text: `📄 **${doc.title}**\n\n🏷️ **Type:** ${doc.type}\n📁 **Partition:** ${doc.partition}\n🔖 **Tags:** ${tags}\n📊 **Stats:** ${doc.word_count} words, ${doc.char_count} characters\n📅 **Created:** ${created}\n🆔 **ID:** ${doc.id}\n\n**Content:**\n${doc.content}`
          }
        ]
      };

    case "list_documents":
      const documents = await knowledgeBase.listDocuments({
        partition: args.partition,
        type: args.type,
        tag: args.tag
      }, args.limit || 50);
      
      if (documents.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "📁 No documents found matching the specified criteria."
            }
          ]
        };
      }
      
      const docsList = documents.map((doc, index) => {
        const created = new Date(doc.created_at).toLocaleDateString();
        const tags = doc.tags.length > 0 ? doc.tags.join(', ') : 'None';
        
        return `${index + 1}. **${doc.title}**\n   🏷️ ${doc.type} | 📁 ${doc.partition} | 🔖 ${tags}\n   📊 ${doc.word_count} words | 📅 ${created}\n   🆔 ${doc.id}\n`;
      }).join('\n');
      
      return {
        content: [
          {
            type: "text",
            text: `📁 **Documents (${documents.length}):**\n\n${docsList}`
          }
        ]
      };

    case "delete_document":
      const deleteResult = await knowledgeBase.deleteDocument(args.id);
      
      if (deleteResult.success) {
        return {
          content: [
            {
              type: "text",
              text: `✅ Document deleted successfully (ID: ${args.id})`
            }
          ]
        };
      } else {
        return {
          content: [
            {
              type: "text",
              text: `❌ Failed to delete document: ${deleteResult.error}`
            }
          ]
        };
      }

    case "analyze_content":
      const analysis = knowledgeBase.analyzeContent(args.content, args.title);
      
      const keyPhrasesList = analysis.keyPhrases
        .map(phrase => `${phrase.word} (${phrase.frequency}x)`)
        .join(', ');
      
      return {
        content: [
          {
            type: "text",
            text: `📊 **Content Analysis:**\n\n**📈 Statistics:**\n- Words: ${analysis.wordCount}\n- Characters: ${analysis.charCount}\n- Sentences: ${analysis.sentences}\n- Avg words per sentence: ${analysis.avgWordsPerSentence}\n\n**📖 Readability:**\n- Score: ${analysis.readabilityScore}\n- Level: ${analysis.readabilityLevel}\n\n**🏷️ Document Type:** ${analysis.type}\n\n**🔖 Auto-detected Tags:** ${analysis.tags.join(', ') || 'None'}\n\n**🔑 Key Phrases:** ${keyPhrasesList}\n\n**📝 Summary:**\n${analysis.summary}`
          }
        ]
      };

    default:
      throw new Error(`Unknown document tool: ${name}`);
  }
} 