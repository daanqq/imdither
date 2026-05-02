import { EFFECT_DEFINITIONS, type EditorSettings } from "@workspace/core"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@workspace/ui/components/select"
import { Slider } from "@workspace/ui/components/slider"
import { Switch } from "@workspace/ui/components/switch"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"
import * as React from "react"

import type { SettingsTransition } from "@/lib/editor-settings-transition"

const PRE_EFFECTS = [
  { id: "pre.blur", label: "Blur" },
  { id: "pre.contrast-shape", label: "Contrast Shape" },
] as const

const POST_EFFECTS = [
  { id: "post.grain", label: "Grain" },
  { id: "post.edge-threshold", label: "Edge Threshold" },
  { id: "post.paper-noise", label: "Paper Noise" },
  { id: "post.crt-bloom", label: "CRT Bloom" },
] as const

type StackTabProps = {
  settings: EditorSettings
  onSettingsTransition: (transition: SettingsTransition) => void
}

export function StackTab({ settings, onSettingsTransition }: StackTabProps) {
  const preStages = settings.effectStack.filter((s) => s.kind === "pre")
  const postStages = settings.effectStack.filter((s) => s.kind === "post")
  const quantize = settings.effectStack.find((s) => s.kind === "quantize")
  const dither = settings.effectStack.find((s) => s.kind === "dither")

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <StackGroup
        label="Pre"
        stages={preStages}
        emptyAction={
          <AddEffectButton
            kind="pre"
            effects={PRE_EFFECTS}
            onSettingsTransition={onSettingsTransition}
          />
        }
        onSettingsTransition={onSettingsTransition}
      />

      <StackGroup
        label="Core"
        stages={[
          ...(quantize ? [{ ...quantize, kind: "quantize" as const }] : []),
          ...(dither ? [{ ...dither, kind: "dither" as const }] : []),
        ]}
        onSettingsTransition={onSettingsTransition}
      />

      <StackGroup
        label="Post"
        stages={postStages}
        emptyAction={
          <AddEffectButton
            kind="post"
            effects={POST_EFFECTS}
            onSettingsTransition={onSettingsTransition}
          />
        }
        onSettingsTransition={onSettingsTransition}
      />
    </div>
  )
}

function AddEffectButton({
  kind,
  effects,
  onSettingsTransition,
}: {
  kind: "pre" | "post"
  effects: readonly { id: string; label: string }[]
  onSettingsTransition: (transition: SettingsTransition) => void
}) {
  const [selected, setSelected] = React.useState("")

  return (
    <div className="flex w-full min-w-0 items-center gap-2">
      <Select
        value={selected}
        onOpenChange={(open) => {
          if (!open) {
            setSelected("")
          }
        }}
        onValueChange={(value) => {
          onSettingsTransition({
            type: "add-effect-stage",
            kind,
            effect: value,
          })
        }}
      >
        <SelectTrigger className="h-8 min-w-0 flex-1 justify-between overflow-hidden py-0 pr-2 pl-2.5 font-mono text-xs">
          <PlusIcon className="size-3.5 shrink-0" />
          <span className="min-w-0 flex-1 truncate text-left">
            Add {kind}-stage
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {effects.map((effect) => (
              <SelectItem key={effect.id} value={effect.id}>
                {effect.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

function StackGroup({
  emptyAction,
  label,
  stages,
  onSettingsTransition,
}: {
  emptyAction?: React.ReactNode
  label: string
  stages: EditorSettings["effectStack"]
  onSettingsTransition: (transition: SettingsTransition) => void
}) {
  const isOptionalGroup =
    stages.length > 0 && (stages[0].kind === "pre" || stages[0].kind === "post")
  const groupKind = isOptionalGroup ? stages[0].kind : null

  return (
    <div className="min-w-0">
      <div className="mb-1.5 font-mono text-xs tracking-wider text-muted-foreground uppercase">
        {label}
      </div>
      <div className="min-w-0 space-y-1.5">
        {stages.map((stage, index) => (
          <StageRow
            key={stage.instanceId}
            index={index}
            isFirst={index === 0}
            isLast={index === stages.length - 1}
            stage={stage}
            totalCount={stages.length}
            onSettingsTransition={onSettingsTransition}
          />
        ))}
        {stages.length === 0 && emptyAction ? (
          <div className="flex w-full min-w-0">{emptyAction}</div>
        ) : groupKind ? (
          <AddEffectButton
            kind={groupKind as "pre" | "post"}
            effects={groupKind === "pre" ? PRE_EFFECTS : POST_EFFECTS}
            onSettingsTransition={onSettingsTransition}
          />
        ) : null}
      </div>
    </div>
  )
}

function StageRow({
  index,
  isFirst,
  isLast,
  stage,
  totalCount,
  onSettingsTransition,
}: {
  index: number
  isFirst: boolean
  isLast: boolean
  stage: EditorSettings["effectStack"][0]
  totalCount: number
  onSettingsTransition: (transition: SettingsTransition) => void
}) {
  const [expanded, setExpanded] = React.useState(false)
  const isCore = stage.kind === "quantize" || stage.kind === "dither"
  const isReorderable = !isCore && totalCount > 1
  const effectId =
    typeof stage.params.effect === "string" ? stage.params.effect : null
  const effectDef = effectId
    ? (EFFECT_DEFINITIONS.find((d) => d.id === effectId) ?? null)
    : null
  const effectLabel = effectId
    ? effectId.replace(/^(pre|post)\./, "")
    : "Unknown"

  return (
    <div className="min-w-0 border border-border">
      <div className="flex min-w-0 items-center justify-between gap-1 px-2 py-1.5">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-1 text-left"
          onClick={() => !isCore && setExpanded(!expanded)}
          disabled={isCore}
        >
          {!isCore ? (
            expanded ? (
              <ChevronDownIcon className="size-3 shrink-0" />
            ) : (
              <ChevronRightIcon className="size-3 shrink-0" />
            )
          ) : null}
          <span className="min-w-0 truncate font-mono text-xs">
            {isCore
              ? stage.kind === "quantize"
                ? "Palette"
                : "Dither"
              : effectLabel}
          </span>
        </button>
        {!isCore ? (
          <div className="flex shrink-0 items-center gap-0.5">
            <Switch
              checked={stage.enabled}
              onCheckedChange={(enabled) =>
                onSettingsTransition({
                  type: "set-effect-stage-enabled",
                  instanceId: stage.instanceId,
                  enabled,
                })
              }
            />
            {isReorderable ? (
              <div className="flex flex-col">
                <Button
                  aria-label="Move stage up"
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4"
                  disabled={isFirst}
                  onClick={() =>
                    onSettingsTransition({
                      type: "reorder-effect-stages",
                      group: stage.kind as "pre" | "post",
                      fromIndex: index,
                      toIndex: index - 1,
                    })
                  }
                >
                  <ArrowUpIcon className="size-2.5" />
                </Button>
                <Button
                  aria-label="Move stage down"
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4"
                  disabled={isLast}
                  onClick={() =>
                    onSettingsTransition({
                      type: "reorder-effect-stages",
                      group: stage.kind as "pre" | "post",
                      fromIndex: index,
                      toIndex: index + 1,
                    })
                  }
                >
                  <ArrowDownIcon className="size-2.5" />
                </Button>
              </div>
            ) : null}
            <Button
              aria-label="Remove stage"
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
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
        ) : null}
      </div>
      {expanded && !isCore ? (
        <div className="border-t border-border px-2 py-1.5">
          <EffectParamsEditor
            params={stage.params}
            effectDef={effectDef}
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

function EffectParamsEditor({
  effectDef,
  params,
  onParamsChange,
}: {
  effectDef: (typeof EFFECT_DEFINITIONS)[number] | null
  params: Record<string, number | string | boolean>
  onParamsChange: (params: Record<string, number | string | boolean>) => void
}) {
  const entries = Object.entries(params).filter(([key]) => key !== "effect")

  if (entries.length === 0) {
    return (
      <span className="font-mono text-[10px] text-muted-foreground">
        No parameters
      </span>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      {entries.map(([key, value]) => (
        <ParamField
          key={key}
          name={key}
          value={value}
          bound={effectDef?.paramBounds[key]}
          options={effectDef?.paramOptions[key]}
          onChange={(nextValue) =>
            onParamsChange({ ...params, [key]: nextValue })
          }
        />
      ))}
    </div>
  )
}

function ParamField({
  bound,
  name,
  options,
  value,
  onChange,
}: {
  bound?: { min: number; max: number; default: number }
  name: string
  options?: readonly string[]
  value: number | string | boolean
  onChange: (value: number | string | boolean) => void
}) {
  const id = React.useId()

  if (typeof value === "boolean") {
    return (
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={id}
          className="min-w-0 truncate font-mono text-[10px] text-muted-foreground"
        >
          {name}
        </label>
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
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={id}
          className="min-w-0 shrink-0 font-mono text-[10px] text-muted-foreground"
        >
          {name}
        </label>
        <Select value={String(value)} onValueChange={(next) => onChange(next)}>
          <SelectTrigger className="h-6 w-24 font-mono text-xs">
            {String(value)}
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {options.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    )
  }

  if (typeof value === "number") {
    if (bound) {
      const min = bound.min
      const max = bound.max
      const step = 0.05
      const displayValue = Number(value.toFixed(2))

      return (
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor={id}
            className="min-w-0 shrink-0 font-mono text-[10px] text-muted-foreground"
          >
            {name}
          </label>
          <div className="flex items-center gap-1.5">
            <span className="w-9 text-right font-mono text-[10px] text-muted-foreground tabular-nums">
              {displayValue}
            </span>
            <Slider
              id={id}
              className="w-20"
              defaultValue={[value]}
              max={max}
              min={min}
              step={step}
              onValueCommit={([next]) => onChange(next)}
            />
          </div>
        </div>
      )
    }

    return (
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={id}
          className="min-w-0 shrink-0 font-mono text-[10px] text-muted-foreground"
        >
          {name}
        </label>
        <Input
          id={id}
          className="h-6 w-24 font-mono text-xs"
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
      <label
        htmlFor={id}
        className="min-w-0 shrink-0 font-mono text-[10px] text-muted-foreground"
      >
        {name}
      </label>
      <Input
        id={id}
        className="h-6 w-24 font-mono text-xs"
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
