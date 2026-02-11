#!/bin/bash
# ============================================
# DEPRECATED: This script has moved
# ============================================
# 
# Environment configuration is now centralized in the root .env file.
# Please use the new setup script from the root:
#
#   ../../scripts/setup-dev-env.sh
#
# Or run from the root directory:
#   cd ../..
#   ./scripts/setup-dev-env.sh
#
# ============================================

echo ""
echo "⚠️  This script has been deprecated"
echo ""
echo "Environment configuration is now centralized in the root .env file."
echo ""
echo "Please use the new setup script:"
echo "  cd ../.."
echo "  ./scripts/setup-dev-env.sh"
echo ""

read -p "Would you like to run the new script now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd ../..
    ./scripts/setup-dev-env.sh
else
    echo "You can run it manually from the root directory."
fi
