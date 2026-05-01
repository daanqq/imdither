import * as React from "react"

export type PreviewSurfaceViewportBox = {
  height: number
  width: number
}

type PreviewSurfaceLifecycleContextValue = {
  initialViewportBox: PreviewSurfaceViewportBox | null
  onViewportBoxChange?: (box: PreviewSurfaceViewportBox) => void
}

const PreviewSurfaceLifecycleContext =
  React.createContext<PreviewSurfaceLifecycleContextValue>({
    initialViewportBox: null,
  })

export function PreviewSurfaceLifecycleProvider({
  children,
  initialViewportBox,
  onViewportBoxChange,
}: {
  children: React.ReactNode
  initialViewportBox: PreviewSurfaceViewportBox | null
  onViewportBoxChange?: (box: PreviewSurfaceViewportBox) => void
}) {
  const value = React.useMemo(
    () => ({ initialViewportBox, onViewportBoxChange }),
    [initialViewportBox, onViewportBoxChange]
  )

  return React.createElement(
    PreviewSurfaceLifecycleContext.Provider,
    { value },
    children
  )
}

export function usePreviewSurfaceLifecycle() {
  return React.useContext(PreviewSurfaceLifecycleContext)
}

export function usePreviewCanvasRedrawBoundary(redraw: () => void) {
  React.useLayoutEffect(() => {
    redraw()
  }, [redraw])

  React.useEffect(() => {
    const restoreCanvasContents = () => {
      if (document.visibilityState !== "visible") {
        return
      }

      redraw()
    }

    document.addEventListener("visibilitychange", restoreCanvasContents)
    window.addEventListener("pageshow", restoreCanvasContents)

    return () => {
      document.removeEventListener("visibilitychange", restoreCanvasContents)
      window.removeEventListener("pageshow", restoreCanvasContents)
    }
  }, [redraw])
}
