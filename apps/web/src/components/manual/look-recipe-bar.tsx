import * as React from "react"
import { Button } from "@workspace/ui/components/button"
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
} from "@workspace/ui/components/select"
import { MoreVerticalIcon, PlusIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { getLocalizedBuiltInRecipeName } from "@/lib/i18n-labels"

export type LookRecipeOption = {
  id: string
  name: string
  builtIn?: boolean
}

export function LookRecipeBar({
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
  const { t } = useTranslation()
  const [state, updateState] = React.useReducer(
    (
      prev: {
        saveName: string
        saveOpen: boolean
        moreOpen: boolean
        renaming: boolean
        renameName: string
      },
      next: Partial<{
        saveName: string
        saveOpen: boolean
        moreOpen: boolean
        renaming: boolean
        renameName: string
      }>
    ) => ({ ...prev, ...next }),
    {
      saveName: "",
      saveOpen: false,
      moreOpen: false,
      renaming: false,
      renameName: "",
    }
  )
  const activeRecipe = recipes.find((recipe) => recipe.id === activeId)
  const isBuiltIn = activeRecipe?.builtIn === true

  function handleRenameConfirm() {
    if (!state.renameName.trim() || !activeRecipe) return
    onRename(activeRecipe.id, state.renameName.trim())
    updateState({ renaming: false, moreOpen: false })
  }

  function handleMoreOpenChange(open: boolean) {
    updateState({ moreOpen: open, renaming: open ? state.renaming : false })
  }

  return (
    <div
      data-slot="look-recipe-bar"
      className="flex min-w-0 items-center gap-1.5 border-b border-border/70 pb-2.5"
    >
      <Select value={activeId} onValueChange={onSelect}>
        <SelectTrigger
          aria-label={t("manual.lookRecipe")}
          className="h-8 w-full min-w-0 flex-1 justify-between font-sans text-xs"
        >
          <span className="min-w-0 flex-1 truncate text-left">
            {activeRecipe
              ? getLocalizedBuiltInRecipeName(activeRecipe, t)
              : t("manual.custom")}
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="custom">{t("manual.custom")}</SelectItem>
            {recipes.map((recipe) => (
              <SelectItem key={recipe.id} value={recipe.id}>
                {getLocalizedBuiltInRecipeName(recipe, t)}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Popover
        open={state.saveOpen}
        onOpenChange={(open) => updateState({ saveOpen: open })}
      >
        <PopoverTrigger asChild>
          <Button
            aria-label={t("manual.saveLookRecipe")}
            title={t("manual.saveLookRecipe")}
            size="icon"
            variant="outline"
            className="shrink-0"
          >
            <PlusIcon className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-56">
          <div className="grid gap-2">
            <Input
              aria-label={t("manual.lookRecipeName")}
              placeholder={t("looks.savePlaceholder")}
              value={state.saveName}
              onChange={(event) =>
                updateState({ saveName: event.currentTarget.value })
              }
              onKeyDown={(event) => {
                if (event.key === "Enter" && state.saveName.trim()) {
                  onSave(state.saveName.trim())
                  updateState({ saveName: "", saveOpen: false })
                }
              }}
            />
            <Button
              disabled={!state.saveName.trim()}
              onClick={() => {
                onSave(state.saveName.trim())
                updateState({ saveName: "", saveOpen: false })
              }}
            >
              {t("manual.save")}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      <Popover open={state.moreOpen} onOpenChange={handleMoreOpenChange}>
        <PopoverTrigger asChild>
          <Button
            aria-label={t("manual.lookRecipeMenu")}
            title={t("manual.lookRecipeMenu")}
            size="icon"
            variant="ghost"
            className="shrink-0"
            disabled={isBuiltIn}
          >
            <MoreVerticalIcon className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-56">
          {state.renaming ? (
            <div className="grid gap-2">
              <Input
                aria-label={t("manual.renameLook")}
                value={state.renameName}
                onChange={(event) =>
                  updateState({ renameName: event.currentTarget.value })
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleRenameConfirm()
                  }
                }}
              />
              <Button
                disabled={!state.renameName.trim()}
                onClick={handleRenameConfirm}
              >
                {t("manual.rename")}
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
                  updateState({ renaming: true, renameName: activeRecipe.name })
                }}
              >
                {t("manual.rename")}
              </Button>
              <Button
                disabled={!activeRecipe || isBuiltIn}
                variant="ghost"
                className="justify-start"
                onClick={() => {
                  if (!activeRecipe) return
                  onDelete(activeRecipe.id)
                  updateState({ moreOpen: false })
                }}
              >
                {t("manual.delete")}
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
