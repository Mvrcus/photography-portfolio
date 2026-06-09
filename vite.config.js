import { resolve } from "node:path";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { cleanUrls } from "./plugins/clean-urls.js";
import { compressPortfolioImages } from "./plugins/compress-portfolio-images.js";

const pages = {
  main: resolve(__dirname, "index.html"),
  "senior-portraits": resolve(__dirname, "senior-portraits.html"),
  about: resolve(__dirname, "about_me.html"),
  contact: resolve(__dirname, "contact.html"),
  "guides/index": resolve(__dirname, "guides/index.html"),
  "guides/best-senior-photo-locations-west-michigan": resolve(
    __dirname,
    "guides/best-senior-photo-locations-west-michigan.html"
  ),
  "guides/what-to-wear-senior-pictures": resolve(
    __dirname,
    "guides/what-to-wear-senior-pictures.html"
  ),
  "guides/when-to-book-senior-photos-michigan": resolve(
    __dirname,
    "guides/when-to-book-senior-photos-michigan.html"
  ),
  "guides/how-much-do-senior-pictures-cost": resolve(
    __dirname,
    "guides/how-much-do-senior-pictures-cost.html"
  ),
};

export default defineConfig({
  publicDir: "public",
  plugins: [tailwindcss(), cleanUrls(), compressPortfolioImages()],
  build: {
    rollupOptions: { input: pages },
    cssMinify: true,
    minify: "esbuild",
  },
});
