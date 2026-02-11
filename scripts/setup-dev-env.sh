#!/bin/bash
# Script to automatically detect and configure your local IP for development
# This updates the root .env file with your current machine's IP address

echo "🔍 Detecting your local IP address..."

# Try to get IP address (works on Mac and Linux)
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    IP_ADDRESS=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -n1 | awk '{print $2}')
else
    # Linux
    IP_ADDRESS=$(hostname -I | awk '{print $1}')
fi

if [ -n "$IP_ADDRESS" ]; then
    echo "✅ Found IP: $IP_ADDRESS"
    
    # Root .env file
    ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
    ENV_FILE="$ROOT_DIR/.env"
    
    if [ -f "$ENV_FILE" ]; then
        # Update existing .env file
        if grep -q "EXPO_PUBLIC_API_HOST=" "$ENV_FILE"; then
            if [[ "$OSTYPE" == "darwin"* ]]; then
                sed -i '' "s/EXPO_PUBLIC_API_HOST=.*/EXPO_PUBLIC_API_HOST=$IP_ADDRESS/" "$ENV_FILE"
            else
                sed -i "s/EXPO_PUBLIC_API_HOST=.*/EXPO_PUBLIC_API_HOST=$IP_ADDRESS/" "$ENV_FILE"
            fi
            echo "✅ Updated .env file with new IP address"
        else
            # Add the mobile configuration if it doesn't exist
            cat >> "$ENV_FILE" << EOF

# Mobile App API Configuration
EXPO_PUBLIC_API_HOST=$IP_ADDRESS
EXPO_PUBLIC_API_PORT=3000
EOF
            echo "✅ Added mobile configuration to .env file"
        fi
    else
        # Create new .env from .env.example
        EXAMPLE_FILE="$ROOT_DIR/.env.example"
        if [ -f "$EXAMPLE_FILE" ]; then
            cp "$EXAMPLE_FILE" "$ENV_FILE"
            if [[ "$OSTYPE" == "darwin"* ]]; then
                sed -i '' "s/EXPO_PUBLIC_API_HOST=.*/EXPO_PUBLIC_API_HOST=$IP_ADDRESS/" "$ENV_FILE"
            else
                sed -i "s/EXPO_PUBLIC_API_HOST=.*/EXPO_PUBLIC_API_HOST=$IP_ADDRESS/" "$ENV_FILE"
            fi
            echo "✅ Created .env file from template"
        else
            echo "⚠️  No .env.example found. Please create one first."
            exit 1
        fi
    fi
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✨ Setup Complete!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📱 Mobile app will connect to: http://${IP_ADDRESS}:3000/api"
    echo ""
    echo "Next steps:"
    echo "  1. Make sure your backend server is running"
    echo "  2. Restart your Expo development server if it's already running"
    echo "  3. Ensure your device/emulator is on the same network"
    echo ""
    
else
    echo "❌ Could not detect your IP address"
    echo ""
    echo "Please manually find your IP and update EXPO_PUBLIC_API_HOST in .env"
    echo ""
    echo "To find your IP:"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "  ifconfig | grep 'inet '"
    else
        echo "  hostname -I"
        echo "  or: ip addr show"
    fi
    echo ""
fi
