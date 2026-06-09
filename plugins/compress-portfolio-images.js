import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, extname } from "node:path";
import sharp from "sharp";

const JPEG_EXT = new Set([".jpg", ".jpeg"]);

export function compressPortfolioImages() {
  let portfolioDir;

  return {
    name: "compress-portfolio-images",
    apply: "build",
    configResolved(config) {
      portfolioDir = join(config.root, config.build.outDir, "assets", "portfolio");
    },
    async closeBundle() {
      let files;
      try {
        files = await readdir(portfolioDir);
      } catch {
        return;
      }

      const jpegFiles = files.filter((file) =>
        JPEG_EXT.has(extname(file).toLowerCase())
      );

      let savedBytes = 0;

      await Promise.all(
        jpegFiles.map(async (file) => {
          const filePath = join(portfolioDir, file);
          const original = await readFile(filePath);
          const compressed = await sharp(original)
            .jpeg({ quality: 80, mozjpeg: true })
            .toBuffer();

          if (compressed.length < original.length) {
            await writeFile(filePath, compressed);
            savedBytes += original.length - compressed.length;
          }
        })
      );

      if (savedBytes > 0) {
        const kb = (savedBytes / 1024).toFixed(1);
        console.log(
          `[compress-portfolio-images] Saved ${kb} KB across ${jpegFiles.length} portfolio JPEGs`
        );
      }
    },
  };
}
