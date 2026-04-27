type RgbLike = {
  red: number
  green: number
  blue: number
}

type LabColor = {
  l: number
  a: number
  b: number
}

export function getPerceptualColorDistance(
  left: RgbLike,
  right: RgbLike
): number {
  const leftLab = rgbToLab(left)
  const rightLab = rgbToLab(right)

  return Math.sqrt(
    (leftLab.l - rightLab.l) ** 2 +
      (leftLab.a - rightLab.a) ** 2 +
      (leftLab.b - rightLab.b) ** 2
  )
}

function rgbToLab(color: RgbLike): LabColor {
  const [x, y, z] = rgbToXyz(color)
  const fx = labPivot(x / 0.95047)
  const fy = labPivot(y)
  const fz = labPivot(z / 1.08883)

  return {
    l: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  }
}

function rgbToXyz({ red, green, blue }: RgbLike): [number, number, number] {
  const r = srgbToLinear(red / 255)
  const g = srgbToLinear(green / 255)
  const b = srgbToLinear(blue / 255)

  return [
    r * 0.4124564 + g * 0.3575761 + b * 0.1804375,
    r * 0.2126729 + g * 0.7151522 + b * 0.072175,
    r * 0.0193339 + g * 0.119192 + b * 0.9503041,
  ]
}

function srgbToLinear(value: number): number {
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

function labPivot(value: number): number {
  return value > 0.008856 ? Math.cbrt(value) : 7.787 * value + 16 / 116
}
