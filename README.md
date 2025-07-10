# 🚀 AtoRAG - Universal RAG Knowledge Base Extension
*by AtonomyAI*

**Transform any content into a searchable RAG (Retrieval-Augmented Generation) knowledge base through Claude Desktop**

AtoRAG is a completely self-contained desktop extension by AtonomyAI that turns Claude Desktop into a powerful RAG-enabled knowledge management system. Store documents, CSV data, policies, research papers, meeting notes, or any text content, then search and retrieve it using natural language with enhanced semantic search and TF-IDF similarity algorithms.

## ✨ Key Features

### 🎯 **Universal Content Storage**
- **Documents**: PDFs, text files, research papers, manuals
- **Structured Data**: CSV files with automatic column detection
- **Policies & Procedures**: Company documents, guidelines, SOPs
- **Meeting Notes**: Agendas, minutes, action items
- **Research**: Studies, reports, analysis documents
- **Contracts**: Agreements, invoices, legal documents

### 🔍 **RAG-Powered Intelligent Search**
- **Enhanced Similarity**: TF-IDF + string similarity hybrid for superior accuracy
- **Natural Language**: Search using everyday language queries
- **Semantic Search**: Finds contextually relevant content, not just keyword matches
- **Smart Filtering**: Filter by type, tags, date ranges, and partitions
- **Advanced Scoring**: Multiple relevance factors with proper similarity ranking
- **Real-time Results**: Instant search with optimized performance
- **Retrieval-Augmented Generation**: Perfect for feeding Claude with relevant context

### 🏷️ **Automatic Organization**
- **Auto-tagging**: Extracts meaningful tags from content
- **Type Detection**: Automatically categorizes documents
- **Smart Summaries**: Generates concise summaries
- **Collections**: Organize related documents together

### 💻 **Zero Dependencies & Production Ready**
- **Self-Contained**: Complete RAG system with no Python, no external installations
- **Enhanced Similarity**: TF-IDF + string similarity hybrid for accurate results
- **SQLite Smart Database**: Efficient local content storage with semantic search
- **Built-in Node.js**: Uses Claude Desktop's runtime (Node.js v23.11.0+ supported)
- **Local Storage**: All data and content analysis stay on your machine
- **Drag & Drop**: Install complete RAG system with a single .dxt file
- **Fully Tested**: 100% tool validation through comprehensive pipeline testing
- **Production Quality**: Robust error handling and optimized performance

### 🏢 **Enterprise RAG Solutions**
- **Shared Corporate Knowledge Bases**: PostgreSQL-powered RAG servers with advanced similarity algorithms
- **Multi-User RAG Access**: Role-based permissions and audit trails for knowledge retrieval
- **Centralized RAG Management**: All employees access same intelligently-indexed knowledge base
- **Custom RAG Integrations**: SSO, API development, custom similarity models, etc.

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
                       │   (TF-IDF)      │
                       └─────────────────┘
```

**Interested in an enterprise MCP solution?** Contact us at [info@atonomy.ai](mailto:info@atonomy.ai)

## 🚀 Quick Start

### Installation

#### Option 1: Download Pre-built Extension
1. Download the [latest release](https://github.com/Atonomy-AI/AtoRAG/releases/latest/download/AtoRAG.dxt) for a pre-built `.dxt` file that can be uploaded directly to Claude Desktop.

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

1. **📚 Store Knowledge**: Documents are processed and stored with TF-IDF analysis
2. **🔍 Retrieve Relevant Info**: When you ask a question, the system finds the most relevant stored content
3. **🧠 Generate Responses**: AI uses the retrieved information to provide accurate, up-to-date answers

### 🎯 How AtoRAG Implements RAG

**AtoRAG transforms Claude Desktop into a complete RAG system:**

```
Your Question → Enhanced Similarity Search → Retrieved Context → Claude + Context → Enhanced Answer
```

**Example RAG Flow:**
1. **Store**: "Our company policy states employees can work remotely 3 days per week"
2. **Ask**: "What's our remote work policy?"
3. **Retrieve**: AtoRAG finds the relevant policy document using semantic search
4. **Generate**: Claude uses the retrieved policy text to give you an accurate answer

### 🔧 RAG Technical Implementation

- **🧮 Enhanced Similarity**: TF-IDF + string similarity hybrid (70% TF-IDF + 30% string matching)
- **🗄️ Smart Database**: SQLite with efficient content storage and enhanced similarity search
- **✂️ Smart Chunking**: Automatically splits large documents (>500 words) into searchable chunks
- **🔍 Semantic Search**: Finds contextually relevant content with accurate similarity scoring
- **⚡ Real-time**: Instant retrieval and context injection into Claude conversations
- **🎯 Production Quality**: Comprehensive testing with 100% tool validation
- **📊 Advanced Analytics**: Content analysis, readability scoring, and key phrase extraction

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

## 🛠️ Available MCP Tools (9 Total)

### 📄 Document Management
- **`add_document`**: Store any document with automatic analysis and tagging
- **`search_documents`**: Enhanced semantic search with TF-IDF + string similarity
- **`get_document`**: Retrieve specific documents by ID with full metadata
- **`list_documents`**: Browse all documents with advanced filtering options
- **`delete_document`**: Remove documents from the knowledge base
- **`analyze_content`**: Analyze text for readability, key phrases, and insights

### 📁 Organization Tools
- **`manage_collections`**: Create, list, and organize document collections
- **`manage_partitions`**: Create and manage partitions for structured organization

### 💾 Backup & Restore
- **`backup_restore`**: Create backups, restore from backups, and list available snapshots

## 🎨 Usage Examples

### Storing Different Content Types

**Upload Multiple Files:**
```
# Upload PDFs, Word docs, text files, etc. in Claude Desktop, then:
Save all these uploaded documents to AtoRAG and to the "policy" partition
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
Restore from the most recent backup
```

**Custom Backup Location:**
```
Create a backup in my custom directory: /Users/myname/Documents/MyBackups/
```

## 🏗️ RAG Technical Architecture

### Enhanced RAG Processing Pipeline
- **🧮 Hybrid Similarity**: TF-IDF + string similarity hybrid (70%/30%) for superior accuracy
- **✂️ Smart Chunking**: Automatically splits large documents (>500 words) into optimal chunks
- **🔍 Enhanced Search**: Advanced similarity scoring with proper ranking algorithms
- **📊 Multi-factor Scoring**: Combines semantic understanding with exact string matching
- **🏷️ Content Analysis**: Automatic type detection, tagging, and readability analysis
- **🎯 Production Quality**: 100% tool validation with comprehensive testing

### Local RAG Storage & Performance
- **🗄️ SQLite Smart Database**: Efficient content storage with enhanced similarity search
- **🏠 Home Directory**: `~/.atorag/` - All content analysis and data stored locally
- **💾 Robust Backups**: Complete RAG system backup and restore with configurable paths
- **🔒 Privacy First**: All content analysis and data stay on your machine - no cloud dependencies
- **⚡ Optimized Performance**: Real-time search with efficient TF-IDF similarity calculation

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

## 🆘 Support

Having issues? Check these common solutions:

1. **Extension not loading**: Restart Claude Desktop
2. **Search not working**: Check if documents are stored
3. **Import failing**: Verify file format
4. **Performance issues**: Large documents may take time to process
5. **Other Issues**: [Submit an issue on GitHub](https://github.com/Atonomy-AI/AtoRAG/issues)

## 🌟 Why AtoRAG?

- **Autonomous**: Works independently without external dependencies
- **Intelligent**: Smart content processing and search
- **Universal**: Handles any type of content
- **Private**: Your data stays with you
- **Simple**: Just drag, drop, and start using

Transform your Claude Desktop into the ultimate knowledge management system with AtoRAG! 🚀

---

*Built with ❤️ by AtonomyAI for the Claude Desktop community* 