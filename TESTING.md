# H5P Runtime Contract Tests

## Purpose

Phase 2A provides a small regression baseline around the public H5P boundary.
The tests load the production Webpack bundle, register it on a browser-like
`window.H5P`, and instantiate it through an H5P Core 1.28-compatible
`H5P.newRunnable` path. They do not import or instantiate an internal
constructor directly as a substitute for H5P prototype composition.

Run the complete runtime suite with:

```sh
npm test
```

The equivalent narrower command is:

```sh
npm run test:runtime
```

Both commands build first so the tests always exercise a current production
bundle. JavaScript linting also includes the harness and tests:

```sh
npm run lint:js
```

## H5P Core contract represented by the harness

The following behavior in `tests/runtime/h5p-runtime.mjs` follows the relevant
H5P Core 1.28 implementations:

- `H5P.Event` and `H5P.EventDispatcher`, including `on`, `once`, `off`, event
  triggering, listener context, bubbling, and external-event scheduling;
- `H5P.ContentType`, including EventDispatcher inheritance, `isRoot`, and
  `getLibraryFilePath`;
- `triggerXAPI` and `createXAPIEventTemplate` from the H5P xAPI helpers;
- the constructor lookup, jQuery prototype composition, instance metadata,
  attach, `domChanged`, and resize portions of `H5P.newRunnable`.

The project does not copy or load the complete H5P Core browser bundle. That
bundle initializes platform integration, AJAX, external dispatchers, content
registries, and other services unrelated to this content type. Loading it in a
Node test would require a much larger and less focused Moodle/H5P host fixture.

## Test-only services

The harness uses real jQuery 3.7 against jsdom. The following services are
minimal test stubs:

- `H5P.Audio`, because the Phase 2A fixture has no audio media;
- `H5P.JoubelUI.createTip` and `createScoreBar`;
- `H5P.Components.Button`, which returns a real DOM button and therefore uses
  real jQuery click handling;
- `H5P.XAPIEvent` statement setters;
- platform path, shuffle, and external-dispatch helpers.

These stubs are deliberately limited to calls made by the two-card browsing
fixture. An unexpected production dependency fails the tests instead of being
silently emulated.

## Coverage and limitations

The suite covers public registration and the three-argument constructor
signature, H5P prototype composition and method enumerability, EventDispatcher
operations, ContentType/xAPI helper availability, and a minimal attach/reset
lifecycle. The lifecycle test resets twice and verifies that the current root
UI and its current navigation click handler are not duplicated.

H5P Core 1.28 composes prototypes with `jQuery.extend({}, ...)`. Because a
function prototype's built-in `constructor` property is non-enumerable, Core's
new object does not retain that property. The tests therefore assert the
registered constructor property before composition and assert `instanceof`
after composition; they do not claim that Core preserves
`instance.constructor` after `newRunnable` rewrites the prototype.

This phase intentionally does not cover saved-state restoration, scoring,
answered/completed xAPI statements, matching modes, audio navigation, layout
measurements, browser accessibility behavior, or timer-sensitive interaction.
Those remain priorities for Phase 2B in [`TEST_PLAN.md`](TEST_PLAN.md).
