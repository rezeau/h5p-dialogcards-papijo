import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { buildXAPIDefinition } from '../../src/scripts/scoring-xapi.js';
import { createMinimalLibrary } from './fixture.mjs';
import { createH5PRuntime } from './h5p-runtime.mjs';

let runtime;

afterEach(() => {
  runtime?.close();
  runtime = undefined;
});

function createInstance(contentId = 141) {
  runtime = createH5PRuntime();
  return runtime.H5P.newRunnable(createMinimalLibrary(), contentId);
}

function plain(value) {
  return structuredClone(value);
}

test('helper preserves exact fallback, shape, and fresh nested objects', () => {
  const first = buildXAPIDefinition({
    title: '',
    description: false,
    showSummary: 'Ignored summary',
  });
  const second = buildXAPIDefinition({
    title: '',
    description: false,
    showSummary: 'Ignored summary',
  });

  assert.deepEqual(first, {
    description: {
      'en-US': false,
    },
    type: 'http://adlnet.gov/expapi/activities/cmi.interaction',
    interactionType: 'long-fill-in',
  });
  assert.notEqual(first, second);
  assert.notEqual(first.description, second.description);

  const missingSummary = buildXAPIDefinition({
    title: '',
    description: '',
    showSummary: undefined,
  });
  assert.equal(Object.hasOwn(missingSummary.description, 'en-US'), true);
  assert.equal(missingSummary.description['en-US'], undefined);
});

test('uses a non-empty title as the definition description source', () => {
  const instance = createInstance();
  instance.params.title = 'Definition title';
  instance.params.description = 'Ignored description';
  instance.params.showSummary = 'Ignored summary';

  const definition = instance.getxAPIDefinition();

  assert.deepEqual(plain(definition), {
    description: {
      'en-US': 'Definition title',
    },
    type: 'http://adlnet.gov/expapi/activities/cmi.interaction',
    interactionType: 'long-fill-in',
  });
  assert.deepEqual(
    Object.keys(definition),
    ['description', 'type', 'interactionType'],
  );
  assert.equal(Object.hasOwn(definition, 'name'), false);
});

test('falls back from an empty title to the exact description HTML', () => {
  const instance = createInstance();
  const description = '<p>Keep <strong>this HTML</strong> & text exactly.</p>';
  instance.params.title = '';
  instance.params.description = description;
  instance.params.showSummary = 'Ignored summary';

  const definition = instance.getxAPIDefinition();

  assert.equal(definition.description['en-US'], description);
});

test('falls back to showSummary only when title and description are empty strings', () => {
  const instance = createInstance();
  instance.params.title = '';
  instance.params.description = '';
  instance.params.showSummary = 'Show the summary';

  const definition = instance.getxAPIDefinition();

  assert.equal(definition.description['en-US'], 'Show the summary');
});

test('uses literal empty-string checks rather than general falsy fallback semantics', () => {
  const instance = createInstance();
  instance.params.description = 'Description fallback';
  instance.params.showSummary = 'Summary fallback';

  for (const title of [undefined, null, false, 0]) {
    instance.params.title = title;
    assert.equal(instance.getxAPIDefinition().description['en-US'], title);
  }

  instance.params.title = '';
  for (const description of [undefined, null, false, 0]) {
    instance.params.description = description;
    assert.equal(
      instance.getxAPIDefinition().description['en-US'],
      description,
    );
  }

  instance.params.description = '';
  delete instance.params.showSummary;
  const definition = instance.getxAPIDefinition();
  assert.equal(Object.hasOwn(definition.description, 'en-US'), true);
  assert.equal(definition.description['en-US'], undefined);
});

test('returns fresh definition and nested description objects on every call', () => {
  const instance = createInstance();

  const first = instance.getxAPIDefinition();
  const second = instance.getxAPIDefinition();

  assert.notEqual(first, second);
  assert.notEqual(first.description, second.description);
  assert.deepEqual(plain(first), plain(second));

  first.description['en-US'] = 'Changed result only';
  assert.equal(second.description['en-US'], instance.params.title);
  assert.equal(instance.params.title, 'Runtime contract fixture');
});

test('preserves the prototype contract and has no observable side effects', () => {
  const instance = createInstance();
  const Constructor = runtime.H5P.DialogcardsPapiJo;
  const descriptor = Object.getOwnPropertyDescriptor(
    Constructor.prototype,
    'getxAPIDefinition',
  );
  const paramsReference = instance.params;
  const originalParams = {
    title: instance.params.title,
    description: instance.params.description,
    showSummary: instance.params.showSummary,
  };
  const originalScoringState = {
    actualScore: instance.actualScore,
    answered: instance.answered,
    maxScore: instance.maxScore,
    taskFinished: instance.taskFinished,
  };
  let xAPIEvents = 0;
  instance.on('xAPI', () => xAPIEvents++);

  const definition = instance.getxAPIDefinition();

  assert.equal(Object.hasOwn(instance, 'getxAPIDefinition'), false);
  assert.equal(instance.getxAPIDefinition, descriptor.value);
  assert.equal(descriptor.value.length, 0);
  assert.equal(descriptor.enumerable, true);
  assert.equal(descriptor.writable, true);
  assert.equal(descriptor.configurable, true);
  assert.equal(instance.params, paramsReference);
  assert.deepEqual(
    {
      title: instance.params.title,
      description: instance.params.description,
      showSummary: instance.params.showSummary,
    },
    originalParams,
  );
  assert.deepEqual(
    {
      actualScore: instance.actualScore,
      answered: instance.answered,
      maxScore: instance.maxScore,
      taskFinished: instance.taskFinished,
    },
    originalScoringState,
  );
  assert.equal(xAPIEvents, 0);
  assert.equal(definition.description['en-US'], instance.params.title);
});
