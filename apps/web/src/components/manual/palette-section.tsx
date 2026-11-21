import {
  PRESET_PALETTES,
  type EditorSettings,
  type MatchingMode,
} from "@workspace/core"
import { Button } from "@workspace/ui/components/button"
import { FieldLabel } from "@workspace/ui/components/field"
import { ShuffleIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { PaletteEditorDrawer } from "@/components/manual/palette-editor-drawer"
import {
  ColorDepthControl,
  PaletteColorInput,
  ParamSelect,
} from "@/components/manual/param-controls"
import { ManualSectionCard } from "@/components/manual/section-card"
import type { SettingsTransition } from "@/lib/editor-settings-transition"
import { getNextPaletteColor } from "@/lib/palette-add-color"
import { getRandomDifferentValue } from "@/lib/random-options"

const MAX_INLINE_SWATCHES = 16

export function PaletteSection({
  activePaletteColors,
  paletteSelectValue,
  settings,
  onCopyPaletteJson,
  onExportPaletteGpl,
  onExportPaletteJson,
  onExtractPalette,
  onImportPaletteFile,
  onImportPaletteFromClipboard,
  onSettingsTransition,
}: {
  activePaletteColors: string[]
  paletteSelectValue: string
  settings: EditorSettings
  onCopyPaletteJson?: () => void
  onExportPaletteGpl?: () => void
  onExportPaletteJson?: () => void
  onExtractPalette?: (size: 2 | 4 | 8 | 16 | 32) => void
  onImportPaletteFile?: (file: File) => void
  onImportPaletteFromClipboard?: () => void
  onSettingsTransition: (transition: SettingsTransition) => void
}) {
  const { t } = useTranslation()
  const visibleSwatches = activePaletteColors.slice(0, MAX_INLINE_SWATCHES)
  const overflowCount = Math.max(
    0,
    activePaletteColors.length - MAX_INLINE_SWATCHES
  )

  return (
    <ManualSectionCard
      defaultOpen
      sectionId="palette"
      summary={t("header.colorsCount", { count: activePaletteColors.length })}
      title={t("manual.palette")}
    >
      <div className="grid min-w-0 gap-3">
        <ParamSelect
          label={t("manual.palette")}
          value={paletteSelectValue}
          options={[
            { id: "custom", label: t("manual.custom") },
            ...PRESET_PALETTES.map((palette) => ({
              id: palette.id,
              label: palette.name,
            })),
          ]}
          action={
            <Button
              aria-label={t("manual.randomPalette")}
              title={t("manual.randomPalette")}
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0"
              onClick={() =>
                onSettingsTransition({
                  type: "set-palette",
                  paletteId: getRandomDifferentValue(
                    PRESET_PALETTES.map((preset) => preset.id),
                    settings.paletteId
                  ),
                })
              }
            >
              <ShuffleIcon className="size-3.5" />
            </Button>
          }
          onValueChange={(paletteId) => {
            if (paletteId === "custom") {
              onSettingsTransition({
                type: "set-custom-palette",
                colors: activePaletteColors,
              })
            } else {
              onSettingsTransition({ type: "set-palette", paletteId })
            }
          }}
        />

        <ColorDepthControl
          value={settings.colorDepth}
          onChange={(colorDepth) =>
            onSettingsTransition({ type: "set-color-depth", colorDepth })
          }
        />

        <ParamSelect
          label={t("manual.matching")}
          value={settings.matchingMode}
          options={[
            { id: "rgb", label: t("manual.rgb") },
            { id: "perceptual", label: t("manual.perceptual") },
          ]}
          onValueChange={(matchingMode) =>
            onSettingsTransition({
              type: "set-matching-mode",
              matchingMode: matchingMode as MatchingMode,
            })
          }
        />

        <div className="grid gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <FieldLabel>{t("manual.paletteSwatches")}</FieldLabel>
            {overflowCount > 0 ? (
              <span
                data-slot="palette-swatch-overflow"
                title={t("manual.moreSwatches", { count: overflowCount })}
                className="inline-flex items-center rounded-sm border border-border bg-[var(--surface-control-active)] px-1.5 py-0.5 font-mono text-[10px] leading-none font-medium text-muted-foreground tabular-nums"
              >
                +{overflowCount}
              </span>
            ) : null}
          </div>
          <div
            data-slot="palette-swatch-strip"
            className="grid grid-cols-8 gap-1"
          >
            {visibleSwatches.map((color, index) => (
              <span
                key={index}
                data-slot="palette-swatch-item"
                className="relative h-5 min-w-0 overflow-hidden rounded-[4px]"
                style={{ backgroundColor: color }}
              >
                <PaletteColorInput
                  aria-label={t("manual.pickSwatchColor", { n: index + 1 })}
                  className="palette-color-input absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  color={color}
                  onCommit={(nextColor) =>
                    onSettingsTransition({
                      type: "set-custom-palette",
                      colors: activePaletteColors.map(
                        (currentColor, colorIndex) =>
                          colorIndex === index ? nextColor : currentColor
                      ),
                    })
                  }
                />
              </span>
            ))}
          </div>
          <PaletteEditorDrawer
            colors={activePaletteColors}
            onAddColor={() =>
              onSettingsTransition({
                type: "set-custom-palette",
                colors: [
                  getNextPaletteColor(activePaletteColors),
                  ...activePaletteColors,
                ],
              })
            }
            onColorChange={(index, color) =>
              onSettingsTransition({
                type: "set-custom-palette",
                colors: activePaletteColors.map((currentColor, colorIndex) =>
                  colorIndex === index ? color : currentColor
                ),
              })
            }
            onDeleteColor={(index) =>
              onSettingsTransition({
                type: "set-custom-palette",
                colors: activePaletteColors.filter(
                  (_color, colorIndex) => colorIndex !== index
                ),
              })
            }
            onCopyPaletteJson={onCopyPaletteJson}
            onExportPaletteGpl={onExportPaletteGpl}
            onExportPaletteJson={onExportPaletteJson}
            onExtractPalette={onExtractPalette}
            onImportPaletteFile={onImportPaletteFile}
            onImportPaletteFromClipboard={onImportPaletteFromClipboard}
          />
        </div>
      </div>
    </ManualSectionCard>
  )
}
