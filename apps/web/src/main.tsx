import { StrictMode, Suspense } from "react"
import { createRoot } from "react-dom/client"

import "@workspace/ui/globals.css"
import { App } from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import "./i18n"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense fallback={null}>
      <ThemeProvider defaultTheme="light" storageKey="imdither-theme">
        <App />
      </ThemeProvider>
    </Suspense>
  </StrictMode>
)
