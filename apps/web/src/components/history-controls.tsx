import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { Redo2Icon, Undo2Icon } from "lucide-react"
import { useTranslation } from "react-i18next"

const noop = () => {}

export function HistoryControls({
  canRedo,
  canUndo,
  className,
  onRedo,
  onUndo,
}: {
  canRedo: boolean
  canUndo: boolean
  className?: string
  onRedo?: () => void
  onUndo?: () => void
}) {
  const { t } = useTranslation()

  return (
    <div className={cn("flex shrink-0 items-center gap-1.5", className)}>
      <Button
        type="button"
        aria-label={t("history.undoAria")}
        className="size-8 gap-1.5 px-0 text-xs whitespace-nowrap sm:h-8 sm:w-auto sm:px-2.5"
        disabled={!canUndo}
        size="sm"
        title={t("history.undoHint")}
        variant="outline"
        onClick={onUndo ?? noop}
      >
        <Undo2Icon className="size-3.5 shrink-0" />
        <span className="hidden whitespace-nowrap sm:inline">
          {t("history.undo")}
        </span>
      </Button>
      <Button
        type="button"
        aria-label={t("history.redoAria")}
        className="size-8 gap-1.5 px-0 text-xs whitespace-nowrap sm:h-8 sm:w-auto sm:px-2.5"
        disabled={!canRedo}
        size="sm"
        title={t("history.redoHint")}
        variant="outline"
        onClick={onRedo ?? noop}
      >
        <Redo2Icon className="size-3.5 shrink-0" />
        <span className="hidden whitespace-nowrap sm:inline">
          {t("history.redo")}
        </span>
      </Button>
    </div>
  )
}
