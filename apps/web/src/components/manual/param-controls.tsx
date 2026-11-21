import * as React from "react"
import type { ColorDepth } from "@workspace/core"
import {
  Field,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import { useTranslation } from "react-i18next"

import { normalizeHexColorDraft } from "@/lib/palette-color-draft"

export function ParamSelect({
  action,
  label,
  options,
  value,
  onValueChange,
}: {
  action?: React.ReactNode
  label: string
  options: { id: string; label: string }[]
  value: string
  onValueChange: (value: string) => void
}) {
  const id = React.useId()

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="flex w-full min-w-0 items-center gap-1.5">
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger
            id={id}
            className="h-8 w-full min-w-0 flex-1 justify-between font-sans text-xs"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {options.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {action}
      </div>
    </div>
  )
}

export function ColorDepthControl({
  value,
  onChange,
}: {
  value: ColorDepth
  onChange: (value: ColorDepth) => void
}) {
  const { t } = useTranslation()
  const selected = value.mode === "full" ? "full" : String(value.count)

  return (
    <FieldSet className="gap-1">
      <FieldLegend variant="label" className="mb-0">
        {t("manual.colorDepth")}
      </FieldLegend>
      <ToggleGroup
        type="single"
        value={selected}
        variant="outline"
        className="w-full"
        onValueChange={(next) => {
          if (next === "full") {
            onChange({ mode: "full" })
          } else if (next) {
            onChange({
              mode: "limit",
              count: Number(next) as 2 | 4 | 8 | 16,
            })
          }
        }}
      >
        {["full", "2", "4", "8", "16"].map((item) => (
          <ToggleGroupItem
            key={item}
            value={item}
            className={
              item === "full"
                ? "flex-1 font-sans text-xs"
                : "flex-1 font-mono text-xs tabular-nums"
            }
          >
            {item === "full" ? t("manual.colorDepthFull") : item}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </FieldSet>
  )
}

export function NumberField({
  action,
  description,
  label,
  onChange,
  value,
}: {
  action?: React.ReactNode
  description?: React.ReactNode
  label: string
  value: number
  onChange: (value: number) => void
}) {
  const id = React.useId()

  function commitDraft(input: HTMLInputElement) {
    const nextValue = Number(input.value)

    if (!Number.isFinite(nextValue) || nextValue < 1) {
      input.value = String(value)
      return
    }

    const roundedValue = Math.round(nextValue)
    input.value = String(roundedValue)

    if (roundedValue !== value) {
      onChange(roundedValue)
    }
  }

  return (
    <Field className="gap-1">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div
        className={
          action
            ? "flex w-full min-w-0 items-center gap-1.5"
            : "flex w-full min-w-0"
        }
      >
        <Input
          key={value}
          id={id}
          className="min-w-0 flex-1 font-mono text-xs tabular-nums"
          defaultValue={value}
          inputMode="numeric"
          max={4096}
          min={1}
          type="number"
          onBlur={(event) => commitDraft(event.currentTarget)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              event.currentTarget.blur()
            }
          }}
        />
        {action}
      </div>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </Field>
  )
}

const LIVE_COLOR_COMMIT_INTERVAL_MS = 60

export function PaletteColorInput({
  color,
  liveCommitDelayMs = LIVE_COLOR_COMMIT_INTERVAL_MS,
  onBlur,
  onChange,
  onCommit,
  ...props
}: Omit<
  React.ComponentProps<typeof Input>,
  "defaultValue" | "type" | "value"
> & {
  color: string
  liveCommitDelayMs?: number
  onCommit: (color: string) => void
}) {
  const [draftColor, setDraftColor] = React.useState(color)
  const lastCommittedRef = React.useRef(color)
  const pendingColorRef = React.useRef<string | null>(null)
  const throttleTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  )
  const onCommitRef = React.useRef(onCommit)
  onCommitRef.current = onCommit

  React.useEffect(() => {
    setDraftColor(color)
    lastCommittedRef.current = color
  }, [color])

  const clearThrottleTimer = React.useCallback(() => {
    if (throttleTimerRef.current !== null) {
      clearTimeout(throttleTimerRef.current)
      throttleTimerRef.current = null
    }
  }, [])

  React.useEffect(() => clearThrottleTimer, [clearThrottleTimer])

  const commitNow = React.useCallback((nextColor: string) => {
    pendingColorRef.current = null
    if (nextColor !== lastCommittedRef.current) {
      lastCommittedRef.current = nextColor
      onCommitRef.current(nextColor)
    }
  }, [])

  const scheduleLiveCommit = React.useCallback(
    (nextColor: string) => {
      if (liveCommitDelayMs <= 0) {
        clearThrottleTimer()
        commitNow(nextColor)
        return
      }

      if (throttleTimerRef.current === null) {
        commitNow(nextColor)
        throttleTimerRef.current = setTimeout(() => {
          throttleTimerRef.current = null
          if (pendingColorRef.current !== null) {
            commitNow(pendingColorRef.current)
          }
        }, liveCommitDelayMs)
      } else {
        pendingColorRef.current = nextColor
      }
    },
    [clearThrottleTimer, commitNow, liveCommitDelayMs]
  )

  return (
    <Input
      type="color"
      value={draftColor}
      onChange={(event) => {
        const nextColor = event.currentTarget.value
        setDraftColor(nextColor)
        scheduleLiveCommit(nextColor)
        onChange?.(event)
      }}
      onBlur={(event) => {
        clearThrottleTimer()
        commitNow(event.currentTarget.value)
        onBlur?.(event)
      }}
      {...props}
    />
  )
}

export function PaletteHexInput({
  className,
  color,
  index,
  onColorChange,
}: {
  className?: string
  color: string
  index: number
  onColorChange: (index: number, color: string) => void
}) {
  const { t } = useTranslation()
  const [draft, setDraft] = React.useState(color)

  React.useEffect(() => {
    setDraft(color)
  }, [color])

  function commitDraft(rawValue: string) {
    const trimmed = rawValue.trim()
    const normalizedDraft = normalizeHexColorDraft(trimmed)

    if (!trimmed || !normalizedDraft) {
      setDraft(color)
      return
    }

    setDraft(normalizedDraft)

    if (normalizedDraft !== color) {
      onColorChange(index, normalizedDraft)
    }
  }

  return (
    <Input
      aria-label={t("manual.hexColor", { n: index + 1 })}
      className={className}
      spellCheck={false}
      value={draft}
      onChange={(event) => setDraft(event.currentTarget.value)}
      onBlur={(event) => commitDraft(event.currentTarget.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault()
          event.currentTarget.blur()
        }
      }}
    />
  )
}
