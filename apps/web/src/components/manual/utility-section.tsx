import { Button } from "@workspace/ui/components/button"
import { ClipboardIcon, RotateCcwIcon, UploadIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { ManualSectionCard } from "@/components/manual/section-card"

export function UtilitySection({
  defaultOpen = false,
  onCopyLook,
  onCopySettings,
  onPasteLook,
  onPasteSettings,
  onReset,
}: {
  defaultOpen?: boolean
  onCopyLook: () => void
  onCopySettings: () => void
  onPasteLook: () => void
  onPasteSettings: () => void
  onReset: () => void
}) {
  const { t } = useTranslation()

  return (
    <ManualSectionCard
      defaultOpen={defaultOpen}
      sectionId="utility"
      title={t("manual.utility")}
    >
      <div className="grid min-w-0 gap-2.5">
        <div
          data-slot="utility-actions-grid"
          className="grid min-w-0 grid-cols-2 gap-1.5"
        >
          <Button
            size="sm"
            variant="outline"
            title={t("manual.copyLookLink")}
            className="min-w-0 justify-start"
            onClick={onCopyLook}
          >
            <ClipboardIcon data-icon="inline-start" />
            <span className="truncate">{t("manual.copyLookLink")}</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            title={t("manual.pasteLookLink")}
            className="min-w-0 justify-start"
            onClick={onPasteLook}
          >
            <UploadIcon data-icon="inline-start" />
            <span className="truncate">{t("manual.pasteLookLink")}</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            title={t("manual.copySettings")}
            className="min-w-0 justify-start"
            onClick={onCopySettings}
          >
            <ClipboardIcon data-icon="inline-start" />
            <span className="truncate">{t("manual.copySettings")}</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            title={t("manual.pasteSettings")}
            className="min-w-0 justify-start"
            onClick={onPasteSettings}
          >
            <UploadIcon data-icon="inline-start" />
            <span className="truncate">{t("manual.pasteSettings")}</span>
          </Button>
        </div>

        <div className="border-t border-border/70 pt-2">
          <Button
            variant="destructive"
            className="w-full justify-center"
            onClick={onReset}
          >
            <RotateCcwIcon data-icon="inline-start" />
            {t("manual.defaults")}
          </Button>
        </div>
      </div>
    </ManualSectionCard>
  )
}
