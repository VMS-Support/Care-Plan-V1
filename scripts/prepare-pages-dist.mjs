import { copyFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const distDir = resolve("dist");

await copyFile(resolve(distDir, "index.html"), resolve(distDir, "404.html"));
await writeFile(resolve(distDir, ".nojekyll"), "");

console.log("Prepared GitHub Pages SPA fallback files in dist.");
