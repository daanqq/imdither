import type { PixelBuffer } from "./types"

const floatPools = new Map<number, Float32Array[]>()
const pixelPools = new Map<string, PixelBuffer[]>()

function pixelKey(width: number, height: number): string {
  return `${width}x${height}`
}

export function acquireFloat32Array(size: number): Float32Array {
  const pool = floatPools.get(size)
  if (pool && pool.length > 0) {
    return pool.pop()!
  }
  return new Float32Array(size)
}

export function releaseFloat32Array(buf: Float32Array): void {
  const size = buf.length
  let pool = floatPools.get(size)
  if (!pool) {
    pool = []
    floatPools.set(size, pool)
  }
  pool.push(buf)
}

export function acquirePixelBuffer(width: number, height: number): PixelBuffer {
  const key = pixelKey(width, height)
  const pool = pixelPools.get(key)
  if (pool && pool.length > 0) {
    return pool.pop()!
  }
  return { width, height, data: new Uint8ClampedArray(width * height * 4) }
}

export function releasePixelBuffer(buf: PixelBuffer): void {
  const key = pixelKey(buf.width, buf.height)
  let pool = pixelPools.get(key)
  if (!pool) {
    pool = []
    pixelPools.set(key, pool)
  }
  pool.push(buf)
}

export function clearPool(): void {
  floatPools.clear()
  pixelPools.clear()
}

export function poolSize(): number {
  let total = 0
  for (const pool of floatPools.values()) {
    total += pool.length
  }
  for (const pool of pixelPools.values()) {
    total += pool.length
  }
  return total
}
