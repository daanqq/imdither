import type { DitherAlgorithm } from "@workspace/core"

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
  if (!busy && !previewReduced) {
    return null
  }

  const title =
    status === "exporting"
      ? "EXPORTING"
      : busy
        ? "PROCESSING PREVIEW"
        : "PREVIEW ONLY"
  const detail =
    status === "exporting"
      ? "Preparing full-size export."
      : previewReduced
        ? `Showing reduced preview while full ${algorithm} output catches up.`
        : status === "queued"
          ? "Queued. Controls remain editable."
          : `${algorithm} worker is running. New changes replace queued preview.`

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
              className="h-3 w-3 animate-pulse bg-primary"
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
          SOURCE REJECTED
        </div>
        <div className="mt-1 font-mono text-[11px] text-muted-foreground">
          {error}
        </div>
      </div>
    </div>
  )
}
