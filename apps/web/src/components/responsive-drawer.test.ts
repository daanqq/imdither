import { describe, expect, it } from "vitest"

import {
  createDrawerHistoryState,
  isDrawerHistoryState,
} from "@/lib/drawer-history"

describe("responsive drawer history state", () => {
  it("adds a drawer marker while preserving existing history state", () => {
    const state = createDrawerHistoryState({ scroll: 120 }, "drawer-a")

    expect(state).toMatchObject({
      scroll: 120,
      __imditherDrawer: "drawer-a",
    })
    expect(isDrawerHistoryState(state, "drawer-a")).toBe(true)
    expect(isDrawerHistoryState(state, "drawer-b")).toBe(false)
  })

  it("creates a drawer marker from non-object history state", () => {
    const state = createDrawerHistoryState(null, "drawer-a")

    expect(state).toEqual({
      __imditherDrawer: "drawer-a",
    })
  })
})
