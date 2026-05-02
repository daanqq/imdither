import {
  DITHER_ALGORITHM_OPTIONS,
  EFFECT_DEFINITIONS,
  PRESET_PALETTES,
  getDitherAlgorithmOption,
  type BayerSize,
  type ColorDepth,
  type DitherAlgorithm,
  type EditorSettings,
  type MatchingMode,
} from "@workspace/core"
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
import { Button } from "@workspace/ui/components/button"
import {
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@workspace/ui/components/drawer"
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
import { Slider } from "@workspace/ui/components/slider"
import { Switch } from "@workspace/ui/components/switch"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import {
  ChevronDownIcon,
  ChevronRightIcon,
  CopyIcon,
  GripVerticalIcon,
  MoreVerticalIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"
import * as React from "react"

import { ResponsiveDrawer } from "@/components/responsive-drawer"
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

type LookRecipeOption = {
  id: string
  name: string
  builtIn?: boolean
}

type StackTabProps = {
  settings: EditorSettings
  activePaletteColors: string[]
  lookRecipeId: string
  lookRecipes: readonly LookRecipeOption[]
  paletteSelectValue: string
  onCopyPaletteJson: () => void
  onDeleteLookRecipe: (id: string) => void
  onExportPaletteGpl: () => void
  onExportPaletteJson: () => void
  onExtractPalette: (size: 2 | 4 | 8 | 16 | 32) => void
  onImportPaletteFile: (file: File) => void
  onImportPaletteFromClipboard: () => void
  onRenameLookRecipe: (id: string, name: string) => void
  onSaveLookRecipe: (name: string) => void
  onSelectLookRecipe: (id: string) => void
  onSettingsTransition: (transition: SettingsTransition) => void
}

export function StackTab({
  settings,
  activePaletteColors,
  lookRecipeId,
  lookRecipes,
  paletteSelectValue,
  onDeleteLookRecipe,
  onExtractPalette,
  onRenameLookRecipe,
  onSaveLookRecipe,
  onSelectLookRecipe,
  onSettingsTransition,
}: StackTabProps) {
  const preStages = settings.effectStack.filter((s) => s.kind === "pre")
  const postStages = settings.effectStack.filter((s) => s.kind === "post")
  const quantize = settings.effectStack.find((s) => s.kind === "quantize")
  const dither = settings.effectStack.find((s) => s.kind === "dither")

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <LookRecipeBar
        activeId={lookRecipeId}
        recipes={lookRecipes}
        onDelete={onDeleteLookRecipe}
        onRename={onRenameLookRecipe}
        onSave={onSaveLookRecipe}
        onSelect={onSelectLookRecipe}
      />

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
        activePaletteColors={activePaletteColors}
        paletteSelectValue={paletteSelectValue}
        settings={settings}
        onExtractPalette={onExtractPalette}
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

function LookRecipeBar({
  activeId,
  recipes,
  onDelete,
  onRename,
  onSave,
  onSelect,
}: {
  activeId: string
  recipes: readonly LookRecipeOption[]
  onDelete: (id: string) => void
  onRename: (id: string, name: string) => void
  onSave: (name: string) => void
  onSelect: (id: string) => void
}) {
  const [saveName, setSaveName] = React.useState("")
  const [saveOpen, setSaveOpen] = React.useState(false)
  const [moreOpen, setMoreOpen] = React.useState(false)
  const [renaming, setRenaming] = React.useState(false)
  const [renameName, setRenameName] = React.useState("")
  const activeRecipe = recipes.find((recipe) => recipe.id === activeId)
  const isBuiltIn = activeRecipe?.builtIn === true

  function handleRenameConfirm() {
    if (!renameName.trim() || !activeRecipe) return
    onRename(activeRecipe.id, renameName.trim())
    setRenaming(false)
    setMoreOpen(false)
  }

  function handleMoreOpenChange(open: boolean) {
    setMoreOpen(open)
    if (!open) {
      setRenaming(false)
    }
  }

  return (
    <div className="flex min-w-0 items-center gap-1 border-b border-border pb-2">
      <span className="flex h-8 shrink-0 items-center border border-border px-3 font-mono text-xs text-muted-foreground uppercase">
        PRESET
      </span>
      <Select value={activeId} onValueChange={onSelect}>
        <SelectTrigger className="h-8 min-w-0 flex-1 justify-between">
          <span className="min-w-0 flex-1 truncate text-left">
            {activeRecipe?.name ?? "Custom"}
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="custom">Custom</SelectItem>
            {recipes.map((recipe) => (
              <SelectItem key={recipe.id} value={recipe.id}>
                {recipe.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Popover open={saveOpen} onOpenChange={setSaveOpen}>
        <PopoverTrigger asChild>
          <Button aria-label="Save look recipe" size="icon" variant="ghost">
            <PlusIcon className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-56">
          <div className="grid gap-2">
            <Input
              aria-label="Look recipe name"
              value={saveName}
              onChange={(event) => setSaveName(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && saveName.trim()) {
                  onSave(saveName.trim())
                  setSaveName("")
                  setSaveOpen(false)
                }
              }}
            />
            <Button
              disabled={!saveName.trim()}
              onClick={() => {
                onSave(saveName.trim())
                setSaveName("")
                setSaveOpen(false)
              }}
            >
              Save
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      <Popover open={moreOpen} onOpenChange={handleMoreOpenChange}>
        <PopoverTrigger asChild>
          <Button
            aria-label="Look recipe menu"
            size="icon"
            variant="ghost"
            disabled={isBuiltIn}
          >
            <MoreVerticalIcon className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-56">
          {renaming ? (
            <div className="grid gap-2">
              <Input
                aria-label="Rename look recipe"
                value={renameName}
                onChange={(event) => setRenameName(event.currentTarget.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleRenameConfirm()
                  }
                }}
              />
              <Button
                disabled={!renameName.trim()}
                onClick={handleRenameConfirm}
              >
                Rename
              </Button>
            </div>
          ) : (
            <div className="grid gap-1">
              <Button
                disabled={!activeRecipe || isBuiltIn}
                variant="ghost"
                className="justify-start"
                onClick={() => {
                  if (!activeRecipe) return
                  setRenaming(true)
                  setRenameName(activeRecipe.name)
                }}
              >
                Rename
              </Button>
              <Button
                disabled={!activeRecipe || isBuiltIn}
                variant="ghost"
                className="justify-start"
                onClick={() =>
                  activeRecipe ? onDelete(activeRecipe.id) : undefined
                }
              >
                Delete
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
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
  activePaletteColors = [],
  emptyAction,
  label,
  paletteSelectValue = "custom",
  settings,
  stages,
  onCopyPaletteJson,
  onExportPaletteGpl,
  onExportPaletteJson,
  onExtractPalette,
  onImportPaletteFromClipboard,
  onSettingsTransition,
}: {
  activePaletteColors?: string[]
  emptyAction?: React.ReactNode
  label: string
  paletteSelectValue?: string
  settings?: EditorSettings
  stages: EditorSettings["effectStack"]
  onCopyPaletteJson?: () => void
  onExportPaletteGpl?: () => void
  onExportPaletteJson?: () => void
  onExtractPalette?: (size: 2 | 4 | 8 | 16 | 32) => void
  onImportPaletteFromClipboard?: () => void
  onSettingsTransition: (transition: SettingsTransition) => void
}) {
  const isOptionalGroup =
    stages.length > 0 && (stages[0].kind === "pre" || stages[0].kind === "post")
  const groupKind = isOptionalGroup ? stages[0].kind : null
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id)
    const overId = event.over ? String(event.over.id) : null

    if (!groupKind || !overId || activeId === overId) {
      return
    }

    const fromIndex = stages.findIndex((stage) => stage.instanceId === activeId)
    const toIndex = stages.findIndex((stage) => stage.instanceId === overId)

    if (fromIndex >= 0 && toIndex >= 0) {
      onSettingsTransition({
        type: "reorder-effect-stages",
        group: groupKind as "pre" | "post",
        fromIndex,
        toIndex,
      })
    }
  }

  const rows = stages.map((stage, index) => (
    <StageRow
      key={stage.instanceId}
      activePaletteColors={activePaletteColors}
      index={index}
      isFirst={index === 0}
      isLast={index === stages.length - 1}
      paletteSelectValue={paletteSelectValue}
      settings={settings}
      stage={stage}
      totalCount={stages.length}
      onCopyPaletteJson={onCopyPaletteJson}
      onExportPaletteGpl={onExportPaletteGpl}
      onExportPaletteJson={onExportPaletteJson}
      onExtractPalette={onExtractPalette}
      onImportPaletteFromClipboard={onImportPaletteFromClipboard}
      onSettingsTransition={onSettingsTransition}
    />
  ))

  return (
    <div className="min-w-0">
      <div className="mb-1.5 font-mono text-xs tracking-wider text-muted-foreground uppercase">
        {label}
      </div>
      <div className="min-w-0 space-y-1.5">
        {groupKind ? (
          <DndContext
            collisionDetection={closestCenter}
            sensors={sensors}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={stages.map((stage) => stage.instanceId)}
              strategy={verticalListSortingStrategy}
            >
              {rows}
            </SortableContext>
          </DndContext>
        ) : (
          rows
        )}
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
  activePaletteColors = [],
  index,
  isFirst,
  isLast,
  paletteSelectValue = "custom",
  settings,
  stage,
  totalCount,
  onCopyPaletteJson,
  onExportPaletteGpl,
  onExportPaletteJson,
  onExtractPalette,
  onImportPaletteFromClipboard,
  onSettingsTransition,
}: {
  activePaletteColors?: string[]
  index: number
  isFirst: boolean
  isLast: boolean
  paletteSelectValue?: string
  settings?: EditorSettings
  stage: EditorSettings["effectStack"][0]
  totalCount: number
  onCopyPaletteJson?: () => void
  onExportPaletteGpl?: () => void
  onExportPaletteJson?: () => void
  onExtractPalette?: (size: 2 | 4 | 8 | 16 | 32) => void
  onImportPaletteFromClipboard?: () => void
  onSettingsTransition: (transition: SettingsTransition) => void
}) {
  const isCore = stage.kind === "quantize" || stage.kind === "dither"
  const [expanded, setExpanded] = React.useState(isCore)
  const isReorderable = !isCore && totalCount > 1
  const sortable = useSortable({ id: stage.instanceId, disabled: isCore })
  const effectId =
    typeof stage.params.effect === "string" ? stage.params.effect : null
  const effectDef = effectId
    ? (EFFECT_DEFINITIONS.find((d) => d.id === effectId) ?? null)
    : null
  const effectLabel = effectId
    ? effectId.replace(/^(pre|post)\./, "")
    : "Unknown"

  return (
    <div
      ref={sortable.setNodeRef}
      className="min-w-0 rounded border border-border bg-background/30"
      style={{
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
      }}
    >
      <div className="flex min-w-0 items-center justify-between gap-1 px-2 py-1.5">
        {!isCore ? (
          <button
            ref={sortable.setActivatorNodeRef}
            aria-label="Drag stage"
            className="flex h-6 w-5 shrink-0 items-center justify-center text-muted-foreground"
            type="button"
            {...sortable.attributes}
            {...sortable.listeners}
          >
            <GripVerticalIcon className="size-3.5" />
          </button>
        ) : null}
        <span className="shrink-0 font-mono text-xs text-muted-foreground">
          {index + 1}
        </span>
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-1 text-left"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronDownIcon className="size-3 shrink-0" />
          ) : (
            <ChevronRightIcon className="size-3 shrink-0" />
          )}
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
              <StageActions
                index={index}
                isFirst={isFirst}
                isLast={isLast}
                stage={stage}
                onSettingsTransition={onSettingsTransition}
              />
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
      {expanded ? (
        <div className="border-t border-border px-2 py-1.5">
          {isCore && settings ? (
            <CoreParamsEditor
              activePaletteColors={activePaletteColors}
              paletteSelectValue={paletteSelectValue}
              settings={settings}
              stageKind={stage.kind as "quantize" | "dither"}
              onCopyPaletteJson={onCopyPaletteJson}
              onExportPaletteGpl={onExportPaletteGpl}
              onExportPaletteJson={onExportPaletteJson}
              onExtractPalette={onExtractPalette}
              onImportPaletteFromClipboard={onImportPaletteFromClipboard}
              onSettingsTransition={onSettingsTransition}
            />
          ) : (
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
          )}
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
  stage: EditorSettings["effectStack"][0]
  onSettingsTransition: (transition: SettingsTransition) => void
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          aria-label="Stage actions"
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
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
            Move up
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
            Move down
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function CoreParamsEditor({
  activePaletteColors,
  paletteSelectValue,
  settings,
  stageKind,
  onCopyPaletteJson,
  onExportPaletteGpl,
  onExportPaletteJson,
  onExtractPalette,
  onImportPaletteFromClipboard,
  onSettingsTransition,
}: {
  activePaletteColors: string[]
  paletteSelectValue: string
  settings: EditorSettings
  stageKind: "quantize" | "dither"
  onCopyPaletteJson?: () => void
  onExportPaletteGpl?: () => void
  onExportPaletteJson?: () => void
  onExtractPalette?: (size: 2 | 4 | 8 | 16 | 32) => void
  onImportPaletteFromClipboard?: () => void
  onSettingsTransition: (transition: SettingsTransition) => void
}) {
  if (stageKind === "quantize") {
    return (
      <div className="grid min-w-0 gap-2">
        <ParamSelect
          label="Palette"
          value={paletteSelectValue}
          options={[
            { id: "custom", label: "Custom" },
            ...PRESET_PALETTES.map((palette) => ({
              id: palette.id,
              label: palette.name,
            })),
          ]}
          onValueChange={(paletteId) => {
            if (paletteId === "custom") {
              onSettingsTransition({
                type: "set-custom-palette",
                colors: activePaletteColors,
              })
            } else {
              onSettingsTransition({ type: "set-palette", paletteId })
            }
          }}
        />
        <ColorDepthControl
          value={settings.colorDepth}
          onChange={(colorDepth) =>
            onSettingsTransition({ type: "set-color-depth", colorDepth })
          }
        />
        <ParamSelect
          label="Matching"
          value={settings.matchingMode}
          options={[
            { id: "rgb", label: "RGB" },
            { id: "perceptual", label: "Perceptual" },
          ]}
          onValueChange={(matchingMode) =>
            onSettingsTransition({
              type: "set-matching-mode",
              matchingMode: matchingMode as MatchingMode,
            })
          }
        />
        <div className="grid gap-1">
          <span className="font-mono text-[10px] text-muted-foreground">
            Palette Swatches
          </span>
          <div className="grid grid-cols-8 gap-1">
            {activePaletteColors.slice(0, 32).map((color, index) => (
              <span
                key={`${color}-${index}`}
                className="aspect-square border border-border"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <StackPaletteEditorDrawer
            onCopyPaletteJson={onCopyPaletteJson}
            onExportPaletteGpl={onExportPaletteGpl}
            onExportPaletteJson={onExportPaletteJson}
            onExtractPalette={onExtractPalette}
            onImportPaletteFromClipboard={onImportPaletteFromClipboard}
          />
        </div>
      </div>
    )
  }

  const selectedAlgorithm = getDitherAlgorithmOption(settings.algorithm)

  return (
    <div className="grid min-w-0 gap-2">
      <ParamSelect
        label="Algorithm"
        value={settings.algorithm}
        options={DITHER_ALGORITHM_OPTIONS.map((algorithm) => ({
          id: algorithm.id,
          label: algorithm.label,
        }))}
        onValueChange={(algorithm) =>
          onSettingsTransition({
            type: "set-algorithm",
            algorithm: algorithm as DitherAlgorithm,
          })
        }
      />
      {selectedAlgorithm.capabilities.bayerSize ? (
        <div className="grid gap-1">
          <span className="font-mono text-[10px] text-muted-foreground">
            Bayer Matrix
          </span>
          <ToggleGroup
            type="single"
            value={String(settings.bayerSize)}
            variant="outline"
            className="w-full"
            onValueChange={(value) => {
              if (value) {
                onSettingsTransition({
                  type: "set-bayer-size",
                  bayerSize: Number(value) as BayerSize,
                })
              }
            }}
          >
            {[2, 4, 8].map((size) => (
              <ToggleGroupItem
                key={size}
                value={String(size)}
                aria-label={`${size} by ${size}`}
                className="flex-1"
              >
                {size}x{size}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      ) : null}
    </div>
  )
}

function StackPaletteEditorDrawer({
  onCopyPaletteJson,
  onExportPaletteGpl,
  onExportPaletteJson,
  onExtractPalette,
  onImportPaletteFromClipboard,
}: {
  onCopyPaletteJson?: () => void
  onExportPaletteGpl?: () => void
  onExportPaletteJson?: () => void
  onExtractPalette?: (size: 2 | 4 | 8 | 16 | 32) => void
  onImportPaletteFromClipboard?: () => void
}) {
  return (
    <ResponsiveDrawer>
      <DrawerTrigger asChild>
        <Button type="button" variant="outline" className="justify-start">
          Edit colors
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Custom Palette Editor</DrawerTitle>
          <DrawerDescription>
            Add, extract, copy, import, or export custom palette colors.
          </DrawerDescription>
        </DrawerHeader>
        <div className="grid gap-2 p-3">
          <Button variant="outline" onClick={() => onExtractPalette?.(8)}>
            Extract palette
          </Button>
          <Button variant="outline" onClick={onImportPaletteFromClipboard}>
            Paste palette
          </Button>
          <Button variant="outline" onClick={onCopyPaletteJson}>
            <CopyIcon data-icon="inline-start" />
            Copy palette JSON
          </Button>
          <Button variant="outline" onClick={onExportPaletteJson}>
            Export JSON
          </Button>
          <Button variant="outline" onClick={onExportPaletteGpl}>
            Export GPL
          </Button>
        </div>
      </DrawerContent>
    </ResponsiveDrawer>
  )
}

function ParamSelect({
  label,
  options,
  value,
  onValueChange,
}: {
  label: string
  options: { id: string; label: string }[]
  value: string
  onValueChange: (value: string) => void
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-2">
      <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
        {label}
      </span>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-7 min-w-0 flex-1 justify-between font-mono text-xs">
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
    </div>
  )
}

function ColorDepthControl({
  value,
  onChange,
}: {
  value: ColorDepth
  onChange: (value: ColorDepth) => void
}) {
  const selected = value.mode === "full" ? "full" : String(value.count)

  return (
    <div className="grid gap-1">
      <span className="font-mono text-[10px] text-muted-foreground">
        Color Depth
      </span>
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
          <ToggleGroupItem key={item} value={item} className="flex-1">
            {item === "full" ? "Full" : item}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
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
  const entries = getEffectParamEntries(params, effectDef)

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
            <Slider
              id={id}
              className="w-24"
              defaultValue={[value]}
              max={max}
              min={min}
              step={step}
              onValueCommit={([next]) => onChange(next)}
            />
            <span className="w-10 border border-border px-1 py-0.5 text-right font-mono text-[10px] text-muted-foreground tabular-nums">
              {displayValue}
            </span>
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
