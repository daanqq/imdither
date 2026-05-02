import * as React from "react"

const DISPLAY_SIZE_CHANGE_THRESHOLD = 16

export function shouldNotifyDisplaySizeChange(
  previous: { height: number; width: number } | null,
  next: { height: number; width: number },
  threshold = DISPLAY_SIZE_CHANGE_THRESHOLD
): boolean {
  if (!previous) {
    return true
  }

  return (
    Math.abs(previous.width - next.width) >= threshold ||
    Math.abs(previous.height - next.height) >= threshold
  )
}

export function usePreviewDisplayMeasurement(
  onPreviewDisplaySizeChange: (size: { height: number; width: number }) => void
) {
  const [previewDisplaySize, setPreviewDisplaySize] = React.useState<{
    height: number
    width: number
  } | null>(null)
  const latestSizeRef = React.useRef<{ height: number; width: number } | null>(
    null
  )
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const previewDisplayRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      if (!node || typeof ResizeObserver === "undefined") {
        return
      }

      const observer = new ResizeObserver((entries) => {
        const rect = entries[0]?.contentRect

        if (!rect) {
          return
        }

        const nextSize = {
          height: Math.max(1, Math.round(rect.height)),
          width: Math.max(1, Math.round(rect.width)),
        }
        const latestSize = latestSizeRef.current

        if (!shouldNotifyDisplaySizeChange(latestSize, nextSize)) {
          return
        }

        latestSizeRef.current = nextSize
        setPreviewDisplaySize(nextSize)

        if (timerRef.current) {
          clearTimeout(timerRef.current)
        }

        timerRef.current = setTimeout(() => {
          onPreviewDisplaySizeChange(nextSize)
        }, 120)
      })

      observer.observe(node)

      return () => {
        observer.disconnect()

        if (timerRef.current) {
          clearTimeout(timerRef.current)
        }
      }
    },
    [onPreviewDisplaySizeChange]
  )

  return { previewDisplayRef, previewDisplaySize }
}
