import { clampOutputSize, MAX_SOURCE_DIMENSION } from "@workspace/core"
import { describe, expect, it } from "vitest"

import {
  acceptLoadedSource,
  createDemoSourceIntake,
  formatSourceNotices,
} from "./source-intake"

describe("Source Intake", () => {
  it("rejects Source Images beyond the source dimension limit", () => {
    const result = acceptLoadedSource(
      sourceWithSize(MAX_SOURCE_DIMENSION + 1, 100)
    )

    expect(result).toEqual({
      type: "rejected",
      message: `Image is too large (${MAX_SOURCE_DIMENSION + 1}x100). Maximum source dimension is ${MAX_SOURCE_DIMENSION}px.`,
    })
  })

  it("recommends an Output Size within the Output Cap", () => {
    const result = acceptLoadedSource(sourceWithSize(4096, 4096))
    const expectedSize = clampOutputSize(4096, 4096)

    expect(result.type).toBe("accepted")

    if (result.type !== "accepted") {
      return
    }

    expect(result.outputSize).toEqual(expectedSize)
    expect(formatSourceNotices(result.notices)).toBe(
      `[OUTPUT AUTO-SIZED: ${expectedSize.width}x${expectedSize.height} / 12MP]`
    )
  })

  it("marks the bundled Demo Image with a Source Notice", () => {
    const result = createDemoSourceIntake()

    expect(result.type).toBe("accepted")

    if (result.type !== "accepted") {
      return
    }

    expect(result.source.name).toBe("Bundled demo image")
    expect(formatSourceNotices(result.notices)).toBe("[DEMO SOURCE LOADED]")
  })
})

function sourceWithSize(width: number, height: number) {
  return {
    id: "source",
    name: "source.png",
    buffer: {
      width,
      height,
      data: new Uint8ClampedArray(0),
    },
    originalWidth: width,
    originalHeight: height,
  }
}
