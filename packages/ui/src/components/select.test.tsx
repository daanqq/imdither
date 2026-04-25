import { renderToStaticMarkup } from "react-dom/server"
import type * as React from "react"
import { describe, expect, it, vi } from "vitest"

const contentRenders: Array<{
  align?: string
  position?: string
  sideOffset?: number
}> = []

vi.mock("radix-ui", () => ({
  Select: {
    Content: ({
      align,
      children,
      position,
      sideOffset,
    }: {
      align?: string
      children: React.ReactNode
      position?: string
      sideOffset?: number
    }) => {
      contentRenders.push({ align, position, sideOffset })
      return <div data-slot="primitive-select-content">{children}</div>
    },
    Group: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Icon: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Item: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    ItemIndicator: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
    ItemText: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Label: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Root: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    ScrollDownButton: () => null,
    ScrollUpButton: () => null,
    Separator: () => null,
    Trigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Value: () => null,
    Viewport: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  },
}))

describe("SelectContent", () => {
  it("uses popper positioning by default to avoid item-aligned reflow", async () => {
    contentRenders.length = 0

    const { SelectContent } = await import("./select")

    renderToStaticMarkup(
      <SelectContent>
        <span>Palette</span>
      </SelectContent>
    )

    expect(contentRenders).toEqual([
      {
        align: "start",
        position: "popper",
        sideOffset: 4,
      },
    ])
  })
})
