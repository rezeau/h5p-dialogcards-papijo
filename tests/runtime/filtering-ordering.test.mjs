import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { makeCurrentFilterName } from '../../src/scripts/filtering-ordering.js';
import { createMinimalLibrary } from './fixture.mjs';
import { createH5PRuntime } from './h5p-runtime.mjs';

let runtime;

afterEach(() => {
  runtime?.close();
  runtime = undefined;
});

function createLocalizedInstance({
  and = 'ALL-OF',
  not = 'EXCEPT',
  or = 'ANY-OF',
} = {}) {
  runtime = createH5PRuntime();
  const library = createMinimalLibrary();
  library.params.boolean_AND = and;
  library.params.boolean_OR = or;
  library.params.boolean_NOT = not;

  return runtime.H5P.newRunnable(library, 111);
}

test('helper receives localized operator labels explicitly', () => {
  assert.equal(
    makeCurrentFilterName('alpha,beta', 'AND', 'DIRECT-AND', 'OR', 'NOT'),
    'alpha DIRECT-AND beta',
  );
});

test('formats multiple categories with the instance localized operators', () => {
  const instance = createLocalizedInstance();

  assert.equal(
    instance.makeCurrentFilterName('alpha,beta', 'AND'),
    'alpha ALL-OF beta',
  );
  assert.equal(
    instance.makeCurrentFilterName('alpha,beta,gamma', 'OR'),
    'alpha ANY-OF beta ANY-OF gamma',
  );
  assert.equal(
    instance.makeCurrentFilterName('alpha,beta,gamma', 'NOT'),
    'EXCEPT alpha EXCEPT beta EXCEPT gamma',
  );
});

test('preserves empty and single-category formatting exactly', () => {
  const instance = createLocalizedInstance();

  assert.equal(instance.makeCurrentFilterName('', 'AND'), '');
  assert.equal(instance.makeCurrentFilterName('', 'OR'), '');
  assert.equal(instance.makeCurrentFilterName('', 'NOT'), 'EXCEPT ');
  assert.equal(instance.makeCurrentFilterName('alpha', 'AND'), 'alpha');
  assert.equal(instance.makeCurrentFilterName('alpha', 'OR'), 'alpha');
  assert.equal(instance.makeCurrentFilterName('alpha', 'NOT'), 'EXCEPT alpha');
});

test('returns undefined for an unknown operator', () => {
  const instance = createLocalizedInstance();

  assert.equal(instance.makeCurrentFilterName('alpha,beta', 'XOR'), undefined);
});

test('remains an enumerable writable prototype method with two parameters', () => {
  const instance = createLocalizedInstance({
    and: 'CUSTOM-AND',
    not: 'CUSTOM-NOT',
    or: 'CUSTOM-OR',
  });
  const Constructor = runtime.H5P.DialogcardsPapiJo;
  const descriptor = Object.getOwnPropertyDescriptor(
    Constructor.prototype,
    'makeCurrentFilterName',
  );

  assert.equal(Object.hasOwn(instance, 'makeCurrentFilterName'), false);
  assert.equal(instance.makeCurrentFilterName, descriptor.value);
  assert.equal(descriptor.value.length, 2);
  assert.equal(descriptor.enumerable, true);
  assert.equal(descriptor.writable, true);
  assert.equal(descriptor.configurable, true);
  assert.equal(
    instance.makeCurrentFilterName('left,right', 'AND'),
    'left CUSTOM-AND right',
  );
  assert.equal(
    instance.makeCurrentFilterName('left,right', 'OR'),
    'left CUSTOM-OR right',
  );
  assert.equal(
    instance.makeCurrentFilterName('left,right', 'NOT'),
    'CUSTOM-NOT left CUSTOM-NOT right',
  );
});
