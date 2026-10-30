#!/bin/bash

set -e

# Always run from the directory where this script lives
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# --- Config -------------------------------------------------------------------

SSH_KEY=~/iservport.pem
USER=ec2-user
BASE_NAME="project"
TARGET_NAME="project"

INSTANCE_IPS=(
#  "ec2-18-228-30-212.sa-east-1.compute.amazonaws.com"
#  "ec2-56-124-76-254.sa-east-1.compute.amazonaws.com"
  "ec2-56-124-96-56.sa-east-1.compute.amazonaws.com"
)

LOCAL_DIST="dist/iservport-$BASE_NAME-ui/browser"
REMOTE_UI_DIR="/home/ec2-user/static/$TARGET_NAME"

# --- Validate local build ------------------------------------------------------

if [ ! -d "$LOCAL_DIST" ]; then
  echo "❌ ERROR: Angular dist folder not found: $LOCAL_DIST"
  echo "Run the Angular build before deploying the UI."
  exit 1
fi

if [ -z "$(ls -A "$LOCAL_DIST")" ]; then
  echo "❌ ERROR: Angular dist folder is empty: $LOCAL_DIST"
  exit 1
fi

echo "📦 Using Angular build folder: $LOCAL_DIST"
echo "📁 Remote UI directory: $REMOTE_UI_DIR"

# --- Deploy loop --------------------------------------------------------------

for IP in "${INSTANCE_IPS[@]}"; do
  echo "🚀 Deploying UI to $IP..."

  # Ensure remote directory exists
  echo "➡️  Creating remote UI directory..."
  ssh -i "$SSH_KEY" "$USER@$IP" "sudo mkdir -p '$REMOTE_UI_DIR'" || {
    echo "❌ ERROR: Failed to create remote directory on $IP. Skipping this host."
    continue
  }

  # Clean previous UI files
  echo "🧹 Cleaning previous UI files..."
  ssh -i "$SSH_KEY" "$USER@$IP" "sudo rm -rf '$REMOTE_UI_DIR'/*" || {
    echo "❌ ERROR: Failed to clean remote UI directory on $IP. Skipping this host."
    continue
  }

  # Upload files to a temporary location first
  echo "➡️  Uploading UI files to temporary directory..."

  ssh -i "$SSH_KEY" "$USER@$IP" "rm -rf ~/ui-upload && mkdir -p ~/ui-upload" || {
    echo "❌ ERROR: Failed to prepare temporary upload directory on $IP. Skipping this host."
    continue
  }

  scp -i "$SSH_KEY" -r "$LOCAL_DIST"/* "$USER@$IP:~/ui-upload/" || {
    echo "❌ ERROR: Failed to upload UI files to $IP. Skipping this host."
    continue
  }

  # Move uploaded files into final directory with sudo
  echo "➡️  Moving UI files into final directory..."

  ssh -i "$SSH_KEY" "$USER@$IP" << EOF
    set -e

    echo "📍 On server: \$(hostname)"

    sudo mkdir -p "$REMOTE_UI_DIR"
    sudo rm -rf "$REMOTE_UI_DIR"/*
    sudo cp -r ~/ui-upload/* "$REMOTE_UI_DIR"/
    sudo chown -R root:root "$REMOTE_UI_DIR"
    sudo find "$REMOTE_UI_DIR" -type d -exec chmod 755 {} \;
    sudo find "$REMOTE_UI_DIR" -type f -exec chmod 644 {} \;

    rm -rf ~/ui-upload

    echo "📂 Deployed files:"
    ls -la "$REMOTE_UI_DIR"
EOF

  if [ $? -ne 0 ]; then
    echo "❌ ERROR: Remote UI install failed on $IP. Continuing to next host..."
    continue
  fi

  echo "✅ UI deployment finished on $IP."

done

echo "✅ UI deployment done on all hosts!"