import * as React from "react"
import {
  DITHER_ALGORITHM_OPTIONS,
  PRESET_PALETTES,
  type AutoTuneRecommendation,
} from "@workspace/core"
import { Spinner } from "@workspace/ui/components/spinner"
import { SparklesIcon } from "lucide-react"

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
  return (
    <div className="min-h-0 overflow-hidden">
      <div className="flex min-w-0 items-center justify-center gap-2 px-1 py-1.5 text-center">
        {isLoading ? (
          <Spinner className="size-3.5 shrink-0 text-primary" />
        ) : (
          <SparklesIcon className="size-3.5 shrink-0 text-primary" />
        )}
        <h2 className="truncate font-mono text-xs leading-none font-semibold tracking-normal text-foreground uppercase">
          Generated Auto-Tune Looks
        </h2>
      </div>
      <div className="space-y-2 pt-2">
        {!sourceAvailable && (
          <p className="rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
            Load a Source Image to generate looks.
          </p>
        )}

        {error && (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}

        {sourceAvailable && recommendations.length === 0 && !error && (
          <p className="rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
            {isLoading
              ? "Generating clean, mono, ink, color, and texture looks."
              : "Generated looks will appear after upload."}
          </p>
        )}

        {recommendations.length > 0 && (
          <div className="space-y-1.5">
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
  const settings = recommendation.snapshot.settings
  const algorithmLabel =
    DITHER_ALGORITHM_OPTIONS.find(
      (algorithm) => algorithm.id === settings.algorithm
    )?.label ?? settings.algorithm
  const paletteLabel = settings.customPalette?.length
    ? `Custom ${settings.customPalette.length}`
    : (PRESET_PALETTES.find((palette) => palette.id === settings.paletteId)
        ?.name ?? settings.paletteId)
  const tonalLabel =
    settings.preprocess.contrast > 16
      ? "High contrast"
      : settings.preprocess.contrast < 0
        ? "Soft contrast"
        : settings.preprocess.colorMode === "color-preserve"
          ? "Color"
          : "Mono"

  return (
    <div
      className="group rounded-sm border border-border bg-background/35 transition-[background-color,border-color,transform] duration-150 ease-out hover:border-primary/35 hover:bg-background/65 data-[applied=true]:border-primary/55 data-[applied=true]:bg-primary/10"
      data-applied={applied}
    >
      <button
        type="button"
        className="flex w-full flex-col gap-2 p-2 text-left active:translate-y-px"
        onClick={() => onApplyRecommendation(recommendation)}
      >
        <span className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-2">
          <span className="flex min-w-0 flex-col gap-2">
            <span className="block truncate text-sm leading-tight font-medium">
              {recommendation.label}
            </span>
            <span className="flex min-w-0 flex-wrap gap-1">
              {[
                algorithmLabel,
                paletteLabel,
                settings.preprocess.colorMode,
                tonalLabel,
              ].map((chip) => (
                <span
                  key={chip}
                  className="rounded-sm bg-muted px-1 py-0.5 font-mono text-[10px] leading-none text-muted-foreground"
                >
                  {chip}
                </span>
              ))}
            </span>
          </span>
          <span className="grid h-[2rem] w-[5.75rem] shrink-0 grid-rows-2 justify-items-end gap-1 overflow-hidden">
            {recommendation.recommended && (
              <span className="rounded-sm border border-primary/40 px-1 py-0.5 font-mono text-[8px] leading-none text-primary uppercase">
                Recommended
              </span>
            )}
            {!recommendation.recommended && applied && (
              <span className="rounded-sm border border-border px-1 py-0.5 font-mono text-[8px] leading-none text-muted-foreground uppercase">
                Applied
              </span>
            )}
            {!recommendation.recommended && !applied && (
              <span aria-hidden="true" className="invisible">
                Applied
              </span>
            )}

            {recommendation.recommended && applied && (
              <span className="rounded-sm border border-border px-1 py-0.5 font-mono text-[8px] leading-none text-muted-foreground uppercase">
                Applied
              </span>
            )}
            {(!recommendation.recommended || !applied) && (
              <span aria-hidden="true" className="invisible">
                Applied
              </span>
            )}
          </span>
        </span>
        <span className="block min-w-0 text-xs leading-snug text-muted-foreground">
          {recommendation.intent}
        </span>
      </button>
    </div>
  )
}
