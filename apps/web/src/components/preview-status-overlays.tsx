import type { DitherAlgorithm } from "@workspace/core"
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
    <div className="pointer-events-none absolute inset-x-2 top-2 z-20 border border-primary bg-background/95 p-2 shadow-none">
      <div className="flex min-w-0 items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="font-display text-xl leading-none tracking-[-0.03em]">
            {title}
          </div>
          <div className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
            {detail}
          </div>
        </div>
        <div className="grid shrink-0 grid-cols-5 gap-1" aria-hidden="true">
          {PROCESSING_OVERLAY_PULSE_STEPS.map((step) => (
            <span
              key={step.id}
              className="size-3 animate-pulse bg-primary"
              style={{ animationDelay: `${step.delayMs}ms` }}
            />
          ))}
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
      className="pointer-events-none absolute inset-x-2 top-2 z-30 border border-destructive bg-background/95 p-2 shadow-none"
    >
      <div className="min-w-0">
        <div className="font-display text-xl leading-none tracking-[-0.03em] text-destructive">
          {t("preview.sourceRejected")}
        </div>
        <div className="mt-1 font-mono text-[11px] text-muted-foreground">
          {error}
        </div>
      </div>
    </div>
  )
}
