import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const indexFile = path.join(publicDir, 'index.html');
if (!fs.existsSync(indexFile)) {
  fs.writeFileSync(
    indexFile,
    '<!DOCTYPE html><html><body><h1>Smart Agriculture API</h1><p>Running on Vercel Serverless</p></body></html>'
  );
}

console.log('✔ Output directory "public" is verified for Vercel');

