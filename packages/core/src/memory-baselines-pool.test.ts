import { describe, expect, it } from "vitest"

import { trackAllocations } from "./baseline-runner"
import { clearPool } from "./buffer-pool"
import { createBaselineInput, IMAGE_SIZES } from "./baseline-runner"
import { processImage } from "./process"
import { DEFAULT_SETTINGS } from "./settings"

const input = createBaselineInput(
  IMAGE_SIZES.small.width,
  IMAGE_SIZES.small.height
)

describe("buffer pool allocation pressure", () => {
  it("error diffusion reuses Float32Array across two calls", () => {
    clearPool()

    const { counts, restore } = trackAllocations()

    processImage(input, {
      ...DEFAULT_SETTINGS,
      algorithm: "floyd-steinberg",
      resize: {
        ...DEFAULT_SETTINGS.resize,
        width: IMAGE_SIZES.small.width,
        height: IMAGE_SIZES.small.height,
        fit: "stretch",
      },
    })

    processImage(input, {
      ...DEFAULT_SETTINGS,
      algorithm: "floyd-steinberg",
      resize: {
        ...DEFAULT_SETTINGS.resize,
        width: IMAGE_SIZES.small.width,
        height: IMAGE_SIZES.small.height,
        fit: "stretch",
      },
    })

    const snapshot = counts()
    // With pooling, the work Float32Array is allocated once and reused.
    // Without pooling, it's allocated twice.
    expect(snapshot.float32Arrays).toBe(1)

    clearPool()
    restore()
  })

  it("Ostromoukhov reuses Float32Array across two calls", () => {
    clearPool()

    const { counts, restore } = trackAllocations()

    processImage(input, {
      ...DEFAULT_SETTINGS,
      algorithm: "ostromoukhov",
      resize: {
        ...DEFAULT_SETTINGS.resize,
        width: IMAGE_SIZES.small.width,
        height: IMAGE_SIZES.small.height,
        fit: "stretch",
      },
    })

    processImage(input, {
      ...DEFAULT_SETTINGS,
      algorithm: "ostromoukhov",
      resize: {
        ...DEFAULT_SETTINGS.resize,
        width: IMAGE_SIZES.small.width,
        height: IMAGE_SIZES.small.height,
        fit: "stretch",
      },
    })

    const snapshot = counts()
    expect(snapshot.float32Arrays).toBe(1)

    clearPool()
    restore()
  })

  it("calling different diffusion algorithms shares the pool by size", () => {
    clearPool()
    const { counts, restore } = trackAllocations()

    processImage(input, {
      ...DEFAULT_SETTINGS,
      algorithm: "floyd-steinberg",
      resize: {
        ...DEFAULT_SETTINGS.resize,
        width: IMAGE_SIZES.small.width,
        height: IMAGE_SIZES.small.height,
        fit: "stretch",
      },
    })

    processImage(input, {
      ...DEFAULT_SETTINGS,
      algorithm: "jarvis-judice-ninke",
      resize: {
        ...DEFAULT_SETTINGS.resize,
        width: IMAGE_SIZES.small.width,
        height: IMAGE_SIZES.small.height,
        fit: "stretch",
      },
    })

    const snapshot = counts()
    expect(snapshot.float32Arrays).toBe(1)

    clearPool()
    restore()
  })
})
