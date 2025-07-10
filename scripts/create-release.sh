#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}$1${NC}"
}

print_success() {
    echo -e "${GREEN}$1${NC}"
}

print_error() {
    echo -e "${RED}$1${NC}"
}

print_warning() {
    echo -e "${YELLOW}$1${NC}"
}

# Check if version argument is provided
if [ $# -eq 0 ]; then
    print_error "❌ Usage: $0 <version>"
    print_error "   Example: $0 0.1.0"
    exit 1
fi

NEW_VERSION=$1

print_status "🚀 Creating AtoRAG release v$NEW_VERSION"

# Check if gh is authenticated
print_status "🔑 Checking GitHub CLI authentication..."
if ! gh auth status >/dev/null 2>&1; then
    print_error "❌ GitHub CLI not authenticated. Please run 'gh auth login' first."
    exit 1
fi
print_success "✅ GitHub CLI authenticated"

# Check if tag already exists locally
if git tag -l | grep -q "^v$NEW_VERSION$"; then
    print_warning "⚠️  Tag v$NEW_VERSION already exists locally. Deleting..."
    git tag -d "v$NEW_VERSION"
fi

# Check if tag exists on remote
if git ls-remote --tags origin | grep -q "refs/tags/v$NEW_VERSION$"; then
    print_warning "⚠️  Tag v$NEW_VERSION exists on remote. Deleting..."
    git push origin --delete "v$NEW_VERSION" || true
fi

# Check if release already exists
if gh release view "v$NEW_VERSION" >/dev/null 2>&1; then
    print_warning "⚠️  Release v$NEW_VERSION already exists. Deleting..."
    gh release delete "v$NEW_VERSION" --yes || true
fi

# Check if AtoRAG.dxt exists
if [ ! -f "./AtoRAG.dxt" ]; then
    print_error "❌ AtoRAG.dxt not found! Build it first."
    exit 1
fi

# Create and push tag
print_status "🏷️ Creating and pushing tag..."
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"
git push origin "v$NEW_VERSION"

# Create the release
print_status "📦 Creating GitHub release..."
gh release create "v$NEW_VERSION" ./AtoRAG.dxt \
    --title "AtoRAG v$NEW_VERSION" \
    --notes "## AtoRAG v$NEW_VERSION

### 🚀 What's New in This Release
- ✅ **Fixed Similarity Bug**: Enhanced search now uses TF-IDF + string similarity hybrid
- ✅ **Comprehensive Testing**: All 9 MCP tools validated through full pipeline testing
- ✅ **Improved Performance**: Optimized embedding generation and search algorithms
- ✅ **Better Accuracy**: Search results now return relevant documents with proper scoring

### 📦 Installation
1. Download the AtoRAG.dxt file below
2. Open Claude Desktop
3. Go to Settings → Extensions  
4. Drag and drop the .dxt file
5. Click 'Install'
6. Start adding documents and searching your knowledge base!


print_success "🎉 Release v$NEW_VERSION created successfully!"
print_success "📋 Check the release at: https://github.com/Atonomy-AI/AtoRAG/releases/tag/v$NEW_VERSION" 