export function getRandomDifferentValue<T extends string>(
  values: readonly T[],
  currentValue: string
): T {
  const candidates =
    values.length > 1
      ? values.filter((value) => value !== currentValue)
      : [...values]

  if (candidates.length === 0) {
    throw new Error("Random options must not be empty")
  }

  return candidates[Math.floor(Math.random() * candidates.length)]
}
