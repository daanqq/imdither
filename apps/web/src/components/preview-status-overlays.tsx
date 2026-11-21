import type { DitherAlgorithm } from "@workspace/core"
import { AlertCircleIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { JobStatus } from "@/store/editor-store"

const PROCESSING_OVERLAY_PULSE_STEPS = Array.from(
  { length: 10 },
  (_, index) => ({
    delayMs: index * 70,
    id: `pulse-${index}`,
  })
)

export function ProcessingOverlay({
  algorithm,
  busy,
  previewReduced,
  status,
}: {
  algorithm: DitherAlgorithm
  busy: boolean
  previewReduced: boolean
  status: JobStatus
}) {
  const { t } = useTranslation()

  if (!busy && !previewReduced) {
    return null
  }

  const title =
    status === "exporting"
      ? t("preview.exporting")
      : busy
        ? t("preview.processing")
        : t("preview.previewOnly")
  const detail =
    status === "exporting"
      ? t("preview.exportingDetail")
      : previewReduced
        ? t("preview.reducedDetail", { algorithm })
        : status === "queued"
          ? t("preview.queuedDetail")
          : t("preview.workerRunningDetail", { algorithm })

  return (
    <div
      data-slot="processing-overlay"
      className="pointer-events-none absolute top-14 left-1/2 z-20 w-max max-w-[min(28rem,calc(100%-1.5rem))] -translate-x-1/2 rounded-lg border border-primary/45 bg-[var(--surface-hud)] px-3 py-2 shadow-[var(--shadow-hud)] backdrop-blur-md"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid shrink-0 grid-cols-5 gap-0.5" aria-hidden="true">
          {PROCESSING_OVERLAY_PULSE_STEPS.map((step) => (
            <span
              key={step.id}
              className="size-1.5 animate-pulse rounded-[1px] bg-primary"
              style={{ animationDelay: `${step.delayMs}ms` }}
            />
          ))}
        </div>
        <div className="min-w-0">
          <div className="font-mono text-[11px] leading-tight font-semibold tracking-wide text-foreground">
            {title}
          </div>
          <div className="mt-0.5 truncate font-sans text-[11px] leading-snug text-muted-foreground">
            {detail}
          </div>
        </div>
      </div>
    </div>
  )
}

export function SourceErrorOverlay({
  error,
  status,
}: {
  error?: string | null
  status: JobStatus
}) {
  const { t } = useTranslation()

  if (status !== "error" || !error) {
    return null
  }

  return (
    <div
      role="alert"
      data-slot="source-error-overlay"
      className="pointer-events-none absolute top-14 left-1/2 z-30 w-max max-w-[min(30rem,calc(100%-1.5rem))] -translate-x-1/2 rounded-lg border border-destructive/60 bg-popover/95 px-3 py-2 shadow-[var(--shadow-hud)] backdrop-blur-md"
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <AlertCircleIcon
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-destructive"
        />
        <div className="min-w-0">
          <div className="font-mono text-[11px] leading-tight font-semibold tracking-wide text-destructive">
            {t("preview.sourceRejected")}
          </div>
          <div className="mt-0.5 font-sans text-xs leading-snug text-muted-foreground">
            {error}
          </div>
        </div>
      </div>
    </div>
  )
}
