import * as React from "react"
import type {
  AlphaBackground,
  DitherAlgorithm,
  PixelBuffer,
} from "@workspace/core"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  DrawerClose,
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
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import { CopyIcon, DownloadIcon, XIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import {
  EXPORT_FORMAT_OPTIONS,
  EXPORT_QUALITY_STEP,
  MAX_EXPORT_QUALITY,
  MIN_EXPORT_QUALITY,
  encodePixelBuffer,
  getExportFormatOption,
  type ExportFormat,
} from "@/lib/export-image"
import {
  formatAspectRatio,
  formatByteSize,
  getLocalizedAlgorithmLabel,
} from "@/lib/i18n-labels"
import type {
  AnimatedExportFormat,
  VideoExportSettings,
} from "@/lib/motion-types"
import {
  resolvePaletteChipLabel,
  resolvePaletteColors,
} from "@/lib/palette-preview"
import type { JobStatus } from "@/store/editor-store"

const SIZE_ESTIMATE_DEBOUNCE_MS = 100

export function ExportDrawerContent({
  algorithm,
  alphaBackground = "white",
  customPalette,
  exportFormat,
  exportQuality,
  outputHeight,
  outputWidth,
  paletteId,
  previewBuffer,
  status,
  isAnimated = false,
  animatedExportFormat = "gif",
  frameCount,
  webCodecsAvailable = false,
  videoExportSettings,
  motionExportSettings,
  onCopyImage,
  onExport,
  onExportFormatChange,
  onExportQualityChange,
  onAnimatedExportFormatChange,
  onVideoExportSettingsChange,
  onMotionExportSettingsChange,
}: {
  algorithm?: DitherAlgorithm
  alphaBackground?: AlphaBackground
  customPalette?: readonly string[]
  exportFormat: ExportFormat
  exportQuality: number
  outputHeight?: number
  outputWidth?: number
  paletteId?: string
  previewBuffer?: PixelBuffer | null
  status: JobStatus
  isAnimated?: boolean
  animatedExportFormat?: AnimatedExportFormat
  frameCount?: number
  webCodecsAvailable?: boolean
  videoExportSettings?: VideoExportSettings
  motionExportSettings?: { frameDurationMs: number; loopCount: number }
  onCopyImage?: () => void
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
  const [durationInput, setDurationInput] = React.useState<string | null>(null)
  const [estimatedSizeState, setEstimatedSizeState] = React.useState<{
    bytes: number | null
    estimating: boolean
  }>({ bytes: null, estimating: false })

  const selectedExportFormat = isAnimated
    ? getAnimatedFormatOption(animatedExportFormat)
    : getExportFormatOption(exportFormat)
  const exportQualityPercent = Math.round(exportQuality * 100)

  React.useEffect(() => {
    if (isAnimated || !previewBuffer || typeof document === "undefined") {
      setEstimatedSizeState({ bytes: null, estimating: false })
      return
    }

    let cancelled = false
    setEstimatedSizeState((prev) => ({ bytes: prev.bytes, estimating: true }))

    const timer = setTimeout(() => {
      void encodePixelBuffer(previewBuffer, {
        alphaBackground,
        format: exportFormat,
        quality: exportQuality,
      })
        .then((blob) => {
          if (cancelled) {
            return
          }

          let estimatedBytes = blob.size
          if (
            outputWidth &&
            outputHeight &&
            previewBuffer.width > 0 &&
            previewBuffer.height > 0 &&
            (previewBuffer.width !== outputWidth ||
              previewBuffer.height !== outputHeight)
          ) {
            const areaRatio =
              (outputWidth * outputHeight) /
              (previewBuffer.width * previewBuffer.height)
            estimatedBytes = Math.round(blob.size * areaRatio)
          }

          setEstimatedSizeState({ bytes: estimatedBytes, estimating: false })
        })
        .catch(() => {
          if (!cancelled) {
            setEstimatedSizeState({ bytes: null, estimating: false })
          }
        })
    }, SIZE_ESTIMATE_DEBOUNCE_MS)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [
    alphaBackground,
    exportFormat,
    exportQuality,
    isAnimated,
    outputHeight,
    outputWidth,
    previewBuffer,
  ])

  const hasDimensions =
    typeof outputWidth === "number" &&
    outputWidth > 0 &&
    typeof outputHeight === "number" &&
    outputHeight > 0
  const algorithmLabel = algorithm
    ? getLocalizedAlgorithmLabel(algorithm, t)
    : null
  const paletteColors =
    paletteId || customPalette?.length
      ? resolvePaletteColors(paletteId ?? "custom", customPalette)
      : null
  const paletteSummary =
    paletteId || customPalette?.length
      ? resolvePaletteChipLabel(
          paletteId ?? "custom",
          customPalette,
          t("manual.custom")
        )
      : null
  const frameDurationMs = motionExportSettings?.frameDurationMs ?? 100
  const animatedFps = Math.max(1, Math.round(1000 / frameDurationMs))
  const totalDurationMs =
    frameCount != null && frameCount > 0 ? frameDurationMs * frameCount : null

  const showSummaryCard =
    hasDimensions ||
    Boolean(algorithmLabel) ||
    Boolean(paletteSummary) ||
    (isAnimated && frameCount != null && frameCount > 0)

  const formatNote = isAnimated
    ? animatedExportFormat === "webm"
      ? t("export.webmNote")
      : animatedExportFormat === "apng"
        ? t("export.apngNote")
        : t("export.gifNote")
    : exportFormat === "png"
      ? t("export.pngNote")
      : exportFormat === "webp"
        ? t("export.webpNote")
        : t("export.jpegNote")

  const animatedDescriptionFormat =
    animatedExportFormat === "apng"
      ? "PNG (APNG)"
      : animatedExportFormat === "webm"
        ? "WebM"
        : "GIF"

  return (
    <DrawerContent>
      <DrawerHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <DrawerTitle>{t("export.title")}</DrawerTitle>
            <DrawerDescription className="mt-0.5">
              {isAnimated
                ? t("export.animatedDescription", {
                    format: animatedDescriptionFormat,
                  })
                : t("export.staticDescription")}
            </DrawerDescription>
          </div>
          <DrawerClose asChild>
            <Button
              aria-label={t("common.close")}
              className="-mt-0.5 -mr-1 shrink-0 text-muted-foreground hover:text-foreground"
              size="icon-sm"
              title={t("common.close")}
              type="button"
              variant="ghost"
            >
              <XIcon className="size-4" />
            </Button>
          </DrawerClose>
        </div>
      </DrawerHeader>

      <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto p-3.5">
        {showSummaryCard ? (
          <section
            data-slot="export-summary-card"
            className="grid min-w-0 gap-2.5 rounded-lg border border-border/80 bg-[var(--surface-control)]/45 p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-sans text-xs font-semibold text-foreground">
                {t("export.summaryHeading")}
              </span>
              {paletteColors && paletteColors.length > 0 ? (
                <span
                  aria-hidden="true"
                  className="flex h-2 w-16 overflow-hidden rounded-[2px] border border-foreground/15"
                >
                  {paletteColors.slice(0, 16).map((hex, index) => (
                    <span
                      key={index}
                      className="h-full flex-1"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </span>
              ) : null}
            </div>

            <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
              {hasDimensions ? (
                <div className="min-w-0">
                  <dt className="font-sans text-[11px] text-muted-foreground">
                    {t("export.dimensions")}
                  </dt>
                  <dd className="mt-0.5 truncate font-mono font-medium text-foreground tabular-nums">
                    {outputWidth}×{outputHeight} {t("export.unitPx")}
                  </dd>
                </div>
              ) : null}

              {hasDimensions ? (
                <div className="min-w-0">
                  <dt className="font-sans text-[11px] text-muted-foreground">
                    {t("export.aspectRatio")}
                  </dt>
                  <dd className="mt-0.5 truncate font-mono font-medium text-foreground tabular-nums">
                    {formatAspectRatio(outputWidth, outputHeight)}
                  </dd>
                </div>
              ) : null}

              {algorithmLabel ? (
                <div className="min-w-0">
                  <dt className="font-sans text-[11px] text-muted-foreground">
                    {t("export.algorithm")}
                  </dt>
                  <dd className="mt-0.5 truncate font-sans font-medium text-foreground">
                    {algorithmLabel}
                  </dd>
                </div>
              ) : null}

              {paletteSummary ? (
                <div className="min-w-0">
                  <dt className="font-sans text-[11px] text-muted-foreground">
                    {t("export.palette")}
                  </dt>
                  <dd className="mt-0.5 truncate font-sans font-medium text-foreground">
                    {paletteSummary}
                  </dd>
                </div>
              ) : null}

              {isAnimated && frameCount != null && frameCount > 0 ? (
                <>
                  <div className="min-w-0">
                    <dt className="font-sans text-[11px] text-muted-foreground">
                      {t("export.frames")}
                    </dt>
                    <dd className="mt-0.5 truncate font-mono font-medium text-foreground tabular-nums">
                      {frameCount} · {animatedFps} {t("export.fps")}
                    </dd>
                  </div>
                  {totalDurationMs !== null ? (
                    <div className="min-w-0">
                      <dt className="font-sans text-[11px] text-muted-foreground">
                        {t("export.duration")}
                      </dt>
                      <dd className="mt-0.5 truncate font-mono font-medium text-foreground tabular-nums">
                        {formatDuration(
                          totalDurationMs,
                          t("export.unitMs"),
                          t("export.unitSec")
                        )}
                      </dd>
                    </div>
                  ) : null}
                </>
              ) : !isAnimated ? (
                <div className="col-span-2 flex items-center justify-between gap-2 border-t border-border/70 pt-2">
                  <dt className="font-sans text-[11px] text-muted-foreground">
                    {t("export.estimatedSize")}
                  </dt>
                  <dd
                    data-slot="export-estimated-size"
                    className="font-mono text-xs font-medium text-foreground tabular-nums"
                  >
                    {estimatedSizeState.bytes !== null
                      ? `~${formatByteSize(estimatedSizeState.bytes, t)}`
                      : estimatedSizeState.estimating
                        ? t("export.calculatingSize")
                        : t("export.sizeUnavailable")}
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>
        ) : null}

        <div className="grid min-w-0 gap-2">
          <span className="font-sans text-xs font-medium text-foreground">
            {t("export.format")}
          </span>
          {isAnimated ? (
            <ToggleGroup
              aria-label={t("export.animatedFormat")}
              className="w-full"
              data-slot="export-format-selector"
              type="single"
              value={animatedExportFormat}
              variant="outline"
              onValueChange={(value) => {
                if (value === "gif" || value === "apng" || value === "webm") {
                  onAnimatedExportFormatChange?.(value)
                }
              }}
            >
              <ToggleGroupItem className="flex-1 font-mono text-xs" value="gif">
                GIF
              </ToggleGroupItem>
              <ToggleGroupItem
                className="flex-1 font-mono text-xs"
                value="apng"
              >
                APNG
              </ToggleGroupItem>
              {webCodecsAvailable ? (
                <ToggleGroupItem
                  className="flex-1 font-mono text-xs"
                  value="webm"
                >
                  WebM
                </ToggleGroupItem>
              ) : null}
            </ToggleGroup>
          ) : (
            <ToggleGroup
              aria-label={t("export.formatLabel")}
              className="w-full"
              data-slot="export-format-selector"
              type="single"
              value={exportFormat}
              variant="outline"
              onValueChange={(value) => {
                if (value === "png" || value === "webp" || value === "jpeg") {
                  onExportFormatChange(value)
                }
              }}
            >
              {EXPORT_FORMAT_OPTIONS.map((option) => (
                <ToggleGroupItem
                  key={option.id}
                  className="flex-1 font-mono text-xs"
                  value={option.id}
                >
                  {option.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          )}
          <p className="text-xs leading-relaxed text-muted-foreground">
            {formatNote}
          </p>
          {isAnimated && !webCodecsAvailable ? (
            <p className="text-[11px] leading-snug text-muted-foreground/85">
              {t("export.webmUnavailable")}
            </p>
          ) : null}
        </div>

        {!isAnimated ? (
          selectedExportFormat.supportsQuality ? (
            <div className="grid min-w-0 gap-2 rounded-lg border border-border/75 bg-[var(--surface-control)]/35 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-sans text-xs font-medium text-foreground">
                  {t("export.quality")}
                </span>
                <span className="font-mono text-xs font-medium text-foreground tabular-nums">
                  {exportQualityPercent}%
                </span>
              </div>
              <Slider
                aria-label={t("export.quality")}
                className="min-w-0"
                disabled={false}
                max={MAX_EXPORT_QUALITY}
                min={MIN_EXPORT_QUALITY}
                step={EXPORT_QUALITY_STEP}
                value={[exportQuality]}
                onValueChange={(value) =>
                  onExportQualityChange(value[0] ?? exportQuality)
                }
              />
            </div>
          ) : (
            <div
              data-slot="export-lossless-badge"
              className="flex items-center justify-between gap-2 rounded-lg border border-border/75 bg-[var(--surface-control)]/35 px-3 py-2"
            >
              <span className="font-sans text-xs font-medium text-foreground">
                {t("export.quality")}
              </span>
              <span className="inline-flex items-center rounded-sm border border-primary/25 bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-medium text-primary tabular-nums">
                {t("export.losslessBadge")}
              </span>
            </div>
          )
        ) : null}

        {isAnimated &&
        animatedExportFormat === "webm" &&
        videoExportSettings &&
        onVideoExportSettingsChange ? (
          <div className="grid min-w-0 gap-2 rounded-lg border border-border/75 bg-[var(--surface-control)]/35 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-sans text-xs font-medium text-foreground">
                {t("export.crf")}
              </span>
              <span className="font-mono text-xs font-medium text-foreground tabular-nums">
                {videoExportSettings.crf} ·{" "}
                <span className="font-sans font-normal text-muted-foreground">
                  {videoExportSettings.crf <= 20
                    ? t("export.highQuality")
                    : videoExportSettings.crf <= 35
                      ? t("export.mediumQuality")
                      : t("export.lowQuality")}
                </span>
              </span>
            </div>
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
          </div>
        ) : null}

        {isAnimated &&
        animatedExportFormat !== "webm" &&
        motionExportSettings &&
        onMotionExportSettingsChange ? (
          <div className="grid gap-3 rounded-lg border border-border/75 bg-[var(--surface-control)]/35 p-3">
            <label
              className="grid min-w-0 gap-1.5 font-sans text-xs font-medium"
              htmlFor="frame-duration"
            >
              {t("export.frameDuration")}
              <Input
                className="min-w-0 font-mono text-xs tabular-nums"
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
              <span className="font-mono text-[11px] font-normal text-muted-foreground tabular-nums">
                {motionExportSettings.frameDurationMs}
                {t("export.unitMs")} ≈ {animatedFps} {t("export.fps")}
                {totalDurationMs !== null
                  ? ` · ${t("export.total")} ${formatDuration(
                      totalDurationMs,
                      t("export.unitMs"),
                      t("export.unitSec")
                    )}`
                  : ""}
              </span>
            </label>
            <label
              className="grid min-w-0 gap-1.5 font-sans text-xs font-medium"
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
                  className="w-full min-w-0"
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
              <span className="font-sans text-[11px] font-normal text-muted-foreground">
                {motionExportSettings.loopCount === 0
                  ? t("export.loopsForever")
                  : t("export.playsCount", {
                      count: motionExportSettings.loopCount,
                    })}
              </span>
            </label>
          </div>
        ) : null}
      </div>

      <DrawerFooter>
        {!isAnimated && onCopyImage ? (
          <Button
            className="w-full"
            disabled={status === "exporting"}
            title={t("export.copyImageHint")}
            type="button"
            variant="outline"
            onClick={onCopyImage}
          >
            <CopyIcon data-icon="inline-start" className="size-3.5" />
            {t("export.copyImage")}
          </Button>
        ) : null}
        <Button
          className="w-full font-semibold"
          disabled={status === "exporting"}
          type="button"
          onClick={onExport}
        >
          <DownloadIcon data-icon="inline-start" className="size-3.5" />
          {t("export.download", { label: selectedExportFormat.label })}
        </Button>
      </DrawerFooter>
    </DrawerContent>
  )
}

function formatDuration(ms: number, unitMs: string, unitSec: string): string {
  if (ms >= 1000) {
    const sec = (ms / 1000).toFixed(1)
    return `${sec}${unitSec}`
  }
  return `${ms}${unitMs}`
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
