import * as React from "react"
import { Button } from "@workspace/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { Slider } from "@workspace/ui/components/slider"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import { cn } from "@workspace/ui/lib/utils"
import { CrosshairIcon, MaximizeIcon, ScanSearchIcon } from "lucide-react"

import {
  clampZoom,
  MIN_PREVIEW_ZOOM,
  type PreviewViewport,
} from "@/lib/preview-viewport"
import type { CompareMode } from "@/store/editor-store"

export function PreviewSurfaceControls({
  compareMode,
  imageHeight,
  imageWidth,
  pixelInspectorEnabled,
  viewport,
  onCompareModeChange,
  onViewportChange,
}: {
  compareMode: CompareMode
  imageHeight: number
  imageWidth: number
  pixelInspectorEnabled: boolean
  viewport: PreviewViewport
  onCompareModeChange: (mode: CompareMode) => void
  onViewportChange: (viewport: Partial<PreviewViewport>) => void
}) {
  const nextCompareMode = getNextCompareMode(compareMode)

  return (
    <div className="pointer-events-none absolute inset-x-2 top-2 z-30 flex items-start justify-between gap-2">
      <Button
        type="button"
        aria-label={`Switch compare mode to ${getCompareModeLabel(nextCompareMode)}`}
        className="pointer-events-auto h-8 border-transparent bg-background/80 px-2.5 text-xs shadow-none backdrop-blur-md"
        variant="outline"
        onClick={() => onCompareModeChange(nextCompareMode)}
      >
        {getCompareModeLabel(compareMode)}
      </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            aria-label="Open preview view controls"
            className="pointer-events-auto h-8 border-transparent bg-background/80 px-2.5 font-mono text-xs shadow-none backdrop-blur-md"
            variant="outline"
          >
            {viewport.mode === "fit"
              ? "Fit"
              : `Pixels ${Math.round(viewport.zoom * 100)}%`}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="border-transparent bg-background/90 backdrop-blur-md"
        >
          <PreviewViewControls
            imageHeight={imageHeight}
            imageWidth={imageWidth}
            pixelInspectorEnabled={pixelInspectorEnabled}
            viewport={viewport}
            onViewportChange={onViewportChange}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

function PreviewViewControls({
  imageHeight,
  imageWidth,
  pixelInspectorEnabled,
  viewport,
  onViewportChange,
}: {
  imageHeight: number
  imageWidth: number
  pixelInspectorEnabled: boolean
  viewport: PreviewViewport
  onViewportChange: (viewport: Partial<PreviewViewport>) => void
}) {
  const zoomPercent = Math.round(viewport.zoom * 100)
  const centeredViewport = React.useMemo(
    () => ({
      center: {
        x: Math.max(1, imageWidth) / 2,
        y: Math.max(1, imageHeight) / 2,
      },
      mode: "manual" as const,
      zoom: 1,
    }),
    [imageHeight, imageWidth]
  )
  return (
    <div
      className={cn(
        "grid h-full w-full min-w-0 grid-cols-4 items-center gap-2"
      )}
    >
      <ToggleGroup
        type="single"
        value={viewport.mode}
        variant="outline"
        className="col-span-4 grid h-10 w-full max-w-full grid-cols-2"
      >
        <ToggleGroupItem
          aria-label="Fit preview"
          value="fit"
          className="h-full min-w-10 px-2"
          onClick={() =>
            onViewportChange({
              center: centeredViewport.center,
              mode: "fit",
              zoom: 1,
            })
          }
        >
          <MaximizeIcon data-icon="inline-start" />
          <span className="md:hidden">Fit</span>
          <span className="hidden md:inline">Screen Fit</span>
        </ToggleGroupItem>
        <ToggleGroupItem
          aria-label="Inspect output pixels"
          value="manual"
          className="h-full min-w-10 px-2"
          onClick={() => onViewportChange(centeredViewport)}
        >
          <ScanSearchIcon data-icon="inline-start" />
          <span className="md:hidden">Pixels</span>
          <span className="hidden md:inline">Real Pixels</span>
        </ToggleGroupItem>
      </ToggleGroup>
      <div className="col-span-4 grid h-10 min-w-0 grid-cols-4 items-center gap-2">
        <Button
          type="button"
          aria-label="Set output pixels to 1:1"
          variant="outline"
          className="h-full min-w-10 px-2 font-mono text-[10px]"
          onClick={() => onViewportChange(centeredViewport)}
        >
          1:1
        </Button>
        <label className="col-span-3 mx-2 grid min-w-0 grid-cols-[minmax(0,1fr)_4ch] items-center gap-x-2 gap-y-1 font-mono text-[10px] text-muted-foreground">
          <span className="col-start-1 row-start-1">Zoom</span>
          <Slider
            aria-label="Preview zoom"
            className="col-span-2 row-start-2 min-w-0"
            min={MIN_PREVIEW_ZOOM}
            max={16}
            step={0.25}
            value={[viewport.zoom]}
            onValueChange={(value) =>
              onViewportChange({
                ...(viewport.mode === "fit"
                  ? { center: centeredViewport.center }
                  : null),
                mode: "manual",
                zoom: clampZoom(value[0] ?? viewport.zoom),
              })
            }
          />
          <span className="col-start-2 row-start-1 text-right tabular-nums">
            {zoomPercent}%
          </span>
        </label>
      </div>
      {pixelInspectorEnabled ? (
        <Button
          type="button"
          aria-label="Toggle pixel inspector"
          aria-pressed={viewport.loupeEnabled}
          variant={viewport.loupeEnabled ? "default" : "outline"}
          className="col-span-4 h-9 min-w-10 px-2"
          onClick={() =>
            onViewportChange({
              ...(viewport.mode === "manual"
                ? null
                : { center: centeredViewport.center }),
              loupeEnabled: !viewport.loupeEnabled,
              mode: "manual",
            })
          }
        >
          <CrosshairIcon data-icon="inline-start" />
          Inspector
        </Button>
      ) : null}
    </div>
  )
}

function getNextCompareMode(compareMode: CompareMode): CompareMode {
  if (compareMode === "slide") {
    return "processed"
  }

  if (compareMode === "processed") {
    return "original"
  }

  return "slide"
}

function getCompareModeLabel(compareMode: CompareMode) {
  return compareMode === "slide"
    ? "Comparison"
    : compareMode === "processed"
      ? "Processed"
      : "Original"
}
