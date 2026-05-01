# Export Action Application PRD

Status: done

## Problem Statement

IMDITHER already has an Export Layer for browser encoding, but the App Shell
still owns the Export Action orchestration. The App Shell currently decides when
to set export status, runs the full-output Export Job, calls the Browser Encoder,
downloads the Export File, writes export metadata, clears or reports errors, and
returns the shared Job Status to ready or error.

That makes the export seam shallow. Export behavior is not scattered across many
files, but the App Shell must still know the ordering and failure modes for
Export Job execution, Browser Encoder output, filename generation, metadata
updates, and status changes. Future export changes would keep making App Shell
orchestration heavier.

## Solution

Add a browser-side Export Action Application module that applies an Export Action
through a small command interface and an editor runtime adapter.

The existing Export Layer remains focused on Browser Encoder behavior: turning a
Pixel Buffer into a Blob for the selected Export Format. The new Export Action
Application owns the runtime workflow around that encoder: source presence,
status, Export Job, Browser Encoder call, Export File download, metadata update,
and error handling.

The user-facing behavior must remain unchanged. Export still uses the current
Source Image, current Editor Settings, selected Export Format, selected Export
Quality, and Full Output from the Export Job. A successful Export Action sets the
shared Job Status to ready; a failed Export Action sets it to error. An Export
Action without a current Source Image is a safe no-op.

## User Stories

1. As an IMDITHER user, I want Export to keep producing the same file formats,
   so that the refactor does not change my PNG, WebP, or JPEG workflow.
2. As an IMDITHER user, I want Export to keep using the Full Output, so that the
   exported file is not reduced by Screen Preview sizing.
3. As an IMDITHER user, I want Export to use my current Editor Settings, so that
   the Export File matches the current processed image.
4. As an IMDITHER user, I want Export to use my selected Export Format, so that
   PNG, WebP, and JPEG still download with the expected encoding.
5. As an IMDITHER user, I want Export to use my selected Export Quality for
   lossy formats, so that WebP and JPEG compression stays under my control.
6. As an IMDITHER user, I want a successful Export Action to download an Export
   File with the correct name and extension, so that the file is easy to identify.
7. As an IMDITHER user, I want export metadata to report the selected Export
   Format label after success, so that the editor describes the last export
   accurately.
8. As an IMDITHER user, I want export failures to keep showing a clear error, so
   that I understand why an Export File was not produced.
9. As an IMDITHER user, I want an Export Action without a Source Image to do
   nothing, so that disabled or accidental export calls do not create confusing
   errors.
10. As an IMDITHER user, I want export status to keep showing exporting while the
    Export Action is running, so that I can tell that the command is active.
11. As an IMDITHER user, I want a successful export to return the editor to ready,
    so that the shared Job Status behaves as it does today.
12. As an IMDITHER user, I want a failed export to put the editor in error state,
    so that failure remains visible.
13. As a maintainer, I want Export Action orchestration behind one module
    interface, so that the App Shell does not own export ordering.
14. As a maintainer, I want Browser Encoder behavior to stay in the Export Layer,
    so that encoding tests remain focused on Pixel Buffer to Blob behavior.
15. As a maintainer, I want Export Action Application to receive a runtime
    adapter, so that tests can fake status, metadata, errors, and download side
    effects without React.
16. As a maintainer, I want Export Action Application to receive an Export Action
    command, so that the current source, settings, format, and quality are one
    explicit input.
17. As a maintainer, I want the App Shell export handler to become a small call
    into Export Action Application, so that App Shell complexity shrinks.
18. As a maintainer, I want Export Job failures tested through the Export Action
    seam, so that full-output processing errors keep mapping to editor errors.
19. As a maintainer, I want Browser Encoder failures tested through the Export
    Action seam, so that Encoder Failure still updates editor state correctly.
20. As a maintainer, I want successful export metadata tested through the Export
    Action seam, so that metadata does not drift from selected Export Format.
21. As a maintainer, I want no-source Export Action behavior tested, so that the
    safe no-op rule is explicit.
22. As a maintainer, I want filename generation to remain delegated to existing
    Export Layer helpers, so that naming rules stay in one place.
23. As a maintainer, I want the shared Job Status model preserved, so that this
    slice does not become a broader runtime status refactor.
24. As a maintainer, I want Browser MIME fallback detection left out of this
    slice, so that the Export Action Application seam stays narrow.

## Implementation Decisions

- Add or modify a browser-side Export Action Application module.
- Keep the existing Export Layer focused on Browser Encoder and Export Format
  helper behavior.
- Introduce an Export Action command that includes the current Source Image,
  current Editor Settings, selected Export Format, and selected Export Quality.
- Allow the Export Action command to carry a missing Source Image and treat that
  case as a safe no-op.
- Introduce an Export Action Runtime Adapter for editor state and side effects.
- The runtime adapter should cover status updates, error updates, metadata
  updates, and Export File download side effects.
- Keep Export Job execution behind an adapter input to Export Action Application
  so tests can fake full-output processing.
- Keep Browser Encoder execution behind an adapter input to Export Action
  Application so tests can fake encoding success and failure.
- Keep filename generation delegated to the existing export helper behavior.
- On no current Source Image, Export Action Application should return without
  setting status, error, metadata, running an Export Job, encoding, or
  downloading.
- On started Export Action, set the shared Job Status to exporting before
  running the Export Job.
- On successful Export Job and Browser Encoder output, download the Export File,
  update metadata with the selected Export Format label, clear error, and set the
  shared Job Status to ready.
- On Export Job failure or Browser Encoder failure, report the thrown error
  message when available, fall back to the existing export failure copy, and set
  the shared Job Status to error.
- Do not change the shared Job Status model in this slice.
- Do not add Browser MIME fallback detection in this slice.
- Do not change Export Format, Export Quality, Export Preferences, Settings JSON,
  Look Payload, or persistence behavior.
- The App Shell should stop owning Export Action try/catch orchestration and call
  the Export Action Application instead.

## Testing Decisions

- Good tests should cover externally visible Export Action outcomes, not private
  helper ordering beyond behavior-critical sequence.
- Test Export Action Application directly through the Export Action command and
  fake runtime/job/encoder adapters.
- Test no Source Image as a no-op: no status change, no job, no encoder, no
  download, no error.
- Test successful export: status becomes exporting, Export Job receives source
  identity, source Pixel Buffer, and Editor Settings, Browser Encoder receives
  the Full Output with Export Format and Export Quality, download receives the
  encoded Blob and generated Export File name, metadata includes selected Export
  Format label, error clears, and status becomes ready.
- Test Export Job failure: status becomes exporting, error is reported, status
  becomes error, no encoder or download occurs.
- Test Browser Encoder failure: status becomes exporting, error is reported,
  status becomes error, no download occurs.
- Test fallback error copy when a thrown value is not an Error.
- Test metadata is not updated on failure.
- Test the App Shell wiring only where needed to prove that the export handler
  calls Export Action Application with the current source, settings, Export
  Format, and Export Quality.
- Existing Export Layer tests are prior art for Browser Encoder and filename
  behavior.
- Existing Processing Jobs tests are prior art for Export Job behavior and Full
  Output guarantees.
- Existing Source Intake Application tests are prior art for command plus runtime
  adapter module shape.
- Run `bun check` after implementation.

## Out of Scope

- Changing supported Export Formats.
- Changing Export Quality range, default, or persistence.
- Changing Export Drawer UI.
- Changing Browser Encoder internals.
- Adding Browser MIME fallback detection.
- Adding new Encoder Failure hardening beyond preserving current failure mapping.
- Splitting preview and export into separate status models.
- Changing Export Job protocol.
- Changing Full Output processing semantics.
- Changing Screen Preview behavior.
- Changing Settings JSON, Look Payload, or Editor Settings.
- Adding copy-to-clipboard, share sheet, open-in-new-tab, batch export, or any new
  export target.
- Changing Auto-Tune, Source Intake, Preview Cycle, Preview Presentation, or
  Output Size Policy.

## Further Notes

This is a narrow architecture deepening slice. It should reduce App Shell
orchestration while preserving behavior.

The accepted domain language is recorded in the domain context: Export Action,
Export Action Application, Export Layer, Browser Encoder, Export File, Export
Format, Export Quality, and Encoder Failure.
