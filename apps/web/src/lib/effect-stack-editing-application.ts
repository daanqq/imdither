import {
  EFFECT_DEFINITIONS,
  type EditorSettings,
  type EffectStage,
  type StageKind,
} from "@workspace/core"

import type { SettingsTransition } from "./editor-settings-transition"

export type StackGroupKind = "pre" | "core" | "post"

export type StackStageModel = {
  instanceId: string
  label: string
  kind: StageKind
  enabled: boolean
  reorderable: boolean
  removable: boolean
  params: Record<string, number | string | boolean>
}

export type StackGroupModel = {
  kind: StackGroupKind
  label: string
  stages: StackStageModel[]
}

export type EffectStackEditingCommand =
  | { type: "add-stage"; kind: "pre" | "post"; effect: string }
  | { type: "remove-stage"; instanceId: string }
  | { type: "toggle-stage"; instanceId: string; enabled: boolean }
  | {
      type: "edit-stage-params"
      instanceId: string
      params: Record<string, number | string | boolean>
    }
  | {
      type: "reorder-stages"
      group: "pre" | "post"
      fromIndex: number
      toIndex: number
    }

export type EffectStackEditingResult =
  | { ok: true; transition: SettingsTransition }
  | { ok: false; error: string }

function stageLabel(stage: EffectStage): string {
  if (stage.kind === "quantize") return "Palette"
  if (stage.kind === "dither") return "Dither"
  const effect =
    typeof stage.params.effect === "string" ? stage.params.effect : ""
  return effect.replace(/^(pre|post)\./, "") || "Unknown"
}

export function buildEffectStackModel(
  settings: EditorSettings
): StackGroupModel[] {
  const pre: EffectStage[] = []
  const core: EffectStage[] = []
  const post: EffectStage[] = []

  for (const stage of settings.effectStack) {
    if (stage.kind === "pre") pre.push(stage)
    else if (stage.kind === "quantize" || stage.kind === "dither")
      core.push(stage)
    else if (stage.kind === "post") post.push(stage)
  }

  function toModel(
    stages: EffectStage[],
    groupKind: StackGroupKind
  ): StackStageModel[] {
    const isCoreGroup = groupKind === "core"
    return stages.map((stage) => ({
      instanceId: stage.instanceId,
      label: stageLabel(stage),
      kind: stage.kind,
      enabled: stage.enabled,
      reorderable: !isCoreGroup,
      removable: !isCoreGroup,
      params: stage.params,
    }))
  }

  return [
    { kind: "pre", label: "Pre", stages: toModel(pre, "pre") },
    { kind: "core", label: "Core", stages: toModel(core, "core") },
    { kind: "post", label: "Post", stages: toModel(post, "post") },
  ]
}

function findEffectDef(effect: string) {
  return EFFECT_DEFINITIONS.find((def) => def.id === effect)
}

function countStagesInGroup(
  stack: EffectStage[],
  group: "pre" | "post"
): number {
  return stack.filter((s) => s.kind === group).length
}

function validateStageParams(
  params: Record<string, number | string | boolean>,
  effectDef: {
    defaultParams: Record<string, number | string | boolean>
    paramBounds: Record<string, { min: number; max: number }>
    paramOptions: Record<string, readonly string[]>
  }
): string | null {
  const knownKeys = new Set([
    ...Object.keys(effectDef.defaultParams),
    ...Object.keys(effectDef.paramBounds),
    ...Object.keys(effectDef.paramOptions),
  ])
  for (const [key, value] of Object.entries(params)) {
    if (!knownKeys.has(key)) {
      return `Unknown param "${key}"`
    }
    const defaultVal = effectDef.defaultParams[key]
    if (defaultVal !== undefined && typeof defaultVal !== typeof value) {
      return `Param "${key}" expected ${typeof defaultVal}, got ${typeof value}`
    }
    const bound = effectDef.paramBounds[key]
    if (bound && typeof value === "number") {
      if (value < bound.min || value > bound.max) {
        return `Param "${key}" value ${value} out of range [${bound.min}, ${bound.max}]`
      }
    }
    const options = effectDef.paramOptions[key]
    if (options && typeof value === "string") {
      if (!options.includes(value)) {
        return `Param "${key}" must be one of [${options.join(", ")}], got "${value}"`
      }
    }
  }
  return null
}

export function executeEffectStackCommand(
  settings: EditorSettings,
  command: EffectStackEditingCommand
): EffectStackEditingResult {
  switch (command.type) {
    case "add-stage": {
      const def = findEffectDef(command.effect)
      if (!def) {
        return { ok: false, error: `Unknown effect: ${command.effect}` }
      }
      if (!command.effect.startsWith(`${command.kind}.`)) {
        return {
          ok: false,
          error: `Effect "${command.effect}" does not match stage kind "${command.kind}"`,
        }
      }
      return {
        ok: true,
        transition: {
          type: "add-effect-stage",
          kind: command.kind,
          effect: command.effect,
        },
      }
    }
    case "remove-stage":
      return {
        ok: true,
        transition: {
          type: "remove-effect-stage",
          instanceId: command.instanceId,
        },
      }
    case "toggle-stage":
      return {
        ok: true,
        transition: {
          type: "set-effect-stage-enabled",
          instanceId: command.instanceId,
          enabled: command.enabled,
        },
      }
    case "reorder-stages": {
      const groupCount = countStagesInGroup(settings.effectStack, command.group)
      if (
        command.fromIndex < 0 ||
        command.fromIndex >= groupCount ||
        command.toIndex < 0 ||
        command.toIndex >= groupCount
      ) {
        return {
          ok: false,
          error: `Reorder index out of bounds for group "${command.group}" (${groupCount} stages)`,
        }
      }
      return {
        ok: true,
        transition: {
          type: "reorder-effect-stages",
          group: command.group,
          fromIndex: command.fromIndex,
          toIndex: command.toIndex,
        },
      }
    }
    case "edit-stage-params": {
      const stage = settings.effectStack.find(
        (s) => s.instanceId === command.instanceId
      )
      if (!stage) {
        return { ok: false, error: `Stage not found: ${command.instanceId}` }
      }
      if (stage.kind === "quantize" || stage.kind === "dither") {
        return {
          ok: true,
          transition: {
            type: "set-effect-stage-params",
            instanceId: command.instanceId,
            params: command.params,
          },
        }
      }
      const effectId =
        typeof stage.params.effect === "string" ? stage.params.effect : null
      if (!effectId) {
        return {
          ok: false,
          error: `Stage ${command.instanceId} has no effect definition for param validation`,
        }
      }
      const def = findEffectDef(effectId)
      if (!def) {
        return {
          ok: false,
          error: `Unknown effect "${effectId}" for stage ${command.instanceId}`,
        }
      }
      const validationError = validateStageParams(command.params, def)
      if (validationError) {
        return { ok: false, error: validationError }
      }
      return {
        ok: true,
        transition: {
          type: "set-effect-stage-params",
          instanceId: command.instanceId,
          params: command.params,
        },
      }
    }
    default:
      return {
        ok: false,
        error: `Unsupported command: ${(command as { type: string }).type}`,
      }
  }
}
