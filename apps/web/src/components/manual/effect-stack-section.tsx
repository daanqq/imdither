import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { EFFECT_DEFINITIONS, type EditorSettings } from "@workspace/core"
import { Button } from "@workspace/ui/components/button"
import { FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Switch } from "@workspace/ui/components/switch"
import { cn } from "@workspace/ui/lib/utils"
import {
  ChevronDownIcon,
  ChevronRightIcon,
  GripVerticalIcon,
  MoreVerticalIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"
import * as React from "react"
import { useTranslation } from "react-i18next"

import { CommittedSliderField } from "@/components/committed-slider-field"
import {
  POST_EFFECTS,
  PRE_EFFECTS,
  areStageIdListsEqual,
  createInitialExpandedStagesState,
  getEffectLabelKey,
  getEffectParamLabelKey,
  getEffectParamOptionLabelKey,
  getEffectParamStep,
  getEffectParamUnit,
  markPendingAutoExpand,
  reconcileExpandedStages,
  toggleStageExpanded,
} from "@/components/manual/effect-stack-helpers"
import { ManualSectionCard } from "@/components/manual/section-card"
import type { SettingsTransition } from "@/lib/editor-settings-transition"

type EffectStageItem = EditorSettings["effectStack"][number]

export function EffectStackSection({
  preStages,
  postStages,
  onSettingsTransition,
}: {
  preStages: EffectStageItem[]
  postStages: EffectStageItem[]
  onSettingsTransition: (transition: SettingsTransition) => void
}) {
  const { t } = useTranslation()
  const allStageIds = React.useMemo(
    () => [
      ...preStages.map((stage) => stage.instanceId),
      ...postStages.map((stage) => stage.instanceId),
    ],
    [preStages, postStages]
  )
  const [expansionState, setExpansionState] = React.useState(() =>
    createInitialExpandedStagesState(allStageIds)
  )
  const currentExpansion = React.useMemo(
    () => reconcileExpandedStages(expansionState, allStageIds),
    [expansionState, allStageIds]
  )

  React.useEffect(() => {
    if (
      !areStageIdListsEqual(expansionState.knownIds, currentExpansion.knownIds)
    ) {
      setExpansionState(currentExpansion)
    }
  }, [currentExpansion, expansionState.knownIds])

  const handleAddStage = React.useCallback(
    (kind: "pre" | "post", effect: string) => {
      setExpansionState((prev) => markPendingAutoExpand(prev))
      onSettingsTransition({
        type: "add-effect-stage",
        kind,
        effect,
      })
    },
    [onSettingsTransition]
  )

  const handleToggleExpand = React.useCallback(
    (instanceId: string) => {
      setExpansionState((prev) =>
        toggleStageExpanded(
          reconcileExpandedStages(prev, allStageIds),
          instanceId
        )
      )
    },
    [allStageIds]
  )

  const totalStages = preStages.length + postStages.length
  const totalEnabled =
    preStages.filter((stage) => stage.enabled).length +
    postStages.filter((stage) => stage.enabled).length

  return (
    <ManualSectionCard
      defaultOpen
      sectionId="effects"
      title={t("manual.effects")}
      badge={
        totalStages > 0 ? (
          <span
            data-slot="effects-total-badge"
            className={cn(
              "inline-flex items-center rounded-sm px-1.5 py-0.5 font-mono text-[10px] leading-none font-medium tabular-nums",
              totalEnabled > 0
                ? "bg-primary/14 text-primary"
                : "bg-muted text-muted-foreground"
            )}
          >
            {totalEnabled === totalStages
              ? totalEnabled
              : `${totalEnabled}/${totalStages}`}
          </span>
        ) : null
      }
    >
      <div className="flex min-w-0 flex-col gap-3">
        <EffectSubGroup
          effects={PRE_EFFECTS}
          expandedIds={currentExpansion.expandedIds}
          kind="pre"
          stages={preStages}
          title={t("manual.preEffects")}
          onAddStage={handleAddStage}
          onSettingsTransition={onSettingsTransition}
          onToggleExpand={handleToggleExpand}
        />
        <div className="border-t border-border/60 pt-2.5">
          <EffectSubGroup
            effects={POST_EFFECTS}
            expandedIds={currentExpansion.expandedIds}
            kind="post"
            stages={postStages}
            title={t("manual.postEffects")}
            onAddStage={handleAddStage}
            onSettingsTransition={onSettingsTransition}
            onToggleExpand={handleToggleExpand}
          />
        </div>
      </div>
    </ManualSectionCard>
  )
}

function EffectSubGroup({
  effects,
  expandedIds,
  kind,
  stages,
  title,
  onAddStage,
  onSettingsTransition,
  onToggleExpand,
}: {
  effects: readonly { id: string; labelKey: string }[]
  expandedIds: readonly string[]
  kind: "pre" | "post"
  stages: EffectStageItem[]
  title: string
  onAddStage: (kind: "pre" | "post", effect: string) => void
  onSettingsTransition: (transition: SettingsTransition) => void
  onToggleExpand: (instanceId: string) => void
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  const enabledCount = stages.filter((stage) => stage.enabled).length

  function handleDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id)
    const overId = event.over ? String(event.over.id) : null

    if (!overId || activeId === overId) {
      return
    }

    const fromIndex = stages.findIndex((stage) => stage.instanceId === activeId)
    const toIndex = stages.findIndex((stage) => stage.instanceId === overId)

    if (fromIndex >= 0 && toIndex >= 0) {
      onSettingsTransition({
        type: "reorder-effect-stages",
        group: kind,
        fromIndex,
        toIndex,
      })
    }
  }

  return (
    <div data-effect-group={kind} className="min-w-0 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="font-sans text-xs font-medium text-muted-foreground">
          {title}
        </span>
        <span
          data-active-count={enabledCount}
          data-slot="effect-group-count"
          data-total-count={stages.length}
          className={cn(
            "inline-flex items-center rounded-sm px-1.5 py-0.5 font-mono text-[10px] leading-none font-medium tabular-nums",
            enabledCount > 0
              ? "bg-primary/14 text-primary"
              : "bg-muted/80 text-muted-foreground"
          )}
        >
          {stages.length === 0
            ? "0"
            : enabledCount === stages.length
              ? String(enabledCount)
              : `${enabledCount}/${stages.length}`}
        </span>
      </div>

      {stages.length > 0 ? (
        <div className="min-w-0 space-y-1.5">
          <DndContext
            collisionDetection={closestCenter}
            sensors={sensors}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={stages.map((stage) => stage.instanceId)}
              strategy={verticalListSortingStrategy}
            >
              {stages.map((stage, index) => (
                <StageRow
                  key={stage.instanceId}
                  expanded={expandedIds.includes(stage.instanceId)}
                  index={index}
                  isFirst={index === 0}
                  isLast={index === stages.length - 1}
                  stage={stage}
                  totalCount={stages.length}
                  onSettingsTransition={onSettingsTransition}
                  onToggleExpand={() => onToggleExpand(stage.instanceId)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      ) : null}

      <AddEffectButton
        effects={effects}
        kind={kind}
        onAddStage={(effect) => onAddStage(kind, effect)}
      />
    </div>
  )
}

function AddEffectButton({
  effects,
  kind,
  onAddStage,
}: {
  effects: readonly { id: string; labelKey: string }[]
  kind: "pre" | "post"
  onAddStage: (effect: string) => void
}) {
  const [selected, setSelected] = React.useState("")
  const { t } = useTranslation()

  return (
    <div className="flex w-full min-w-0 items-center">
      <Select
        value={selected}
        onOpenChange={(open) => {
          if (!open) {
            setSelected("")
          }
        }}
        onValueChange={(value) => {
          onAddStage(value)
          setSelected("")
        }}
      >
        <SelectTrigger className="h-8 w-full min-w-0 flex-1 justify-between overflow-hidden py-0 pr-2 pl-2.5 font-sans text-xs">
          <PlusIcon className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate text-left">
            {kind === "pre"
              ? t("manual.addPreStage")
              : t("manual.addPostStage")}
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {effects.map((effect) => (
              <SelectItem key={effect.id} value={effect.id}>
                {t(effect.labelKey)}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

export function StageRow({
  expanded,
  index,
  isFirst,
  isLast,
  stage,
  totalCount,
  onSettingsTransition,
  onToggleExpand,
}: {
  expanded: boolean
  index: number
  isFirst: boolean
  isLast: boolean
  stage: EffectStageItem
  totalCount: number
  onSettingsTransition: (transition: SettingsTransition) => void
  onToggleExpand: () => void
}) {
  const { t } = useTranslation()
  const isReorderable = totalCount > 1
  const sortable = useSortable({ id: stage.instanceId })
  const effectId =
    typeof stage.params.effect === "string" ? stage.params.effect : null
  const effectDef = effectId
    ? (EFFECT_DEFINITIONS.find((d) => d.id === effectId) ?? null)
    : null
  const labelKey = getEffectLabelKey(effectId)
  const effectLabel = labelKey
    ? t(labelKey)
    : effectId
      ? effectId.replace(/^(pre|post)\./, "")
      : t("manual.unknown")

  return (
    <div
      ref={sortable.setNodeRef}
      data-slot="effect-stage-row"
      data-stage-enabled={stage.enabled ? "true" : "false"}
      data-stage-expanded={expanded ? "true" : "false"}
      className={cn(
        "min-w-0 overflow-hidden rounded-md border border-border/80 bg-[var(--surface-inspector)]/85 transition-opacity duration-150",
        !stage.enabled && "opacity-60"
      )}
      style={{
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
      }}
    >
      <div className="flex min-w-0 items-center gap-1.5 px-1.5 py-1.5">
        <button
          ref={sortable.setActivatorNodeRef}
          aria-label={t("manual.dragStage")}
          title={t("manual.dragStage")}
          className="flex size-6 shrink-0 cursor-grab items-center justify-center rounded-sm text-muted-foreground/75 transition-colors hover:bg-muted/70 hover:text-foreground active:cursor-grabbing"
          type="button"
          {...sortable.attributes}
          {...sortable.listeners}
        >
          <GripVerticalIcon className="size-3.5" />
        </button>

        <button
          type="button"
          aria-expanded={expanded}
          className="flex min-w-0 flex-1 items-center gap-1.5 rounded-sm py-0.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          onClick={onToggleExpand}
        >
          {expanded ? (
            <ChevronDownIcon className="size-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRightIcon className="size-3.5 shrink-0 text-muted-foreground" />
          )}
          <span className="min-w-0 truncate font-sans text-xs font-medium text-foreground">
            {effectLabel}
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-1.5">
          <Switch
            aria-label={t("manual.enableStage", { name: effectLabel })}
            checked={stage.enabled}
            onCheckedChange={(enabled) =>
              onSettingsTransition({
                type: "set-effect-stage-enabled",
                instanceId: stage.instanceId,
                enabled,
              })
            }
          />
          <span
            aria-hidden="true"
            className="h-3.5 w-px shrink-0 bg-border/80"
          />
          <div className="flex shrink-0 items-center gap-0.5">
            {isReorderable ? (
              <StageActions
                index={index}
                isFirst={isFirst}
                isLast={isLast}
                stage={stage}
                onSettingsTransition={onSettingsTransition}
              />
            ) : null}
            <Button
              aria-label={t("manual.removeStage")}
              title={t("manual.removeStage")}
              type="button"
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground hover:text-destructive"
              onClick={() =>
                onSettingsTransition({
                  type: "remove-effect-stage",
                  instanceId: stage.instanceId,
                })
              }
            >
              <Trash2Icon className="size-3" />
            </Button>
          </div>
        </div>
      </div>

      {expanded ? (
        <div className="border-t border-border/70 px-2.5 py-2">
          <EffectParamsEditor
            effectDef={effectDef}
            effectId={effectId}
            params={stage.params}
            onParamsChange={(params) =>
              onSettingsTransition({
                type: "set-effect-stage-params",
                instanceId: stage.instanceId,
                params,
              })
            }
          />
        </div>
      ) : null}
    </div>
  )
}

function StageActions({
  index,
  isFirst,
  isLast,
  stage,
  onSettingsTransition,
}: {
  index: number
  isFirst: boolean
  isLast: boolean
  stage: EffectStageItem
  onSettingsTransition: (transition: SettingsTransition) => void
}) {
  const { t } = useTranslation()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          aria-label={t("manual.stageActions")}
          title={t("manual.stageActions")}
          type="button"
          variant="ghost"
          size="icon-xs"
        >
          <MoreVerticalIcon className="size-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-36">
        <div className="grid gap-1">
          <Button
            disabled={isFirst}
            variant="ghost"
            className="justify-start"
            onClick={() =>
              onSettingsTransition({
                type: "reorder-effect-stages",
                group: stage.kind as "pre" | "post",
                fromIndex: index,
                toIndex: index - 1,
              })
            }
          >
            {t("manual.moveUp")}
          </Button>
          <Button
            disabled={isLast}
            variant="ghost"
            className="justify-start"
            onClick={() =>
              onSettingsTransition({
                type: "reorder-effect-stages",
                group: stage.kind as "pre" | "post",
                fromIndex: index,
                toIndex: index + 1,
              })
            }
          >
            {t("manual.moveDown")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function EffectParamsEditor({
  effectDef,
  effectId,
  params,
  onParamsChange,
}: {
  effectDef: (typeof EFFECT_DEFINITIONS)[number] | null
  effectId: string | null
  params: Record<string, number | string | boolean>
  onParamsChange: (params: Record<string, number | string | boolean>) => void
}) {
  const { t } = useTranslation()
  const entries = getEffectParamEntries(params, effectDef)

  if (entries.length === 0) {
    return (
      <span className="font-sans text-xs text-muted-foreground">
        {t("manual.noParameters")}
      </span>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-2.5">
      {entries.map(([key, value]) => (
        <ParamField
          key={key}
          bound={effectDef?.paramBounds[key]}
          effectId={effectId}
          name={key}
          options={effectDef?.paramOptions[key]}
          value={value}
          onChange={(nextValue) =>
            onParamsChange({ ...params, [key]: nextValue })
          }
        />
      ))}
    </div>
  )
}

function getEffectParamEntries(
  params: Record<string, number | string | boolean>,
  effectDef: (typeof EFFECT_DEFINITIONS)[number] | null
): [string, number | string | boolean][] {
  if (!effectDef) {
    return Object.entries(params).filter(([key]) => key !== "effect")
  }

  return Object.entries(effectDef.defaultParams).map(([key, defaultValue]) => [
    key,
    params[key] ?? defaultValue,
  ])
}

function ParamField({
  bound,
  effectId,
  name,
  options,
  value,
  onChange,
}: {
  bound?: { min: number; max: number; default: number }
  effectId: string | null
  name: string
  options?: readonly string[]
  value: number | string | boolean
  onChange: (value: number | string | boolean) => void
}) {
  const { t } = useTranslation()
  const id = React.useId()
  const paramLabelKey = getEffectParamLabelKey(name)
  const label = paramLabelKey ? t(paramLabelKey) : name

  if (typeof value === "boolean") {
    return (
      <div className="flex items-center justify-between gap-2">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <Switch
          id={id}
          checked={value}
          onCheckedChange={(checked) => onChange(checked)}
        />
      </div>
    )
  }

  if (options) {
    return (
      <div className="flex min-w-0 flex-col gap-1">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <Select value={String(value)} onValueChange={(next) => onChange(next)}>
          <SelectTrigger
            id={id}
            className="h-7 w-full min-w-0 flex-1 justify-between font-sans text-xs"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {options.map((opt) => {
                const optionKey = getEffectParamOptionLabelKey(opt)
                return (
                  <SelectItem key={opt} value={opt}>
                    {optionKey ? t(optionKey) : opt}
                  </SelectItem>
                )
              })}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    )
  }

  if (typeof value === "number") {
    if (bound) {
      return (
        <CommittedSliderField
          defaultValue={bound.default}
          label={label}
          max={bound.max}
          min={bound.min}
          step={getEffectParamStep(effectId, name, bound)}
          unit={getEffectParamUnit(name)}
          value={value}
          onCommit={(next) => onChange(next)}
        />
      )
    }

    return (
      <div className="flex items-center justify-between gap-2">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <Input
          id={id}
          className="h-7 w-24 font-mono text-xs tabular-nums"
          defaultValue={String(value)}
          type="number"
          onBlur={(event) => {
            const next = Number(event.currentTarget.value)
            if (Number.isFinite(next)) {
              onChange(Math.round(next))
            } else {
              event.currentTarget.value = String(value)
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur()
            }
          }}
        />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        className="h-7 w-28 font-mono text-xs"
        defaultValue={String(value)}
        onBlur={(event) => {
          onChange(event.currentTarget.value)
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.currentTarget.blur()
          }
        }}
      />
    </div>
  )
}
