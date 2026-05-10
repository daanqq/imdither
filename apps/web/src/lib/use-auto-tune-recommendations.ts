import * as React from "react"
import {
  type AutoTuneRecommendation,
  type EditorSettings,
  type PixelBuffer,
} from "@workspace/core"

import { applyAutoTuneLookSettings } from "./auto-tune-application"
import { runAutoTuneJob } from "./auto-tune-worker-client"

type AutoTuneSource = {
  id: string
  buffer: PixelBuffer
  autoTuneAnalysisSample: PixelBuffer
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
  const [state, dispatch] = React.useReducer(
    (
      prev: {
        recommendations: AutoTuneRecommendation[]
        recommendationsSourceId: string | null
        error: string | null
        errorSourceId: string | null
        appliedRecommendationId: string | null
        appliedSourceId: string | null
      },
      action:
        | Partial<{
            recommendations: AutoTuneRecommendation[]
            recommendationsSourceId: string | null
            error: string | null
            errorSourceId: string | null
            appliedRecommendationId: string | null
            appliedSourceId: string | null
          }>
        | ((prev: {
            recommendations: AutoTuneRecommendation[]
            recommendationsSourceId: string | null
            error: string | null
            errorSourceId: string | null
            appliedRecommendationId: string | null
            appliedSourceId: string | null
          }) => Partial<{
            recommendations: AutoTuneRecommendation[]
            recommendationsSourceId: string | null
            error: string | null
            errorSourceId: string | null
            appliedRecommendationId: string | null
            appliedSourceId: string | null
          }>)
    ) => ({
      ...prev,
      ...(typeof action === "function" ? action(prev) : action),
    }),
    {
      recommendations: [] as AutoTuneRecommendation[],
      recommendationsSourceId: null as string | null,
      error: null as string | null,
      errorSourceId: null as string | null,
      appliedRecommendationId: null as string | null,
      appliedSourceId: null as string | null,
    }
  )
  const [isLoading, startTransition] = React.useTransition()
  const generationIdRef = React.useRef(0)
  const nextJobIdRef = React.useRef(0)
  const settingsRef = React.useRef(settings)
  const sourceId = source?.id ?? null
  const visibleRecommendations =
    state.recommendationsSourceId === sourceId ? state.recommendations : []
  const visibleError = state.errorSourceId === sourceId ? state.error : null
  const derivedAppliedRecommendationId = findAppliedRecommendationId({
    recommendations: visibleRecommendations,
    settings,
  })
  const explicitAppliedRecommendationId =
    state.appliedSourceId === sourceId &&
    state.appliedRecommendationId === derivedAppliedRecommendationId
      ? state.appliedRecommendationId
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

        dispatch({
          recommendations: [],
          recommendationsSourceId: null,
          error: null,
          errorSourceId: null,
          appliedRecommendationId: null,
          appliedSourceId: null,
        })
      })
      return undefined
    }

    const currentSource = source
    const controller = new AbortController()

    function generateAutoTune() {
      startTransition(async () => {
        try {
          dispatch((prev) => ({
            ...prev,
            error: null,
            errorSourceId: null,
          }))
          await waitForLoadingPaint()
          const currentSettings = settingsRef.current
          nextJobIdRef.current += 1

          const nextRecommendations = await runAutoTuneJob({
            jobId: nextJobIdRef.current,
            sourceId: currentSource.id,
            analysisSample: currentSource.autoTuneAnalysisSample,
            settings: currentSettings,
            outputDimensions: {
              width: currentSettings.resize.width,
              height: currentSettings.resize.height,
            },
            signal: controller.signal,
          })

          if (generationIdRef.current !== generationId) {
            return
          }

          dispatch((prev) => ({
            ...prev,
            recommendations: nextRecommendations,
            recommendationsSourceId: currentSource.id,
            appliedRecommendationId: null,
            appliedSourceId: null,
          }))
        } catch (autoTuneError) {
          if (generationIdRef.current !== generationId) {
            return
          }

          if (isAbortError(autoTuneError)) {
            return
          }

          dispatch({
            recommendations: [],
            recommendationsSourceId: null,
            appliedRecommendationId: null,
            appliedSourceId: null,
            error: getAutoTuneErrorMessage(autoTuneError),
            errorSourceId: currentSource.id,
          })
        }
      })
    }

    generateAutoTune()

    return () => {
      controller.abort()
    }
  }, [enabled, source, sourceId])

  const markApplied = React.useCallback(
    (recommendationId: string) => {
      dispatch((prev) => ({
        ...prev,
        appliedRecommendationId: recommendationId,
        appliedSourceId: sourceId,
      }))
    },
    [sourceId]
  )

  const clearAppliedMarker = React.useCallback(() => {
    dispatch((prev) => ({
      ...prev,
      appliedRecommendationId: null,
      appliedSourceId: null,
    }))
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

function getAutoTuneErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Auto-Tune failed"
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError"
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
