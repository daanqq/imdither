import type {
  AlphaBackground,
  EditorSettings,
  ResizeMode,
} from "@workspace/core"
import { Button } from "@workspace/ui/components/button"
import { FieldLegend, FieldSet } from "@workspace/ui/components/field"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import { RotateCcwIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { NumberField } from "@/components/manual/param-controls"
import { ManualSectionCard } from "@/components/manual/section-card"
import type { SettingsTransition } from "@/lib/editor-settings-transition"

export function OutputSection({
  defaultOpen = false,
  resolutionAspectLabel,
  settings,
  sourceWidth,
  onResolutionWidthChange,
  onSettingsTransition,
}: {
  defaultOpen?: boolean
  resolutionAspectLabel: string
  settings: EditorSettings
  sourceWidth?: number
  onResolutionWidthChange: (width: number) => void
  onSettingsTransition: (transition: SettingsTransition) => void
}) {
  const { t } = useTranslation()
  const halfSourceWidth = sourceWidth
    ? Math.max(1, Math.round(sourceWidth * 0.5))
    : null

  return (
    <ManualSectionCard
      defaultOpen={defaultOpen}
      sectionId="output"
      summary={
        <span data-slot="output-dimensions-summary">
          {settings.resize.width}×{settings.resize.height}
        </span>
      }
      title={t("manual.output")}
    >
      <div className="grid min-w-0 gap-3">
        <NumberField
          label={t("manual.width")}
          value={settings.resize.width}
          description={t("manual.heightInferred", {
            height: settings.resize.height,
            aspect: resolutionAspectLabel,
          })}
          action={
            sourceWidth && halfSourceWidth ? (
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  aria-label={t("manual.scalePreset", { scale: "0.5x" })}
                  aria-pressed={settings.resize.width === halfSourceWidth}
                  title={t("manual.scalePreset", { scale: "0.5x" })}
                  type="button"
                  variant={
                    settings.resize.width === halfSourceWidth
                      ? "secondary"
                      : "outline"
                  }
                  className="h-8 px-2 font-mono text-xs tabular-nums"
                  disabled={settings.resize.width === halfSourceWidth}
                  onClick={() => onResolutionWidthChange(halfSourceWidth)}
                >
                  0.5x
                </Button>
                <Button
                  aria-label={t("manual.resetWidth")}
                  aria-pressed={settings.resize.width === sourceWidth}
                  title={t("manual.resetWidth")}
                  type="button"
                  variant={
                    settings.resize.width === sourceWidth
                      ? "secondary"
                      : "outline"
                  }
                  className="h-8 px-2 font-mono text-xs tabular-nums"
                  disabled={settings.resize.width === sourceWidth}
                  onClick={() => onResolutionWidthChange(sourceWidth)}
                >
                  <RotateCcwIcon data-icon="inline-start" className="size-3" />
                  1x
                </Button>
              </div>
            ) : null
          }
          onChange={onResolutionWidthChange}
        />

        <FieldSet className="gap-1">
          <FieldLegend variant="label" className="mb-0">
            {t("manual.resizeKernel")}
          </FieldLegend>
          <ToggleGroup
            type="single"
            value={settings.resize.mode}
            variant="outline"
            className="w-full"
            onValueChange={(value) => {
              if (value) {
                onSettingsTransition({
                  type: "set-resize-mode",
                  mode: value as ResizeMode,
                })
              }
            }}
          >
            <ToggleGroupItem value="bilinear" className="flex-1">
              {t("manual.resizeBilinear")}
            </ToggleGroupItem>
            <ToggleGroupItem value="nearest" className="flex-1">
              {t("manual.resizeNearest")}
            </ToggleGroupItem>
          </ToggleGroup>
        </FieldSet>

        <FieldSet className="gap-1">
          <FieldLegend variant="label" className="mb-0">
            {t("manual.alphaFlatten")}
          </FieldLegend>
          <ToggleGroup
            type="single"
            value={settings.alphaBackground}
            variant="outline"
            className="w-full"
            onValueChange={(value) => {
              if (value) {
                onSettingsTransition({
                  type: "set-alpha-background",
                  alphaBackground: value as AlphaBackground,
                })
              }
            }}
          >
            <ToggleGroupItem value="white" className="flex-1">
              {t("manual.white")}
            </ToggleGroupItem>
            <ToggleGroupItem value="black" className="flex-1">
              {t("manual.black")}
            </ToggleGroupItem>
          </ToggleGroup>
        </FieldSet>
      </div>
    </ManualSectionCard>
  )
}
