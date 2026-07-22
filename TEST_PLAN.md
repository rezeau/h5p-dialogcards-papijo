# Phase 2 Behavioral Test Plan

## Purpose

Phase 2 should establish behavior-level regression protection before any
constructor renaming, module extraction, constant renaming, or class work. The
tests must exercise the built library with H5P Core 1.28 and the declared H5P
dependencies wherever runtime integration is relevant.

## Priority scenarios

1. **Real H5P instantiation path**
   - Load the production bundle and instantiate `H5P.DialogcardsPapiJo` through
     `H5P.newRunnable`.
   - Confirm the public prototype methods, H5P event methods, xAPI helpers, and
     content-type methods remain available after H5P composes the prototype.

2. **Attach and reset**
   - Attach a minimal valid two-card activity to a real DOM container.
   - Confirm the initial card, navigation, progress, and footer are rendered.
   - Reset the activity and confirm state and DOM return to their initial form
     without duplicate controls or duplicate event handling.

3. **Saved-state round trip**
   - Navigate and interact, serialize with `getCurrentState()`, then create a
     fresh runtime instance using that state.
   - Confirm card position, order, mode, score counters, round, filters, and
     completion state are restored for the selected scenario.

4. **Scoring**
   - Cover `getScore()`, `getMaxScore()`, `getAnswerGiven()`, pass percentage,
     penalties, and completion for one scored mode.
   - Confirm browsing mode remains unscored.

5. **xAPI**
   - Capture `attempted` and `answered` events.
   - Assert actor/context integration, score, maximum score, success,
     completion, duration, and response text without over-specifying unrelated
     H5P Core fields.

6. **Representative browsing mode**
   - Use `normalMode` to cover next, previous, card turning, progress updates,
     last-card behavior, and retry/reset policy.

7. **Representative matching mode**
   - Use `matchMode` to cover correct and incorrect matches, left/right card
     navigation, delayed feedback, score counters, and final summary.

8. **Audio navigation**
   - Use cards with front and back audio.
   - Confirm moving, turning, matching, retrying, and resetting stop or reset
     the correct audio instances and do not leave overlapping playback.

9. **Callback-context-sensitive behavior**
   - Exercise jQuery `.each()` handlers whose `this` value is a DOM element.
   - Exercise arrow-based click handlers that require lexical component `this`.
   - Exercise H5P `resize` dispatch and timer callbacks with fake timers.
   - Cover previous/next double-click protection and delayed match feedback.

## Test layers

- Use focused unit tests only for pure data behavior such as filtering, state
  serialization, score calculations, and xAPI response construction.
- Use DOM integration tests for attach, navigation, reset, and callback context.
- Keep at least one browser/H5P-runtime smoke test for bundle loading, layout,
  audio integration, and H5P prototype composition.

## Exit criteria

Phase 2 is complete when the scenarios above pass against the current
function-constructor/prototype implementation and can detect an intentional
break in H5P prototype composition, state restoration, scoring, xAPI, audio
cleanup, and callback context.
