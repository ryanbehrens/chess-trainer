// Copies the Stockfish WASM engine into public/ so the browser can load it as a Web Worker.
import { cpSync, mkdirSync } from 'node:fs';
const src = 'node_modules/stockfish/bin';
const dest = 'public/stockfish';
mkdirSync(dest, { recursive: true });
for (const f of ['stockfish-19-lite-single.js', 'stockfish-19-lite-single.wasm']) {
  cpSync(`${src}/${f}`, `${dest}/${f}`);
}
console.log('Stockfish copied to public/stockfish');
