import { clampOutputSize, MAX_SOURCE_DIMENSION } from "@workspace/core"
import { describe, expect, it } from "vitest"

import {
  getOutputAutoSizedNotice,
  getOutputClampedNotice,
  getSourceRejectionMessage,
  resolveOutputSizePolicy,
  shouldRejectSourceSize,
} from "./output-size-policy"

describe("Output Size Policy", () => {
  it("reuses core Output Cap math for output recommendations", () => {
    const expectedSize = clampOutputSize(4096, 4096)

    expect(resolveOutputSizePolicy(4096, 4096)).toEqual(expectedSize)
    expect(getOutputAutoSizedNotice(expectedSize)).toBe(
      `[OUTPUT AUTO-SIZED: ${expectedSize.width}x${expectedSize.height} / 12MP]`
    )
    expect(getOutputClampedNotice(expectedSize)).toBe(
      `[OUTPUT CLAMPED: ${expectedSize.width}x${expectedSize.height} / 12MP]`
    )
  })

  it("owns Source Image rejection copy for source dimensions", () => {
    expect(shouldRejectSourceSize(MAX_SOURCE_DIMENSION + 1, 100)).toBe(true)
    expect(getSourceRejectionMessage(MAX_SOURCE_DIMENSION + 1, 100)).toBe(
      `Image is too large (${MAX_SOURCE_DIMENSION + 1}x100). Maximum source dimension is ${MAX_SOURCE_DIMENSION}px.`
    )
  })
})
