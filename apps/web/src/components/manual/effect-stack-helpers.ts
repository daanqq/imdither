import { DEFAULT_SETTINGS, type EditorSettings } from "@workspace/core"

export const PRE_EFFECTS = [
  { id: "pre.blur", labelKey: "manual.effectBlur" },
  { id: "pre.contrast-shape", labelKey: "manual.effectContrastShape" },
] as const

export const POST_EFFECTS = [
  { id: "post.grain", labelKey: "manual.effectGrain" },
  { id: "post.edge-threshold", labelKey: "manual.effectEdgeThreshold" },
  { id: "post.paper-noise", labelKey: "manual.effectPaperNoise" },
  { id: "post.crt-bloom", labelKey: "manual.effectCrtBloom" },
  { id: "post.invert", labelKey: "manual.effectInvert" },
] as const

const EFFECT_LABEL_KEYS: Record<string, string> = {
  "pre.blur": "manual.effectBlur",
  "pre.contrast-shape": "manual.effectContrastShape",
  "post.grain": "manual.effectGrain",
  "post.edge-threshold": "manual.effectEdgeThreshold",
  "post.paper-noise": "manual.effectPaperNoise",
  "post.crt-bloom": "manual.effectCrtBloom",
  "post.invert": "manual.effectInvert",
}

const EFFECT_PARAM_LABEL_KEYS: Record<string, string> = {
  radius: "manual.effectParams.radius",
  amount: "manual.effectParams.amount",
  curve: "manual.effectParams.curve",
  seed: "manual.effectParams.seed",
  threshold: "manual.effectParams.threshold",
  strength: "manual.effectParams.strength",
  scale: "manual.effectParams.scale",
  intensity: "manual.effectParams.intensity",
}

const EFFECT_PARAM_OPTION_KEYS: Record<string, string> = {
  soft: "manual.effectParamOptions.soft",
  medium: "manual.effectParamOptions.medium",
  hard: "manual.effectParamOptions.hard",
}

export function getEffectLabelKey(effectId: string | null): string | null {
  if (!effectId) {
    return null
  }
  return EFFECT_LABEL_KEYS[effectId] ?? null
}

export function getEffectParamLabelKey(paramName: string): string | null {
  return EFFECT_PARAM_LABEL_KEYS[paramName] ?? null
}

export function getEffectParamOptionLabelKey(option: string): string | null {
  return EFFECT_PARAM_OPTION_KEYS[option] ?? null
}

export function getEffectParamUnit(paramName: string): string | undefined {
  if (paramName === "radius") {
    return "px"
  }
  return undefined
}

export function getEffectParamStep(
  effectId: string | null,
  paramName: string,
  bound: { min: number; max: number }
): number {
  if (effectId === "post.crt-bloom" && paramName === "radius") {
    return 1
  }
  if (paramName === "scale") {
    return 0.5
  }
  if (bound.max - bound.min > 2) {
    return 0.25
  }
  return 0.05
}

export function isToneModified(settings: EditorSettings): boolean {
  const { preprocess } = settings
  const defaults = DEFAULT_SETTINGS.preprocess
  return (
    preprocess.brightness !== defaults.brightness ||
    preprocess.contrast !== defaults.contrast ||
    preprocess.gamma !== defaults.gamma ||
    preprocess.invert !== defaults.invert ||
    preprocess.colorMode !== defaults.colorMode
  )
}

export type ExpandedStagesState = {
  knownIds: readonly string[]
  expandedIds: readonly string[]
  pendingAutoExpand: boolean
}

export function createInitialExpandedStagesState(
  stageIds: readonly string[]
): ExpandedStagesState {
  return {
    knownIds: [...stageIds],
    expandedIds: [],
    pendingAutoExpand: false,
  }
}

export function markPendingAutoExpand(
  state: ExpandedStagesState
): ExpandedStagesState {
  if (state.pendingAutoExpand) {
    return state
  }
  return {
    ...state,
    pendingAutoExpand: true,
  }
}

export function reconcileExpandedStages(
  state: ExpandedStagesState,
  nextStageIds: readonly string[]
): ExpandedStagesState {
  const knownSet = new Set(state.knownIds)
  const nextSet = new Set(nextStageIds)
  const addedIds = nextStageIds.filter((id) => !knownSet.has(id))

  const nextExpanded = state.expandedIds.filter((id) => nextSet.has(id))
  if (state.pendingAutoExpand && addedIds.length > 0) {
    for (const id of addedIds) {
      if (!nextExpanded.includes(id)) {
        nextExpanded.push(id)
      }
    }
  }

  return {
    knownIds: [...nextStageIds],
    expandedIds: nextExpanded,
    pendingAutoExpand: addedIds.length > 0 ? false : state.pendingAutoExpand,
  }
}

export function toggleStageExpanded(
  state: ExpandedStagesState,
  instanceId: string
): ExpandedStagesState {
  const isExpanded = state.expandedIds.includes(instanceId)
  return {
    ...state,
    expandedIds: isExpanded
      ? state.expandedIds.filter((id) => id !== instanceId)
      : [...state.expandedIds, instanceId],
  }
}

export function areStageIdListsEqual(
  left: readonly string[],
  right: readonly string[]
): boolean {
  if (left.length !== right.length) {
    return false
  }
  for (let i = 0; i < left.length; i += 1) {
    if (left[i] !== right[i]) {
      return false
    }
  }
  return true
}
