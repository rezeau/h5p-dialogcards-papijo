import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { createMinimalLibrary } from './fixture.mjs';
import { createH5PRuntime } from './h5p-runtime.mjs';

let runtime;

afterEach(() => {
  runtime?.close();
  runtime = undefined;
});

test('registers the public three-argument constructor on H5P', () => {
  runtime = createH5PRuntime();
  const { H5P } = runtime;
  const library = createMinimalLibrary();
  const contentData = { previousState: undefined };

  assert.equal(typeof H5P.DialogcardsPapiJo, 'function');
  assert.equal(H5P.DialogcardsPapiJo.length, 3);
  assert.equal(
    H5P.DialogcardsPapiJo.prototype.constructor,
    H5P.DialogcardsPapiJo,
  );

  const instance = new H5P.DialogcardsPapiJo(
    library.params,
    41,
    contentData,
  );
  assert.equal(instance.contentId, 41);
  assert.equal(instance.contentData, contentData);
  assert.equal(instance.params.title, library.params.title);
});

test('H5P.newRunnable composes enumerable library and ContentType methods', () => {
  runtime = createH5PRuntime();
  const { H5P } = runtime;
  const Constructor = H5P.DialogcardsPapiJo;
  const instance = H5P.newRunnable(
    createMinimalLibrary(),
    42,
    undefined,
    true,
    { standalone: true },
  );

  assert.ok(instance instanceof Constructor);
  for (const method of [
    'attach',
    'resetTask',
    'on',
    'once',
    'off',
    'trigger',
    'triggerXAPI',
    'createXAPIEventTemplate',
    'isRoot',
    'getLibraryFilePath',
  ]) {
    assert.equal(typeof instance[method], 'function', `${method} is composed`);
    assert.equal(
      Object.prototype.propertyIsEnumerable.call(Constructor.prototype, method),
      true,
      `${method} remains enumerable`,
    );
  }

  assert.equal(instance.isRoot(), true);
  assert.equal(
    instance.getLibraryFilePath('icon.svg'),
    '/libraries/H5P.DialogcardsPapiJo-1.17/icon.svg',
  );
});

test('EventDispatcher on, once, off and trigger work on a runnable instance', () => {
  runtime = createH5PRuntime();
  const { H5P } = runtime;
  const instance = H5P.newRunnable(createMinimalLibrary(), 43);
  const calls = [];
  const thisArg = { name: 'listener context' };
  function listener(event) {
    calls.push([this, event.type, event.data]);
  }

  instance.on('contract', listener, thisArg);
  instance.trigger('contract', { count: 1 });
  assert.deepEqual(calls, [[thisArg, 'contract', { count: 1 }]]);

  let onceCalls = 0;
  instance.once('once-contract', () => onceCalls++);
  instance.trigger('once-contract');
  instance.trigger('once-contract');
  assert.equal(onceCalls, 1);

  instance.off('contract', listener);
  instance.trigger('contract', { count: 2 });
  assert.equal(calls.length, 1);

  instance.on('remove-all', listener);
  instance.off('remove-all');
  instance.trigger('remove-all');
  assert.equal(calls.length, 1);
});

test('xAPI helpers create and dispatch an H5P xAPI event', () => {
  runtime = createH5PRuntime();
  const { H5P } = runtime;
  const instance = H5P.newRunnable(createMinimalLibrary(), 44);
  const template = instance.createXAPIEventTemplate('attempted');

  assert.ok(template instanceof H5P.XAPIEvent);
  assert.equal(template.data.statement.verb.id, 'attempted');
  assert.deepEqual(template.data.statement.actor, { objectType: 'Agent' });
  assert.deepEqual(template.data.statement.object, { id: 'content-44' });
  assert.deepEqual(template.data.statement.context, {});

  let dispatched;
  instance.on('xAPI', (event) => {
    dispatched = event;
  });
  instance.triggerXAPI('attempted');
  assert.ok(dispatched instanceof H5P.XAPIEvent);
  assert.equal(dispatched.data.statement.verb.id, 'attempted');
});
