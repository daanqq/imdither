import { describe, expect, it } from "vitest"

import {
  DEFAULT_SETTINGS,
  createLookSnapshot,
  decodeLookPayload,
  encodeLookPayload,
  extractLookPayload,
} from "./index"

describe("Look Snapshot public contract", () => {
  it("creates an immutable look wrapper around normalized schema version 3 settings", () => {
    const snapshot = createLookSnapshot({
      settings: {
        algorithm: "atkinson",
        colorDepth: { mode: "limit", count: 8 },
        customPalette: ["#ffffff", "#111111"],
        matchingMode: "perceptual",
        preprocess: {
          ...DEFAULT_SETTINGS.preprocess,
          brightness: 12,
          colorMode: "color-preserve",
        },
        resize: {
          ...DEFAULT_SETTINGS.resize,
          height: 360,
          width: 480,
        },
      },
      createdAt: "2026-04-26T00:00:00.000Z",
    })

    expect(snapshot.format).toBe("imdither-look")
    expect(snapshot.version).toBe(1)
    expect(snapshot.kind).toBe("look-snapshot")
    expect(snapshot.createdAt).toBe("2026-04-26T00:00:00.000Z")
    expect(snapshot.settings.schemaVersion).toBe(3)
    expect(snapshot.settings.algorithm).toBe("atkinson")
    expect(snapshot.settings.colorDepth).toEqual({ mode: "limit", count: 8 })
    expect(snapshot.settings.customPalette).toEqual(["#ffffff", "#111111"])
    expect(snapshot.settings.matchingMode).toBe("perceptual")
    expect(snapshot.settings.preprocess.brightness).toBe(12)
    expect(snapshot.settings.preprocess.colorMode).toBe("color-preserve")
    expect(snapshot.settings.resize.height).toBe(360)
    expect(snapshot.settings.resize.width).toBe(480)
    expect(snapshot.settings.effectStack).toHaveLength(2)
    expect(snapshot.settings.effectStack[0].kind).toBe("quantize")
    expect(snapshot.settings.effectStack[1].kind).toBe("dither")
  })

  it("encodes and decodes one URL-safe payload for clipboard and hash flows", () => {
    const snapshot = createLookSnapshot({
      settings: {
        alphaBackground: "black",
        resize: {
          ...DEFAULT_SETTINGS.resize,
          height: 512,
          width: 512,
        },
      },
      createdAt: "2026-04-26T00:00:00.000Z",
      name: "Mono proof",
    })
    const payload = encodeLookPayload(snapshot)

    expect(payload).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(decodeLookPayload(payload)).toEqual(snapshot)
    expect(extractLookPayload(payload)).toBe(payload)
    expect(extractLookPayload(`https://imdither.local/#look=${payload}`)).toBe(
      payload
    )
  })

  it("uses a compact wire payload while decoding back to the public snapshot", () => {
    const snapshot = createLookSnapshot({
      settings: {
        algorithm: "atkinson",
      },
      createdAt: "2026-04-26T00:00:00.000Z",
    })
    const payload = encodeLookPayload(snapshot)

    expect(payload.length).toBeLessThan(180)
    expect(decodeLookPayload(payload)).toEqual(snapshot)
  })

  it("rejects invalid wrapper identity and invalid nested settings", () => {
    const unsupportedFormat = encodeLookPayload({
      format: "other",
      version: 1,
      kind: "look-snapshot",
      createdAt: "2026-04-26T00:00:00.000Z",
      settings: DEFAULT_SETTINGS,
    })
    const invalidSettings = encodeLookPayload({
      format: "imdither-look",
      version: 1,
      kind: "look-snapshot",
      createdAt: "2026-04-26T00:00:00.000Z",
      settings: {
        ...DEFAULT_SETTINGS,
        algorithm: "unknown",
      },
    })

    expect(() => decodeLookPayload(unsupportedFormat)).toThrow(
      "Unsupported Look Snapshot payload"
    )
    expect(() => decodeLookPayload(invalidSettings)).toThrow(
      "Unsupported Look Snapshot payload"
    )
    expect(() => decodeLookPayload("not-json")).toThrow(
      "Look payload is not valid compressed base64url JSON"
    )
  })
})
