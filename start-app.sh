#!/bin/bash
# Quick start script for PokerTrainer React app
# This script fixes the HOST environment variable issue and starts the app

echo "🃏 Starting PokerTrainer..."
echo "🔧 Fixing HOST environment variable..."

# Unset the problematic HOST variable
unset HOST

# Start the React development server
echo "🚀 Starting development server..."
npm start