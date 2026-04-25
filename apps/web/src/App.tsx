import * as React from "react"
import { safeNormalizeSettings } from "@workspace/core"
import { Button } from "@workspace/ui/components/button"
import { MoonIcon, SunIcon } from "lucide-react"

import { ControlPanel } from "@/components/control-panel"
import { PreviewStage } from "@/components/preview-stage"
import { useTheme } from "@/components/theme-provider"
import { downloadBlob, pixelBufferToPngBlob } from "@/lib/image"
import { createProcessingJobs } from "@/lib/processing-jobs"
import { getScreenPreviewTarget } from "@/lib/screen-preview"
import {
  createDemoSourceIntake,
  formatSourceNotices,
  intakeImageFile,
  pickImageFromClipboard,
  type LoadedSource,
  type SourceIntakeResult,
} from "@/lib/source-intake"
import type { SettingsTransition } from "@/lib/editor-settings-transition"
import { useEditorStore, type ViewScale } from "@/store/editor-store"

const DESKTOP_VIEW_SCALE_QUERY = "(min-width: 768px)"
export function App() {
  const settings = useEditorStore((state) => state.settings)
  const compareMode = useEditorStore((state) => state.compareMode)
  const viewScale = useEditorStore((state) => state.viewScale)
  const advancedOpen = useEditorStore((state) => state.advancedOpen)
  const status = useEditorStore((state) => state.status)
  const transitionSettings = useEditorStore((state) => state.transitionSettings)
  const setCompareMode = useEditorStore((state) => state.setCompareMode)
  const setViewScale = useEditorStore((state) => state.setViewScale)
  const setAdvancedOpen = useEditorStore((state) => state.setAdvancedOpen)
  const setStatus = useEditorStore((state) => state.setStatus)
  const setError = useEditorStore((state) => state.setError)
  const setSourceNotice = useEditorStore((state) => state.setSourceNotice)
  const setMetadata = useEditorStore((state) => state.setMetadata)
  const [source, setSource] = React.useState<LoadedSource | null>(null)
  const [preview, setPreview] = React.useState<LoadedSource["buffer"] | null>(
    null
  )
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
        viewScale,
      }),
    [
      previewDisplaySize?.height,
      previewDisplaySize?.width,
      settings.resize.height,
      settings.resize.width,
      viewScale,
    ]
  )

  const applySourceIntake = React.useCallback(
    (result: SourceIntakeResult) => {
      if (result.type === "rejected") {
        setError(result.message)
        setStatus("error")
        return false
      }

      setSource(result.source)
      setPreview(null)
      setError(null)
      setSourceNotice(formatSourceNotices(result.notices))
      transitionSettings({
        type: "set-output-size",
        width: result.outputSize.width,
        height: result.outputSize.height,
      })
      return true
    },
    [setError, setSourceNotice, setStatus, transitionSettings]
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
          case "refined-preview-ready":
            setPreview(event.result.image)
            setMetadata(event.result.metadata)
            setError(null)
            setStatus("ready")
            return
          case "failed":
            setError(event.error.message)
            setStatus("error")
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
        setViewScale("fit")
      }
    }

    enforceMobileFit()
    mediaQuery.addEventListener("change", enforceMobileFit)

    return () => {
      mediaQuery.removeEventListener("change", enforceMobileFit)
    }
  }, [setViewScale])

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

  const handleInvalidDrop = React.useCallback(
    (message: string) => {
      setError(message)
    },
    [setError]
  )

  const handleExportPng = React.useCallback(async () => {
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
      const blob = await pixelBufferToPngBlob(result.image)
      downloadBlob(blob, makeExportName(source.name, "png"))
      setMetadata(result.metadata)
      setError(null)
      setStatus("ready")
    } catch (exportError) {
      setError(
        exportError instanceof Error ? exportError.message : "Export failed"
      )
      setStatus("error")
    }
  }, [processingJobs, setError, setMetadata, setStatus, settings, source])

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
        throw new Error("Clipboard JSON does not match settings schema v1")
      }

      const result = transitionSettings(
        { type: "apply-settings", settings: parsed },
        transitionContext
      )
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
  }, [setError, setSourceNotice, transitionContext, transitionSettings])

  const handleResolutionWidthChange = React.useCallback(
    (width: number) => {
      transitionSettings({ type: "set-output-width", width }, transitionContext)
    },
    [transitionContext, transitionSettings]
  )

  const handleResetSettings = React.useCallback(() => {
    transitionSettings({ type: "reset-defaults" }, transitionContext)
  }, [transitionContext, transitionSettings])

  const handleSettingsTransition = React.useCallback(
    (transition: SettingsTransition) => {
      transitionSettings(transition, transitionContext)
    },
    [transitionContext, transitionSettings]
  )

  const handleViewScaleChange = React.useCallback(
    (scale: ViewScale) => {
      setViewScale(scale)
    },
    [setViewScale]
  )

  return (
    <main className="h-svh w-full overflow-hidden bg-background text-foreground">
      <div className="mx-auto flex h-full w-full max-w-[1800px] min-w-0 flex-col gap-3 overflow-hidden p-3">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="size-2 rounded-full bg-destructive" />
              <h1 className="font-display text-3xl leading-none tracking-[-0.04em] md:text-4xl">
                IMDITHER
              </h1>
            </div>
          </div>
          <ThemeToggle />
        </header>

        <section className="grid min-h-0 min-w-0 flex-1 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-3 overflow-hidden xl:grid-cols-[minmax(0,1fr)_420px] xl:grid-rows-1">
          <PreviewStage
            algorithm={settings.algorithm}
            compareMode={compareMode}
            isDesktopViewScale={isDesktopViewScale}
            original={source?.buffer ?? null}
            preview={preview}
            previewTargetHeight={
              previewTarget?.height ?? settings.resize.height
            }
            previewTargetWidth={previewTarget?.width ?? settings.resize.width}
            status={status}
            viewScale={viewScale}
            onExportPng={handleExportPng}
            onFileSelected={handleFile}
            onInvalidDrop={handleInvalidDrop}
            onPreviewDisplaySizeChange={setPreviewDisplaySize}
            onViewScaleChange={handleViewScaleChange}
          />

          <ControlPanel
            advancedOpen={advancedOpen}
            compareMode={compareMode}
            settings={settings}
            onAdvancedOpenChange={setAdvancedOpen}
            onCompareModeChange={setCompareMode}
            onCopySettings={handleCopySettings}
            onPasteSettings={handlePasteSettings}
            onResolutionWidthChange={handleResolutionWidthChange}
            onReset={handleResetSettings}
            onSettingsTransition={handleSettingsTransition}
            resolutionAspectLabel={aspectLabel}
          />
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
      className="font-mono text-xs uppercase"
      variant="outline"
      onClick={() => setTheme(nextTheme)}
    >
      {isLight ? (
        <MoonIcon data-icon="inline-start" />
      ) : (
        <SunIcon data-icon="inline-start" />
      )}
      {isLight ? "Dark theme" : "Light theme"}
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

function makeExportName(sourceName: string, extension: "png" | "json") {
  const base = sourceName
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()

  return `imdither-${base || "export"}.${extension}`
}
