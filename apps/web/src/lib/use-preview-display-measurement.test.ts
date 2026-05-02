import { describe, expect, it } from "vitest"

import { shouldNotifyDisplaySizeChange } from "./use-preview-display-measurement"

describe("shouldNotifyDisplaySizeChange", () => {
  it("returns true when no previous size exists (first measurement)", () => {
    expect(
      shouldNotifyDisplaySizeChange(null, { width: 800, height: 600 })
    ).toBe(true)
  })

  it("returns false when width and height deltas are below default 16px threshold", () => {
    expect(
      shouldNotifyDisplaySizeChange(
        { width: 800, height: 600 },
        { width: 815, height: 615 }
      )
    ).toBe(false)

    expect(
      shouldNotifyDisplaySizeChange(
        { width: 800, height: 600 },
        { width: 785, height: 585 }
      )
    ).toBe(false)
  })

  it("returns true when width delta meets or exceeds 16px", () => {
    expect(
      shouldNotifyDisplaySizeChange(
        { width: 800, height: 600 },
        { width: 816, height: 600 }
      )
    ).toBe(true)

    expect(
      shouldNotifyDisplaySizeChange(
        { width: 800, height: 600 },
        { width: 784, height: 600 }
      )
    ).toBe(true)
  })

  it("returns true when height delta meets or exceeds 16px", () => {
    expect(
      shouldNotifyDisplaySizeChange(
        { width: 800, height: 600 },
        { width: 800, height: 616 }
      )
    ).toBe(true)

    expect(
      shouldNotifyDisplaySizeChange(
        { width: 800, height: 600 },
        { width: 800, height: 584 }
      )
    ).toBe(true)
  })

  it("returns true when only one dimension changes enough (not both)", () => {
    // Width changes by 20, height unchanged
    expect(
      shouldNotifyDisplaySizeChange(
        { width: 800, height: 600 },
        { width: 820, height: 600 }
      )
    ).toBe(true)

    // Width unchanged, height changes by 20
    expect(
      shouldNotifyDisplaySizeChange(
        { width: 800, height: 600 },
        { width: 800, height: 620 }
      )
    ).toBe(true)
  })

  it("respects custom threshold", () => {
    expect(
      shouldNotifyDisplaySizeChange(
        { width: 800, height: 600 },
        { width: 810, height: 600 },
        20
      )
    ).toBe(false)

    expect(
      shouldNotifyDisplaySizeChange(
        { width: 800, height: 600 },
        { width: 820, height: 600 },
        20
      )
    ).toBe(true)
  })
})
