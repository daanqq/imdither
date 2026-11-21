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
import {
  ChevronDownIcon,
  CrosshairIcon,
  MaximizeIcon,
  MinusIcon,
  PlusIcon,
  ScanSearchIcon,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { getSteppedZoom } from "@/lib/editor-shortcuts"
import {
  clampZoom,
  MIN_PREVIEW_ZOOM,
  type PreviewViewport,
} from "@/lib/preview-viewport"
import type { CompareMode } from "@/store/editor-store"

const HUD_CAPSULE_CLASS =
  "pointer-events-auto rounded-lg border border-border bg-[var(--surface-hud)] p-0.5 shadow-[var(--shadow-hud)] backdrop-blur-md"

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
  const { t } = useTranslation()
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
  const zoomPercent = Math.round(viewport.zoom * 100)

  return (
    <div className="pointer-events-none absolute inset-x-2 top-2 z-30 flex items-start justify-between gap-2">
      <ToggleGroup
        type="single"
        aria-label={t("compare.modeGroup")}
        title={t("compare.cycleHint")}
        value={compareMode}
        className={cn(HUD_CAPSULE_CLASS, "gap-0.5")}
        onValueChange={(next) => {
          if (next === "slide" || next === "processed" || next === "original") {
            onCompareModeChange(next)
          }
        }}
      >
        <ToggleGroupItem
          aria-label={t("compare.split")}
          className="h-7 px-2 text-[11px] whitespace-nowrap sm:px-2.5 sm:text-xs"
          size="sm"
          value="slide"
        >
          {t("compare.split")}
        </ToggleGroupItem>
        <ToggleGroupItem
          aria-label={t("compare.result")}
          className="h-7 px-2 text-[11px] whitespace-nowrap sm:px-2.5 sm:text-xs"
          size="sm"
          value="processed"
        >
          {t("compare.result")}
        </ToggleGroupItem>
        <ToggleGroupItem
          aria-label={t("compare.original")}
          className="h-7 px-2 text-[11px] whitespace-nowrap sm:px-2.5 sm:text-xs"
          size="sm"
          title={t("compare.holdSpaceHint")}
          value="original"
        >
          {t("compare.original")}
        </ToggleGroupItem>
      </ToggleGroup>

      <div className={cn(HUD_CAPSULE_CLASS, "flex items-center gap-0.5")}>
        {pixelInspectorEnabled ? (
          <Button
            type="button"
            aria-label={t("viewport.toggleInspector")}
            aria-pressed={viewport.loupeEnabled}
            title={t("viewport.inspector")}
            size="icon-sm"
            variant="ghost"
            className={cn(
              "size-7 rounded-[calc(var(--radius)-2px)] border border-transparent text-muted-foreground hover:bg-background/60 hover:text-foreground",
              viewport.loupeEnabled &&
                "border-transparent bg-[var(--surface-control-active)] text-primary shadow-[var(--shadow-control)] hover:bg-[var(--surface-control-active)] hover:text-primary dark:border-white/8"
            )}
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
            <CrosshairIcon className="size-3.5" />
          </Button>
        ) : null}

        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              aria-label={t("viewport.openControls")}
              title={t("viewport.zoomShortcutHint")}
              className="h-7 gap-1 rounded-[calc(var(--radius)-2px)] border-0 bg-transparent px-1.5 font-mono text-[11px] font-medium whitespace-nowrap text-foreground tabular-nums hover:bg-background/60 sm:px-2 sm:text-xs"
              size="sm"
              variant="ghost"
            >
              <span>
                {viewport.mode === "fit"
                  ? t("viewport.fit")
                  : `${zoomPercent}%`}
              </span>
              <ChevronDownIcon className="size-3.5 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-64 border-border bg-popover/95 p-3 shadow-[var(--shadow-popover)] backdrop-blur-md"
          >
            <PreviewViewControls
              centeredViewport={centeredViewport}
              viewport={viewport}
              onViewportChange={onViewportChange}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}

function PreviewViewControls({
  centeredViewport,
  viewport,
  onViewportChange,
}: {
  centeredViewport: {
    center: { x: number; y: number }
    mode: "manual"
    zoom: number
  }
  viewport: PreviewViewport
  onViewportChange: (viewport: Partial<PreviewViewport>) => void
}) {
  const { t } = useTranslation()
  const effectiveZoom = viewport.mode === "fit" ? 1 : viewport.zoom
  const zoomPercent = Math.round(effectiveZoom * 100)

  function handleStepZoom(direction: "in" | "out") {
    onViewportChange({
      ...(viewport.mode === "fit" ? { center: centeredViewport.center } : null),
      mode: "manual",
      zoom: getSteppedZoom(effectiveZoom, direction),
    })
  }

  return (
    <div className="grid w-full min-w-0 gap-3">
      <ToggleGroup
        type="single"
        value={viewport.mode}
        variant="outline"
        className="grid h-9 w-full max-w-full grid-cols-2"
      >
        <ToggleGroupItem
          aria-label={t("viewport.fitPreview")}
          value="fit"
          className="h-full min-w-0 px-2"
          onClick={() =>
            onViewportChange({
              center: centeredViewport.center,
              mode: "fit",
              zoom: 1,
            })
          }
        >
          <MaximizeIcon data-icon="inline-start" />
          <span className="md:hidden">{t("viewport.fit")}</span>
          <span className="hidden md:inline">{t("viewport.screenFit")}</span>
        </ToggleGroupItem>
        <ToggleGroupItem
          aria-label={t("viewport.inspectPixels")}
          value="manual"
          className="h-full min-w-0 px-2"
          onClick={() => onViewportChange(centeredViewport)}
        >
          <ScanSearchIcon data-icon="inline-start" />
          <span className="md:hidden">100%</span>
          <span className="hidden md:inline">{t("viewport.realPixels")}</span>
        </ToggleGroupItem>
      </ToggleGroup>

      <div className="grid min-w-0 gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-sans text-xs font-medium text-muted-foreground">
            {t("viewport.zoom")}
          </span>
          <span className="font-mono text-xs font-medium text-foreground tabular-nums">
            {viewport.mode === "fit" ? t("viewport.fit") : `${zoomPercent}%`}
          </span>
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <Button
            type="button"
            aria-label={t("viewport.zoomOut")}
            className="size-7 shrink-0"
            size="icon-sm"
            variant="outline"
            onClick={() => handleStepZoom("out")}
          >
            <MinusIcon className="size-3.5" />
          </Button>
          <Slider
            aria-label={t("viewport.previewZoom")}
            className="min-w-0 flex-1"
            min={MIN_PREVIEW_ZOOM}
            max={16}
            step={0.25}
            value={[effectiveZoom]}
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
          <Button
            type="button"
            aria-label={t("viewport.zoomIn")}
            className="size-7 shrink-0"
            size="icon-sm"
            variant="outline"
            onClick={() => handleStepZoom("in")}
          >
            <PlusIcon className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
