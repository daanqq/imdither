import { describe, expect, it } from "vitest"
import { editorSettingsSchema } from "@workspace/core"

import { DEMO_AUTO_TUNE_RECOMMENDATIONS } from "./demo-auto-tune"

describe("demo Auto-Tune recommendations", () => {
  it("uses the same public recommendation contract as runtime Auto-Tune", () => {
    expect(DEMO_AUTO_TUNE_RECOMMENDATIONS).toHaveLength(5)
    expect(
      DEMO_AUTO_TUNE_RECOMMENDATIONS.filter(
        (recommendation) => recommendation.recommended
      )
    ).toHaveLength(1)

    for (const [
      index,
      recommendation,
    ] of DEMO_AUTO_TUNE_RECOMMENDATIONS.entries()) {
      expect(recommendation.rank).toBe(index + 1)
      expect(recommendation.snapshot).toMatchObject({
        format: "imdither-look",
        version: 1,
        kind: "look-snapshot",
      })
      expect(
        editorSettingsSchema.safeParse(recommendation.snapshot.settings).success
      ).toBe(true)
    }
  })
})
