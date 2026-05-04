declare module "gifenc" {
  export type GIFPalette = Array<[number, number, number]>

  export interface GIFEncoder {
    writeFrame(
      index: Uint8Array,
      width: number,
      height: number,
      options: {
        palette: GIFPalette
        delay?: number
        repeat?: number
        transparent?: boolean
        transparentIndex?: number
        dispose?: number
        first?: boolean
      }
    ): void
    finish(): void
    reset(): void
    bytes(): Uint8Array
    bytesView(): Uint8Array
  }

  export function GIFEncoder(opts?: {
    initialCapacity?: number
    auto?: boolean
  }): GIFEncoder

  export function applyPalette(
    rgba: Uint8Array | Uint8ClampedArray,
    palette: GIFPalette,
    format?: "rgb565" | "rgb444" | "rgba4444"
  ): Uint8Array

  export function quantize(
    rgba: Uint8Array | Uint8ClampedArray,
    maxColors: number,
    options?: {
      format?: "rgb565" | "rgb444" | "rgba4444"
      oneBitAlpha?: boolean | number
    }
  ): GIFPalette
}
