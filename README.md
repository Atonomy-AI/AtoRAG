# 🚀 AtoRAG - Universal RAG Knowledge Base Extension
*by AtonomyAI*

**Transform any content into a searchable RAG (Retrieval-Augmented Generation) knowledge base through Claude Desktop**

AtoRAG is a completely self-contained desktop extension by AtonomyAI that turns Claude Desktop into a powerful RAG-enabled knowledge management system. Store documents, CSV data, policies, research papers, meeting notes, or any text content, then search and retrieve it using natural language with advanced semantic search and vector embeddings.

## ✨ Key Features

### 🎯 **Universal Content Storage**
- **Documents**: PDFs, text files, research papers, manuals
- **Structured Data**: CSV files with automatic column detection
- **Policies & Procedures**: Company documents, guidelines, SOPs
- **Meeting Notes**: Agendas, minutes, action items
- **Research**: Studies, reports, analysis documents
- **Contracts**: Agreements, invoices, legal documents

### 🔍 **RAG-Powered Intelligent Search**
- **Natural Language**: Search using everyday language queries
- **Vector Embeddings**: Uses all-MiniLM-L6-v2 transformer model for semantic understanding
- **Semantic Search**: Finds contextually relevant content, not just keyword matches
- **Smart Filtering**: Filter by type, tags, date ranges, and partitions
- **Advanced Scoring**: Multiple relevance factors for better results
- **Retrieval-Augmented Generation**: Perfect for feeding Claude with relevant context

### 🏷️ **Automatic Organization**
- **Auto-tagging**: Extracts meaningful tags from content
- **Type Detection**: Automatically categorizes documents
- **Smart Summaries**: Generates concise summaries
- **Collections**: Organize related documents together

### 💻 **Zero Dependencies RAG Stack**
- **Self-Contained**: Complete RAG system with no Python, no external installations
- **Built-in Embeddings**: Uses @xenova/transformers for all-MiniLM-L6-v2 embeddings
- **SQLite Vector Database**: Efficient local vector storage with semantic search
- **Built-in Node.js**: Uses Claude Desktop's runtime
- **Local Storage**: All data and embeddings stay on your machine
- **Drag & Drop**: Install complete RAG system with a single .dxt file

### 🏢 **Enterprise RAG Solutions**
- **Shared Corporate Knowledge Bases**: PostgreSQL-powered RAG servers with advanced embeddings
- **Multi-User RAG Access**: Role-based permissions and audit trails for knowledge retrieval
- **Centralized RAG Management**: All employees access same vector-indexed knowledge base
- **Custom RAG Integrations**: SSO, API development, custom embedding models, etc.

**Enterprise Architecture:**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Claude Desktop│    │   AtoRAG Client │    │  PostgreSQL RAG │
│   (Employee)    │◄──►│   (MCP Server)  │◄──►│   (Corporate)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Redis Cache   │
                       │   (Embeddings)  │
                       └─────────────────┘
```

**Interested in an enterprise MCP solution?** Contact us at [info@atonomy.ai](mailto:info@atonomy.ai)

## 🚀 Quick Start

### Installation

#### Option 1: Download Pre-built Extension
1. Download the [latest release](https://github.com/Atonomy-AI/AtoRAG/releases/latest) for a pre-built `.dxt` file that can be uploaded directly to Claude Desktop.

#### Option 2: Build from Source
1. **Clone the repository**:
   ```bash
   git clone https://github.com/Atonomy-AI/AtoRAG.git
   cd AtoRAG
   ```

2. **Build the extension**:
   ```bash
   ./scripts/build.sh
   ```

3. **Install in Claude Desktop**:
   - Open Claude Desktop
   - Go to Settings → Extensions
   - Drag and drop the generated `AtoRAG.dxt` file
   - Click 'Install'

4. **Optional**: Configure backup directory path (recommended)
5. **Start using**: The extension is now available in your Claude conversations!

### ⚙️ Configuration

#### Backup Directory Path (Recommended)
To preserve your backups when uninstalling the extension, set a custom backup path:

1. During installation, set **Backup Directory Path** to a location outside the extension directory
2. Recommended paths:
   - **macOS/Linux**: `~/Documents/AtoRAG-Backups/`
   - **Windows**: `C:\Users\YourName\Documents\AtoRAG-Backups\`

If not configured, backups will be stored in `~/.atorag/backups/` (may be lost when uninstalling).

### Basic Usage

**Store documents (multiple ways):**
```
# Upload files directly in Claude Desktop, then:
Save these uploaded documents to AtoRAG

# Or paste content:
Store this policy document: [paste your content]

# Or import CSV data:
Import this CSV file: [paste CSV content]
```

**Search your knowledge base:**
```
Find all documents about data privacy
Search for information about budget planning
What do we have on customer feedback?
```

**Browse by type:**
```
Show me all policy documents
List all meeting notes from this month
```

## 🤖 What is RAG (Retrieval-Augmented Generation)?

**RAG** combines the power of information retrieval with AI generation to provide more accurate, contextual responses. Instead of relying solely on the AI's training data, RAG systems:

1. **📚 Store Knowledge**: Documents are processed and stored with semantic embeddings
2. **🔍 Retrieve Relevant Info**: When you ask a question, the system finds the most relevant stored content
3. **🧠 Generate Responses**: AI uses the retrieved information to provide accurate, up-to-date answers

### 🎯 How AtoRAG Implements RAG

**AtoRAG transforms Claude Desktop into a complete RAG system:**

```
Your Question → Vector Search → Retrieved Context → Claude + Context → Enhanced Answer
```

**Example RAG Flow:**
1. **Store**: "Our company policy states employees can work remotely 3 days per week"
2. **Ask**: "What's our remote work policy?"
3. **Retrieve**: AtoRAG finds the relevant policy document using semantic search
4. **Generate**: Claude uses the retrieved policy text to give you an accurate answer

### 🔧 RAG Technical Implementation

- **🧮 Embeddings**: Uses all-MiniLM-L6-v2 transformer model (384-dimensional vectors)
- **🗄️ Vector Database**: SQLite with efficient vector storage and cosine similarity search
- **✂️ Chunking**: Automatically splits large documents into searchable chunks
- **🔍 Semantic Search**: Finds contextually relevant content, not just keyword matches
- **⚡ Real-time**: Instant retrieval and context injection into Claude conversations

### 🎨 RAG Use Cases

**📊 Business Intelligence RAG:**
- Store quarterly reports, then ask "What were our key challenges last quarter?"
- Upload meeting minutes, then ask "What decisions were made about the budget?"

**🔬 Research RAG:**
- Store research papers, then ask "What are the latest findings on AI safety?"
- Upload documentation, then ask "How do I implement this API?"

**📚 Knowledge Management RAG:**
- Store company policies, then ask "What's our vacation policy?"
- Upload manuals, then ask "How do I troubleshoot this error?"

## 🛠️ Available Tools

### 📄 `store_document`
Store any document with automatic processing
- **Title**: Document name
- **Content**: Full text content
- **Type**: Auto-detected (document, policy, meeting, etc.)
- **Metadata**: Optional additional information

### 📊 `import_csv`
Import structured data with smart processing
- **CSV Content**: Raw CSV data
- **Filename**: Optional file name
- **Auto-detection**: Columns and data types

### 🔍 `smart_search`
Natural language search with advanced filtering
- **Query**: Natural language search terms
- **Type Filter**: Specific document types
- **Tag Filter**: Filter by extracted tags
- **Date Range**: Filter by creation date

### 📚 `list_documents`
Browse all documents with filtering
- **Type Filter**: Show specific document types
- **Tag Filter**: Filter by tags
- **Limit**: Number of results

### 📖 `get_document`
Retrieve full document details
- **Document ID**: Specific document identifier

### 🗑️ `delete_document`
Remove documents from knowledge base
- **Document ID**: Document to delete

### 🔍 `analyze_content`
Preview content analysis before storing
- **Content**: Text to analyze
- **Title**: Optional title for context

### 📁 `manage_collections`
Organize documents into collections
- **Create**: New collections
- **List**: View all collections
- **Add Document**: Add docs to collections

### 💾 `backup_restore`
Backup and restore your knowledge base
- **Create Backup**: Generate timestamped backup files
- **Restore Backup**: Restore from previous backup
- **List Backups**: View all available backups
- **Configurable Path**: Set custom backup directory

## 🎨 Usage Examples

### Storing Different Content Types

**Upload Multiple Files:**
```
# Upload PDFs, Word docs, text files, etc. in Claude Desktop, then:
Save all these uploaded documents to AtoRAG with type "policy"
```

**Paste Content:**
```
Store this meeting note:
Title: "Q4 Planning Meeting - Dec 2024"
Content: "Attendees: John, Sarah, Mike. Agenda: Budget review..."
```

**Batch Processing:**
```
# Upload multiple research papers, then:
Save these research papers to AtoRAG in the "research" partition
```

### Smart Searching

**Natural Language:**
```
Find documents about budget planning
Search for privacy policies
What do we have on customer feedback?
```

**Filtered Search:**
```
Show me all meeting documents from this month
Find policy documents tagged with "security"
Search for CSV files about sales data
```

### Content Analysis

**Before Storing:**
```
Analyze this content before I store it: [paste content]
```

**Results:**
- Word count and reading time
- Detected document type
- Suggested tags
- Key topics
- Summary preview

### Backup & Restore

**Create Backup:**
```
Create a backup of my knowledge base
```

**List Backups:**
```
Show me all available backups
```

**Restore from Backup:**
```
Restore from this backup: /path/to/backup/atorag-backup-2024-01-15T10-30-45-123Z.json
```

**Custom Backup Location:**
```
Create a backup in my custom directory: /Users/myname/Documents/MyBackups/
```

## 🏗️ RAG Technical Architecture

### Advanced RAG Processing Pipeline
- **🧮 Transformer Embeddings**: Uses all-MiniLM-L6-v2 model for 384-dimensional semantic vectors
- **✂️ Intelligent Chunking**: Automatically splits documents into optimal chunks for retrieval
- **🔍 Vector Search**: Cosine similarity search across embedded document chunks
- **📊 Semantic Scoring**: Multi-factor relevance scoring for accurate retrieval
- **🏷️ Content Analysis**: Automatic type detection and tagging for better organization

### Local RAG Storage
- **🗄️ SQLite Vector Database**: Efficient vector storage with semantic search capabilities
- **🏠 Home Directory**: `~/.atorag/` - All embeddings and data stored locally
- **💾 Automatic Backups**: Complete RAG system backup and restore
- **🔒 Privacy First**: All embeddings and data stay on your machine - no cloud dependencies

### Document Types
- `document` - General documents
- `policy` - Policies and procedures
- `meeting` - Meeting notes and agendas
- `report` - Reports and analysis
- `research` - Research papers and studies
- `guide` - Manuals and guides
- `contract` - Legal documents
- `financial` - Invoices and financial docs
- `csv` - Structured data files

## 🎯 Use Cases

### 📊 **Business Intelligence**
- Store and search company policies
- Analyze meeting minutes and decisions
- Track project documentation
- Organize contracts and agreements

### 🔬 **Research & Development**
- Build a personal research library
- Store and cross-reference papers
- Track experimental data
- Organize literature reviews

### 📈 **Data Management**
- Import and search CSV datasets
- Store data dictionaries
- Track data lineage
- Analyze structured information

### 📝 **Knowledge Management**
- Personal note-taking system
- Team knowledge sharing
- Document version control
- Content organization

## 🛡️ Privacy & Security

- **100% Local**: All data stored on your machine
- **No Cloud**: No external API calls or data transmission
- **Encrypted Storage**: Local file system security
- **Private by Design**: Your data never leaves your device

## 🔧 Development

### Building from Source
```bash
npm install
./scripts/build.sh
```

The `build.sh` script handles everything - it installs dependencies, builds the extension, and creates the `.dxt` file in the root directory.

## 📜 License

MIT License - Open source and free to use, modify, and distribute.

## 🤝 Contributing

We welcome contributions! This is designed to be a universal knowledge management solution for everyone.

### Ideas for Enhancement
- **Multi-format Support**: PDF, Word, PowerPoint parsing
- **Advanced Analytics**: Content insights and trends
- **Export Features**: Backup and migration tools
- **Collaboration**: Shared knowledge bases
- **Integration**: Connect with other tools and services

## 🆘 Support

Having issues? Check these common solutions:

1. **Extension not loading**: Restart Claude Desktop
2. **Search not working**: Check if documents are stored
3. **Import failing**: Verify CSV format
4. **Performance issues**: Large documents may take time to process

## 🌟 Why AtoRAG?

- **Autonomous**: Works independently without external dependencies
- **Intelligent**: Smart content processing and search
- **Universal**: Handles any type of content
- **Private**: Your data stays with you
- **Simple**: Just drag, drop, and start using

Transform your Claude Desktop into the ultimate knowledge management system with AtoRAG! 🚀

---

*Built with ❤️ by AtonomyAI for the Claude Desktop community* 