import * as React from "react"
import {
  recommendAutoTuneLooks,
  type AutoTuneRecommendation,
  type EditorSettings,
  type PixelBuffer,
} from "@workspace/core"

import { DEMO_AUTO_TUNE_RECOMMENDATIONS } from "./demo-auto-tune"

type AutoTuneSource = {
  id: string
  buffer: PixelBuffer
} | null

export type AutoTuneRecommendationState = {
  recommendations: AutoTuneRecommendation[]
  isLoading: boolean
  error: string | null
  appliedRecommendationId: string | null
  runAutoTune: () => void
  markApplied: (recommendationId: string) => void
  clearAppliedMarker: () => void
}

export function useAutoTuneRecommendations({
  settings,
  source,
}: {
  settings: EditorSettings
  source: AutoTuneSource
}): AutoTuneRecommendationState {
  const [recommendations, setRecommendations] = React.useState<
    AutoTuneRecommendation[]
  >([])
  const [recommendationsSourceId, setRecommendationsSourceId] = React.useState<
    string | null
  >(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [errorSourceId, setErrorSourceId] = React.useState<string | null>(null)
  const [appliedRecommendationId, setAppliedRecommendationId] = React.useState<
    string | null
  >(null)
  const [appliedSourceId, setAppliedSourceId] = React.useState<string | null>(
    null
  )
  const sourceId = source?.id ?? null
  const visibleRecommendations =
    recommendationsSourceId === sourceId
      ? recommendations
      : sourceId === "demo"
        ? DEMO_AUTO_TUNE_RECOMMENDATIONS
        : []
  const visibleError = errorSourceId === sourceId ? error : null
  const visibleAppliedRecommendationId =
    appliedSourceId === sourceId ? appliedRecommendationId : null

  const runAutoTune = React.useCallback(() => {
    if (!source) {
      setError("Load a Source Image before running Auto-Tune")
      setErrorSourceId(null)
      setRecommendations([])
      setRecommendationsSourceId(null)
      setAppliedRecommendationId(null)
      setAppliedSourceId(null)
      return
    }

    setIsLoading(true)
    setError(null)
    setErrorSourceId(null)

    try {
      const nextRecommendations = recommendAutoTuneLooks(source.buffer, {
        settings,
        sourceDimensions: {
          width: source.buffer.width,
          height: source.buffer.height,
        },
        outputDimensions: {
          width: settings.resize.width,
          height: settings.resize.height,
        },
      })

      setRecommendations(nextRecommendations)
      setRecommendationsSourceId(source.id)
      setAppliedRecommendationId(null)
      setAppliedSourceId(null)
    } catch (autoTuneError) {
      setRecommendations([])
      setRecommendationsSourceId(null)
      setAppliedRecommendationId(null)
      setAppliedSourceId(null)
      setError(
        autoTuneError instanceof Error
          ? autoTuneError.message
          : "Auto-Tune failed"
      )
      setErrorSourceId(source.id)
    } finally {
      setIsLoading(false)
    }
  }, [settings, source])

  const markApplied = React.useCallback(
    (recommendationId: string) => {
      setAppliedRecommendationId(recommendationId)
      setAppliedSourceId(sourceId)
    },
    [sourceId]
  )

  const clearAppliedMarker = React.useCallback(() => {
    setAppliedRecommendationId(null)
    setAppliedSourceId(null)
  }, [])

  return {
    recommendations: visibleRecommendations,
    isLoading,
    error: visibleError,
    appliedRecommendationId: visibleAppliedRecommendationId,
    runAutoTune,
    markApplied,
    clearAppliedMarker,
  }
}
