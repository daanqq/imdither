import * as React from "react"
import {
  createLookSnapshot,
  decodeLookPayload,
  encodeLookPayload,
  exportPaletteGpl,
  exportPaletteJson,
  extractLookPayload,
  extractPaletteFromSource,
  parsePaletteText,
  safeNormalizeSettings,
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
  encodePixelBuffer,
  getExportFormatOption,
  makeExportName,
} from "@/lib/export-image"
import { downloadBlob } from "@/lib/image"
import { createProcessingJobs } from "@/lib/processing-jobs"
import { getScreenPreviewTarget } from "@/lib/screen-preview"
import { useAutoTuneRecommendations } from "@/lib/use-auto-tune-recommendations"
import {
  createDemoSourceIntake,
  formatSourceNotices,
  intakeImageFile,
  pickImageFromClipboard,
  type LoadedSource,
  type SourceIntakeResult,
} from "@/lib/source-intake"
import type { SettingsTransition } from "@/lib/editor-settings-transition"
import {
  DEFAULT_PREVIEW_VIEWPORT,
  type PreviewViewport,
} from "@/lib/preview-viewport"
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
  const [preview, setPreview] = React.useState<LoadedSource["buffer"] | null>(
    null
  )
  const [previewRefiningPending, setPreviewRefiningPending] =
    React.useState(false)
  const [previewDisplaySize, setPreviewDisplaySize] = React.useState<{
    height: number
    width: number
  } | null>(null)
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
  const previewTarget = React.useMemo(
    () =>
      getScreenPreviewTarget({
        displayHeight: previewDisplaySize?.height,
        displayWidth: previewDisplaySize?.width,
        outputHeight: settings.resize.height,
        outputWidth: settings.resize.width,
        viewScale: previewViewport.mode === "fit" ? "fit" : "actual",
      }),
    [
      previewDisplaySize?.height,
      previewDisplaySize?.width,
      settings.resize.height,
      settings.resize.width,
      previewViewport.mode,
    ]
  )
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
    (result: SourceIntakeResult) => {
      if (result.type === "rejected") {
        setError(result.message)
        setStatus("error")
        return false
      }

      setSource(result.source)
      setPreview(null)
      setPreviewRefiningPending(false)
      setPreviewViewport(DEFAULT_PREVIEW_VIEWPORT)
      setError(null)
      setSourceNotice(formatSourceNotices(result.notices))
      transitionSettings(
        {
          type: "set-output-size",
          width: result.outputSize.width,
          height: result.outputSize.height,
        },
        undefined,
        { recordHistory: false }
      )
      return true
    },
    [
      setError,
      setPreviewViewport,
      setSourceNotice,
      setStatus,
      transitionSettings,
    ]
  )

  React.useEffect(() => {
    let isCurrent = true

    async function loadDemoSource() {
      try {
        setStatus("processing")
        const result = await createDemoSourceIntake()

        if (isCurrent) {
          applySourceIntake(result)
        }
      } catch (demoError) {
        if (!isCurrent) {
          return
        }

        setError(
          demoError instanceof Error
            ? demoError.message
            : "Demo image failed to load"
        )
        setStatus("error")
      }
    }

    void loadDemoSource()

    return () => {
      isCurrent = false
    }
  }, [applySourceIntake, setError, setStatus])

  React.useEffect(() => {
    if (!source) {
      return undefined
    }

    const handle = processingJobs.startPreviewJob({
      sourceKey: source.id,
      image: source.buffer,
      settings,
      previewTarget,
      onEvent: (event) => {
        switch (event.type) {
          case "queued":
            setStatus("queued")
            return
          case "processing":
            setStatus("processing")
            return
          case "reduced-preview-ready":
            setPreview(event.result.image)
            setMetadata(event.result.metadata)
            setError(null)
            setStatus("ready")
            setPreviewRefiningPending(event.willRefine)
            return
          case "refined-preview-ready":
            setPreview(event.result.image)
            setMetadata(event.result.metadata)
            setError(null)
            setStatus("ready")
            setPreviewRefiningPending(false)
            return
          case "failed":
            setError(event.error.message)
            setStatus("error")
            setPreviewRefiningPending(false)
            return
        }
      },
    })

    return () => {
      handle.cancel()
    }
  }, [
    previewTarget,
    processingJobs,
    settings,
    source,
    setError,
    setMetadata,
    setStatus,
  ])

  const handleFile = React.useCallback(
    async (file: File) => {
      try {
        setStatus("processing")
        applySourceIntake(await intakeImageFile(file))
      } catch (fileError) {
        setError(
          fileError instanceof Error ? fileError.message : "Image decode failed"
        )
        setStatus("error")
      }
    },
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
      const snapshot = decodeLookPayload(payload)
      const result = transitionSettings(
        { type: "apply-settings", settings: snapshot.settings },
        transitionContext
      )

      clearAppliedMarker()
      setError(null)
      setSourceNotice(
        result.sourceNotice
          ? `[LOOK APPLIED FROM URL] ${result.sourceNotice}`
          : "[LOOK APPLIED FROM URL]"
      )
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
    try {
      await navigator.clipboard.writeText(JSON.stringify(settings, null, 2))
      setError(null)
      setSourceNotice("[SETTINGS COPIED TO CLIPBOARD]")
    } catch (settingsError) {
      setError(
        settingsError instanceof Error
          ? settingsError.message
          : "Settings copy failed"
      )
    }
  }, [setError, setSourceNotice, settings])

  const handlePasteSettings = React.useCallback(async () => {
    try {
      const clipboardText = await navigator.clipboard.readText()
      const parsed = safeNormalizeSettings(JSON.parse(clipboardText))

      if (!parsed) {
        setError("Clipboard JSON does not match settings schema v1")
        return
      }

      const result = transitionSettings(
        { type: "apply-settings", settings: parsed },
        transitionContext
      )
      clearAppliedMarker()
      setError(null)
      setSourceNotice(
        result.sourceNotice
          ? `[SETTINGS PASTED FROM CLIPBOARD] ${result.sourceNotice}`
          : "[SETTINGS PASTED FROM CLIPBOARD]"
      )
    } catch (settingsError) {
      setError(
        settingsError instanceof Error
          ? settingsError.message
          : "Settings paste failed"
      )
    }
  }, [
    clearAppliedMarker,
    setError,
    setSourceNotice,
    transitionContext,
    transitionSettings,
  ])

  const applyLookText = React.useCallback(
    (text: string, notice: string) => {
      const payload = extractLookPayload(text)

      if (!payload) {
        throw new Error("Look payload is empty")
      }

      const snapshot = decodeLookPayload(payload)
      const result = transitionSettings(
        { type: "apply-settings", settings: snapshot.settings },
        transitionContext
      )

      clearAppliedMarker()
      setError(null)
      setSourceNotice(
        result.sourceNotice ? `${notice} ${result.sourceNotice}` : notice
      )
    },
    [
      clearAppliedMarker,
      setError,
      setSourceNotice,
      transitionContext,
      transitionSettings,
    ]
  )

  const handleCopyLook = React.useCallback(async () => {
    try {
      const payload = encodeLookPayload(createLookSnapshot({ settings }))
      const url = new URL(window.location.href)
      url.hash = `look=${payload}`
      await navigator.clipboard.writeText(url.toString())
      setError(null)
      setSourceNotice("[LOOK COPIED TO CLIPBOARD]")
    } catch (lookError) {
      setError(
        lookError instanceof Error ? lookError.message : "Look copy failed"
      )
    }
  }, [setError, setSourceNotice, settings])

  const handlePasteLook = React.useCallback(async () => {
    try {
      applyLookText(
        await navigator.clipboard.readText(),
        "[LOOK PASTED FROM CLIPBOARD]"
      )
    } catch (lookError) {
      setError(
        lookError instanceof Error ? lookError.message : "Look paste failed"
      )
    }
  }, [applyLookText, setError])

  const applyPaletteText = React.useCallback(
    (text: string, notice: string) => {
      const palette = parsePaletteText(text)
      transitionSettings(
        { type: "set-custom-palette", colors: palette.colors },
        transitionContext
      )
      setError(null)
      setSourceNotice(notice)
    },
    [setError, setSourceNotice, transitionContext, transitionSettings]
  )

  const handleImportPaletteFile = React.useCallback(
    async (file: File) => {
      try {
        applyPaletteText(await file.text(), "[PALETTE IMPORTED]")
      } catch (paletteError) {
        setError(
          paletteError instanceof Error
            ? paletteError.message
            : "Palette import failed"
        )
      }
    },
    [applyPaletteText, setError]
  )

  const handleImportPaletteFromClipboard = React.useCallback(async () => {
    try {
      applyPaletteText(
        await navigator.clipboard.readText(),
        "[PALETTE IMPORTED FROM CLIPBOARD]"
      )
    } catch (paletteError) {
      setError(
        paletteError instanceof Error
          ? paletteError.message
          : "Palette clipboard import failed"
      )
    }
  }, [applyPaletteText, setError])

  const handleCopyPaletteJson = React.useCallback(async () => {
    const colors = settings.customPalette

    if (!colors) {
      setError("Convert the current preset to Custom before copy")
      return
    }

    try {
      await navigator.clipboard.writeText(exportPaletteJson(colors))
      setError(null)
      setSourceNotice("[PALETTE JSON COPIED TO CLIPBOARD]")
    } catch (paletteError) {
      setError(
        paletteError instanceof Error
          ? paletteError.message
          : "Palette copy failed"
      )
    }
  }, [setError, setSourceNotice, settings.customPalette])

  const handleExportPaletteJson = React.useCallback(() => {
    const colors = settings.customPalette

    if (!colors) {
      setError("Convert the current preset to Custom before export")
      return
    }

    try {
      downloadBlob(
        new Blob([exportPaletteJson(colors)], { type: "application/json" }),
        "imdither-palette.json"
      )
      setError(null)
      setSourceNotice("[PALETTE JSON EXPORTED]")
    } catch (paletteError) {
      setError(
        paletteError instanceof Error
          ? paletteError.message
          : "Palette export failed"
      )
    }
  }, [setError, setSourceNotice, settings.customPalette])

  const handleExportPaletteGpl = React.useCallback(() => {
    const colors = settings.customPalette

    if (!colors) {
      setError("Convert the current preset to Custom before export")
      return
    }

    try {
      downloadBlob(
        new Blob([exportPaletteGpl(colors)], { type: "text/plain" }),
        "imdither-palette.gpl"
      )
      setError(null)
      setSourceNotice("[PALETTE GPL EXPORTED]")
    } catch (paletteError) {
      setError(
        paletteError instanceof Error
          ? paletteError.message
          : "Palette export failed"
      )
    }
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
