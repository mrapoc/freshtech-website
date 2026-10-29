#!/usr/bin/env node
// Upload a local image to Cloudinary with a chosen public_id.
//
// Usage:
//   node scripts/upload-cloudinary.js <local-file> <public-id> [folder]
//
// Examples:
//   node scripts/upload-cloudinary.js ./hero.jpg claude-in-microsoft-365-copilot-hero
//   node scripts/upload-cloudinary.js ./img.png microsoft-365-tips blog
//
// Reads CLOUDINARY_URL (or CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY +
// CLOUDINARY_API_SECRET) from .env.local. Outputs the delivery URL on success.

import { v2 as cloudinary } from 'cloudinary';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), '.env.local');
  if (!existsSync(envPath)) return;
  const text = readFileSync(envPath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

loadEnvLocal();

const [, , localFile, publicId, folder] = process.argv;

if (!localFile || !publicId) {
  console.error('Usage: node scripts/upload-cloudinary.js <local-file> <public-id> [folder]');
  process.exit(1);
}

if (!existsSync(localFile)) {
  console.error(`File not found: ${localFile}`);
  process.exit(1);
}

// SDK auto-config from CLOUDINARY_URL only fires at import time (before our
// .env.local loader runs), so always configure explicitly here.
let cloudName = process.env.CLOUDINARY_CLOUD_NAME;
let apiKey = process.env.CLOUDINARY_API_KEY;
let apiSecret = process.env.CLOUDINARY_API_SECRET;

if ((!cloudName || !apiKey || !apiSecret) && process.env.CLOUDINARY_URL) {
  const m = process.env.CLOUDINARY_URL.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
  if (m) {
    apiKey = apiKey || m[1];
    apiSecret = apiSecret || m[2];
    cloudName = cloudName || m[3];
  }
}

if (!cloudName || !apiKey || !apiSecret) {
  console.error('Missing Cloudinary credentials in .env.local (need CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET)');
  process.exit(1);
}

cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });

try {
  const result = await cloudinary.uploader.upload(resolve(localFile), {
    public_id: publicId,
    folder: folder || undefined,
    overwrite: true,
    resource_type: 'image',
  });
  console.log('Uploaded:', result.secure_url);
  console.log('Public ID:', result.public_id);
  console.log('Format:', result.format, '|', result.width + 'x' + result.height, '|', Math.round(result.bytes / 1024) + 'KB');
} catch (err) {
  console.error('Upload failed:', err.message || err);
  process.exit(1);
}
