import { describe, expect, it } from "vitest"

import { BASELINE_GATES } from "./baseline-runner"

describe("baseline gates", () => {
  it("defines at least one gate per processing path", () => {
    expect(BASELINE_GATES.length).toBeGreaterThanOrEqual(10)
  })

  it.each(BASELINE_GATES)("$name has positive maxMedianMs", (gate) => {
    expect(gate.maxMedianMs).toBeGreaterThan(0)
    expect(gate.maxMeanMs).toBeGreaterThan(0)
  })

  it("all gates have unique names", () => {
    const names = BASELINE_GATES.map((g) => g.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it("all gates have descriptions", () => {
    for (const gate of BASELINE_GATES) {
      expect(gate.description.length).toBeGreaterThan(0)
    }
  })
})
