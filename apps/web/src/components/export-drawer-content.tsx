import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@workspace/ui/components/drawer"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Slider } from "@workspace/ui/components/slider"
import { DownloadIcon } from "lucide-react"

import {
  EXPORT_FORMAT_OPTIONS,
  EXPORT_QUALITY_STEP,
  MAX_EXPORT_QUALITY,
  MIN_EXPORT_QUALITY,
  getExportFormatOption,
  type ExportFormat,
} from "@/lib/export-image"
import type {
  AnimatedExportFormat,
  VideoExportSettings,
} from "@/lib/motion-types"
import { useState } from "react"
import type { JobStatus } from "@/store/editor-store"

export function ExportDrawerContent({
  exportFormat,
  exportQuality,
  status,
  isAnimated = false,
  animatedExportFormat = "gif",
  frameCount,
  webCodecsAvailable = false,
  videoExportSettings,
  motionExportSettings,
  onExport,
  onExportFormatChange,
  onExportQualityChange,
  onAnimatedExportFormatChange,
  onVideoExportSettingsChange,
  onMotionExportSettingsChange,
}: {
  exportFormat: ExportFormat
  exportQuality: number
  status: JobStatus
  isAnimated?: boolean
  animatedExportFormat?: AnimatedExportFormat
  frameCount?: number
  webCodecsAvailable?: boolean
  videoExportSettings?: VideoExportSettings
  motionExportSettings?: { frameDurationMs: number; loopCount: number }
  onExport: () => void
  onExportFormatChange: (format: ExportFormat) => void
  onExportQualityChange: (quality: number) => void
  onAnimatedExportFormatChange?: (format: AnimatedExportFormat) => void
  onVideoExportSettingsChange?: (settings: Partial<VideoExportSettings>) => void
  onMotionExportSettingsChange?: (settings: {
    frameDurationMs?: number
    loopCount?: number
  }) => void
}) {
  const [durationInput, setDurationInput] = useState<string | null>(null)
  const selectedExportFormat = isAnimated
    ? getAnimatedFormatOption(animatedExportFormat)
    : getExportFormatOption(exportFormat)
  const exportQualityPercent = Math.round(exportQuality * 100)
  const displayedExportQuality = selectedExportFormat.supportsQuality
    ? exportQuality
    : 1

  return (
    <DrawerContent>
      <DrawerHeader>
        <DrawerTitle>Export</DrawerTitle>
        <DrawerDescription>
          {isAnimated
            ? `Export all frames as an animated ${animatedExportFormat === "apng" ? "PNG (APNG)" : "GIF"}.`
            : "Format and quality for final image download."}
        </DrawerDescription>
      </DrawerHeader>
      <div className="grid min-w-0 gap-3 p-3">
        <div className="grid min-w-0 grid-cols-[minmax(8rem,0.75fr)_minmax(0,1.25fr)] gap-3">
          <label
            className="grid min-w-0 content-start gap-1.5 pr-3 text-sm font-medium"
            htmlFor="export-format"
          >
            Export Format
            {isAnimated ? (
              <Select
                value={animatedExportFormat}
                onValueChange={(value) =>
                  onAnimatedExportFormatChange?.(value as AnimatedExportFormat)
                }
              >
                <SelectTrigger
                  aria-label="Animated export format"
                  className="w-full min-w-0"
                  id="animated-export-format"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gif">GIF</SelectItem>
                  <SelectItem value="apng">APNG</SelectItem>
                  {webCodecsAvailable ? (
                    <SelectItem value="webm">WebM</SelectItem>
                  ) : null}
                </SelectContent>
                {!webCodecsAvailable ? (
                  <span className="font-sans text-[11px] text-muted-foreground">
                    WebM requires WebCodecs (Chrome 94+, Firefox 130+, Safari
                    16.4+)
                  </span>
                ) : null}
              </Select>
            ) : (
              <Select
                value={exportFormat}
                onValueChange={(value) =>
                  onExportFormatChange(value as ExportFormat)
                }
              >
                <SelectTrigger
                  aria-label="Export format"
                  className="min-w-0"
                  id="export-format"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPORT_FORMAT_OPTIONS.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </label>
          <label className="grid min-w-0 grid-cols-[minmax(0,1fr)_4ch] gap-x-2 gap-y-1 border-l border-border pl-3 font-mono text-[10px] text-muted-foreground">
            <span className="font-sans text-sm font-medium text-foreground">
              Export Quality
            </span>
            <Slider
              aria-label="Export quality"
              className="col-span-2 row-start-2 min-w-0"
              disabled={isAnimated || !selectedExportFormat.supportsQuality}
              max={MAX_EXPORT_QUALITY}
              min={MIN_EXPORT_QUALITY}
              step={EXPORT_QUALITY_STEP}
              value={[displayedExportQuality]}
              onValueChange={(value) =>
                onExportQualityChange(value[0] ?? exportQuality)
              }
            />
            <span className="col-start-2 row-start-1 text-right tabular-nums">
              {selectedExportFormat.supportsQuality
                ? exportQualityPercent
                : 100}
              %
            </span>
          </label>
        </div>
        {isAnimated ? (
          <>
            <p className="text-xs text-muted-foreground">
              {animatedExportFormat === "webm"
                ? "WebM output uses VP9 lossy compression. Palette matching and dithering still apply."
                : animatedExportFormat === "apng"
                  ? "APNG output uses 24-bit RGBA per frame. Palette matching and dithering still apply."
                  : "GIF output uses the active palette. Palettes larger than 256 colors are not supported."}
            </p>
            {animatedExportFormat === "webm" &&
            videoExportSettings &&
            onVideoExportSettingsChange ? (
              <label className="grid min-w-0 gap-1.5 text-sm font-medium">
                CRF (quality)
                <Slider
                  aria-label="Video quality"
                  className="min-w-0"
                  max={63}
                  min={0}
                  step={1}
                  value={[videoExportSettings.crf]}
                  onValueChange={(value) =>
                    onVideoExportSettingsChange({ crf: value[0] ?? 30 })
                  }
                />
                <span className="font-sans text-[11px] text-muted-foreground">
                  {videoExportSettings.crf} —{" "}
                  {videoExportSettings.crf <= 20
                    ? "high quality"
                    : videoExportSettings.crf <= 35
                      ? "medium quality"
                      : "low quality"}
                </span>
              </label>
            ) : null}
            {animatedExportFormat !== "webm" &&
            motionExportSettings &&
            onMotionExportSettingsChange ? (
              <div className="grid gap-3">
                <label
                  className="grid min-w-0 gap-1.5 text-sm font-medium"
                  htmlFor="frame-duration"
                >
                  Frame Duration (ms)
                  <Input
                    className="min-w-0"
                    id="frame-duration"
                    type="number"
                    value={
                      durationInput !== null
                        ? durationInput
                        : String(motionExportSettings.frameDurationMs)
                    }
                    onChange={(e) => {
                      setDurationInput(e.target.value)
                    }}
                    onBlur={() => {
                      if (durationInput === null) return
                      const value = Number(durationInput)
                      if (Number.isFinite(value)) {
                        onMotionExportSettingsChange?.({
                          frameDurationMs: Math.max(
                            20,
                            Math.min(5000, Math.round(value / 10) * 10)
                          ),
                        })
                      }
                      setDurationInput(null)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        ;(e.target as HTMLInputElement).blur()
                      }
                    }}
                  />
                  <span className="font-sans text-[11px] text-muted-foreground">
                    {motionExportSettings.frameDurationMs}ms ≈{" "}
                    {Math.round(1000 / motionExportSettings.frameDurationMs)}{" "}
                    fps
                    {frameCount != null && frameCount > 0
                      ? ` · total ${formatDuration(motionExportSettings.frameDurationMs * frameCount)}`
                      : ""}
                  </span>
                </label>
                <label
                  className="grid min-w-0 gap-1.5 text-sm font-medium"
                  htmlFor="loop-count"
                >
                  Loop Count
                  <Select
                    value={String(motionExportSettings.loopCount)}
                    onValueChange={(value) =>
                      onMotionExportSettingsChange({
                        loopCount: Number(value),
                      })
                    }
                  >
                    <SelectTrigger
                      aria-label="Loop count"
                      className="min-w-0"
                      id="loop-count"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">∞ (infinite)</SelectItem>
                      <SelectItem value="1">1 (once)</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="font-sans text-[11px] text-muted-foreground">
                    {motionExportSettings.loopCount === 0
                      ? "Loops forever."
                      : `Plays ${motionExportSettings.loopCount} time${motionExportSettings.loopCount === 1 ? "" : "s"}.`}
                  </span>
                </label>
              </div>
            ) : null}
          </>
        ) : exportFormat === "png" ? (
          <p className="text-xs text-muted-foreground">
            PNG exports remain lossless at 100%.
          </p>
        ) : null}
      </div>
      <DrawerFooter>
        <Button disabled={status === "exporting"} onClick={onExport}>
          <DownloadIcon data-icon="inline-start" />
          Download {selectedExportFormat.label}
        </Button>
      </DrawerFooter>
    </DrawerContent>
  )
}

function formatDuration(ms: number): string {
  if (ms >= 60000) {
    const sec = (ms / 1000).toFixed(1)
    return `${sec}s`
  }
  return `${ms}ms`
}

function getAnimatedFormatOption(format: AnimatedExportFormat): {
  extension: string
  id: string
  label: string
  mimeType: string
  supportsQuality: boolean
} {
  if (format === "apng") {
    return {
      extension: "png",
      id: "apng",
      label: "APNG",
      mimeType: "image/png",
      supportsQuality: false,
    }
  }
  if (format === "webm") {
    return {
      extension: "webm",
      id: "webm",
      label: "WebM",
      mimeType: "video/webm",
      supportsQuality: false,
    }
  }
  return {
    extension: "gif",
    id: "gif",
    label: "GIF",
    mimeType: "image/gif",
    supportsQuality: false,
  }
}
