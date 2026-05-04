import * as React from "react"
import {
  createAutoTuneAnalysisSample,
  type PaletteExtractionSize,
  type AutoTuneRecommendation,
} from "@workspace/core"
import { Button } from "@workspace/ui/components/button"
import { MoonIcon, SunIcon } from "lucide-react"

import { InspectorPanel } from "@/components/inspector-panel"
import { PreviewStage } from "@/components/preview-stage"
import { useTheme } from "@/components/theme-provider"

import brandMarkUrl from "@/assets/brand-mark.svg"
import {
  applyAutoTuneRecommendation,
  type AutoTuneApplyAdapter,
} from "@/lib/auto-tune-application"
import {
  executeClipboardCommand,
  type ClipboardSettingsAdapter,
} from "@/lib/clipboard-settings-application"
import {
  applyExportAction,
  type ExportActionRuntimeAdapter,
} from "@/lib/export-action-application"
import {
  applyEditorSettingsCommand,
  type EditorSettingsCommandAdapter,
} from "@/lib/editor-settings-command-application"
import {
  executePaletteCommand,
  type PaletteActionAdapter,
} from "@/lib/palette-action-application"
import { downloadBlob } from "@/lib/image"
import { createProcessingJobs } from "@/lib/processing-jobs"
import {
  executeSourceLoadCommand,
  type SourceIntakeRuntimeAdapter,
} from "@/lib/source-intake-application"
import { useAutoTuneRecommendations } from "@/lib/use-auto-tune-recommendations"
import { usePreviewCycle } from "@/lib/use-preview-cycle"
import { pickImageFromClipboard, type LoadedSource } from "@/lib/source-intake"
import { BUILT_IN_LOOK_RECIPES, matchLookRecipe } from "@/lib/look-recipes"
import type { SettingsTransition } from "@/lib/editor-settings-transition"
import {
  DEFAULT_PREVIEW_VIEWPORT,
  type PreviewViewport,
} from "@/lib/preview-viewport"
import { exportGifSequence, makeMotionExportName } from "@/lib/export-motion"
import {
  runMotionFrameSequenceJob,
  runMotionGifJob,
} from "@/lib/motion-worker-client"
import { useEditorStore } from "@/store/editor-store"

const DESKTOP_VIEW_SCALE_QUERY = "(min-width: 768px)"

function BrandMark() {
  return (
    <span
      aria-hidden="true"
      className="block aspect-[214/34] w-[10.5rem] shrink-0 bg-primary drop-shadow-[0_0_10px_color-mix(in_srgb,var(--primary)_42%,transparent)] md:w-[14rem]"
      style={{
        mask: `url(${brandMarkUrl}) center / contain no-repeat`,
        WebkitMask: `url(${brandMarkUrl}) center / contain no-repeat`,
      }}
    />
  )
}

export function App() {
  const settings = useEditorStore((state) => state.settings)
  const compareMode = useEditorStore((state) => state.compareMode)
  const previewViewport = useEditorStore((state) => state.previewViewport)
  const exportFormat = useEditorStore((state) => state.exportFormat)
  const exportQuality = useEditorStore((state) => state.exportQuality)
  const advancedOpen = useEditorStore((state) => state.advancedOpen)
  const lookRecipes = useEditorStore((state) => state.lookRecipes)
  const status = useEditorStore((state) => state.status)
  const error = useEditorStore((state) => state.error)
  const canRedoSettingsChange = useEditorStore(
    (state) => state.canRedoSettingsChange
  )
  const canUndoSettingsChange = useEditorStore(
    (state) => state.canUndoSettingsChange
  )
  const transitionSettings = useEditorStore((state) => state.transitionSettings)
  const undoSettingsChange = useEditorStore((state) => state.undoSettingsChange)
  const redoSettingsChange = useEditorStore((state) => state.redoSettingsChange)
  const setCompareMode = useEditorStore((state) => state.setCompareMode)
  const setPreviewViewport = useEditorStore((state) => state.setPreviewViewport)
  const setExportFormat = useEditorStore((state) => state.setExportFormat)
  const setExportQuality = useEditorStore((state) => state.setExportQuality)
  const setAdvancedOpen = useEditorStore((state) => state.setAdvancedOpen)
  const saveLookRecipe = useEditorStore((state) => state.saveLookRecipe)
  const renameLookRecipe = useEditorStore((state) => state.renameLookRecipe)
  const deleteLookRecipe = useEditorStore((state) => state.deleteLookRecipe)
  const applyLookRecipe = useEditorStore((state) => state.applyLookRecipe)
  const setStatus = useEditorStore((state) => state.setStatus)
  const setError = useEditorStore((state) => state.setError)
  const setSourceNotice = useEditorStore((state) => state.setSourceNotice)
  const setMetadata = useEditorStore((state) => state.setMetadata)
  const frameSequence = useEditorStore((state) => state.frameSequence)
  const processedFrames = useEditorStore((state) => state.processedFrames)
  const currentFrameIndex = useEditorStore((state) => state.currentFrameIndex)
  const isPlaying = useEditorStore((state) => state.isPlaying)
  const setFrameSequence = useEditorStore((state) => state.setFrameSequence)
  const setCurrentFrameIndex = useEditorStore(
    (state) => state.setCurrentFrameIndex
  )
  const setIsPlaying = useEditorStore((state) => state.setIsPlaying)
  const animatedSourceName = useEditorStore((state) => state.animatedSourceName)
  const motionExportSettings = useEditorStore(
    (state) => state.motionExportSettings
  )
  const setMotionExportSettings = useEditorStore(
    (state) => state.setMotionExportSettings
  )
  const setProcessedFrame = useEditorStore((state) => state.setProcessedFrame)
  const clearProcessedFrames = useEditorStore(
    (state) => state.clearProcessedFrames
  )
  const [source, setSource] = React.useState<LoadedSource | null>(null)
  const [isDesktopViewScale, setIsDesktopViewScale] = React.useState(() =>
    typeof window === "undefined"
      ? true
      : window.matchMedia(DESKTOP_VIEW_SCALE_QUERY).matches
  )
  const processingJobs = React.useMemo(() => createProcessingJobs(), [])
  const lookHashAppliedRef = React.useRef(false)
  const motionJobIdRef = React.useRef(0)
  const motionJobAbortRef = React.useRef<AbortController | null>(null)
  const [selectedLookRecipeId, setSelectedLookRecipeId] =
    React.useState("custom")
  const explicitCustomRef = React.useRef(false)
  const aspectLabel = source
    ? formatAspectRatio(source.buffer.width, source.buffer.height)
    : formatAspectRatio(settings.resize.width, settings.resize.height)
  const transitionContext = React.useMemo(
    () => ({
      sourceDimensions: source
        ? { width: source.buffer.width, height: source.buffer.height }
        : null,
    }),
    [source]
  )
  const allLookRecipes = React.useMemo(
    () => [...BUILT_IN_LOOK_RECIPES, ...lookRecipes],
    [lookRecipes]
  )
  const lookRecipeId =
    explicitCustomRef.current && selectedLookRecipeId === "custom"
      ? "custom"
      : selectedLookRecipeId !== "custom" &&
          allLookRecipes.some(
            (recipe) =>
              recipe.id === selectedLookRecipeId &&
              matchLookRecipe(settings, [recipe]) !== null
          )
        ? selectedLookRecipeId
        : (matchLookRecipe(settings, allLookRecipes)?.id ?? "custom")
  const {
    preview,
    previewRefiningPending,
    previewTarget,
    resetPreviewCycle,
    setPreviewDisplaySize,
  } = usePreviewCycle({
    processingJobs,
    previewViewportMode: previewViewport.mode,
    settings,
    source,
    onErrorChange: setError,
    onMetadataChange: setMetadata,
    onStatusChange: setStatus,
  })
  const autoTune = useAutoTuneRecommendations({
    enabled: Boolean(preview),
    settings,
    source,
  })
  const {
    appliedRecommendationId,
    clearAppliedMarker,
    error: autoTuneError,
    isLoading: isAutoTuneLoading,
    markApplied: markAutoTuneApplied,
    recommendations: autoTuneRecommendations,
  } = autoTune

  const sourceIntakeAdapter: SourceIntakeRuntimeAdapter = React.useMemo(
    () => ({
      setStatus,
      setSource,
      setSourceNotice,
      setError,
      resetPreviewCycle,
      resetPreviewViewport: () => setPreviewViewport(DEFAULT_PREVIEW_VIEWPORT),
      applyOutputSizeWithoutHistory: (width, height) =>
        transitionSettings(
          { type: "set-output-size", width, height },
          undefined,
          { recordHistory: false }
        ),
    }),
    [
      resetPreviewCycle,
      setError,
      setPreviewViewport,
      setSource,
      setSourceNotice,
      setStatus,
      transitionSettings,
    ]
  )

  React.useEffect(() => {
    const isCurrentRef = { current: true }

    void executeSourceLoadCommand(
      { kind: "demo" },
      { ...sourceIntakeAdapter, isCurrent: () => isCurrentRef.current }
    )

    return () => {
      isCurrentRef.current = false
    }
  }, [sourceIntakeAdapter])

  const isAnimated = frameSequence !== null
  const currentOriginal = isAnimated
    ? frameSequence.frames[currentFrameIndex]
    : (source?.buffer ?? null)
  const currentPreview = isAnimated
    ? (processedFrames[currentFrameIndex] ?? null)
    : preview

  const handleAnimatedFile = React.useCallback(
    async (file: File) => {
      motionJobAbortRef.current?.abort()
      const controller = new AbortController()
      motionJobAbortRef.current = controller
      motionJobIdRef.current += 1
      const jobId = motionJobIdRef.current

      try {
        setSource(null)
        setStatus("processing")
        await runMotionGifJob({
          jobId,
          file,
          settings,
          signal: controller.signal,
          onDecoded: (decoded) => {
            if (controller.signal.aborted || jobId !== motionJobIdRef.current) {
              return
            }

            const firstFrame = decoded.frames[0]

            setFrameSequence(decoded, file.name)
            setMotionExportSettings({
              frameDurationMs: decoded.durationsMs[0] ?? 100,
              loopCount: decoded.loopCount ?? 0,
            })

            useEditorStore.setState((state) => ({
              settings: {
                ...state.settings,
                resize: {
                  ...state.settings.resize,
                  width: decoded.sourceWidth,
                  height: decoded.sourceHeight,
                },
              },
            }))

            if (firstFrame) {
              setSource({
                id: `gif-${file.name}-${file.size}-${file.lastModified}`,
                name: file.name,
                buffer: firstFrame,
                autoTuneAnalysisSample:
                  createAutoTuneAnalysisSample(firstFrame),
                originalWidth: decoded.sourceWidth,
                originalHeight: decoded.sourceHeight,
              })
            }

            setPreviewViewport({ mode: "fit" })
            setError(null)
          },
          onFrame: (frameIndex, image) => {
            if (controller.signal.aborted || jobId !== motionJobIdRef.current) {
              return
            }

            setProcessedFrame(frameIndex, image)
          },
        })

        if (controller.signal.aborted || jobId !== motionJobIdRef.current) {
          return
        }

        setStatus("ready")
      } catch (gifError) {
        if (
          gifError instanceof DOMException &&
          gifError.name === "AbortError"
        ) {
          return
        }

        setStatus("error")
        setError(
          gifError instanceof Error ? gifError.message : "GIF decode failed"
        )
      }
    },
    [
      setError,
      setFrameSequence,
      setMotionExportSettings,
      setPreviewViewport,
      setProcessedFrame,
      setSource,
      setStatus,
      settings,
    ]
  )

  React.useEffect(() => {
    if (!frameSequence) {
      return
    }

    motionJobAbortRef.current?.abort()
    const controller = new AbortController()
    motionJobAbortRef.current = controller
    motionJobIdRef.current += 1
    const jobId = motionJobIdRef.current

    setStatus("processing")
    clearProcessedFrames()

    void runMotionFrameSequenceJob({
      jobId,
      frameSequence,
      settings,
      signal: controller.signal,
      onFrame: (frameIndex, image) => {
        if (controller.signal.aborted || jobId !== motionJobIdRef.current) {
          return
        }

        setProcessedFrame(frameIndex, image)
      },
    })
      .then(() => {
        if (controller.signal.aborted || jobId !== motionJobIdRef.current) {
          return
        }

        setStatus("ready")
      })
      .catch((motionError) => {
        if (
          motionError instanceof DOMException &&
          motionError.name === "AbortError"
        ) {
          return
        }

        setStatus("error")
        setError(
          motionError instanceof Error
            ? motionError.message
            : "GIF processing failed"
        )
      })

    return () => {
      controller.abort()
    }
  }, [
    clearProcessedFrames,
    frameSequence,
    settings,
    setError,
    setProcessedFrame,
    setStatus,
  ])

  React.useEffect(() => {
    if (!isPlaying || !frameSequence || frameSequence.frames.length <= 1) {
      return
    }

    const duration = frameSequence.durationsMs[currentFrameIndex] ?? 100
    const timer = setTimeout(() => {
      setCurrentFrameIndex(
        currentFrameIndex < frameSequence.frames.length - 1
          ? currentFrameIndex + 1
          : 0
      )
    }, duration)

    return () => clearTimeout(timer)
  }, [isPlaying, frameSequence, currentFrameIndex, setCurrentFrameIndex])

  const handleFile = React.useCallback(
    (file: File) => {
      if (
        file.type === "image/gif" ||
        file.name.toLowerCase().endsWith(".gif")
      ) {
        return handleAnimatedFile(file)
      }

      motionJobAbortRef.current?.abort()
      setFrameSequence(null, undefined)

      return executeSourceLoadCommand(
        { kind: "file", file },
        sourceIntakeAdapter
      )
    },
    [handleAnimatedFile, setFrameSequence, sourceIntakeAdapter]
  )

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_VIEW_SCALE_QUERY)
    const enforceMobileFit = () => {
      setIsDesktopViewScale(mediaQuery.matches)

      if (!mediaQuery.matches) {
        setPreviewViewport({ mode: "fit" })
      }
    }

    enforceMobileFit()
    mediaQuery.addEventListener("change", enforceMobileFit)

    return () => {
      mediaQuery.removeEventListener("change", enforceMobileFit)
    }
  }, [setPreviewViewport])

  React.useEffect(() => {
    const handlePaste = async (event: ClipboardEvent) => {
      const file = pickImageFromClipboard(event.clipboardData)

      if (!file) {
        return
      }

      event.preventDefault()
      await handleFile(file)
    }

    window.addEventListener("paste", handlePaste)

    return () => {
      window.removeEventListener("paste", handlePaste)
    }
  }, [handleFile])

  const clipboardSettingsAdapter: ClipboardSettingsAdapter = React.useMemo(
    () => ({
      setError,
      setSourceNotice,
    }),
    [setError, setSourceNotice]
  )

  React.useEffect(() => {
    if (!source || lookHashAppliedRef.current) {
      return
    }

    lookHashAppliedRef.current = true

    void executeClipboardCommand(
      { type: "apply-look-from-url", text: window.location.hash },
      clipboardSettingsAdapter,
      {
        clipboard: navigator.clipboard,
        transitionSettings,
        clearAppliedMarker,
        clearLookHash: () =>
          window.history.replaceState(
            null,
            "",
            `${window.location.pathname}${window.location.search}`
          ),
      },
      transitionContext
    )
  }, [
    clearAppliedMarker,
    clipboardSettingsAdapter,
    source,
    transitionContext,
    transitionSettings,
  ])

  const handleInvalidDrop = React.useCallback(
    (message: string) => {
      setError(message)
    },
    [setError]
  )

  const exportActionAdapter: ExportActionRuntimeAdapter = React.useMemo(
    () => ({
      setStatus,
      setError,
      setMetadata,
      downloadBlob,
    }),
    [setError, setMetadata, setStatus]
  )

  const handleExport = React.useCallback(async () => {
    if (isAnimated && frameSequence) {
      try {
        setStatus("exporting")
        const blob = await exportGifSequence(
          frameSequence,
          settings,
          motionExportSettings
        )
        const name = makeMotionExportName(
          animatedSourceName ?? (source ? source.name : "output.gif")
        )

        downloadBlob(blob, name)
        setStatus("ready")
      } catch (exportError) {
        setStatus("error")
        setError(
          exportError instanceof Error
            ? exportError.message
            : "GIF export failed"
        )
      }

      return
    }

    await applyExportAction(
      {
        source,
        settings,
        format: exportFormat,
        quality: exportQuality,
      },
      exportActionAdapter,
      { runExportJob: processingJobs.runExportJob }
    )
  }, [
    animatedSourceName,
    exportActionAdapter,
    exportFormat,
    exportQuality,
    frameSequence,
    isAnimated,
    motionExportSettings,
    processingJobs,
    setError,
    setStatus,
    settings,
    source,
  ])

  const handleCopySettings = React.useCallback(async () => {
    await executeClipboardCommand(
      { type: "copy-settings", settings },
      clipboardSettingsAdapter,
      { clipboard: navigator.clipboard }
    )
  }, [clipboardSettingsAdapter, settings])

  const handlePasteSettings = React.useCallback(async () => {
    await executeClipboardCommand(
      { type: "paste-settings" },
      clipboardSettingsAdapter,
      {
        clipboard: navigator.clipboard,
        transitionSettings,
        clearAppliedMarker,
      },
      transitionContext
    )
  }, [
    clearAppliedMarker,
    clipboardSettingsAdapter,
    transitionContext,
    transitionSettings,
  ])

  const handleCopyLook = React.useCallback(async () => {
    await executeClipboardCommand(
      { type: "copy-look", settings, href: window.location.href },
      clipboardSettingsAdapter,
      { clipboard: navigator.clipboard }
    )
  }, [clipboardSettingsAdapter, settings])

  const handlePasteLook = React.useCallback(async () => {
    await executeClipboardCommand(
      { type: "paste-look" },
      clipboardSettingsAdapter,
      {
        clipboard: navigator.clipboard,
        transitionSettings,
        clearAppliedMarker,
      },
      transitionContext
    )
  }, [
    clearAppliedMarker,
    clipboardSettingsAdapter,
    transitionContext,
    transitionSettings,
  ])

  const paletteActionAdapter: PaletteActionAdapter = React.useMemo(
    () => ({
      setError,
      setSourceNotice,
      clearAppliedMarker,
    }),
    [clearAppliedMarker, setError, setSourceNotice]
  )

  const handleImportPaletteFile = React.useCallback(
    (file: File) =>
      executePaletteCommand(
        { type: "import-file", file },
        paletteActionAdapter,
        { transitionSettings }
      ),
    [paletteActionAdapter, transitionSettings]
  )

  const handleImportPaletteFromClipboard = React.useCallback(async () => {
    await executePaletteCommand(
      { type: "import-clipboard" },
      paletteActionAdapter,
      {
        clipboard: navigator.clipboard,
        transitionSettings,
      },
      transitionContext
    )
  }, [paletteActionAdapter, transitionContext, transitionSettings])

  const handleCopyPaletteJson = React.useCallback(async () => {
    await executePaletteCommand(
      { type: "copy-json", colors: settings.customPalette },
      paletteActionAdapter,
      { clipboard: navigator.clipboard }
    )
  }, [paletteActionAdapter, settings.customPalette])

  const handleExportPaletteJson = React.useCallback(() => {
    executePaletteCommand(
      { type: "export-json", colors: settings.customPalette },
      paletteActionAdapter,
      { downloadBlob }
    )
  }, [paletteActionAdapter, settings.customPalette])

  const handleExportPaletteGpl = React.useCallback(() => {
    executePaletteCommand(
      { type: "export-gpl", colors: settings.customPalette },
      paletteActionAdapter,
      { downloadBlob }
    )
  }, [paletteActionAdapter, settings.customPalette])

  const handleExtractPalette = React.useCallback(
    (size: PaletteExtractionSize) => {
      executePaletteCommand(
        {
          type: "extract",
          size,
          source: source?.buffer ?? null,
        },
        paletteActionAdapter,
        { transitionSettings }
      )
    },
    [paletteActionAdapter, source, transitionSettings]
  )

  const editorSettingsCommandAdapter: EditorSettingsCommandAdapter =
    React.useMemo(
      () => ({
        clearAppliedMarker,
      }),
      [clearAppliedMarker]
    )

  const handleResolutionWidthChange = React.useCallback(
    (width: number) => {
      applyEditorSettingsCommand(
        { type: "set-output-width", width },
        editorSettingsCommandAdapter,
        { transitionSettings },
        transitionContext
      )
    },
    [editorSettingsCommandAdapter, transitionContext, transitionSettings]
  )

  const handleResetSettings = React.useCallback(() => {
    applyEditorSettingsCommand(
      { type: "reset-defaults" },
      editorSettingsCommandAdapter,
      { transitionSettings },
      transitionContext
    )
    setSelectedLookRecipeId("custom")
    explicitCustomRef.current = true
  }, [editorSettingsCommandAdapter, transitionContext, transitionSettings])

  const handleSelectLookRecipe = React.useCallback(
    (id: string) => {
      if (id !== "custom") {
        explicitCustomRef.current = false
        applyLookRecipe(id)
        setSelectedLookRecipeId(id)
      } else {
        explicitCustomRef.current = true
        setSelectedLookRecipeId("custom")
      }
    },
    [applyLookRecipe]
  )

  const handleSaveLookRecipe = React.useCallback(
    (name: string) => {
      const recipe = saveLookRecipe(name)
      handleSelectLookRecipe(recipe.id)
    },
    [saveLookRecipe, handleSelectLookRecipe]
  )

  const handleSettingsTransition = React.useCallback(
    (transition: SettingsTransition) => {
      applyEditorSettingsCommand(
        { type: "settings-transition", transition },
        editorSettingsCommandAdapter,
        { transitionSettings },
        transitionContext
      )
    },
    [editorSettingsCommandAdapter, transitionContext, transitionSettings]
  )

  const autoTuneApplyAdapter: AutoTuneApplyAdapter = React.useMemo(
    () => ({
      markApplied: markAutoTuneApplied,
      setError,
      setSourceNotice,
    }),
    [markAutoTuneApplied, setError, setSourceNotice]
  )

  const handleApplyAutoTuneRecommendation = React.useCallback(
    (recommendation: AutoTuneRecommendation) => {
      applyAutoTuneRecommendation(
        {
          recommendation,
          currentSettings: settings,
        },
        autoTuneApplyAdapter,
        { transitionSettings },
        transitionContext
      )
    },
    [autoTuneApplyAdapter, settings, transitionContext, transitionSettings]
  )

  const handlePreviewViewportChange = React.useCallback(
    (viewport: Partial<PreviewViewport>) => {
      setPreviewViewport(viewport)
    },
    [setPreviewViewport]
  )

  return (
    <main className="h-[100dvh] w-full overflow-hidden bg-[var(--surface-workbench)] text-foreground">
      <div className="mx-auto flex h-full w-full max-w-[1800px] min-w-0 flex-col gap-2 overflow-hidden p-2 md:gap-3 md:p-3">
        <header className="flex shrink-0 items-center justify-between gap-1.5 border-b border-border pb-1.5 md:gap-3 md:pb-2">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex min-w-0 items-center gap-1.5 md:gap-2">
              <BrandMark />
              <h1 className="sr-only">IMDITHER</h1>
            </div>
          </div>
          <ThemeToggle />
        </header>

        <section className="grid min-h-0 min-w-0 flex-1 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-2 overflow-hidden md:gap-3 xl:grid-cols-[minmax(0,1fr)_380px] xl:grid-rows-1">
          <PreviewStage
            isAnimated={isAnimated}
            algorithm={settings.algorithm}
            compareMode={compareMode}
            isDesktopViewScale={isDesktopViewScale}
            original={currentOriginal}
            outputHeight={settings.resize.height}
            outputWidth={settings.resize.width}
            preview={currentPreview}
            previewRefiningPending={previewRefiningPending}
            previewTargetHeight={
              previewTarget?.height ?? settings.resize.height
            }
            previewTargetWidth={previewTarget?.width ?? settings.resize.width}
            status={status}
            error={error}
            previewViewport={previewViewport}
            exportFormat={exportFormat}
            exportQuality={exportQuality}
            canRedoSettingsChange={canRedoSettingsChange}
            canUndoSettingsChange={canUndoSettingsChange}
            onExport={handleExport}
            onCompareModeChange={setCompareMode}
            onExportFormatChange={setExportFormat}
            onExportQualityChange={setExportQuality}
            motionExportSettings={motionExportSettings}
            onMotionExportSettingsChange={setMotionExportSettings}
            onFileSelected={handleFile}
            onInvalidDrop={handleInvalidDrop}
            onPreviewDisplaySizeChange={setPreviewDisplaySize}
            onPreviewViewportChange={handlePreviewViewportChange}
            onRedoSettingsChange={redoSettingsChange}
            onUndoSettingsChange={undoSettingsChange}
            frameCount={frameSequence?.frames.length ?? 0}
            currentFrame={currentFrameIndex}
            isPlaying={isPlaying}
            onPlayPause={() => setIsPlaying(!isPlaying)}
            onFrameChange={setCurrentFrameIndex}
            onPrevFrame={() =>
              setCurrentFrameIndex(Math.max(0, currentFrameIndex - 1))
            }
            onNextFrame={() =>
              setCurrentFrameIndex(
                Math.min(
                  (frameSequence?.frames.length ?? 1) - 1,
                  currentFrameIndex + 1
                )
              )
            }
          />

          <aside className="min-h-0 min-w-0 overflow-hidden">
            <InspectorPanel
              advancedOpen={advancedOpen}
              appliedRecommendationId={appliedRecommendationId}
              autoTuneError={autoTuneError}
              autoTuneLoading={isAutoTuneLoading}
              autoTuneRecommendations={autoTuneRecommendations}
              lookRecipeId={lookRecipeId}
              lookRecipes={allLookRecipes}
              settings={settings}
              sourceAvailable={Boolean(source)}
              sourceWidth={source?.buffer.width}
              onAdvancedOpenChange={setAdvancedOpen}
              onApplyAutoTuneRecommendation={handleApplyAutoTuneRecommendation}
              onCopyLook={handleCopyLook}
              onCopySettings={handleCopySettings}
              onCopyPaletteJson={handleCopyPaletteJson}
              onExportPaletteGpl={handleExportPaletteGpl}
              onExportPaletteJson={handleExportPaletteJson}
              onExtractPalette={handleExtractPalette}
              onImportPaletteFile={handleImportPaletteFile}
              onImportPaletteFromClipboard={handleImportPaletteFromClipboard}
              onDeleteLookRecipe={(id) => {
                deleteLookRecipe(id)
                if (selectedLookRecipeId === id) {
                  setSelectedLookRecipeId("custom")
                }
              }}
              onRenameLookRecipe={renameLookRecipe}
              onSaveLookRecipe={handleSaveLookRecipe}
              onSelectLookRecipe={handleSelectLookRecipe}
              onPasteLook={handlePasteLook}
              onPasteSettings={handlePasteSettings}
              onResolutionWidthChange={handleResolutionWidthChange}
              onReset={handleResetSettings}
              onSettingsTransition={handleSettingsTransition}
              resolutionAspectLabel={aspectLabel}
            />
          </aside>
        </section>
      </div>
    </main>
  )
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const nextTheme = theme === "light" ? "dark" : "light"
  const isLight = theme === "light"

  return (
    <Button
      type="button"
      aria-label={`Switch to ${nextTheme} theme`}
      aria-pressed={isLight}
      className="!size-7 !min-h-7 gap-0 p-0 font-mono text-xs md:!h-8 md:!min-h-8 md:!w-auto md:gap-1.5 md:px-2.5"
      size="icon-xs"
      variant="outline"
      onClick={() => setTheme(nextTheme)}
    >
      {isLight ? (
        <MoonIcon data-icon="inline-start" />
      ) : (
        <SunIcon data-icon="inline-start" />
      )}
      <span className="hidden md:inline">
        {isLight ? "Dark theme" : "Light theme"}
      </span>
    </Button>
  )
}

function formatAspectRatio(width: number, height: number): string {
  const safeWidth = Math.max(1, Math.round(width))
  const safeHeight = Math.max(1, Math.round(height))
  const divisor = greatestCommonDivisor(safeWidth, safeHeight)

  return `${safeWidth / divisor}:${safeHeight / divisor}`
}

function greatestCommonDivisor(left: number, right: number): number {
  let a = Math.abs(left)
  let b = Math.abs(right)

  while (b > 0) {
    const next = a % b
    a = b
    b = next
  }

  return Math.max(1, a)
}
