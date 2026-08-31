# Phase 2D2 browser characterization

This directory contains a diagnostic-only real-browser harness for the nested
DialogCards resize lifecycle. It loads the unchanged production bundles for
DialogCardsPapiJo 1.17.2 and official Dialogcards 1.9.40, plus the unchanged
ColumnPapiJo 1.17.3 production script.

Start the local probe server from the DialogCardsPapiJo repository root:

```powershell
node tests/browser/phase-2d2-server.mjs
```

Then open `http://127.0.0.1:8092/` in a browser. The scenarios run
automatically and write the complete trace to
`tests/browser/artifacts/phase-2d2-results.json`.

The harness distinguishes resize emission, handler entry, and actual
calculation. Test-only `ResizeObserver` and `MutationObserver` instances record
dimension and style changes. The final counterfactual clears `issetHeight`
once immediately before an otherwise normal parent-to-child resize; it does
not patch or replace the production resize implementation.

The lightweight Interactive Book shell duplicates the production book's
observable parent-to-Column resize direction and upward notification guard.
The companion full H5P CLI characterization uses the real local fixture at
`http://localhost:8080/view/h5p-interactive-book-papi-jo/ib-pj-001` for final
InteractiveBookPapiJo DOM and clipping measurements.
