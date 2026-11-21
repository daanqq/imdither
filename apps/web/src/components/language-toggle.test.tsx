import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { LanguageToggle } from "@/App"

describe("LanguageToggle", () => {
  it("renders a single non-duplicated language code with globe icon and accessible switch label", () => {
    const markup = renderToStaticMarkup(<LanguageToggle />)
    const textContent = markup.replace(/<[^>]+>/g, "")

    expect(textContent).toBe("EN")
    expect(textContent).not.toBe("ENEN")
    expect(textContent).not.toBe("RURU")
    expect(markup).toContain("<svg")
    expect(markup).toContain('aria-label="Switch language to Русский"')
  })
})
