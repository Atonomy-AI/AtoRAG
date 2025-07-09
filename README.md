# 🚀 AtoRAG - Universal Knowledge Base Extension
*by AtonomyAI*

**Transform any content into a searchable knowledge base through Claude Desktop**

AtoRAG is a completely self-contained desktop extension by AtonomyAI that turns Claude Desktop into a powerful knowledge management system. Store documents, CSV data, policies, research papers, meeting notes, or any text content, then search and retrieve it using natural language.

## ✨ Key Features

### 🎯 **Universal Content Storage**
- **Documents**: PDFs, text files, research papers, manuals
- **Structured Data**: CSV files with automatic column detection
- **Policies & Procedures**: Company documents, guidelines, SOPs
- **Meeting Notes**: Agendas, minutes, action items
- **Research**: Studies, reports, analysis documents
- **Contracts**: Agreements, invoices, legal documents

### 🔍 **Intelligent Search**
- **Natural Language**: Search using everyday language
- **Smart Filtering**: Filter by type, tags, date ranges
- **Advanced Scoring**: Multiple relevance factors for better results
- **Vector Similarity**: Custom text embeddings for semantic search

### 🏷️ **Automatic Organization**
- **Auto-tagging**: Extracts meaningful tags from content
- **Type Detection**: Automatically categorizes documents
- **Smart Summaries**: Generates concise summaries
- **Collections**: Organize related documents together

### 💻 **Zero Dependencies**
- **Self-Contained**: No Python, no external installations
- **Built-in Node.js**: Uses Claude Desktop's runtime
- **Local Storage**: All data stays on your machine
- **Drag & Drop**: Install with a single .dxt file

### 🏢 **Enterprise Solutions**
- **Shared Corporate Knowledge Bases**: PostgreSQL-powered RAG servers
- **Multi-User Access**: Role-based permissions and audit trails
- **Centralized Management**: All employees access same knowledge base
- **Custom Integrations**: SSO, API development, etc.

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

#### Option 1: Build from Source (Recommended)
1. **Clone the repository**:
   ```bash
   git clone https://github.com/Atonomy-AI/AtoRAG.git
   cd AtoRAG
   ```

2. **Build the extension**:
   ```bash
   ./build.sh
   ```

3. **Install in Claude Desktop**:
   - Open Claude Desktop
   - Go to Settings → Extensions
   - Drag and drop the generated `AtoRAG.dxt` file
   - Click 'Install'

4. **Optional**: Configure backup directory path (recommended)
5. **Start using**: The extension is now available in your Claude conversations!

#### Option 2: Download Pre-built Extension
Check the [Releases](https://github.com/Atonomy-AI/AtoRAG/releases) page for pre-built `.dxt` files (when available).

### ⚙️ Configuration

#### Backup Directory Path (Recommended)
To preserve your backups when uninstalling the extension, set a custom backup path:

1. During installation, set **Backup Directory Path** to a location outside the extension directory
2. Recommended paths:
   - **macOS/Linux**: `~/Documents/AtoRAG-Backups/`
   - **Windows**: `C:\Users\YourName\Documents\AtoRAG-Backups\`

**Example Claude Desktop configuration:**
```json
{
  "mcpServers": {
    "atorag": {
      "command": "node",
      "args": ["path/to/server/index.js"],
      "env": {
        "ATORAG_BACKUP_PATH": "/Users/yourname/Documents/AtoRAG-Backups"
      }
    }
  }
}
```

If not configured, backups will be stored in `~/.atorag/backups/` (may be lost when uninstalling).

### Basic Usage

**Store a document:**
```
Store this policy document: [paste your content]
```

**Import CSV data:**
```
Import this CSV file: [paste CSV content]
```

**Search your knowledge base:**
```
Find all documents about data privacy
```

**Browse by type:**
```
Show me all policy documents
```

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

**Company Policy:**
```
Store this document:
Title: "Data Privacy Policy"
Content: "This policy outlines how we handle customer data..."
```

**Meeting Minutes:**
```
Store this meeting note:
Title: "Q4 Planning Meeting - Dec 2024"
Content: "Attendees: John, Sarah, Mike. Agenda: Budget review..."
```

**Research Paper:**
```
Store this research:
Title: "AI in Healthcare - Literature Review"
Content: "Abstract: This paper examines the current state..."
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

## 🏗️ Technical Architecture

### Advanced Text Processing
- **Multi-hash Embeddings**: Sophisticated text vectorization
- **Semantic Similarity**: Custom cosine similarity scoring
- **Content Analysis**: Automatic type detection and tagging
- **Smart Summarization**: Intelligent content summarization

### Local Storage
- **JSON Database**: Simple, fast, and reliable
- **Home Directory**: `~/.atorag/knowledge_base/`
- **Automatic Backups**: Data persistence across sessions
- **Privacy First**: All data stays local

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
npm run build
```

### Creating Extension
```bash
./build.sh
```

### Self-Contained Build
```bash
./build_selfcontained.sh
```

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