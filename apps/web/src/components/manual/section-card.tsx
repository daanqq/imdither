import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react"

type ManualSectionCardProps = {
  sectionId: string
  title: string
  defaultOpen?: boolean
  modified?: boolean
  modifiedLabel?: string
  badge?: React.ReactNode
  summary?: React.ReactNode
  children: React.ReactNode
}

export function ManualSectionCard({
  badge,
  children,
  defaultOpen = false,
  modified = false,
  modifiedLabel,
  sectionId,
  summary,
  title,
}: ManualSectionCardProps) {
  const [open, setOpen] = React.useState(defaultOpen)

  return (
    <section
      data-modified={modified ? "true" : "false"}
      data-open={open ? "true" : "false"}
      data-section={sectionId}
      data-slot="manual-section-card"
      className="min-w-0 overflow-hidden rounded-lg border border-border/80 bg-[var(--surface-control)]/45"
    >
      <button
        type="button"
        aria-expanded={open}
        className={cn(
          "flex w-full min-w-0 items-center justify-between gap-2 px-2.5 py-2 text-left transition-colors duration-150 outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-inset"
        )}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          {open ? (
            <ChevronDownIcon className="size-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRightIcon className="size-3.5 shrink-0 text-muted-foreground" />
          )}
          <span className="min-w-0 truncate font-sans text-xs font-semibold text-foreground">
            {title}
          </span>
          {modified ? (
            <span
              data-slot="section-modified-indicator"
              title={modifiedLabel}
              className="size-1.5 shrink-0 rounded-full bg-primary"
            >
              {modifiedLabel ? (
                <span className="sr-only">{modifiedLabel}</span>
              ) : null}
            </span>
          ) : null}
          {badge}
        </span>
        {summary ? (
          <span className="shrink-0 font-mono text-[11px] text-muted-foreground tabular-nums">
            {summary}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="min-w-0 border-t border-border/70 px-2.5 py-2.5">
          {children}
        </div>
      ) : null}
    </section>
  )
}
