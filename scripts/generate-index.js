import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, '../public');
const OUTPUT_FILE = path.join(PUBLIC_DIR, 'notes-index.json');

const IGNORE_FILES = ['notes-index.json', 'vite.svg', 'index.json', 'mockServiceWorker.js'];
const IGNORE_DIRS = ['assets'];

function scanDirectory(dir, relativePath = '') {
  const items = fs.readdirSync(dir);
  const result = [];

  for (const item of items) {
    if (IGNORE_FILES.includes(item)) continue;
    if (item.startsWith('.')) continue; // Ignore hidden files

    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    const itemRelativePath = path.join(relativePath, item);

    if (stat.isDirectory()) {
      if (IGNORE_DIRS.includes(item)) continue;
      
      const children = scanDirectory(fullPath, itemRelativePath);
      if (children.length > 0) {
        result.push({
          name: item,
          type: 'directory',
          path: itemRelativePath,
          children: children.sort((a, b) => {
            // Sort directories first, then files
            if (a.type === b.type) return a.name.localeCompare(b.name);
            return a.type === 'directory' ? -1 : 1;
          })
        });
      }
    } else if (item.endsWith('.md')) {
      // Extract title from first line of markdown if possible
      let title = item.replace('.md', '');
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const firstLine = content.split('\n')[0];
        if (firstLine.startsWith('# ')) {
          title = firstLine.substring(2).trim();
        }
      } catch (e) {
        // Ignore error, use filename
      }

      result.push({
        name: item,
        type: 'file',
        path: itemRelativePath,
        title: title
      });
    }
  }

  return result.sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === 'directory' ? -1 : 1;
  });
}

console.log('Scanning public directory for notes...');
const tree = scanDirectory(PUBLIC_DIR);
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(tree, null, 2));
console.log(`Generated notes index at ${OUTPUT_FILE}`);
