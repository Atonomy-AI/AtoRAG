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
    print_error "❌ Usage: $0 <version|patch|minor|major>"
    print_error "   Examples: $0 1.0.0"
    print_error "             $0 patch"
    print_error "             $0 minor"
    print_error "             $0 major"
    exit 1
fi

VERSION_INPUT=$1

# Get current version from manifest.json
CURRENT_VERSION=$(grep '"version"' manifest.json | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')

# Calculate new version based on input
if [[ $VERSION_INPUT =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    # Direct version specified
    NEW_VERSION=$VERSION_INPUT
elif [[ $VERSION_INPUT == "patch" || $VERSION_INPUT == "minor" || $VERSION_INPUT == "major" ]]; then
    # Calculate new version from current
    IFS='.' read -r major minor patch <<< "$CURRENT_VERSION"
    
    case $VERSION_INPUT in
        "major")
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        "minor")
            minor=$((minor + 1))
            patch=0
            ;;
        "patch")
            patch=$((patch + 1))
            ;;
    esac
    
    NEW_VERSION="$major.$minor.$patch"
else
    print_error "❌ Invalid input. Use semantic versioning (e.g., 1.0.0) or keywords (patch, minor, major)"
    exit 1
fi

print_status "🚀 Creating AtoRAG release v$NEW_VERSION"
print_status "📋 Current version: $CURRENT_VERSION → New version: $NEW_VERSION"

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

# Update version in package.json
print_status "📝 Updating package.json version to $NEW_VERSION..."
sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" package.json

# Update version in manifest.json
print_status "📝 Updating manifest.json version to $NEW_VERSION..."
sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" manifest.json

print_success "✅ Updated version to $NEW_VERSION"

# Validate the manifest first
print_status "🔍 Validating DXT manifest..."
if ! dxt validate manifest.json; then
    print_error "❌ Manifest validation failed!"
    exit 1
fi

# Build the extension using official DXT toolchain
print_status "📦 Building extension with DXT toolchain..."
if ! dxt pack . AtoRAG.dxt; then
    print_error "❌ DXT build failed!"
    exit 1
fi
print_success "✅ Extension built successfully"

# Check if AtoRAG.dxt exists
if [ ! -f "./AtoRAG.dxt" ]; then
    print_error "❌ AtoRAG.dxt not found after build!"
    exit 1
fi

# Commit all changes (version updates + package-lock.json changes from build)
print_status "📝 Committing all changes..."
git add .
git commit -m "Release v$NEW_VERSION"

# Create and push tag
print_status "🏷️ Creating and pushing tag..."
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"
git push origin main
git push origin "v$NEW_VERSION"

# Create the release
print_status "📦 Creating GitHub release..."
gh release create "v$NEW_VERSION" ./AtoRAG.dxt \
    --title "AtoRAG v$NEW_VERSION" \
    --notes "## AtoRAG v$NEW_VERSION

### 🌟 Features
- 📄 Store any documents, policies, research papers
- 🔍 Semantic search with natural language  
- 🏷️ Auto-tagging and content analysis
- 📁 Organize with collections and partitions
- 💾 Configurable backup system with restore points
- 🔍 Vector-based similarity search
- 📊 Content analysis and summarization

### 📦 Installation
1. Download the AtoRAG.dxt file below
2. Open Claude Desktop
3. Go to Settings → Extensions  
4. Drag and drop the .dxt file
5. Click 'Install'

### 📊 Stats
- Package size: 8.8MB
- Zero external dependencies
- Uses Claude Desktop's built-in Node.js runtime
- All data stored locally in ~/.atorag/knowledge_base/"

print_success "🎉 Release v$NEW_VERSION created successfully!"
print_success "📋 Check the release at: https://github.com/Atonomy-AI/AtoRAG/releases/tag/v$NEW_VERSION"
print_success "🔄 Auto-updates are now enabled for users!" 