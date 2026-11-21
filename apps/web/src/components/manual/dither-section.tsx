import {
  ALGORITHMS_BY_FAMILY,
  DEFAULT_SETTINGS,
  DITHER_ALGORITHM_OPTIONS,
  getDitherAlgorithmOption,
  type BayerSize,
  type DitherAlgorithm,
  type EditorSettings,
  type HalftoneDotShape,
  type HalftonePatternSize,
} from "@workspace/core"
import { Button } from "@workspace/ui/components/button"
import {
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@workspace/ui/components/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import { ShuffleIcon } from "lucide-react"
import * as React from "react"
import { useTranslation } from "react-i18next"

import { CommittedSliderField } from "@/components/committed-slider-field"
import { ParamSelect } from "@/components/manual/param-controls"
import { ManualSectionCard } from "@/components/manual/section-card"
import type { SettingsTransition } from "@/lib/editor-settings-transition"
import {
  getLocalizedAlgorithmFamily,
  getLocalizedAlgorithmLabel,
} from "@/lib/i18n-labels"
import { getRandomDifferentValue } from "@/lib/random-options"

export function DitherSection({
  isAnimated = false,
  settings,
  onSettingsTransition,
}: {
  isAnimated?: boolean
  settings: EditorSettings
  onSettingsTransition: (transition: SettingsTransition) => void
}) {
  const { t } = useTranslation()
  const algorithmId = React.useId()
  const selectedAlgorithm = getDitherAlgorithmOption(settings.algorithm)

  return (
    <ManualSectionCard
      defaultOpen
      sectionId="dither"
      summary={getLocalizedAlgorithmLabel(settings.algorithm, t)}
      title={t("manual.dither")}
    >
      <div className="grid min-w-0 gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <FieldLabel htmlFor={algorithmId}>{t("manual.algorithm")}</FieldLabel>
          <div className="flex w-full min-w-0 items-center gap-1.5">
            <Select
              value={settings.algorithm}
              onValueChange={(algorithm) =>
                onSettingsTransition({
                  type: "set-algorithm",
                  algorithm: algorithm as DitherAlgorithm,
                })
              }
            >
              <SelectTrigger
                id={algorithmId}
                className="h-8 w-full min-w-0 flex-1 justify-between font-sans text-xs"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from(ALGORITHMS_BY_FAMILY).map(
                  ([family, algorithms]) => (
                    <SelectGroup key={family}>
                      <SelectLabel>
                        {getLocalizedAlgorithmFamily(family, t)}
                      </SelectLabel>
                      {algorithms.map((algorithm) => (
                        <SelectItem key={algorithm.id} value={algorithm.id}>
                          {getLocalizedAlgorithmLabel(algorithm.id, t)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )
                )}
              </SelectContent>
            </Select>
            <Button
              aria-label={t("manual.randomAlgorithm")}
              title={t("manual.randomAlgorithm")}
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0"
              onClick={() =>
                onSettingsTransition({
                  type: "set-algorithm",
                  algorithm: getRandomDifferentValue(
                    DITHER_ALGORITHM_OPTIONS.map((algorithm) => algorithm.id),
                    settings.algorithm
                  ),
                })
              }
            >
              <ShuffleIcon className="size-3.5" />
            </Button>
          </div>
        </div>

        {selectedAlgorithm.capabilities.bayerSize ? (
          <FieldSet className="gap-1">
            <FieldLegend variant="label" className="mb-0">
              {t("manual.bayerMatrix")}
            </FieldLegend>
            <ToggleGroup
              type="single"
              value={String(settings.bayerSize)}
              variant="outline"
              className="w-full"
              onValueChange={(value) => {
                if (value) {
                  onSettingsTransition({
                    type: "set-bayer-size",
                    bayerSize: Number(value) as BayerSize,
                  })
                }
              }}
            >
              {[2, 4, 8].map((size) => (
                <ToggleGroupItem
                  key={size}
                  value={String(size)}
                  aria-label={t("manual.patternSizeItem", { n: size })}
                  className="flex-1 font-mono text-xs tabular-nums"
                >
                  {size}x{size}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </FieldSet>
        ) : null}

        {selectedAlgorithm.family === "Halftone" ? (
          <div
            data-slot="halftone-controls"
            className="grid min-w-0 gap-2.5 rounded-md border border-border/70 bg-[var(--surface-inspector)]/75 p-2.5"
          >
            <span className="font-sans text-xs font-semibold text-foreground">
              {t("manual.halftoneScreen")}
            </span>
            <ParamSelect
              label={t("manual.dotShape")}
              value={settings.halftoneScreen.dotShape}
              options={[
                { id: "round", label: t("manual.round") },
                { id: "square", label: t("manual.square") },
                { id: "line", label: t("manual.line") },
              ]}
              onValueChange={(dotShape) =>
                onSettingsTransition({
                  type: "set-halftone-screen",
                  dotShape: dotShape as HalftoneDotShape,
                })
              }
            />
            <CommittedSliderField
              defaultValue={DEFAULT_SETTINGS.halftoneScreen.angle}
              label={t("manual.angle")}
              max={360}
              min={0}
              step={1}
              unit="°"
              value={settings.halftoneScreen.angle}
              onCommit={(angle) =>
                onSettingsTransition({
                  type: "set-halftone-screen",
                  angle,
                })
              }
            />
            <CommittedSliderField
              defaultValue={DEFAULT_SETTINGS.halftoneScreen.frequency}
              label={t("manual.frequency")}
              max={100}
              min={1}
              step={1}
              unit="lpi"
              value={settings.halftoneScreen.frequency}
              onCommit={(frequency) =>
                onSettingsTransition({
                  type: "set-halftone-screen",
                  frequency,
                })
              }
            />
            <FieldSet className="gap-1">
              <FieldLegend variant="label" className="mb-0">
                {t("manual.patternSize")}
              </FieldLegend>
              <ToggleGroup
                type="single"
                value={String(settings.halftoneScreen.patternSize)}
                variant="outline"
                className="w-full"
                onValueChange={(value) => {
                  if (value) {
                    onSettingsTransition({
                      type: "set-halftone-screen",
                      patternSize: Number(value) as HalftonePatternSize,
                    })
                  }
                }}
              >
                {[4, 6, 8].map((size) => (
                  <ToggleGroupItem
                    key={size}
                    value={String(size)}
                    aria-label={t("manual.patternSizeItem", { n: size })}
                    className="flex-1 font-mono text-xs tabular-nums"
                  >
                    {size}x{size}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </FieldSet>
          </div>
        ) : null}

        {isAnimated ? (
          <div data-slot="temporal-stability-control" className="grid gap-1">
            <ParamSelect
              label={t("manual.temporalStability")}
              value={settings.temporalStability}
              options={[
                { id: "none", label: t("manual.temporalNone") },
                {
                  id: "global-palette",
                  label: t("manual.temporalGlobalPalette"),
                },
              ]}
              onValueChange={(value) =>
                onSettingsTransition({
                  type: "set-temporal-stability",
                  temporalStability: value as "none" | "global-palette",
                })
              }
            />
            <FieldDescription>
              {settings.temporalStability === "none"
                ? t("manual.temporalNoneDesc")
                : t("manual.temporalGlobalPaletteDesc")}
            </FieldDescription>
          </div>
        ) : null}
      </div>
    </ManualSectionCard>
  )
}
