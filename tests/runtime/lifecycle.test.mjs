import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { createMinimalLibrary } from './fixture.mjs';
import { createH5PRuntime } from './h5p-runtime.mjs';

let runtime;

afterEach(() => {
  runtime?.close();
  runtime = undefined;
});

function countClickHandlers($, element) {
  return ($._data(element, 'events')?.click || []).length;
}

function assertSingleAttachedUI($container, $) {
  assert.equal($container.filter('.h5p-dialogcards').length, 1);
  assert.equal($container.find('.h5p-dialogcards-title-container').length, 1);
  assert.equal($container.find('.h5p-dialogcards-cardwrap-set').length, 1);
  assert.equal($container.find('.h5p-dialogcards-cardwrap').length, 2);
  assert.equal($container.find('.h5p-dialogcards-current').length, 1);
  assert.equal($container.find('.h5p-navigation').length, 1);

  const nextButton = $container.find('.h5p-theme-next, .h5p-theme-nav-button').last()[0];
  assert.ok(nextButton, 'a current navigation button exists');
  assert.equal(countClickHandlers($, nextButton), 1);
}

test('attaches and repeatedly resets a minimal runnable without duplicate UI', () => {
  runtime = createH5PRuntime();
  const { $, H5P, window } = runtime;
  const $container = $('<div id="h5p-container"></div>').appendTo(window.document.body);
  const instance = H5P.newRunnable(
    createMinimalLibrary(),
    51,
    $container,
    false,
    { standalone: true },
  );

  assertSingleAttachedUI($container, $);
  assert.doesNotThrow(() => instance.resetTask());
  assertSingleAttachedUI($container, $);
  assert.doesNotThrow(() => instance.resetTask());
  assertSingleAttachedUI($container, $);
});
