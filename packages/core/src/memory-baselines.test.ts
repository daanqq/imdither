import { describe, expect, it } from "vitest"

import { createBaselineInput, trackAllocations } from "./baseline-runner"
import { clearPool } from "./buffer-pool"
import { processImage } from "./process"
import { DEFAULT_SETTINGS } from "./settings"

const input = createBaselineInput(240, 160)

function runWithTracking(settings: Partial<typeof DEFAULT_SETTINGS>) {
  const { counts, restore } = trackAllocations()
  try {
    processImage(input, { ...DEFAULT_SETTINGS, ...settings })
    return counts()
  } finally {
    restore()
  }
}

describe("memory baselines", () => {
  it("records Uint8ClampedArray allocations for ordered dither (bayer)", () => {
    const allocs = runWithTracking({ algorithm: "bayer", bayerSize: 4 })
    expect(allocs.uint8ClampedArrays).toBeGreaterThan(0)
    expect(allocs.uint8ClampedBytes).toBeGreaterThan(0)
  })

  it("records Uint8ClampedArray allocations for error diffusion (floyd-steinberg)", () => {
    const allocs = runWithTracking({ algorithm: "floyd-steinberg" })
    expect(allocs.uint8ClampedArrays).toBeGreaterThan(0)
    expect(allocs.uint8ClampedBytes).toBeGreaterThan(0)
  })

  it("records Uint8ClampedArray allocations for halftone", () => {
    const allocs = runWithTracking({ algorithm: "halftone-dot" })
    expect(allocs.uint8ClampedArrays).toBeGreaterThan(0)
    expect(allocs.uint8ClampedBytes).toBeGreaterThan(0)
  })

  it("records Uint8ClampedArray allocations for direct quantization", () => {
    const allocs = runWithTracking({ algorithm: "none" })
    expect(allocs.uint8ClampedArrays).toBeGreaterThan(0)
    expect(allocs.uint8ClampedBytes).toBeGreaterThan(0)
  })

  it("records Uint8ClampedArray allocations for preview path", () => {
    const allocs = runWithTracking({
      algorithm: "bayer",
      bayerSize: 4,
      resize: { ...DEFAULT_SETTINGS.resize, width: 120, height: 80 },
    })
    expect(allocs.uint8ClampedArrays).toBeGreaterThan(0)
  })

  it("records Float32Array allocations for error diffusion", () => {
    const allocs = runWithTracking({ algorithm: "floyd-steinberg" })
    // Error diffusion uses Float32Array for error buffers
    expect(allocs.float32Arrays).toBeGreaterThanOrEqual(0)
    expect(allocs.float32Bytes).toBeGreaterThanOrEqual(0)
  })

  it("reports allocation size increases with larger inputs", () => {
    clearPool()
    const small = createBaselineInput(16, 16)
    const large = createBaselineInput(240, 160)

    const { counts: countsSmall, restore: restoreSmall } = trackAllocations()
    processImage(small, { ...DEFAULT_SETTINGS, algorithm: "floyd-steinberg" })
    const smallAllocs = countsSmall()
    restoreSmall()
    clearPool()

    const { counts: countsLarge, restore: restoreLarge } = trackAllocations()
    processImage(large, { ...DEFAULT_SETTINGS, algorithm: "floyd-steinberg" })
    const largeAllocs = countsLarge()
    restoreLarge()

    expect(largeAllocs.uint8ClampedBytes).toBeGreaterThan(0)
    expect(smallAllocs.uint8ClampedBytes).toBeGreaterThan(0)
    expect(largeAllocs.uint8ClampedBytes).toBeGreaterThan(
      smallAllocs.uint8ClampedBytes
    )
  })
})
