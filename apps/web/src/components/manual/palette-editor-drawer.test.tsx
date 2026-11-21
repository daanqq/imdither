import { renderToStaticMarkup } from "react-dom/server"
import * as React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { PaletteEditorDrawer } from "./palette-editor-drawer"

type DrawerContentMockProps = {
  children?: React.ReactNode
  overlayVariant?: "default" | "subtle"
}

type InputMockProps = React.ComponentProps<"input">
type ButtonMockProps = React.ComponentProps<"button">

const drawerContentRenders: DrawerContentMockProps[] = []
const inputRenders: InputMockProps[] = []
const buttonRenders: ButtonMockProps[] = []
const toggleItemRenders: Array<{
  onClick?: () => void
  value?: string
}> = []

vi.mock("@/components/responsive-drawer", () => ({
  ResponsiveDrawer: ({ children }: { children: React.ReactNode }) => (
    <div data-slot="responsive-drawer">{children}</div>
  ),
}))

vi.mock("@workspace/ui/components/drawer", () => ({
  DrawerClose: ({ children }: { children: React.ReactNode }) => (
    <span data-slot="drawer-close">{children}</span>
  ),
  DrawerContent: ({ children, overlayVariant }: DrawerContentMockProps) => {
    drawerContentRenders.push({ overlayVariant })
    return (
      <div
        data-overlay-variant={overlayVariant ?? "default"}
        data-slot="drawer-content"
      >
        {children}
      </div>
    )
  },
  DrawerDescription: ({ children }: { children: React.ReactNode }) => (
    <p>{children}</p>
  ),
  DrawerHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DrawerTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
  DrawerTrigger: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}))

vi.mock("@workspace/ui/components/toggle-group", () => ({
  ToggleGroup: ({
    children,
    onValueChange,
  }: {
    children: React.ReactNode
    onValueChange?: (value: string) => void
  }) => (
    <div>
      {React.Children.map(children, (child) =>
        React.isValidElement<{ onClick?: () => void; value?: string }>(child)
          ? React.cloneElement(child, {
              onClick: () => {
                child.props.onClick?.()
                onValueChange?.(child.props.value ?? "")
              },
            })
          : child
      )}
    </div>
  ),
  ToggleGroupItem: ({
    children,
    onClick,
    value,
  }: {
    children: React.ReactNode
    onClick?: () => void
    value?: string
  }) => {
    toggleItemRenders.push({ onClick, value })
    return (
      <button type="button" data-value={value} onClick={onClick}>
        {children}
      </button>
    )
  },
}))

vi.mock("@workspace/ui/components/input", () => ({
  Input: (props: InputMockProps) => {
    inputRenders.push(props)
    return <input {...props} />
  },
}))

vi.mock("@workspace/ui/components/button", () => ({
  Button: (props: ButtonMockProps) => {
    buttonRenders.push(props)
    return <button {...props} />
  },
}))

describe("PaletteEditorDrawer", () => {
  beforeEach(() => {
    drawerContentRenders.length = 0
    inputRenders.length = 0
    buttonRenders.length = 0
    toggleItemRenders.length = 0
  })

  it("renders close button, live N / 32 counter, subtle non-blurring overlay, and reorganized controls", () => {
    const html = renderToStaticMarkup(
      <PaletteEditorDrawer
        colors={["#ffffff", "#000000", "#c45b20", "#2a2620"]}
        onAddColor={vi.fn()}
        onColorChange={vi.fn()}
        onCopyPaletteJson={vi.fn()}
        onDeleteColor={vi.fn()}
        onExportPaletteGpl={vi.fn()}
        onExportPaletteJson={vi.fn()}
        onExtractPalette={vi.fn()}
        onImportPaletteFile={vi.fn()}
        onImportPaletteFromClipboard={vi.fn()}
      />
    )

    expect(drawerContentRenders.at(-1)?.overlayVariant).toBe("subtle")
    expect(html).toContain('data-overlay-variant="subtle"')
    expect(html).toContain('data-slot="drawer-close"')
    expect(html).toContain('aria-label="Close"')
    expect(html).toContain('data-slot="palette-color-count"')
    expect(html).toContain("4 / 32")
    expect(html).toContain('data-slot="palette-primary-actions"')
    expect(html).toContain('data-slot="palette-utility-toolbar"')
    expect(html).toContain('data-slot="palette-color-list"')
    expect(html).toContain("Extract from image")
    expect(html).toContain("Add color")
    expect(html).toContain("rounded-md")
    expect(html).toContain('data-slot="palette-editor-swatch"')
    expect(html).not.toContain("border-foreground/25")
  })

  it("disables Add color when reaching the 32-color limit and shows 32 / 32", () => {
    const colors32 = Array.from(
      { length: 32 },
      (_, index) => `#${index.toString(16).padStart(2, "0")}3366`
    )

    const html = renderToStaticMarkup(
      <PaletteEditorDrawer
        colors={colors32}
        onAddColor={vi.fn()}
        onColorChange={vi.fn()}
        onDeleteColor={vi.fn()}
      />
    )

    expect(html).toContain("32 / 32")
    const addButton = buttonRenders.find((button) =>
      String(button.children).includes("Add color")
    )
    expect(addButton?.disabled).toBe(true)
  })

  it("commits live color updates on onChange without waiting strictly for onBlur", () => {
    const onColorChange = vi.fn()

    renderToStaticMarkup(
      <PaletteEditorDrawer
        colors={["#112233", "#aabbcc"]}
        onAddColor={vi.fn()}
        onColorChange={onColorChange}
        onDeleteColor={vi.fn()}
      />
    )

    const firstColorInput = inputRenders.find((input) => input.type === "color")
    expect(firstColorInput).toBeDefined()

    firstColorInput?.onChange?.({
      currentTarget: { value: "#ff5500" },
    } as React.ChangeEvent<HTMLInputElement>)

    expect(onColorChange).toHaveBeenCalledWith(0, "#ff5500")
  })

  it("triggers extraction and compact utility toolbar actions", () => {
    const onExtractPalette = vi.fn()
    const onCopyPaletteJson = vi.fn()
    const onExportPaletteJson = vi.fn()
    const onExportPaletteGpl = vi.fn()
    const onImportPaletteFromClipboard = vi.fn()

    renderToStaticMarkup(
      <PaletteEditorDrawer
        colors={["#111111", "#eeeeee", "#aa5522", "#336699"]}
        onAddColor={vi.fn()}
        onColorChange={vi.fn()}
        onCopyPaletteJson={onCopyPaletteJson}
        onDeleteColor={vi.fn()}
        onExportPaletteGpl={onExportPaletteGpl}
        onExportPaletteJson={onExportPaletteJson}
        onExtractPalette={onExtractPalette}
        onImportPaletteFile={vi.fn()}
        onImportPaletteFromClipboard={onImportPaletteFromClipboard}
      />
    )

    const extractButton = buttonRenders.find((button) =>
      String(button.children).includes("Extract")
    )
    extractButton?.onClick?.({} as React.MouseEvent<HTMLButtonElement>)
    expect(onExtractPalette).toHaveBeenCalledWith(4)

    buttonRenders
      .find((button) => button["aria-label"] === "Copy JSON")
      ?.onClick?.({} as React.MouseEvent<HTMLButtonElement>)
    buttonRenders
      .find((button) => button["aria-label"] === "Paste from clipboard")
      ?.onClick?.({} as React.MouseEvent<HTMLButtonElement>)
    buttonRenders
      .find((button) => button["aria-label"] === "Export JSON")
      ?.onClick?.({} as React.MouseEvent<HTMLButtonElement>)
    buttonRenders
      .find((button) => button["aria-label"] === "Export GPL")
      ?.onClick?.({} as React.MouseEvent<HTMLButtonElement>)

    expect(onCopyPaletteJson).toHaveBeenCalledTimes(1)
    expect(onImportPaletteFromClipboard).toHaveBeenCalledTimes(1)
    expect(onExportPaletteJson).toHaveBeenCalledTimes(1)
    expect(onExportPaletteGpl).toHaveBeenCalledTimes(1)
  })
})
