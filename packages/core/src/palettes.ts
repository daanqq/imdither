import type { EditorSettings, Palette, PaletteColor, Rgb } from "./types"

export const PRESET_PALETTES: Palette[] = [
  {
    id: "black-white",
    name: "Black / White",
    defaultColorMode: "grayscale-first",
    colors: [color("Black", "#000000"), color("White", "#ffffff")],
  },
  {
    id: "gray-4",
    name: "4 Gray",
    defaultColorMode: "grayscale-first",
    colors: [
      color("Ink", "#000000"),
      color("Shadow", "#555555"),
      color("Mist", "#aaaaaa"),
      color("Paper", "#ffffff"),
    ],
  },
  {
    id: "game-boy",
    name: "Game Boy",
    defaultColorMode: "grayscale-first",
    colors: [
      color("Deep", "#0f380f"),
      color("Pine", "#306230"),
      color("Moss", "#8bac0f"),
      color("LCD", "#9bbc0f"),
    ],
  },
  {
    id: "amber-terminal",
    name: "Amber Terminal",
    defaultColorMode: "grayscale-first",
    colors: [
      color("Black Glass", "#1b1200"),
      color("Burnt Amber", "#5a3200"),
      color("Signal", "#d0831e"),
      color("Phosphor", "#ffd37a"),
    ],
  },
  {
    id: "cga-pop",
    name: "CGA Pop",
    defaultColorMode: "color-preserve",
    colors: [
      color("Black", "#000000"),
      color("Cyan", "#00aaaa"),
      color("Magenta", "#aa00aa"),
      color("White", "#ffffff"),
    ],
  },
  {
    id: "redline",
    name: "Redline",
    defaultColorMode: "color-preserve",
    colors: [
      color("Black", "#000000"),
      color("Graphite", "#333333"),
      color("Signal Red", "#d71921"),
      color("White", "#ffffff"),
    ],
  },
  {
    id: "sea-glass",
    name: "Sea Glass",
    defaultColorMode: "color-preserve",
    colors: [
      color("Black", "#000000"),
      color("Deep Slate", "#173747"),
      color("Sea Iris", "#2aa7c8"),
      color("Pearl", "#e9fbff"),
    ],
  },
]

export function resolvePalette(settings: EditorSettings): Palette {
  if (settings.customPalette?.length) {
    return {
      id: "custom",
      name: "Custom",
      defaultColorMode: settings.preprocess.colorMode,
      colors: settings.customPalette.map((hex, index) =>
        color(`Custom ${index + 1}`, hex)
      ),
    }
  }

  return (
    PRESET_PALETTES.find((palette) => palette.id === settings.paletteId) ??
    PRESET_PALETTES[0]
  )
}

export function hexToRgb(hex: string): Rgb {
  const normalized = hex.replace("#", "")
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((part) => `${part}${part}`)
          .join("")
      : normalized

  return [
    Number.parseInt(full.slice(0, 2), 16),
    Number.parseInt(full.slice(2, 4), 16),
    Number.parseInt(full.slice(4, 6), 16),
  ]
}

function color(name: string, hex: string): PaletteColor {
  return {
    name,
    hex,
    rgb: hexToRgb(hex),
  }
}
