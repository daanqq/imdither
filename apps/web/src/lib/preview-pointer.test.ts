import { describe, expect, it } from "vitest"

import { getViewportPointFromClientPoint } from "./preview-pointer"

describe("preview pointer mapping", () => {
  it("maps client points against the gesture surface, not its parent", () => {
    const element = {
      getBoundingClientRect: () => ({
        bottom: 420,
        height: 300,
        left: 80,
        right: 480,
        top: 120,
        width: 400,
        x: 80,
        y: 120,
        toJSON: () => ({}),
      }),
      parentElement: {
        getBoundingClientRect: () => ({
          bottom: 520,
          height: 500,
          left: 20,
          right: 520,
          top: 20,
          width: 500,
          x: 20,
          y: 20,
          toJSON: () => ({}),
        }),
      },
    } as unknown as HTMLElement

    expect(
      getViewportPointFromClientPoint(element, {
        clientX: 280,
        clientY: 270,
      })
    ).toEqual({ x: 200, y: 150 })
  })
})
