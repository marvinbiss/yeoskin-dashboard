#!/usr/bin/env node
/**
 * Security Script: Check for exposed secrets
 * Run: node scripts/check-secrets.js
 *
 * This script scans for common secret patterns that should never be committed.
 */

const fs = require('fs');
const path = require('path');

const DANGEROUS_PATTERNS = [
  // Supabase
  { pattern: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, name: 'Supabase JWT Token' },
  { pattern: /sb_secret_[A-Za-z0-9_-]+/g, name: 'Supabase Service Role Key' },
  { pattern: /sb_publishable_[A-Za-z0-9_-]+/g, name: 'Supabase Anon Key' },

  // API Keys
  { pattern: /re_[A-Za-z0-9_-]{20,}/g, name: 'Resend API Key' },
  { pattern: /sk_live_[A-Za-z0-9_-]+/g, name: 'Stripe Live Key' },
  { pattern: /shpat_[A-Za-z0-9]+/g, name: 'Shopify Admin Token' },

  // Generic secrets
  { pattern: /postgresql:\/\/[^:]+:[^@]+@[^/]+/g, name: 'Database Connection String' },
  { pattern: /[a-f0-9]{64}/g, name: 'Possible 256-bit Hex Secret' },

  // AWS
  { pattern: /AKIA[0-9A-Z]{16}/g, name: 'AWS Access Key ID' },

  // Private keys
  { pattern: /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g, name: 'Private Key' },
];

const IGNORE_DIRS = ['node_modules', '.git', '.next', 'dist', 'build', '.vercel'];
const IGNORE_FILES = ['.env.example', 'check-secrets.js', 'package-lock.json'];
const SCAN_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.json', '.env', '.sql', '.md', '.txt', '.sh'];

function scanFile(filePath) {
  const findings = [];
  const content = fs.readFileSync(filePath, 'utf8');

  for (const { pattern, name } of DANGEROUS_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      // Filter out false positives (very short matches for hex pattern)
      const realMatches = matches.filter(m => {
        if (name === 'Possible 256-bit Hex Secret') {
          // Only flag if it looks like a real secret (not in code context)
          return !m.includes('0000') && !m.includes('ffff');
        }
        return true;
      });

      if (realMatches.length > 0) {
        findings.push({
          file: filePath,
          type: name,
          count: realMatches.length,
          preview: realMatches[0].substring(0, 20) + '...'
        });
      }
    }
  }

  return findings;
}

function scanDirectory(dir) {
  let allFindings = [];

  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!IGNORE_DIRS.includes(item)) {
        allFindings = allFindings.concat(scanDirectory(fullPath));
      }
    } else if (stat.isFile()) {
      const ext = path.extname(item);
      const fileName = path.basename(item);

      if (SCAN_EXTENSIONS.includes(ext) || item.startsWith('.env')) {
        if (!IGNORE_FILES.includes(fileName)) {
          allFindings = allFindings.concat(scanFile(fullPath));
        }
      }
    }
  }

  return allFindings;
}

// Main execution
console.log('🔍 Scanning for exposed secrets...\n');

const projectRoot = path.resolve(__dirname, '..');
const findings = scanDirectory(projectRoot);

if (findings.length === 0) {
  console.log('✅ No secrets detected! Your codebase appears clean.\n');
  process.exit(0);
} else {
  console.log(`🚨 ALERT: Found ${findings.length} potential secret(s)!\n`);
  console.log('=' .repeat(60));

  for (const finding of findings) {
    console.log(`\n📁 File: ${finding.file}`);
    console.log(`   Type: ${finding.type}`);
    console.log(`   Count: ${finding.count}`);
    console.log(`   Preview: ${finding.preview}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n⚠️  ACTION REQUIRED:');
  console.log('   1. Remove these secrets from the files');
  console.log('   2. Use environment variables instead');
  console.log('   3. Rotate any exposed credentials immediately');
  console.log('   4. Clean git history if secrets were committed\n');

  process.exit(1);
}
