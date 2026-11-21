import * as React from "react"
import { Button } from "@workspace/ui/components/button"
import { CheckIcon, XIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { formatSourceNotice } from "@/lib/notice-formatter"

const DEFAULT_AUTO_DISMISS_MS = 4200

export function SourceNoticeToast({
  autoDismissMs = DEFAULT_AUTO_DISMISS_MS,
  notice,
  noticeVersion = 0,
  onDismiss,
}: {
  autoDismissMs?: number
  notice: string | null
  noticeVersion?: number
  onDismiss: () => void
}) {
  const { t } = useTranslation()

  React.useEffect(() => {
    if (!notice || autoDismissMs <= 0) {
      return undefined
    }

    const timer = setTimeout(() => {
      onDismiss()
    }, autoDismissMs)

    return () => {
      clearTimeout(timer)
    }
  }, [autoDismissMs, notice, noticeVersion, onDismiss])

  if (!notice) {
    return null
  }

  const formattedMessage = formatSourceNotice(notice, t)

  if (!formattedMessage) {
    return null
  }

  return (
    <div className="pointer-events-none absolute inset-x-3 bottom-14 z-40 flex justify-center md:bottom-13">
      <div
        role="status"
        aria-live="polite"
        data-slot="source-notice-toast"
        className="pointer-events-auto flex max-w-[min(28rem,calc(100vw-1.5rem))] items-center gap-2 rounded-lg border border-border bg-popover/95 py-1.5 pr-1.5 pl-2.5 text-xs text-popover-foreground shadow-[var(--shadow-popover)] backdrop-blur-md"
      >
        <span
          aria-hidden="true"
          className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/14 text-primary"
        >
          <CheckIcon className="size-3" />
        </span>
        <span className="min-w-0 truncate font-sans font-medium">
          {formattedMessage}
        </span>
        <Button
          type="button"
          aria-label={t("notice.dismiss")}
          className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
          size="icon-xs"
          variant="ghost"
          onClick={onDismiss}
        >
          <XIcon className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}
