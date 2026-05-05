import { describe, expect, it } from "vitest"

import { trackAllocations } from "./baseline-runner"
import {
  acquireFloat32Array,
  acquirePixelBuffer,
  clearPool,
  releaseFloat32Array,
  releasePixelBuffer,
  poolSize,
} from "./buffer-pool"

describe("Float32Array pool", () => {
  it("acquire creates array of requested size", () => {
    const buf = acquireFloat32Array(64)
    expect(buf.length).toBe(64)
    clearPool()
  })

  it("acquire returns zeroed array", () => {
    const buf = acquireFloat32Array(100)
    for (let i = 0; i < buf.length; i++) {
      expect(buf[i]).toBe(0)
    }
    clearPool()
  })

  it("release + acquire reuses same underlying buffer", () => {
    const a = acquireFloat32Array(256)
    a[0] = 42
    a[128] = 99
    releaseFloat32Array(a)

    const b = acquireFloat32Array(256)
    expect(b.length).toBe(256)
    b[0] = 42
    releaseFloat32Array(b)

    clearPool()
  })

  it("pool size grows with outstanding buffers", () => {
    const a = acquireFloat32Array(128)
    const b = acquireFloat32Array(128)
    const start = poolSize()
    releaseFloat32Array(a)
    expect(poolSize()).toBe(start + 1)
    releaseFloat32Array(b)
    expect(poolSize()).toBe(start + 2)
    clearPool()
  })

  it("acquire after release does not allocate new Float32Array", () => {
    const { counts, restore } = trackAllocations()

    const buf = acquireFloat32Array(512)
    const afterAcquire = counts()
    releaseFloat32Array(buf)

    const buf2 = acquireFloat32Array(512)
    const afterReuse = counts()
    releaseFloat32Array(buf2)

    expect(afterReuse.float32Arrays).toBe(afterAcquire.float32Arrays)
    clearPool()
    restore()
  })

  it("clearPool frees all pooled buffers", () => {
    const a = acquireFloat32Array(100)
    const b = acquireFloat32Array(200)
    releaseFloat32Array(a)
    releaseFloat32Array(b)
    clearPool()
    expect(poolSize()).toBe(0)
  })
})

describe("PixelBuffer pool", () => {
  it("acquirePixelBuffer creates buffer with correct dimensions", () => {
    const buf = acquirePixelBuffer(16, 8)
    expect(buf.width).toBe(16)
    expect(buf.height).toBe(8)
    expect(buf.data.length).toBe(16 * 8 * 4)
    clearPool()
  })

  it("release + acquire reuses PixelBuffer data", () => {
    const a = acquirePixelBuffer(32, 32)
    const dataAddr = a.data
    releasePixelBuffer(a)

    const b = acquirePixelBuffer(32, 32)
    expect(b.data).toBe(dataAddr)
    clearPool()
  })
})
