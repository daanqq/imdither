import * as React from "react"
import {
  recommendAutoTuneLooks,
  type AutoTuneRecommendation,
  type EditorSettings,
  type PixelBuffer,
} from "@workspace/core"

import { applyAutoTuneLookSettings } from "./auto-tune-application"

type AutoTuneSource = {
  id: string
  buffer: PixelBuffer
} | null

export type AutoTuneRecommendationState = {
  recommendations: AutoTuneRecommendation[]
  isLoading: boolean
  error: string | null
  appliedRecommendationId: string | null
  markApplied: (recommendationId: string) => void
  clearAppliedMarker: () => void
}

export function useAutoTuneRecommendations({
  enabled = true,
  settings,
  source,
}: {
  enabled?: boolean
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
  const generationIdRef = React.useRef(0)
  const settingsRef = React.useRef(settings)
  const sourceId = source?.id ?? null
  const visibleRecommendations =
    recommendationsSourceId === sourceId ? recommendations : []
  const visibleError = errorSourceId === sourceId ? error : null
  const derivedAppliedRecommendationId = findAppliedRecommendationId({
    recommendations: visibleRecommendations,
    settings,
  })
  const explicitAppliedRecommendationId =
    appliedSourceId === sourceId &&
    appliedRecommendationId === derivedAppliedRecommendationId
      ? appliedRecommendationId
      : null
  const visibleAppliedRecommendationId =
    explicitAppliedRecommendationId ?? derivedAppliedRecommendationId

  React.useEffect(() => {
    settingsRef.current = settings
  }, [settings])

  React.useEffect(() => {
    const generationId = generationIdRef.current + 1
    generationIdRef.current = generationId

    if (!isAutoTuneGenerationReady({ enabled, source, sourceId }) || !source) {
      queueMicrotask(() => {
        if (generationIdRef.current !== generationId) {
          return
        }

        setError(null)
        setErrorSourceId(null)
        setRecommendations([])
        setRecommendationsSourceId(null)
        setAppliedRecommendationId(null)
        setAppliedSourceId(null)
        setIsLoading(false)
      })
      return undefined
    }

    const currentSource = source

    async function generateAutoTune() {
      try {
        setIsLoading(true)
        setError(null)
        setErrorSourceId(null)
        await waitForLoadingPaint()
        const currentSettings = settingsRef.current

        const nextRecommendations = recommendAutoTuneLooks(
          currentSource.buffer,
          {
            settings: currentSettings,
            sourceDimensions: {
              width: currentSource.buffer.width,
              height: currentSource.buffer.height,
            },
            outputDimensions: {
              width: currentSettings.resize.width,
              height: currentSettings.resize.height,
            },
          }
        )

        if (generationIdRef.current !== generationId) {
          return
        }

        setRecommendations(nextRecommendations)
        setRecommendationsSourceId(currentSource.id)
        setAppliedRecommendationId(null)
        setAppliedSourceId(null)
      } catch (autoTuneError) {
        if (generationIdRef.current !== generationId) {
          return
        }

        setRecommendations([])
        setRecommendationsSourceId(null)
        setAppliedRecommendationId(null)
        setAppliedSourceId(null)
        setError(
          autoTuneError instanceof Error
            ? autoTuneError.message
            : "Auto-Tune failed"
        )
        setErrorSourceId(currentSource.id)
      } finally {
        if (generationIdRef.current === generationId) {
          setIsLoading(false)
        }
      }
    }

    void generateAutoTune()

    return undefined
  }, [enabled, source, sourceId])

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
    markApplied,
    clearAppliedMarker,
  }
}

function waitForLoadingPaint() {
  return new Promise<void>((resolve) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => resolve())
      return
    }

    setTimeout(resolve, 0)
  })
}

export function isAutoTuneGenerationReady({
  enabled,
  source,
  sourceId,
}: {
  enabled: boolean
  source: AutoTuneSource
  sourceId: string | null
}): boolean {
  return enabled && Boolean(sourceId) && Boolean(source)
}

function findAppliedRecommendationId({
  recommendations,
  settings,
}: {
  recommendations: AutoTuneRecommendation[]
  settings: EditorSettings
}): string | null {
  const matchingRecommendation = recommendations.find((recommendation) =>
    areSettingsEqual(
      settings,
      applyAutoTuneLookSettings({
        current: settings,
        recommended: recommendation.snapshot.settings,
      })
    )
  )

  return matchingRecommendation?.id ?? null
}

function areSettingsEqual(a: EditorSettings, b: EditorSettings) {
  return JSON.stringify(a) === JSON.stringify(b)
}
