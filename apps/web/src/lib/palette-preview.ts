import { PRESET_PALETTES } from "@workspace/core"

export function resolvePaletteColors(
  paletteId: string,
  customPalette?: readonly string[] | null
): string[] {
  if (customPalette && customPalette.length > 0) {
    return [...customPalette]
  }

  const preset = PRESET_PALETTES.find((palette) => palette.id === paletteId)

  if (preset) {
    return preset.colors.map((color) => color.hex)
  }

  return PRESET_PALETTES[0].colors.map((color) => color.hex)
}

export function resolvePaletteChipLabel(
  paletteId: string,
  customPalette: readonly string[] | null | undefined,
  customLabel: string
): string {
  if (customPalette && customPalette.length > 0) {
    return `${customLabel} · ${customPalette.length}`
  }

  const preset = PRESET_PALETTES.find((palette) => palette.id === paletteId)

  if (!preset) {
    return paletteId
  }

  const count = preset.colors.length
  const endsWithCount = new RegExp(`\\b${count}$`).test(preset.name.trim())

  return endsWithCount ? preset.name : `${preset.name} · ${count}`
}
