#!/bin/bash
set -e

echo "Setting up NexusOS on Oracle Cloud Always Free VM"

# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git build-essential pkg-config libssl-dev

# Install pnpm
sudo npm install -g pnpm

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source ~/.cargo/env

# Verify
node --version
pnpm --version
rustc --version

# Install OpenClaw globally
sudo pnpm add -g openclaw
openclaw --version

# Install cloudflared
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
rm cloudflared-linux-amd64.deb
cloudflared --version

# Clone NexusOS (user should have their repo ready, but we provide the baseline)
# git clone https://github.com/Inmodel-Labs/NexusOS.git
# cd NexusOS

echo ""
echo "VM setup complete. Next: configure .env and start services."
