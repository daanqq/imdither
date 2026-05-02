# Effect Stack in Editor Settings

Status: accepted

IMDITHER will store the Effect Stack as a typed, ordered, serializable part of
Editor Settings instead of introducing a parallel filter or layer model. This
makes Settings JSON and Look Payloads carry the full repeatable look, while the
MVP keeps a fixed pipeline order and locked core palette/dither stages so the
current deterministic processing path remains the compatibility baseline.

## Consequences

- Editor Settings needs schema version 3 for the stack contract.
- Effect Stack data may contain Stage Instance Ids, Stage Kinds, enabled state,
  and serializable params only.
- Pixel Buffers, binary assets, DOM objects, browser handles, and runtime job
  state stay outside the stack.
- Future arbitrary graphs, multiple dither stages, or stack-aware Auto-Tune
  ranking need separate decisions.

