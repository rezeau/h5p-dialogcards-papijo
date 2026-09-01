# Phase 2D3B six-pixel resize-growth investigation

Starting commit: `3c9c7536c00ab3aa5c579b50a03d53967170f010`.
The uncommitted Phase 2D3A production experiment was not changed during this
investigation.

## Numeric source

At a stable 16 px card-set font size, the PapiJo holder has `height: 100%`,
content-box sizing, and a computed 3 px border on both its top and bottom. Its
border box is therefore exactly 6 px taller than its 100% content height.

For PapiJo, the five passes were:

| Pass | Set before | Holder border box measured | Applied em | Applied px | Set/root after |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 360 | 366 | 22.875 | 366 | 366 / 455.171875 |
| 2 | 366 | 372 | 23.25 | 372 | 372 / 461.171875 |
| 3 | 372 | 378 | 23.625 | 378 | 378 / 467.171875 |
| 4 | 378 | 384 | 24 | 384 | 384 / 473.171875 |
| 5 | 384 | 390 | 24.375 | 390 | 390 / 479.171875 |

The first pass starts with a 360 px set and a holder whose computed content
height is 360 px but whose border-box/outer height is 366 px. Resetting the set
to `auto` makes its own box zero because the wrappers are absolutely
positioned. Setting each wrapper to `initial` does not remove the 366 px child
footprint. The selected maximum is therefore 366 px. Writing that maximum back
to the set makes the holder content 366 px and its border box 372 px, which is
the next pass's measurement. The increment is `3 + 3 = 6 px`.

The official control under the shared harness CSS followed the same sequence:

| Pass | Set before | Wrapper outer height | Applied em | Set/root after |
| ---: | ---: | ---: | ---: | ---: |
| 1 | 336 | 342 | 21.375 | 342 / 408.78125 |
| 2 | 342 | 348 | 21.75 | 348 / 414.78125 |
| 3 | 348 | 354 | 22.125 | 354 / 420.78125 |
| 4 | 354 | 360 | 22.5 | 360 / 426.78125 |
| 5 | 360 | 366 | 22.875 | 366 / 432.78125 |

The official code measured only the current wrapper in this scenario. The
wrapper's intrinsic outer height nevertheless included its holder's 6 px
border excess. PapiJo CSS was loaded first and uses the same unnamespaced class
selector, while official CSS does not reset the holder border. This made the
PapiJo border leak into the official fixture.

With the PapiJo stylesheet disabled and official CSS left enabled, a
normalization resize and five recorded official passes all stayed exactly at a
109 px set, 109 px holder, and 153.78125 px root. Both holder borders were 0.
Thus current official Dialogcards is idempotent in the lightweight harness
when isolated from PapiJo CSS.

The em conversion is exact: `6 / 16 = 0.375 em`. Font size, text height,
footer height, margins, padding, and scaling helpers did not change. PapiJo's
final pixel write was numerically redundant and did not create the increment.

## Mutation inventory

One PapiJo pass writes the set from its previous pixel height to `auto`, writes
each wrapper from `inherit` to `initial` and back to `inherit`, writes the new
maximum in em, then writes the same maximum in px. The wrapper reset does not
remove the holder border footprint. The new set height is retained and directly
drives the holder's next `height: 100%` measurement.

One official pass writes the set from its previous em height to `auto`, writes
the current wrapper to `initial`, clears the wrapper's inline height with an
empty value, and writes the new maximum in em. In the contaminated harness,
that retained set height drives the leaked PapiJo holder border on the next
pass. In official-only CSS, the same mutations are stable.

`updateImageSize`, `determineCardSizes`, `scaleToFitHeight`,
`truncateRetryButton`, and `resizeOverflowingText` made no measured height
change in the traced passes. There were no class changes, font-size changes,
footer changes, or autonomous mutations after the pass.

## Live fixture cross-check

The full local H5P fixture also loads both libraries into one document, so the
PapiJo holder border applies to the official control there as well. Five
1280-to-1279-to-1280 width cycles produced official set heights of 328, 340,
352, 364, 376, and 388 px. Each cycle delivered two calculations, so the 12 px
cycle increase is 6 px per calculation.

The live PapiJo bundle SHA-256 matched the repository experimental dist bundle
(`3D18B6866ADCFFA5F7AF511FE45E725FA5C3AC831D98E6049B49FF8E5088F67D`) and
contains `isResizing`. Its corresponding samples were 384, 390, 396, 396, 402,
and 408 px. Growth occurred in 6 px quanta; some viewport transitions did not
produce a completed calculation. The behavior is therefore real for the
experimental PapiJo and for an official control sharing PapiJo's global CSS,
not a lightweight-harness-only artifact.

## History and current official implementation

Commit `6bb92858de2e04ce76fb6d087ce1288a6525a45e` added the lifetime
`issetHeight` guard to the same height-feedback calculation, explicitly to
prevent infinite vertical scrolling in Chrome and Edge. The exact monotonic
6 px feedback now measured is strongly consistent with that workaround's
target, although the historical commit contains no runtime trace proving
identity.

Current official 1.9.40 differs conceptually: it measures only the current
wrapper, clears the temporary wrapper height instead of restoring `inherit`,
resets and clears the holder when it is the last wrapper, and applies only the
em height. More importantly for this trace, official CSS has no holder border.
The official-only five-pass result confirms that combination is idempotent.

## Phase 2D3C recommendation

The smallest next experiment is to keep the transient reentrancy behavior but
make the measured height independent of the holder's decorative border. Test
one narrowly scoped sizing change: measure the holder's content requirement
without feeding its `height: 100%` border box back into the set (or equivalently
make the holder's 100% height use border-box sizing), then require five and
twenty sequential resizes to remain constant. Do not combine that experiment
with parent resize-emission changes.
