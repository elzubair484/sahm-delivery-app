#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('📦 Creating deployment ZIP with essential files...');

// Essential files and directories to include
const essentialFiles = [
  // Root configuration files
  'package.json',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
  'vite.config.ts',
  'tailwind.config.js',
  'postcss.config.js',
  'eslint.config.js',
  'capacitor.config.ts',
  'index.html',
  'README.md',
  'DEPLOYMENT.md',
  
  // Source code (entire src directory)
  'src/',
  
  // Android project (entire android directory)
  'android/',
  
  // Documentation
  'docs/',
  
  // Scripts
  'scripts/'
];

// Files to exclude even if in included directories
const excludePatterns = [
  'node_modules',
  'dist',
  '.git',
  '.env',
  '.env.local',
  '.env.production',
  'build',
  '*.log',
  '.DS_Store',
  'Thumbs.db',
  '*.tmp',
  '*.temp',
  '.cache',
  'coverage',
  '.nyc_output'
];

// Create deployment directory
const deploymentDir = 'sahm-delivery-deployment';
const zipFileName = 'sahm-delivery-essential-files.zip';

try {
  // Remove existing deployment directory if it exists
  if (fs.existsSync(deploymentDir)) {
    fs.rmSync(deploymentDir, { recursive: true, force: true });
  }
  
  // Create deployment directory
  fs.mkdirSync(deploymentDir, { recursive: true });
  
  console.log('📋 Copying essential files...');
  
  // Copy essential files
  essentialFiles.forEach(item => {
    const sourcePath = path.join(process.cwd(), item);
    const destPath = path.join(deploymentDir, item);
    
    if (fs.existsSync(sourcePath)) {
      const stats = fs.statSync(sourcePath);
      
      if (stats.isDirectory()) {
        // Copy directory recursively, excluding unwanted files
        copyDirectorySync(sourcePath, destPath, excludePatterns);
        console.log(`✅ Copied directory: ${item}`);
      } else {
        // Copy file
        const destDir = path.dirname(destPath);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        fs.copyFileSync(sourcePath, destPath);
        console.log(`✅ Copied file: ${item}`);
      }
    } else {
      console.log(`⚠️  File not found: ${item}`);
    }
  });
  
  // Create a quick setup script
  const setupScript = `#!/bin/bash
# Sahm Delivery Quick Setup Script

echo "🚀 Setting up Sahm Delivery App..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install Capacitor dependencies
echo "📱 Installing Capacitor dependencies..."
npm install @capacitor/core @capacitor/cli @capacitor/android
npm install @capacitor/camera @capacitor/geolocation @capacitor/push-notifications
npm install @capacitor/local-notifications @capacitor/device @capacitor/network
npm install @capacitor/filesystem @capacitor/share @capacitor/haptics
npm install @capacitor/status-bar @capacitor/splash-screen

echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. npm run build:android    # Build and open Android Studio"
echo "2. npm run dev:android      # Build and run on device"
echo ""
echo "📱 For Google Play Store:"
echo "1. Open Android Studio"
echo "2. Build → Generate Signed Bundle/APK"
echo "3. Upload AAB to Google Play Console"
`;

  fs.writeFileSync(path.join(deploymentDir, 'setup.sh'), setupScript);
  fs.chmodSync(path.join(deploymentDir, 'setup.sh'), '755');
  
  // Create Windows setup script
  const setupBat = `@echo off
echo 🚀 Setting up Sahm Delivery App...

echo 📦 Installing dependencies...
npm install

echo 📱 Installing Capacitor dependencies...
npm install @capacitor/core @capacitor/cli @capacitor/android
npm install @capacitor/camera @capacitor/geolocation @capacitor/push-notifications
npm install @capacitor/local-notifications @capacitor/device @capacitor/network
npm install @capacitor/filesystem @capacitor/share @capacitor/haptics
npm install @capacitor/status-bar @capacitor/splash-screen

echo ✅ Setup complete!
echo.
echo 🎯 Next steps:
echo 1. npm run build:android    # Build and open Android Studio
echo 2. npm run dev:android      # Build and run on device
echo.
echo 📱 For Google Play Store:
echo 1. Open Android Studio
echo 2. Build → Generate Signed Bundle/APK
echo 3. Upload AAB to Google Play Console

pause
`;

  fs.writeFileSync(path.join(deploymentDir, 'setup.bat'), setupBat);
  
  console.log('📝 Creating README for deployment...');
  
  // Create deployment-specific README
  const deploymentReadme = `# 🚀 Sahm Delivery - Easy Deployment

## Quick Start

### For Linux/Mac:
\`\`\`bash
chmod +x setup.sh
./setup.sh
\`\`\`

### For Windows:
\`\`\`cmd
setup.bat
\`\`\`

### Manual Setup:
\`\`\`bash
npm install
npm run build:android
\`\`\`

## 📱 Build for Android

1. **Development**: \`npm run dev:android\`
2. **Production**: \`npm run build:android\`

## 🏪 Google Play Store

1. Open Android Studio
2. Build → Generate Signed Bundle/APK
3. Choose Android App Bundle (AAB)
4. Upload to Google Play Console

## 📋 Features

- ✅ Multi-language (Arabic, English, Urdu)
- ✅ Voice ordering with AI
- ✅ AR menu visualization
- ✅ Real-time tracking
- ✅ PIN-secured delivery
- ✅ Push notifications
- ✅ Native camera & GPS

## 🔗 Original Repository
https://github.com/elzubair484/sahm-delivery-app.git

---
**Ready for production deployment!** 🎉
`;

  fs.writeFileSync(path.join(deploymentDir, 'README.md'), deploymentReadme);
  
  console.log('🗜️  Creating ZIP file...');
  
  // Create ZIP file using Node.js (cross-platform)
  try {
    // Try to use system zip command first
    execSync(`cd "${deploymentDir}" && zip -r "../${zipFileName}" .`, { stdio: 'inherit' });
    console.log(`✅ Created: ${zipFileName}`);
  } catch (error) {
    // Fallback: Create tar.gz if zip not available
    try {
      execSync(`tar -czf "${zipFileName.replace('.zip', '.tar.gz')}" -C "${deploymentDir}" .`, { stdio: 'inherit' });
      console.log(`✅ Created: ${zipFileName.replace('.zip', '.tar.gz')}`);
    } catch (tarError) {
      console.log('⚠️  Could not create archive automatically.');
      console.log(`📁 Files are ready in: ${deploymentDir}/`);
      console.log('💡 Manually zip the contents of this folder and upload to GitHub.');
    }
  }
  
  // Calculate and display size
  const stats = getDirectorySize(deploymentDir);
  console.log(`📊 Total size: ${(stats / 1024 / 1024).toFixed(2)} MB`);
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Upload the ZIP file to your GitHub repository');
  console.log('2. Or manually copy files from the deployment folder');
  console.log('3. Anyone can then clone and deploy your app!');
  
} catch (error) {
  console.error('❌ Error creating deployment package:', error.message);
  process.exit(1);
}

// Helper function to copy directory recursively with exclusions
function copyDirectorySync(src, dest, excludePatterns = []) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    // Check if file/directory should be excluded
    const shouldExclude = excludePatterns.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(entry.name);
      }
      return entry.name === pattern || entry.name.includes(pattern);
    });
    
    if (shouldExclude) {
      continue;
    }
    
    if (entry.isDirectory()) {
      copyDirectorySync(srcPath, destPath, excludePatterns);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Helper function to calculate directory size
function getDirectorySize(dirPath) {
  let totalSize = 0;
  
  function calculateSize(currentPath) {
    const stats = fs.statSync(currentPath);
    
    if (stats.isDirectory()) {
      const files = fs.readdirSync(currentPath);
      files.forEach(file => {
        calculateSize(path.join(currentPath, file));
      });
    } else {
      totalSize += stats.size;
    }
  }
  
  calculateSize(dirPath);
  return totalSize;
}