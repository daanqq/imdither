import * as React from "react"
import { type AutoTuneRecommendation } from "@workspace/core"
import { Spinner } from "@workspace/ui/components/spinner"
import { cn } from "@workspace/ui/lib/utils"
import { CheckIcon, SparklesIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import {
  getLocalizedAlgorithmLabel,
  getLocalizedAutoTuneIntent,
  getLocalizedAutoTuneLabel,
} from "@/lib/i18n-labels"
import {
  resolvePaletteChipLabel,
  resolvePaletteColors,
} from "@/lib/palette-preview"

type AutoTunePanelProps = {
  appliedRecommendationId: string | null
  error: string | null
  isLoading: boolean
  recommendations: AutoTuneRecommendation[]
  sourceAvailable: boolean
  onApplyRecommendation: (recommendation: AutoTuneRecommendation) => void
}

export const AutoTunePanel = React.memo(function AutoTunePanel({
  appliedRecommendationId,
  error,
  isLoading,
  recommendations,
  sourceAvailable,
  onApplyRecommendation,
}: AutoTunePanelProps) {
  const { t } = useTranslation()

  return (
    <div className="min-h-0 overflow-hidden">
      <div className="flex min-w-0 items-center gap-1.5 px-0.5 py-1">
        {isLoading ? (
          <Spinner
            aria-label={t("common.loading")}
            className="size-3.5 shrink-0 text-primary"
          />
        ) : (
          <SparklesIcon className="size-3.5 shrink-0 text-primary" />
        )}
        <h2 className="truncate font-sans text-xs leading-none font-semibold text-foreground">
          {t("autoTune.heading")}
        </h2>
      </div>
      <div className="space-y-2 pt-2">
        {!sourceAvailable && (
          <p className="rounded-md border border-dashed border-border bg-[var(--surface-control)]/45 px-3 py-2 text-xs text-muted-foreground">
            {t("autoTune.noSource")}
          </p>
        )}

        {error && (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}

        {sourceAvailable && recommendations.length === 0 && !error && (
          <p className="rounded-md border border-dashed border-border bg-[var(--surface-control)]/45 px-3 py-2 text-xs text-muted-foreground">
            {isLoading
              ? t("autoTune.generating")
              : t("autoTune.noRecommendations")}
          </p>
        )}

        {recommendations.length > 0 && (
          <div className="space-y-2">
            {recommendations.map((recommendation) => (
              <RecommendationButton
                key={recommendation.id}
                applied={appliedRecommendationId === recommendation.id}
                recommendation={recommendation}
                onApplyRecommendation={onApplyRecommendation}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
})

function RecommendationButton({
  applied,
  recommendation,
  onApplyRecommendation,
}: {
  applied: boolean
  recommendation: AutoTuneRecommendation
  onApplyRecommendation: (recommendation: AutoTuneRecommendation) => void
}) {
  const { t } = useTranslation()
  const settings = recommendation.snapshot.settings
  const swatches = resolvePaletteColors(
    settings.paletteId,
    settings.customPalette
  )
  const algorithmLabel = getLocalizedAlgorithmLabel(settings.algorithm, t)
  const recommendationLabel = getLocalizedAutoTuneLabel(recommendation, t)
  const recommendationIntent = getLocalizedAutoTuneIntent(recommendation, t)
  const paletteLabel = resolvePaletteChipLabel(
    settings.paletteId,
    settings.customPalette,
    t("manual.custom")
  )
  const tonalLabel =
    settings.preprocess.contrast > 16
      ? t("autoTune.tonalHighContrast")
      : settings.preprocess.contrast < 0
        ? t("autoTune.tonalSoftContrast")
        : settings.preprocess.colorMode === "color-preserve"
          ? t("autoTune.tonalColor")
          : t("autoTune.tonalMono")
  const chips = Array.from(
    new Set([algorithmLabel, paletteLabel, tonalLabel].filter(Boolean))
  )

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-md border border-border bg-[var(--surface-control)]/55 transition-[background-color,border-color,box-shadow] duration-150 ease-out hover:border-foreground/25 hover:bg-[var(--surface-control-active)]/80",
        applied &&
          "border-primary/65 bg-[var(--surface-control-active)] shadow-[var(--shadow-control)] ring-1 ring-primary/20"
      )}
      data-applied={applied}
      data-slot="auto-tune-card"
    >
      {applied ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-0.5 bg-primary"
        />
      ) : null}
      <button
        type="button"
        aria-pressed={applied}
        className="flex w-full flex-col gap-2 p-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/40 active:translate-y-px"
        onClick={() => onApplyRecommendation(recommendation)}
      >
        <span
          aria-hidden="true"
          data-slot="palette-swatch-bar"
          className="flex h-2 w-full overflow-hidden rounded-[3px] border border-border/50"
        >
          {swatches.map((hex, index) => (
            <span
              key={`${recommendation.id}-${hex}-${index}`}
              className="h-full flex-1"
              style={{ backgroundColor: hex }}
            />
          ))}
        </span>

        <span className="flex w-full min-w-0 flex-col gap-1">
          <span className="flex min-h-5 w-full min-w-0 items-center justify-between gap-2">
            <span className="min-w-0 truncate font-sans text-sm leading-5 font-medium text-foreground">
              {recommendationLabel}
            </span>
            {applied ? (
              <span className="inline-flex h-5 shrink-0 items-center gap-1 rounded-sm bg-foreground px-1.5 font-sans text-[10px] leading-none font-medium whitespace-nowrap text-background">
                <CheckIcon aria-hidden="true" className="size-2.5" />
                {t("autoTune.applied")}
              </span>
            ) : null}
          </span>
          {recommendation.recommended ? (
            <span className="flex items-center">
              <span className="inline-flex items-center rounded-sm border border-primary/35 bg-primary/12 px-1.5 py-0.5 font-sans text-[10px] leading-none font-medium whitespace-nowrap text-primary">
                {t("autoTune.recommended")}
              </span>
            </span>
          ) : null}
        </span>

        <span className="flex min-w-0 flex-wrap gap-1">
          {chips.map((chip) => (
            <span
              key={chip}
              className="rounded-sm border border-border/70 bg-background/85 px-1.5 py-0.5 font-mono text-[10px] leading-tight text-foreground/85"
            >
              {chip}
            </span>
          ))}
        </span>

        <span className="block min-w-0 font-sans text-xs leading-snug text-muted-foreground">
          {recommendationIntent}
        </span>
      </button>
    </div>
  )
}
