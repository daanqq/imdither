import { renderToStaticMarkup } from "react-dom/server"
import type * as React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const overlayRenders: Array<{
  className?: string
  "data-overlay-variant"?: string
}> = []

vi.mock("vaul", () => ({
  Drawer: {
    Close: ({ children }: { children?: React.ReactNode }) => (
      <button type="button">{children}</button>
    ),
    Content: ({
      children,
      ...props
    }: React.ComponentProps<"div"> & { "data-overlay-variant"?: string }) => (
      <div {...props}>{children}</div>
    ),
    Description: ({ children }: { children?: React.ReactNode }) => (
      <p>{children}</p>
    ),
    Overlay: (
      props: React.ComponentProps<"div"> & { "data-overlay-variant"?: string }
    ) => {
      overlayRenders.push({
        className: props.className,
        "data-overlay-variant": props["data-overlay-variant"],
      })
      return <div {...props} />
    },
    Portal: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    Root: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    Title: ({ children }: { children?: React.ReactNode }) => (
      <h2>{children}</h2>
    ),
    Trigger: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  },
}))

const { DrawerContent } = await import("./drawer")

describe("DrawerContent overlayVariant", () => {
  beforeEach(() => {
    overlayRenders.length = 0
  })

  it("uses blurred default overlay by default", () => {
    renderToStaticMarkup(
      <DrawerContent>
        <span>Export</span>
      </DrawerContent>
    )

    expect(overlayRenders.at(-1)?.["data-overlay-variant"]).toBe("default")
    expect(overlayRenders.at(-1)?.className).toContain("backdrop-blur-[1px]")
  })

  it("supports subtle non-blurring overlay so desktop canvas pixels stay sharp", () => {
    renderToStaticMarkup(
      <DrawerContent overlayVariant="subtle">
        <span>Palette</span>
      </DrawerContent>
    )

    expect(overlayRenders.at(-1)?.["data-overlay-variant"]).toBe("subtle")
    expect(overlayRenders.at(-1)?.className).toContain("md:bg-transparent")
    expect(overlayRenders.at(-1)?.className).not.toContain("backdrop-blur")
  })
})
