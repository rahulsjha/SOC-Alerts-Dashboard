#!/bin/bash
# Quick setup script for SOC Alerts Dashboard

echo "🚀 SOC Alerts Dashboard - Setup Script"
echo "========================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install it from https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js version: $(node --version)"
echo "✓ npm version: $(npm --version)"
echo ""

# Setup Backend
echo "📦 Setting up backend..."
cd backend
npm install
echo "✓ Backend dependencies installed"
npm run seed
echo "✓ Database seeded with alerts"
cd ..
echo ""

# Setup Frontend  
echo "📦 Setting up frontend..."
cd frontend
npm install
echo "✓ Frontend dependencies installed"
cd ..
echo ""

echo "✅ Setup complete!"
echo ""
echo "📝 To start development:"
echo "   Terminal 1: cd backend && npm run dev"
echo "   Terminal 2: cd frontend && npm run dev"
echo ""
echo "🌐 Then open http://localhost:3000 in your browser"
echo ""
echo "🔑 Login credentials:"
echo "   Email: analyst@company.com"
echo "   Password: Alert123!"
echo ""
