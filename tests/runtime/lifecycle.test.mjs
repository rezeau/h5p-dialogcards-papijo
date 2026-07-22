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

test('reset registers each H5P lifecycle listener exactly once', () => {
  runtime = createH5PRuntime();
  const { $, H5P, window } = runtime;
  const instance = H5P.newRunnable(createMinimalLibrary(), 52);
  const registeredTypes = [];
  instance.on('newListener', (event) => registeredTypes.push(event.data.type));
  const $container = $('<div></div>').appendTo(window.document.body);

  instance.attach($container);
  assert.deepEqual(registeredTypes, ['retry', 'resetTask', 'resize']);
  instance.resetTask();
  instance.resetTask();

  assert.deepEqual(registeredTypes, ['retry', 'resetTask', 'resize']);
});

test('retry, resetTask and resize dispatch once after repeated resets', () => {
  runtime = createH5PRuntime();
  const { $, H5P, window } = runtime;
  const instance = H5P.newRunnable(createMinimalLibrary(), 53);
  const originalResize = instance.resize;
  let resizeCalls = 0;
  instance.resize = function (...args) {
    resizeCalls++;
    return originalResize.apply(this, args);
  };
  const $container = $('<div></div>').appendTo(window.document.body);

  instance.attach($container);
  instance.resetTask();
  instance.resetTask();

  let retryCalls = 0;
  instance.retry = () => retryCalls++;
  instance.trigger('retry');
  assert.equal(retryCalls, 1);

  let resetCalls = 0;
  instance.resetTask = () => resetCalls++;
  instance.trigger('resetTask');
  assert.equal(resetCalls, 1);

  const resizeCallsBeforeTrigger = resizeCalls;
  instance.trigger('resize');
  assert.equal(resizeCalls, resizeCallsBeforeTrigger + 1);
});
