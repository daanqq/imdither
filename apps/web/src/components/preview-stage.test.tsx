import { renderToStaticMarkup } from "react-dom/server"
import type * as React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { PixelBuffer } from "@workspace/core"

import { areCanvasPanelPropsEqual } from "./preview-render-boundaries"
import { PreviewStage } from "./preview-stage"

type ButtonMockProps = React.ComponentProps<"button"> & {
  variant?: string
}

type InputMockProps = React.ComponentProps<"input">

const buttonRenders: ButtonMockProps[] = []
const inputRenders: InputMockProps[] = []

vi.mock("@workspace/ui/components/button", () => ({
  Button: (props: ButtonMockProps) => {
    buttonRenders.push(props)
    return <button {...props} />
  },
}))

vi.mock("@workspace/ui/components/input", () => ({
  Input: (props: InputMockProps) => {
    inputRenders.push(props)
    return <input {...props} />
  },
}))

const buffer: PixelBuffer = {
  data: new Uint8ClampedArray([0, 0, 0, 255]),
  height: 1,
  width: 1,
}

describe("PreviewStage", () => {
  beforeEach(() => {
    buttonRenders.length = 0
    inputRenders.length = 0
  })

  it("keeps upload and export side effects behind callbacks", () => {
    const onExportPng = vi.fn()
    const onFileSelected = vi.fn()

    renderToStaticMarkup(
      <PreviewStage
        algorithm="floyd-steinberg"
        compareMode="processed"
        isDesktopViewScale
        original={buffer}
        preview={buffer}
        previewTargetHeight={1}
        previewTargetWidth={1}
        status="ready"
        viewScale="fit"
        onExportPng={onExportPng}
        onFileSelected={onFileSelected}
        onInvalidDrop={vi.fn()}
        onPreviewDisplaySizeChange={vi.fn()}
        onViewScaleChange={vi.fn()}
      />
    )

    const file = new File(["x"], "source.png", { type: "image/png" })
    const fileInput = inputRenders.at(-1)
    const exportButton = buttonRenders.find((button) =>
      button.children?.toString().includes("Export PNG")
    )

    fileInput?.onChange?.({
      target: { files: [file], value: "source.png" },
    } as unknown as React.ChangeEvent<HTMLInputElement>)
    exportButton?.onClick?.({} as React.MouseEvent<HTMLButtonElement>)

    expect(onFileSelected).toHaveBeenCalledTimes(1)
    expect(onFileSelected).toHaveBeenCalledWith(file)
    expect(onExportPng).toHaveBeenCalledTimes(1)
  })

  it("keeps ready canvas presentation stable across status-only updates", () => {
    const baseProps = {
      buffer,
      expectedHeight: 1,
      expectedWidth: 1,
      label: "Processed",
      missing: false,
      status: "ready",
      viewScale: "fit",
    } as const

    expect(
      areCanvasPanelPropsEqual(baseProps, {
        ...baseProps,
        status: "processing",
      })
    ).toBe(true)

    expect(
      areCanvasPanelPropsEqual(baseProps, {
        ...baseProps,
        buffer: {
          ...buffer,
          data: new Uint8ClampedArray(buffer.data),
        },
      })
    ).toBe(false)
  })

  it("keeps placeholder status updates visible while processed output is missing", () => {
    const baseProps = {
      buffer: null,
      expectedHeight: 1,
      expectedWidth: 1,
      label: "Processed",
      missing: true,
      status: "queued",
      viewScale: "fit",
    } as const

    expect(
      areCanvasPanelPropsEqual(baseProps, {
        ...baseProps,
        status: "processing",
      })
    ).toBe(false)
  })
})
