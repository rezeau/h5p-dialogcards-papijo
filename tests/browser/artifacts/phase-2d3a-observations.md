# Phase 2D3A transient resize guard observations

Starting commit:
`3c9c7536c00ab3aa5c579b50a03d53967170f010`.

Captured in the Codex in-app Chromium browser with a Chrome 151 user agent at a
1280 x 720 viewport. No external Chrome or Edge browser connection was
available.

## Guard contract

- PapiJo: 72 resize entries, 70 calculations, 1 synchronous reentrancy exit,
  1 `taskFinished` exit, and 0 errors.
- The explicit synchronous recursive call was suppressed while its outer call
  completed normally.
- The guard was false again after every completed calculation.
- Independent sequential calls were accepted.

## Clipping regression

- Nested visible attachment: root 287.17 px, card set 198 px, no clipping.
- Hidden attachment: zero rendered geometry and a 6 px inline card-set height.
- Reveal before parent resize: root 117.56 px with 284 px scroll content,
  clipped.
- First incoming parent resize after reveal: root 309.56 px, card set 198 px,
  Column/book shell 309.56 px, no clipping.
- Leave and return: hidden geometry was zero while the 378 px inline card-set
  height was retained. Return plus parent resize produced a 495.56 px root,
  384 px card set, and no clipping, stable through two animation frames.

Side-by-side next produced two calculations and remained unclipped; the root
was 317.17 px at 0 ms and 323.17 px at 300 ms. Previous produced one
calculation and a 329.17 px unclipped root.

The explicit 390 -> 760 -> 390 px width cycle remained unclipped, but card-set
heights were 366 -> 372 -> 378 px. Root heights were 477.56 -> 461.17 ->
489.56 px.

The original delayed-image load caused a later calculation at approximately
393.5 ms and changed the card set from 374 to 380 px. A test-only unique-URL
reload completed but caused no additional production resize callback and no
geometry change.

## Mandatory loop stress

The 20 sequential PapiJo parent resize events did not stabilize:

- card set: 390 -> 504 px;
- root and Column/book shell: 501.56 -> 615.56 px;
- scroll height: 502 -> 616 px;
- increment: exactly 6 px per event;
- distinct geometry states: 20 of 20.

The official Dialogcards 1.9 control also accepted all 20 events and grew by
6 px per event in this lightweight harness: card set 342 -> 456 px and root
408.78 -> 522.78 px. It remained unclipped.

No synchronous parent/child feedback loop, alternating height, browser hang,
or post-stress observer continuation occurred. The ResizeObserver count was 4
after two animation frames and remained 4 after the 500 ms quiescence window.
The failure is monotonic geometry growth under continuing independent resize
input, which meets the Phase 2D3A historical-loop stop condition.

## Scope

The probe loads the changed PapiJo production bundle and actual ColumnPapiJo
1.17.3 script. As in Phase 2D2, the Interactive Book component is a lightweight
test shell mirroring parent-down/child-up resize direction, not the full
InteractiveBookPapiJo runtime. The full external H5P fixture was not modified
to replace its installed PapiJo bundle.
