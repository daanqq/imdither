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
import { useState } from "react"
import type { JobStatus } from "@/store/editor-store"

export function ExportDrawerContent({
  exportFormat,
  exportQuality,
  status,
  isAnimated = false,
  motionExportSettings,
  onExport,
  onExportFormatChange,
  onExportQualityChange,
  onMotionExportSettingsChange,
}: {
  exportFormat: ExportFormat
  exportQuality: number
  status: JobStatus
  isAnimated?: boolean
  motionExportSettings?: { frameDurationMs: number; loopCount: number }
  onExport: () => void
  onExportFormatChange: (format: ExportFormat) => void
  onExportQualityChange: (quality: number) => void
  onMotionExportSettingsChange?: (settings: {
    frameDurationMs?: number
    loopCount?: number
  }) => void
}) {
  const [durationInput, setDurationInput] = useState<string | null>(null)
  const selectedExportFormat = isAnimated
    ? {
        extension: "gif" as const,
        id: "gif" as const,
        label: "Animated GIF" as const,
        mimeType: "image/gif",
        supportsQuality: false,
      }
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
            ? "Export all frames as an animated GIF."
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
              <div className="mt-1.5 font-mono text-xs text-muted-foreground">
                Animated GIF
              </div>
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
              GIF output uses the active palette. Palettes larger than 256
              colors are not supported.
            </p>
            {motionExportSettings && onMotionExportSettingsChange ? (
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
