import { describe, expect, it } from "vitest"

import { getPreviewFrameStyle } from "./preview-frame"

describe("preview frame style", () => {
  it("uses container query units for fit sizing instead of source pixel dimensions", () => {
    expect(
      getPreviewFrameStyle({
        sourceHeight: 32,
        sourceWidth: 64,
        viewScale: "fit",
      })
    ).toMatchObject({
      "--preview-aspect": "2",
      height:
        "max(1px, min(calc(100cqh - 12px), calc(calc(100cqw - 12px) / var(--preview-aspect))))",
      width:
        "max(1px, min(calc(100cqw - 12px), calc(calc(100cqh - 12px) * var(--preview-aspect))))",
    })
  })

  it("keeps actual sizing at source pixel dimensions", () => {
    expect(
      getPreviewFrameStyle({
        sourceHeight: 32,
        sourceWidth: 64,
        viewScale: "actual",
      })
    ).toMatchObject({
      height: "32px",
      width: "64px",
    })
  })
})
