import * as React from "react"
import {
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
import { executeClipboardCommand } from "@/lib/clipboard-settings-application"
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
import { MotionCycle } from "@/lib/motion-cycle"
import {
  MotionIntakeApplication,
  type MotionIntakeRuntimeAdapter,
} from "@/lib/motion-intake-application"
import {
  getMotionPlaybackDelay,
  getNextMotionFrameIndex,
  getPreviousMotionFrameIndex,
  isMotionPlayable,
} from "@/lib/motion-playback"
import type { SettingsTransition } from "@/lib/editor-settings-transition"
import {
  DEFAULT_PREVIEW_VIEWPORT,
  type PreviewViewport,
} from "@/lib/preview-viewport"
import {
  exportApngSequence,
  exportGifSequence,
  exportWebMSequence,
  makeMotionExportName,
} from "@/lib/export-motion"
import type {
  AnimatedExportFormat,
  VideoExportSettings,
} from "@/lib/motion-types"
import { isVideoFile } from "@/lib/motion-types"
import { decodeVideoToFrameSequence } from "@/lib/video-intake"
import { hasAcTlChunk } from "@/lib/apng-intake-detect"
import {
  runMotionApngJob,
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
  const [localState, setLocalState] = React.useReducer(
    (
      state: {
        source: LoadedSource | null
        animatedExportFormat: AnimatedExportFormat
        videoExportSettings: VideoExportSettings
        isDesktopViewScale: boolean
        selectedLookRecipeId: string
      },
      action: Partial<{
        source: LoadedSource | null
        animatedExportFormat: AnimatedExportFormat
        videoExportSettings: VideoExportSettings
        isDesktopViewScale: boolean
        selectedLookRecipeId: string
      }>
    ) => ({ ...state, ...action }),
    {
      source: null,
      animatedExportFormat: "gif",
      videoExportSettings: { crf: 30 },
      isDesktopViewScale:
        typeof window === "undefined"
          ? true
          : window.matchMedia(DESKTOP_VIEW_SCALE_QUERY).matches,
      selectedLookRecipeId: "custom",
    }
  )
  const {
    source,
    animatedExportFormat,
    videoExportSettings,
    isDesktopViewScale,
    selectedLookRecipeId,
  } = localState
  const setAnimatedExportFormat = (
    animatedExportFormat: AnimatedExportFormat
  ) => setLocalState({ animatedExportFormat })
  const setVideoExportSettings = (
    videoExportSettings: Partial<VideoExportSettings>
  ) =>
    setLocalState({
      videoExportSettings: {
        ...localState.videoExportSettings,
        ...videoExportSettings,
      },
    })
  const _setIsDesktopViewScale = (isDesktopViewScale: boolean) =>
    setLocalState({ isDesktopViewScale })
  const setSelectedLookRecipeId = (selectedLookRecipeId: string) =>
    setLocalState({ selectedLookRecipeId })
  const [webCodecsAvailable] = React.useState(
    () => typeof VideoEncoder !== "undefined"
  )
  const processingJobs = React.useMemo(() => createProcessingJobs(), [])
  const _lookHashAppliedRef = React.useRef(false)
  const motionIntakeRef = React.useRef(new MotionIntakeApplication())
  const motionCycleRef = React.useRef(new MotionCycle())
  const explicitCustomRef = React.useRef(false)
  const aspectLabel = localState.source
    ? formatAspectRatio(
        localState.source.buffer.width,
        localState.source.buffer.height
      )
    : formatAspectRatio(settings.resize.width, settings.resize.height)
  const transitionContext = React.useMemo(
    () => ({
      sourceDimensions: localState.source
        ? {
            width: localState.source.buffer.width,
            height: localState.source.buffer.height,
          }
        : null,
    }),
    [localState.source]
  )
  const allLookRecipes = React.useMemo(
    () => [...BUILT_IN_LOOK_RECIPES, ...lookRecipes],
    [lookRecipes]
  )
  const lookRecipeId =
    explicitCustomRef.current && localState.selectedLookRecipeId === "custom"
      ? "custom"
      : localState.selectedLookRecipeId !== "custom" &&
          allLookRecipes.some(
            (recipe) =>
              recipe.id === localState.selectedLookRecipeId &&
              matchLookRecipe(settings, [recipe]) !== null
          )
        ? localState.selectedLookRecipeId
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
    source: localState.source,
    onErrorChange: setError,
    onMetadataChange: setMetadata,
    onStatusChange: setStatus,
  })
  const autoTune = useAutoTuneRecommendations({
    enabled: Boolean(preview),
    settings,
    source: localState.source,
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
      setSource: (source) => setLocalState({ source }),
    }),
    [
      resetPreviewCycle,
      setError,
      setPreviewViewport,
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
    : (localState.source?.buffer ?? null)
  const currentPreview = isAnimated
    ? (processedFrames[currentFrameIndex] ?? null)
    : preview

  const motionIntakeAdapter = React.useMemo<MotionIntakeRuntimeAdapter>(
    () => ({
      applyMotionSource: (nextFrameSequence, sourceName) =>
        useEditorStore.setState({
          frameSequence: nextFrameSequence,
          processedFrames: [],
          currentFrameIndex: 0,
          animatedSourceName: sourceName,
        }),
      applyOutputSizeWithoutHistory: (width, height) =>
        transitionSettings(
          { type: "set-output-size", width, height },
          undefined,
          { recordHistory: false }
        ),
      resetPreviewViewport: () =>
        setPreviewViewport({ mode: "fit", center: { x: 0, y: 0 } }),
      setError,
      setMotionExportSettings,
      setProcessedFrame,
      setSource: (source) => setLocalState({ source }),
      setStatus,
    }),
    [
      setError,
      setMotionExportSettings,
      setPreviewViewport,
      setProcessedFrame,
      setStatus,
      transitionSettings,
    ]
  )

  const handleAnimatedFile = React.useCallback(
    async (file: File, format: "gif" | "apng" = "gif") => {
      const runner = format === "apng" ? runMotionApngJob : runMotionGifJob

      await motionIntakeRef.current.execute(
        { kind: format, file },
        motionIntakeAdapter,
        settings,
        { runAnimatedJob: runner, decodeVideo: decodeVideoToFrameSequence }
      )
    },
    [motionIntakeAdapter, settings]
  )

  React.useEffect(() => {
    if (!frameSequence) {
      return
    }

    const motionCycle = motionCycleRef.current

    void motionCycle.start(
      frameSequence,
      settings,
      {
        clearProcessedFrames,
        setError,
        setProcessedFrame,
        setStatus,
      },
      { runFrameSequenceJob: runMotionFrameSequenceJob }
    )

    return () => {
      motionCycle.cancel()
    }
  }, [
    clearProcessedFrames,
    frameSequence,
    setError,
    setProcessedFrame,
    setStatus,
    settings,
  ])

  React.useEffect(() => {
    if (!isPlaying || !isMotionPlayable(frameSequence)) {
      return
    }

    const duration = getMotionPlaybackDelay(frameSequence, currentFrameIndex)
    const timer = setTimeout(() => {
      setCurrentFrameIndex(
        getNextMotionFrameIndex(frameSequence, currentFrameIndex)
      )
    }, duration)

    return () => clearTimeout(timer)
  }, [isPlaying, frameSequence, currentFrameIndex, setCurrentFrameIndex])

  const handleFile = React.useCallback(
    async (file: File) => {
      if (isVideoFile(file)) {
        await motionIntakeRef.current.execute(
          { kind: "video", file },
          motionIntakeAdapter,
          settings,
          {
            runAnimatedJob: runMotionGifJob,
            decodeVideo: decodeVideoToFrameSequence,
          }
        )
        return
      }

      if (
        file.type === "image/gif" ||
        file.name.toLowerCase().endsWith(".gif")
      ) {
        return handleAnimatedFile(file, "gif")
      }

      if (
        file.type === "image/png" ||
        file.name.toLowerCase().endsWith(".png")
      ) {
        const isApng = await hasAcTlChunk(file)

        if (isApng) {
          return handleAnimatedFile(file, "apng")
        }
      }

      motionIntakeRef.current.cancel()
      motionCycleRef.current.cancel()
      useEditorStore.setState({
        frameSequence: null,
        processedFrames: [],
        currentFrameIndex: 0,
        animatedSourceName: null,
      })

      return executeSourceLoadCommand(
        { kind: "file", file },
        sourceIntakeAdapter
      )
    },
    [handleAnimatedFile, motionIntakeAdapter, settings, sourceIntakeAdapter]
  )

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_VIEW_SCALE_QUERY)
    const enforceMobileFit = () => {
      _setIsDesktopViewScale(mediaQuery.matches)

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

  const clipboardSettingsAdapter = React.useMemo(
    () => ({
      setError,
      setSourceNotice,
    }),
    [setError, setSourceNotice]
  )

  React.useEffect(() => {
    if (!source || _lookHashAppliedRef.current) {
      return
    }

    _lookHashAppliedRef.current = true

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
        const exporter =
          animatedExportFormat === "apng"
            ? exportApngSequence
            : animatedExportFormat === "webm"
              ? exportWebMSequence
              : exportGifSequence
        const blob = await exporter(
          frameSequence,
          settings,
          motionExportSettings,
          animatedExportFormat === "webm" ? videoExportSettings : undefined
        )
        const ext =
          animatedExportFormat === "apng"
            ? "png"
            : animatedExportFormat === "webm"
              ? "webm"
              : "gif"
        const name = makeMotionExportName(
          animatedSourceName ?? (source ? source.name : `output.${ext}`),
          animatedExportFormat
        )

        downloadBlob(blob, name)
        setStatus("ready")
      } catch (exportError) {
        setStatus("error")
        setError(
          exportError instanceof Error
            ? exportError.message
            : `${animatedExportFormat === "apng" ? "APNG" : animatedExportFormat === "webm" ? "WebM" : "GIF"} export failed`
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
    animatedExportFormat,
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
    videoExportSettings,
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
            animatedExportFormat={animatedExportFormat}
            onAnimatedExportFormatChange={setAnimatedExportFormat}
            webCodecsAvailable={webCodecsAvailable}
            videoExportSettings={videoExportSettings}
            onVideoExportSettingsChange={setVideoExportSettings}
            onPlayPause={() => setIsPlaying(!isPlaying)}
            onFrameChange={setCurrentFrameIndex}
            onPrevFrame={() =>
              frameSequence
                ? setCurrentFrameIndex(
                    getPreviousMotionFrameIndex(
                      frameSequence,
                      currentFrameIndex
                    )
                  )
                : undefined
            }
            onNextFrame={() =>
              frameSequence
                ? setCurrentFrameIndex(
                    getNextMotionFrameIndex(frameSequence, currentFrameIndex, {
                      wrap: false,
                    })
                  )
                : undefined
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
