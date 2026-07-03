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
import { useTranslation } from "react-i18next"

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
  const { t } = useTranslation()
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
        <DrawerTitle>{t("export.title")}</DrawerTitle>
        <DrawerDescription>
          {isAnimated
            ? t("export.animatedDescription", {
                format: animatedExportFormat === "apng" ? "PNG (APNG)" : "GIF",
              })
            : t("export.staticDescription")}
        </DrawerDescription>
      </DrawerHeader>
      <div className="grid min-w-0 gap-3 p-3">
        <div className="grid min-w-0 grid-cols-[minmax(8rem,0.75fr)_minmax(0,1.25fr)] gap-3">
          <label
            className="grid min-w-0 content-start gap-1.5 pr-3 text-sm font-medium"
            htmlFor="export-format"
          >
            {t("export.format")}
            {isAnimated ? (
              <Select
                value={animatedExportFormat}
                onValueChange={(value) =>
                  onAnimatedExportFormatChange?.(value as AnimatedExportFormat)
                }
              >
                <SelectTrigger
                  aria-label={t("export.animatedFormat")}
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
                    {t("export.webmUnavailable")}
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
                  aria-label={t("export.formatLabel")}
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
              {t("export.quality")}
            </span>
            <Slider
              aria-label={t("export.quality")}
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
                ? t("export.webmNote")
                : animatedExportFormat === "apng"
                  ? t("export.apngNote")
                  : t("export.gifNote")}
            </p>
            {animatedExportFormat === "webm" &&
            videoExportSettings &&
            onVideoExportSettingsChange ? (
              <label className="grid min-w-0 gap-1.5 text-sm font-medium">
                {t("export.crf")}
                <Slider
                  aria-label={t("export.crf")}
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
                  {videoExportSettings.crf}:{" "}
                  {videoExportSettings.crf <= 20
                    ? t("export.highQuality")
                    : videoExportSettings.crf <= 35
                      ? t("export.mediumQuality")
                      : t("export.lowQuality")}
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
                  {t("export.frameDuration")}
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
                    {t("export.fps")}
                    {frameCount != null && frameCount > 0
                      ? ` · ${t("export.total")} ${formatDuration(motionExportSettings.frameDurationMs * frameCount)}`
                      : ""}
                  </span>
                </label>
                <label
                  className="grid min-w-0 gap-1.5 text-sm font-medium"
                  htmlFor="loop-count"
                >
                  {t("export.loopCount")}
                  <Select
                    value={String(motionExportSettings.loopCount)}
                    onValueChange={(value) =>
                      onMotionExportSettingsChange({
                        loopCount: Number(value),
                      })
                    }
                  >
                    <SelectTrigger
                      aria-label={t("export.loopCount")}
                      className="min-w-0"
                      id="loop-count"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">{t("export.infinite")}</SelectItem>
                      <SelectItem value="1">{t("export.once")}</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="font-sans text-[11px] text-muted-foreground">
                    {motionExportSettings.loopCount === 0
                      ? t("export.loopsForever")
                      : t("export.playsCount", {
                          count: motionExportSettings.loopCount,
                        })}
                  </span>
                </label>
              </div>
            ) : null}
          </>
        ) : exportFormat === "png" ? (
          <p className="text-xs text-muted-foreground">{t("export.pngNote")}</p>
        ) : null}
      </div>
      <DrawerFooter>
        <Button disabled={status === "exporting"} onClick={onExport}>
          <DownloadIcon data-icon="inline-start" />
          {t("export.download", { label: selectedExportFormat.label })}
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
