import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const libraryPath = path.join(projectRoot, 'library.json');
const library = JSON.parse(await readFile(libraryPath, 'utf8'));

const referencedAssets = [
  ...(library.preloadedJs ?? []),
  ...(library.preloadedCss ?? []),
];

if (referencedAssets.length === 0) {
  throw new Error('library.json does not reference any preloaded JavaScript or CSS files.');
}

for (const asset of referencedAssets) {
  if (typeof asset.path !== 'string' || asset.path.length === 0) {
    throw new Error('library.json contains a preloaded asset without a valid path.');
  }

  const assetPath = path.resolve(projectRoot, asset.path);
  const relativePath = path.relative(projectRoot, assetPath);

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error(`library.json references a file outside the project: ${asset.path}`);
  }

  await access(assetPath);
}

const expectedJavaScriptPath = 'dist/h5p-dialogcards.js';
const expectedCssPath = 'dist/h5p-dialogcards.css';
const referencedPaths = new Set(referencedAssets.map((asset) => asset.path.replaceAll('\\', '/')));

if (!referencedPaths.has(expectedJavaScriptPath) || !referencedPaths.has(expectedCssPath)) {
  throw new Error(
    `library.json must reference ${expectedJavaScriptPath} and ${expectedCssPath}.`,
  );
}

const bundle = await readFile(path.join(projectRoot, expectedJavaScriptPath), 'utf8');

if (!bundle.includes('H5P.DialogcardsPapiJo')) {
  throw new Error('The built JavaScript does not register H5P.DialogcardsPapiJo.');
}

process.stdout.write(
  `Verified ${referencedAssets.length} built assets and H5P.DialogcardsPapiJo registration.\n`,
);
