import type { PixelBuffer, StageCache } from "./types"

export function createStageCache(maxEntries = 8): StageCache {
  const entries = new Map<string, PixelBuffer>()

  return {
    get(key) {
      const value = entries.get(key)

      if (!value) {
        return undefined
      }

      entries.delete(key)
      entries.set(key, value)
      return value
    },
    set(key, value) {
      if (entries.has(key)) {
        entries.delete(key)
      }

      entries.set(key, value)

      while (entries.size > maxEntries) {
        const oldestKey = entries.keys().next().value

        if (typeof oldestKey !== "string") {
          break
        }

        entries.delete(oldestKey)
      }
    },
    clear() {
      entries.clear()
    },
  }
}

export function hashPixelBuffer(buffer: PixelBuffer): string {
  let hash = 2166136261

  for (let index = 0; index < buffer.data.length; index += 1) {
    hash ^= buffer.data[index]
    hash = Math.imul(hash, 16777619)
  }

  return `${buffer.width}x${buffer.height}:${(hash >>> 0).toString(16)}`
}
