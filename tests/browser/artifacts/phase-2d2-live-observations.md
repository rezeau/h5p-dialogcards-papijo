# Phase 2D2 live H5P observations

Captured in Chromium 151 on Windows 10 against the local H5P CLI fixture:

- InteractiveBookPapiJo 1.14.2
- ColumnPapiJo 1.17.3
- DialogcardsPapiJo 1.17.2
- official Dialogcards 1.9.40
- H5P Core 1.28

## Existing clipped PapiJo state

At an approximately 748.44 px content width, the PapiJo root measured
approximately 312.38 px high with approximately 464 px of scroll content.
At an approximately 431.44 px content width, the same saved session measured:

- PapiJo root: 408.38 px
- PapiJo scroll content: 560 px
- card set: 0 px (`style.height = 0px`)
- Column: 431.16 px
- Interactive Book: 647.13 px

The content was visibly clipped. See `phase-2d2-live-nested-clipping.png`.

## Fresh side-by-side control path

In a fresh session at the default viewport, the PapiJo root measured 654.38 px,
the card set 342 px, Column 677.16 px, and Interactive Book 893.13 px. It was not
clipped.

At an 820 x 900 viewport (approximately 431.44 px content width), it measured:

- PapiJo root: 750.38 px
- card set: 342 px
- Column: 773.16 px
- Interactive Book: 989.13 px

Leaving for the official control made the hidden PapiJo geometry zero while its
342 px inline card-set height was retained. Returning to PapiJo produced the same
750.38 / 342 / 773.16 / 989.13 px geometry at approximately 100 ms and 500 ms,
without clipping. Thus this fresh leave-and-return path did not reproduce the
saved clipped state.

## Scope note

The JSON trace and browser-evidence screenshot come from a real Chromium test
harness that loads the unchanged production Dialogcards bundles and actual
ColumnPapiJo script. Its Interactive Book shell is test-only and mirrors the
parent-down/child-up resize direction; it is not the full InteractiveBookPapiJo
runtime. The live observations above are therefore retained separately from the
harness measurements.
