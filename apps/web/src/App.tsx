import * as React from "react"
import {
  extractLookPayload,
  extractPaletteFromSource,
  type PaletteExtractionSize,
  type AutoTuneRecommendation,
} from "@workspace/core"
import { Button } from "@workspace/ui/components/button"
import { MoonIcon, SunIcon } from "lucide-react"

import { InspectorPanel } from "@/components/inspector-panel"
import { PreviewStage } from "@/components/preview-stage"
import { useTheme } from "@/components/theme-provider"

import brandMarkUrl from "@/assets/brand-mark.svg"
import { applyAutoTuneLookSettings } from "@/lib/auto-tune-application"
import {
  applyLookText as applyLookTextAdapter,
  copyLookPayload,
  copyPaletteJson,
  copySettingsJson,
  exportPaletteAsset,
  importPaletteFile,
  importPaletteFromClipboard,
  pasteLookPayload,
  pasteSettingsJson,
} from "@/lib/clipboard-settings-adapter"
import {
  encodePixelBuffer,
  getExportFormatOption,
  makeExportName,
} from "@/lib/export-image"
import { downloadBlob } from "@/lib/image"
import { createProcessingJobs } from "@/lib/processing-jobs"
import {
  applySourceIntakeResult,
  runDemoSourceIntake,
  runFileSourceIntake,
} from "@/lib/source-intake-application"
import { useAutoTuneRecommendations } from "@/lib/use-auto-tune-recommendations"
import { usePreviewCycle } from "@/lib/use-preview-cycle"
import {
  pickImageFromClipboard,
  type LoadedSource,
  type SourceIntakeResult,
} from "@/lib/source-intake"
import type { SettingsTransition } from "@/lib/editor-settings-transition"
import type { PreviewViewport } from "@/lib/preview-viewport"
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
  const setStatus = useEditorStore((state) => state.setStatus)
  const setError = useEditorStore((state) => state.setError)
  const setSourceNotice = useEditorStore((state) => state.setSourceNotice)
  const setMetadata = useEditorStore((state) => state.setMetadata)
  const [source, setSource] = React.useState<LoadedSource | null>(null)
  const [isDesktopViewScale, setIsDesktopViewScale] = React.useState(() =>
    typeof window === "undefined"
      ? true
      : window.matchMedia(DESKTOP_VIEW_SCALE_QUERY).matches
  )
  const processingJobs = React.useMemo(() => createProcessingJobs(), [])
  const lookHashAppliedRef = React.useRef(false)
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

  const applySourceIntake = React.useCallback(
    (result: SourceIntakeResult) =>
      applySourceIntakeResult(result, {
        onErrorChange: setError,
        onPreviewCycleReset: resetPreviewCycle,
        onPreviewViewportChange: setPreviewViewport,
        onSettingsTransition: transitionSettings,
        onSourceChange: setSource,
        onSourceNoticeChange: setSourceNotice,
        onStatusChange: setStatus,
      }),
    [
      setError,
      setPreviewViewport,
      setSourceNotice,
      setStatus,
      resetPreviewCycle,
      transitionSettings,
    ]
  )

  React.useEffect(() => {
    let isCurrent = true

    void runDemoSourceIntake({
      isCurrent: () => isCurrent,
      onErrorChange: setError,
      onResult: applySourceIntake,
      onStatusChange: setStatus,
    })

    return () => {
      isCurrent = false
    }
  }, [applySourceIntake, setError, setStatus])

  const handleFile = React.useCallback(
    (file: File) =>
      runFileSourceIntake(file, {
        onErrorChange: setError,
        onResult: applySourceIntake,
        onStatusChange: setStatus,
      }),
    [applySourceIntake, setError, setStatus]
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

  React.useEffect(() => {
    if (!source || lookHashAppliedRef.current) {
      return
    }

    lookHashAppliedRef.current = true

    const payload = extractLookPayload(window.location.hash)

    if (!payload) {
      return
    }

    try {
      applyLookTextAdapter({
        clearAppliedMarker,
        notice: "[LOOK APPLIED FROM URL]",
        onErrorChange: setError,
        onSourceNoticeChange: setSourceNotice,
        text: window.location.hash,
        transitionContext,
        transitionSettings,
      })
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}`
      )
    } catch (lookError) {
      setError(
        lookError instanceof Error ? lookError.message : "Look import failed"
      )
    }
  }, [
    clearAppliedMarker,
    setError,
    setSourceNotice,
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

  const handleExport = React.useCallback(async () => {
    if (!source) {
      return
    }

    setStatus("exporting")

    try {
      const result = await processingJobs.runExportJob({
        sourceKey: source.id,
        image: source.buffer,
        settings,
      })
      const blob = await encodePixelBuffer(result.image, {
        alphaBackground: settings.alphaBackground,
        format: exportFormat,
        quality: exportQuality,
      })
      downloadBlob(blob, makeExportName(source.name, exportFormat))
      setMetadata({
        ...result.metadata,
        exportFormat: getExportFormatOption(exportFormat).label,
      })
      setError(null)
      setStatus("ready")
    } catch (exportError) {
      setError(
        exportError instanceof Error ? exportError.message : "Export failed"
      )
      setStatus("error")
    }
  }, [
    exportFormat,
    exportQuality,
    processingJobs,
    setError,
    setMetadata,
    setStatus,
    settings,
    source,
  ])

  const handleCopySettings = React.useCallback(async () => {
    await copySettingsJson({
      clipboard: navigator.clipboard,
      settings,
      onErrorChange: setError,
      onSourceNoticeChange: setSourceNotice,
    })
  }, [setError, setSourceNotice, settings])

  const handlePasteSettings = React.useCallback(async () => {
    await pasteSettingsJson({
      clearAppliedMarker,
      clipboard: navigator.clipboard,
      onErrorChange: setError,
      onSourceNoticeChange: setSourceNotice,
      transitionContext,
      transitionSettings,
    })
  }, [
    clearAppliedMarker,
    setError,
    setSourceNotice,
    transitionContext,
    transitionSettings,
  ])

  const handleCopyLook = React.useCallback(async () => {
    await copyLookPayload({
      clipboard: navigator.clipboard,
      href: window.location.href,
      settings,
      onErrorChange: setError,
      onSourceNoticeChange: setSourceNotice,
    })
  }, [setError, setSourceNotice, settings])

  const handlePasteLook = React.useCallback(async () => {
    await pasteLookPayload({
      clearAppliedMarker,
      clipboard: navigator.clipboard,
      onErrorChange: setError,
      onSourceNoticeChange: setSourceNotice,
      transitionContext,
      transitionSettings,
    })
  }, [
    clearAppliedMarker,
    setError,
    setSourceNotice,
    transitionContext,
    transitionSettings,
  ])

  const handleImportPaletteFile = React.useCallback(
    (file: File) =>
      importPaletteFile({
        file,
        onErrorChange: setError,
        onSourceNoticeChange: setSourceNotice,
        transitionContext,
        transitionSettings,
      }),
    [setError, setSourceNotice, transitionContext, transitionSettings]
  )

  const handleImportPaletteFromClipboard = React.useCallback(async () => {
    await importPaletteFromClipboard({
      clipboard: navigator.clipboard,
      onErrorChange: setError,
      onSourceNoticeChange: setSourceNotice,
      transitionContext,
      transitionSettings,
    })
  }, [setError, setSourceNotice, transitionContext, transitionSettings])

  const handleCopyPaletteJson = React.useCallback(async () => {
    await copyPaletteJson({
      clipboard: navigator.clipboard,
      colors: settings.customPalette,
      onErrorChange: setError,
      onSourceNoticeChange: setSourceNotice,
    })
  }, [setError, setSourceNotice, settings.customPalette])

  const handleExportPaletteJson = React.useCallback(() => {
    exportPaletteAsset({
      colors: settings.customPalette,
      downloadBlob,
      format: "json",
      onErrorChange: setError,
      onSourceNoticeChange: setSourceNotice,
    })
  }, [setError, setSourceNotice, settings.customPalette])

  const handleExportPaletteGpl = React.useCallback(() => {
    exportPaletteAsset({
      colors: settings.customPalette,
      downloadBlob,
      format: "gpl",
      onErrorChange: setError,
      onSourceNoticeChange: setSourceNotice,
    })
  }, [setError, setSourceNotice, settings.customPalette])

  const handleExtractPalette = React.useCallback(
    (size: PaletteExtractionSize) => {
      if (!source) {
        setError("Load a Source Image before extracting a palette")
        return
      }

      try {
        transitionSettings(
          {
            type: "set-custom-palette",
            colors: extractPaletteFromSource(source.buffer, size),
          },
          transitionContext
        )
        clearAppliedMarker()
        setError(null)
        setSourceNotice(`[PALETTE EXTRACTED: ${size} COLORS]`)
      } catch (paletteError) {
        setError(
          paletteError instanceof Error
            ? paletteError.message
            : "Palette extraction failed"
        )
      }
    },
    [
      clearAppliedMarker,
      setError,
      setSourceNotice,
      source,
      transitionContext,
      transitionSettings,
    ]
  )

  const handleResolutionWidthChange = React.useCallback(
    (width: number) => {
      clearAppliedMarker()
      transitionSettings({ type: "set-output-width", width }, transitionContext)
    },
    [clearAppliedMarker, transitionContext, transitionSettings]
  )

  const handleResetSettings = React.useCallback(() => {
    clearAppliedMarker()
    transitionSettings({ type: "reset-defaults" }, transitionContext)
  }, [clearAppliedMarker, transitionContext, transitionSettings])

  const handleSettingsTransition = React.useCallback(
    (transition: SettingsTransition) => {
      clearAppliedMarker()
      transitionSettings(transition, transitionContext)
    },
    [clearAppliedMarker, transitionContext, transitionSettings]
  )

  const handleApplyAutoTuneRecommendation = React.useCallback(
    (recommendation: AutoTuneRecommendation) => {
      transitionSettings(
        {
          type: "apply-settings",
          settings: applyAutoTuneLookSettings({
            current: settings,
            recommended: recommendation.snapshot.settings,
          }),
        },
        transitionContext
      )
      markAutoTuneApplied(recommendation.id)
      setError(null)
      setSourceNotice(`[AUTO-TUNE APPLIED: ${recommendation.label}]`)
    },
    [
      markAutoTuneApplied,
      setError,
      setSourceNotice,
      settings,
      transitionContext,
      transitionSettings,
    ]
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
            algorithm={settings.algorithm}
            compareMode={compareMode}
            isDesktopViewScale={isDesktopViewScale}
            original={source?.buffer ?? null}
            outputHeight={settings.resize.height}
            outputWidth={settings.resize.width}
            preview={preview}
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
            onFileSelected={handleFile}
            onInvalidDrop={handleInvalidDrop}
            onPreviewDisplaySizeChange={setPreviewDisplaySize}
            onPreviewViewportChange={handlePreviewViewportChange}
            onRedoSettingsChange={redoSettingsChange}
            onUndoSettingsChange={undoSettingsChange}
          />

          <aside className="min-h-0 min-w-0 overflow-hidden">
            <InspectorPanel
              advancedOpen={advancedOpen}
              appliedRecommendationId={appliedRecommendationId}
              autoTuneError={autoTuneError}
              autoTuneLoading={isAutoTuneLoading}
              autoTuneRecommendations={autoTuneRecommendations}
              exportFormat={exportFormat}
              exportQuality={exportQuality}
              settings={settings}
              sourceAvailable={Boolean(source)}
              sourceWidth={source?.buffer.width}
              onAdvancedOpenChange={setAdvancedOpen}
              onApplyAutoTuneRecommendation={handleApplyAutoTuneRecommendation}
              onCopyLook={handleCopyLook}
              onCopySettings={handleCopySettings}
              onCopyPaletteJson={handleCopyPaletteJson}
              onExportFormatChange={setExportFormat}
              onExportPaletteGpl={handleExportPaletteGpl}
              onExportPaletteJson={handleExportPaletteJson}
              onExportQualityChange={setExportQuality}
              onExtractPalette={handleExtractPalette}
              onImportPaletteFile={handleImportPaletteFile}
              onImportPaletteFromClipboard={handleImportPaletteFromClipboard}
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
