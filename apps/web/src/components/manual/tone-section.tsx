import {
  DEFAULT_SETTINGS,
  type ColorMode,
  type EditorSettings,
} from "@workspace/core"
import { Button } from "@workspace/ui/components/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@workspace/ui/components/field"
import { Switch } from "@workspace/ui/components/switch"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import { useTranslation } from "react-i18next"

import { CommittedSliderField } from "@/components/committed-slider-field"
import { isToneModified } from "@/components/manual/effect-stack-helpers"
import { ManualSectionCard } from "@/components/manual/section-card"
import type { SettingsTransition } from "@/lib/editor-settings-transition"

export function ToneSection({
  advancedOpen,
  defaultOpen = false,
  settings,
  onAdvancedOpenChange,
  onSettingsTransition,
}: {
  advancedOpen: boolean
  defaultOpen?: boolean
  settings: EditorSettings
  onAdvancedOpenChange: (open: boolean) => void
  onSettingsTransition: (transition: SettingsTransition) => void
}) {
  const { t } = useTranslation()
  const modified = isToneModified(settings)

  return (
    <ManualSectionCard
      defaultOpen={defaultOpen}
      modified={modified}
      modifiedLabel={t("manual.modified")}
      sectionId="tone"
      title={t("manual.tone")}
    >
      <div className="grid min-w-0 gap-3">
        <CommittedSliderField
          defaultValue={DEFAULT_SETTINGS.preprocess.brightness}
          label={t("manual.brightness")}
          max={100}
          min={-100}
          step={1}
          value={settings.preprocess.brightness}
          onCommit={(brightness) =>
            onSettingsTransition({
              type: "set-preprocess",
              patch: { brightness },
            })
          }
        />
        <CommittedSliderField
          defaultValue={DEFAULT_SETTINGS.preprocess.contrast}
          label={t("manual.contrast")}
          max={100}
          min={-100}
          step={1}
          value={settings.preprocess.contrast}
          onCommit={(contrast) =>
            onSettingsTransition({
              type: "set-preprocess",
              patch: { contrast },
            })
          }
        />
        <Collapsible
          className="min-w-0 overflow-hidden"
          open={advancedOpen}
          onOpenChange={onAdvancedOpenChange}
        >
          <div className="flex items-start justify-between gap-3 border-t border-border/70 pt-2.5">
            <div className="flex flex-col gap-0.5">
              <FieldLabel>{t("manual.advanced")}</FieldLabel>
              <FieldDescription>{t("manual.advancedDesc")}</FieldDescription>
            </div>
            <CollapsibleTrigger asChild>
              <Button size="xs" variant="ghost">
                {advancedOpen ? t("manual.close") : t("manual.open")}
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="flex min-w-0 flex-col gap-3 overflow-hidden pt-3">
            <FieldSet className="gap-1">
              <FieldLegend variant="label" className="mb-0">
                {t("manual.colorMode")}
              </FieldLegend>
              <ToggleGroup
                type="single"
                value={settings.preprocess.colorMode}
                variant="outline"
                className="w-full"
                onValueChange={(value) => {
                  if (value) {
                    onSettingsTransition({
                      type: "set-color-mode",
                      colorMode: value as ColorMode,
                    })
                  }
                }}
              >
                <ToggleGroupItem value="color-preserve" className="flex-1">
                  {t("manual.color")}
                </ToggleGroupItem>
                <ToggleGroupItem value="grayscale-first" className="flex-1">
                  {t("manual.gray")}
                </ToggleGroupItem>
              </ToggleGroup>
            </FieldSet>
            <CommittedSliderField
              defaultValue={DEFAULT_SETTINGS.preprocess.gamma}
              label={t("manual.gamma")}
              max={3}
              min={0.2}
              step={0.05}
              value={settings.preprocess.gamma}
              onCommit={(gamma) =>
                onSettingsTransition({
                  type: "set-preprocess",
                  patch: { gamma },
                })
              }
            />
            <Field orientation="horizontal">
              <FieldContent>
                <FieldLabel htmlFor="invert">
                  {t("manual.invertLabel")}
                </FieldLabel>
                <FieldDescription>{t("manual.invertDesc")}</FieldDescription>
              </FieldContent>
              <Switch
                id="invert"
                checked={settings.preprocess.invert}
                onCheckedChange={(invert) =>
                  onSettingsTransition({
                    type: "set-preprocess",
                    patch: { invert },
                  })
                }
              />
            </Field>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </ManualSectionCard>
  )
}
