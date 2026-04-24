import { describe, expect, it } from "vitest"

import {
  SLIDE_COMPARE_DEFAULT,
  SLIDE_COMPARE_MAX,
  SLIDE_COMPARE_MIN,
  clampSlideDivider,
  getSlideDividerFromClientX,
  getSlideDividerFromKey,
} from "./slide-compare"

describe("slide compare math", () => {
  it("clamps divider positions near the image edges", () => {
    expect(clampSlideDivider(-20)).toBe(SLIDE_COMPARE_MIN)
    expect(clampSlideDivider(120)).toBe(SLIDE_COMPARE_MAX)
    expect(clampSlideDivider(Number.NaN)).toBe(SLIDE_COMPARE_DEFAULT)
  })

  it("maps pointer coordinates inside the preview frame to percent values", () => {
    expect(getSlideDividerFromClientX(150, 100, 200)).toBe(25)
    expect(getSlideDividerFromClientX(100, 100, 200)).toBe(SLIDE_COMPARE_MIN)
    expect(getSlideDividerFromClientX(300, 100, 200)).toBe(SLIDE_COMPARE_MAX)
  })

  it("supports keyboard slider controls", () => {
    expect(getSlideDividerFromKey(50, "ArrowLeft")).toBe(49)
    expect(getSlideDividerFromKey(50, "ArrowRight")).toBe(51)
    expect(getSlideDividerFromKey(50, "ArrowLeft", true)).toBe(40)
    expect(getSlideDividerFromKey(50, "ArrowRight", true)).toBe(60)
    expect(getSlideDividerFromKey(50, "Home")).toBe(SLIDE_COMPARE_MIN)
    expect(getSlideDividerFromKey(50, "End")).toBe(SLIDE_COMPARE_MAX)
    expect(getSlideDividerFromKey(50, "Tab")).toBeNull()
  })
})
