# Phase 2D3C minimal cardholder box-sizing experiment

Starting commit: `3c9c7536c00ab3aa5c579b50a03d53967170f010`.
The Phase 2D3A transient `isResizing` experiment remained in place.

## Production experiment

The only Phase 2D3C production source change was:

```css
.h5p-dialogcards .h5p-dialogcards-cardholder {
  height: 100%;
  box-sizing: border-box;
}
```

No JavaScript, border, height, event propagation, ColumnPapiJo, or
InteractiveBookPapiJo changes were made during this phase.

## Focused stability gate

The visible nested fixture had a 198 px card set. The holder retained its
3 px top and 3 px bottom borders, but its 198 px border box now contained a
192 px content box.

All five independent resize passes and all twenty subsequent independent
resize passes recorded exactly:

- card set: 198 px;
- holder content: 192 px;
- holder border box: 198 px;
- root: 287.171875 px;
- root scroll height: 287 px;
- clipped: false.

There were 28 total observed resize entries/calculations including attachment,
zero reentry exits, maximum depth 1, and zero errors. A 500 ms quiescence
window produced no additional observer callback or geometry change.

## Targeted regressions

- Hidden attachment: set/root were zero while hidden. Reveal before resize was
  clipped at set 0, root 89.171875, and scroll height 262 px. The first incoming
  parent resize produced set 198, root 287.171875, scroll height 287, and no
  clipping. A repeated resize was identical.
- Nested Column/book shell: set 198, root/Column/book 287.171875, scroll height
  287, and no clipping.
- Side-by-side next and previous: set 198 and root 287.171875 at 0 and 320 ms;
  both 350 px-wide current holders stayed 198 px tall, with content and footer
  inside their borders.
- Width 390 -> 760 -> 390: set stayed 198 px. Root/scroll were
  309.5625/310, 287.171875/287, and 309.5625/310 px respectively. A repeated
  resize at every width was identical and unclipped.
- Leave -> return: hidden geometry was zero. On return, the retained set was
  already 198 px and the root was 309.5625 px with no clipping. Parent resize
  and a repeated resize left the same geometry.

The targeted run recorded 19 PapiJo entries/calculations, zero reentry exits,
maximum depth 1, zero errors, no oscillation, and no post-run autonomous
change.

## Visual and CSS-isolation results

The border remained visible and unchanged. Front/back and side-by-side holders
had equal 198 px border-box heights. Automated containment checks confirmed
that card content and footer boxes remained inside every visible holder. The
browser screenshots showed no new overlap, border damage, or footer/content
displacement attributable to `border-box`.

The selector remains unnamespaced. When PapiJo and official Dialogcards were
loaded together, the official holder inherited both the PapiJo 3 px borders
and `box-sizing: border-box`. The official control was consequently stable at
a 198 px set across five passes, but the cross-library style leak remains an
independent CSS-isolation defect and was not changed here.

## Recommendation

The one-line holder `box-sizing: border-box` change should be carried into the
final Phase 2D fix together with the transient reentrancy guard, subject to a
final live-fixture/browser confirmation and a separate decision about
namespacing PapiJo CSS. CSS isolation should not be bundled into the resize fix.
