import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { visualizer } from "rollup-plugin-visualizer"
import { defineConfig } from "vite"

const shouldAnalyzeBundle = process.env.ANALYZE === "true"
const shouldUseReactCompiler = process.env.REACT_COMPILER === "true"

// https://vite.dev/config/
export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1000,
  },
  plugins: [
    react(
      shouldUseReactCompiler
        ? {
            babel: {
              plugins: ["babel-plugin-react-compiler"],
            },
          }
        : undefined
    ),
    tailwindcss(),
    shouldAnalyzeBundle &&
      visualizer({
        filename: "dist/stats.html",
        template: "treemap",
        gzipSize: true,
        brotliSize: true,
      }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
