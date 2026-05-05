import { describe, expect, it } from "vitest"

import {
  createBaselineInput,
  getMachineProfile,
  trackAllocations,
} from "./baseline-runner"

describe("createBaselineInput", () => {
  it("creates a PixelBuffer with the requested dimensions", () => {
    const buf = createBaselineInput(16, 8)
    expect(buf.width).toBe(16)
    expect(buf.height).toBe(8)
    expect(buf.data.length).toBe(16 * 8 * 4)
  })

  it("fills data with valid RGBA values (0-255)", () => {
    const buf = createBaselineInput(32, 32)
    for (let i = 0; i < buf.data.length; i++) {
      expect(buf.data[i]).toBeGreaterThanOrEqual(0)
      expect(buf.data[i]).toBeLessThanOrEqual(255)
    }
  })

  it("sets alpha channel to 255", () => {
    const buf = createBaselineInput(4, 4)
    for (let i = 3; i < buf.data.length; i += 4) {
      expect(buf.data[i]).toBe(255)
    }
  })
})

describe("getMachineProfile", () => {
  it("returns expected machine profile fields", () => {
    const profile = getMachineProfile()
    expect(profile).toHaveProperty("platform")
    expect(profile).toHaveProperty("cpuCores")
    expect(profile).toHaveProperty("memory")
  })

  it("reports positive cpuCores", () => {
    const profile = getMachineProfile()
    expect(profile.cpuCores).toBeGreaterThan(0)
  })
})

describe("trackAllocations", () => {
  it("counts Uint8ClampedArray allocations", () => {
    const { counts, restore } = trackAllocations()
    new Uint8ClampedArray(100)
    new Uint8ClampedArray(200)
    const snapshot = counts()
    expect(snapshot.uint8ClampedArrays).toBe(2)
    expect(snapshot.uint8ClampedBytes).toBe(300)
    restore()
  })

  it("counts Float32Array allocations", () => {
    const { counts, restore } = trackAllocations()
    new Float32Array(64)
    const snapshot = counts()
    expect(snapshot.float32Arrays).toBe(1)
    expect(snapshot.float32Bytes).toBe(256)
    restore()
  })

  it("returns zero counts when no allocations happen", () => {
    const { counts, restore } = trackAllocations()
    const snapshot = counts()
    expect(snapshot.uint8ClampedArrays).toBe(0)
    expect(snapshot.float32Arrays).toBe(0)
    restore()
  })

  it("restore removes the instrumentation", () => {
    const { counts, restore } = trackAllocations()
    new Uint8ClampedArray(10)
    const before = counts()
    expect(before.uint8ClampedArrays).toBe(1)
    restore()
    new Uint8ClampedArray(10)
    const after = counts()
    expect(after.uint8ClampedArrays).toBe(1)
  })
})
