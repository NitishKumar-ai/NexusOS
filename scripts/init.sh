#!/bin/bash
# NexusOS — one-command setup
# Usage: bash scripts/init.sh

set -e

echo "🚀 NexusOS Setup"
echo "================"

# Check prerequisites
echo "Checking prerequisites..."
command -v rust   >/dev/null 2>&1 || { echo "❌ Rust not found. Install: https://rustup.rs"; exit 1; }
command -v node   >/dev/null 2>&1 || { echo "❌ Node.js not found. Install: https://nodejs.org"; exit 1; }
command -v pnpm   >/dev/null 2>&1 || { echo "❌ pnpm not found. Install: npm install -g pnpm"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "⚠️  Docker not found — skipping infrastructure"; SKIP_DOCKER=true; }
echo "✅ Prerequisites OK"

# Install dependencies
echo "Installing Node.js dependencies..."
pnpm install
echo "✅ Dependencies installed"

# Build Rust Traffic Controller
echo "Building Traffic Controller (Rust)..."
cd packages/traffic-controller
cargo build --release 2>&1 | tail -5
cd ../..
echo "✅ Traffic Controller built"

# Set up environment files
echo "Setting up environment files..."
[ -f packages/traffic-controller/.env ] || cp packages/traffic-controller/.env.example packages/traffic-controller/.env
[ -f packages/connectors/.env ] || cp packages/connectors/.env.example packages/connectors/.env
[ -f dashboard/.env.local ] || echo "NEXT_PUBLIC_GATEWAY_URL=http://localhost:3000" > dashboard/.env.local
echo "✅ Environment files created"

# Start infrastructure
if [ -z "$SKIP_DOCKER" ]; then
  echo "Starting Docker services (Postgres + Redis)..."
  docker-compose up -d
  echo "✅ Docker services running"
fi

echo ""
echo "✅ NexusOS setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit packages/traffic-controller/.env with your Telegram bot token"
echo "  2. Edit packages/connectors/.env with your Firebase/GitHub/Linear credentials"
echo "  3. Start services:"
echo "     Terminal 1: cd packages/traffic-controller && cargo run"
echo "     Terminal 2: cd packages/connectors && pnpm dev"
echo "     Terminal 3: cd dashboard && pnpm dev"
echo ""
echo "  4. Open http://localhost:3001"
echo "  5. Submit your first mission from the CommandBar"
echo ""
echo "📖 Docs: https://github.com/Inmodel-Labs/NexusOS/blob/main/docs/"
