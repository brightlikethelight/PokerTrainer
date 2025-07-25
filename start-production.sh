#!/bin/bash
# Production build and serve script for PokerTrainer
# This builds the app and serves it on port 3000

echo "🃏 Building PokerTrainer for production..."
npm run build

echo "🚀 Starting production server on http://localhost:3000..."
npx serve -s build -p 3000