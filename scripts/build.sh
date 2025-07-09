#!/bin/bash

# Build script for AtoRAG Universal Knowledge Base Extension

echo "🚀 Building AtoRAG Universal Knowledge Base Extension..."
echo "✨ Zero external dependencies - works out of the box!"

# Check if DXT CLI is installed
if ! command -v dxt &> /dev/null; then
    echo "❌ DXT CLI not found. Installing..."
    if ! command -v npm &> /dev/null; then
        echo "❌ npm is required to install DXT CLI"
        echo "   Please install Node.js from: https://nodejs.org/"
        exit 1
    fi
    npm install -g @anthropic-ai/dxt
fi

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Create server directory if it doesn't exist
mkdir -p server

# Make the server script executable
chmod +x server/index.js

# Validate the manifest
echo "🔍 Validating manifest..."
if ! dxt validate manifest.json; then
    echo "❌ Manifest validation failed"
    exit 1
fi

# Package the extension
echo "📦 Packaging self-contained extension..."
dxt pack

# Find the generated DXT file
DXT_FILE=$(find . -name "*.dxt" -type f | head -1)

if [ -f "$DXT_FILE" ]; then
    echo "✅ AtoRAG extension built successfully: $DXT_FILE"
    echo ""
    echo "🎉 ZERO DEPENDENCY INSTALLATION:"
    echo "1. Open Claude Desktop"
    echo "2. Go to Settings → Extensions"
    echo "3. Drag and drop: $DXT_FILE"
    echo "4. (Optional) Set custom backup directory path to preserve backups when uninstalling"
    echo "5. Click 'Install'"
    echo ""
    echo "🌟 Features:"
    echo "   📄 Store any documents, policies, research papers"
    echo "   📊 Import CSV data with automatic processing"
    echo "   🔍 Smart search with natural language"
    echo "   🏷️ Auto-tagging and content analysis"
    echo "   📁 Organize with collections"
    echo "   💾 Configurable backup system with restore points"
    echo ""
    echo "✨ NO Python, NO conda, NO dependencies needed!"
    echo "📚 Uses Claude Desktop's built-in Node.js runtime"
    echo "🔒 All data stored locally in ~/.atorag/knowledge_base/"
    echo "💾 Backups stored in configurable location (default: ~/.atorag/backups/)"
else
    echo "❌ Build failed - no DXT file generated"
    exit 1
fi 