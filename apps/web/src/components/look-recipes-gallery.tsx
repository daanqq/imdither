import * as React from "react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
import { BookmarkIcon, CheckIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { useTranslation } from "react-i18next"

import {
  getLocalizedAlgorithmLabel,
  getLocalizedBuiltInRecipeName,
} from "@/lib/i18n-labels"
import type { LookRecipe } from "@/lib/look-recipes"
import { resolvePaletteColors } from "@/lib/palette-preview"

type LookRecipesGalleryProps = {
  activeRecipeId: string
  recipes: readonly LookRecipe[]
  onDeleteRecipe: (id: string) => void
  onSaveRecipe: (name: string) => void
  onSelectRecipe: (id: string) => void
}

export const LookRecipesGallery = React.memo(function LookRecipesGallery({
  activeRecipeId,
  recipes,
  onDeleteRecipe,
  onSaveRecipe,
  onSelectRecipe,
}: LookRecipesGalleryProps) {
  const { t } = useTranslation()
  const [saveOpen, setSaveOpen] = React.useState(false)
  const [draftName, setDraftName] = React.useState("")

  const savedRecipes = React.useMemo(
    () => recipes.filter((recipe) => !recipe.builtIn),
    [recipes]
  )
  const builtInRecipes = React.useMemo(
    () => recipes.filter((recipe) => recipe.builtIn),
    [recipes]
  )

  function handleSaveSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = draftName.trim()

    if (!trimmed) {
      return
    }

    onSaveRecipe(trimmed)
    setDraftName("")
    setSaveOpen(false)
  }

  return (
    <section
      data-slot="look-recipes-gallery"
      className="min-w-0 border-t border-border/80 pt-3"
    >
      <div className="flex min-w-0 items-center justify-between gap-2 px-0.5 pb-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <BookmarkIcon className="size-3.5 shrink-0 text-primary" />
          <h2 className="truncate font-sans text-xs leading-none font-semibold text-foreground">
            {t("looks.recipesHeading")}
          </h2>
        </div>
        <Button
          type="button"
          aria-expanded={saveOpen}
          className="h-6 shrink-0 px-2 text-[11px]"
          size="xs"
          variant="outline"
          onClick={() => setSaveOpen((open) => !open)}
        >
          <PlusIcon data-icon="inline-start" className="size-3" />
          {t("looks.saveCurrent")}
        </Button>
      </div>

      {saveOpen ? (
        <form
          className="mb-2.5 flex items-center gap-1.5 rounded-md border border-border bg-[var(--surface-control)]/70 p-1.5"
          onSubmit={handleSaveSubmit}
        >
          <Input
            aria-label={t("manual.lookRecipeName")}
            className="h-7 flex-1 bg-[var(--surface-control-active)] text-xs"
            placeholder={t("looks.savePlaceholder")}
            value={draftName}
            onChange={(event) => setDraftName(event.currentTarget.value)}
          />
          <Button
            type="submit"
            className="h-7 shrink-0 px-2.5 text-xs"
            disabled={!draftName.trim()}
            size="sm"
          >
            {t("manual.save")}
          </Button>
        </form>
      ) : null}

      <div className="space-y-2.5">
        {savedRecipes.length > 0 ? (
          <div className="space-y-1.5">
            <div className="px-0.5 font-sans text-[11px] font-medium text-muted-foreground">
              {t("looks.savedGroup")}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {savedRecipes.map((recipe) => (
                <LookRecipeCard
                  key={recipe.id}
                  active={activeRecipeId === recipe.id}
                  recipe={recipe}
                  onDelete={onDeleteRecipe}
                  onSelect={onSelectRecipe}
                />
              ))}
            </div>
          </div>
        ) : null}

        {builtInRecipes.length > 0 ? (
          <div className="space-y-1.5">
            {savedRecipes.length > 0 ? (
              <div className="px-0.5 font-sans text-[11px] font-medium text-muted-foreground">
                {t("looks.builtInGroup")}
              </div>
            ) : null}
            <div className="grid grid-cols-2 gap-1.5">
              {builtInRecipes.map((recipe) => (
                <LookRecipeCard
                  key={recipe.id}
                  active={activeRecipeId === recipe.id}
                  recipe={recipe}
                  onSelect={onSelectRecipe}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
})

function LookRecipeCard({
  active,
  recipe,
  onDelete,
  onSelect,
}: {
  active: boolean
  recipe: LookRecipe
  onDelete?: (id: string) => void
  onSelect: (id: string) => void
}) {
  const { t } = useTranslation()
  const swatches = resolvePaletteColors(
    recipe.style.paletteId,
    recipe.style.customPalette
  )
  const algorithmLabel = getLocalizedAlgorithmLabel(recipe.style.algorithm, t)
  const displayName = getLocalizedBuiltInRecipeName(recipe, t)
  const extraEffectsCount = recipe.style.effectStack.filter(
    (stage) => (stage.kind === "pre" || stage.kind === "post") && stage.enabled
  ).length

  return (
    <div
      data-active={active}
      data-slot="look-recipe-card"
      className={cn(
        "group relative flex min-w-0 flex-col overflow-hidden rounded-md border border-border bg-[var(--surface-control)]/55 transition-[background-color,border-color,box-shadow] duration-150 ease-out hover:border-foreground/25 hover:bg-[var(--surface-control-active)]/80",
        active &&
          "border-primary/65 bg-[var(--surface-control-active)] shadow-[var(--shadow-control)] ring-1 ring-primary/20"
      )}
    >
      <button
        type="button"
        aria-pressed={active}
        className="flex w-full min-w-0 flex-col gap-1.5 p-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/40 active:translate-y-px"
        onClick={() => onSelect(recipe.id)}
      >
        <span
          aria-hidden="true"
          data-slot="palette-swatch-bar"
          className="flex h-1.5 w-full overflow-hidden rounded-[2px] border border-border/50"
        >
          {swatches.map((hex, index) => (
            <span
              key={`${recipe.id}-${hex}-${index}`}
              className="h-full flex-1"
              style={{ backgroundColor: hex }}
            />
          ))}
        </span>
        <span className="flex min-w-0 items-center justify-between gap-1">
          <span className="truncate font-sans text-xs leading-tight font-medium text-foreground">
            {displayName}
          </span>
          {active ? (
            <span
              aria-hidden="true"
              className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
            >
              <CheckIcon className="size-2.5" />
            </span>
          ) : null}
        </span>
        <span className="flex min-w-0 items-center justify-between gap-1 font-mono text-[10px] leading-none text-muted-foreground">
          <span className="truncate">{algorithmLabel}</span>
          {extraEffectsCount > 0 ? (
            <span className="shrink-0 rounded-xs bg-muted/90 px-1 py-0.5 text-[9px] text-foreground/75">
              {t("looks.effectsCount", { count: extraEffectsCount })}
            </span>
          ) : null}
        </span>
      </button>
      {!recipe.builtIn && onDelete ? (
        <Button
          type="button"
          aria-label={t("looks.deleteRecipe", { name: recipe.name })}
          className="absolute top-1 right-1 size-5 bg-popover/85 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100"
          size="icon-xs"
          variant="ghost"
          onClick={(event) => {
            event.stopPropagation()
            onDelete(recipe.id)
          }}
        >
          <Trash2Icon className="size-3" />
        </Button>
      ) : null}
    </div>
  )
}
