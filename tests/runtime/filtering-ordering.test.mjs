import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import {
  applyFilter,
  makeCurrentFilterName,
} from '../../src/scripts/filtering-ordering.js';
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

function createFilterCard(text, itemCategories) {
  const card = {
    text,
    answer: `${text} answer`,
    imageMedia: {},
    audioMedia: {},
    tips: { front: '', back: '' },
  };
  if (itemCategories !== undefined) {
    card.itemCategories = itemCategories;
  }
  return card;
}

function createFilteringInstance(dialogs) {
  runtime = createH5PRuntime();
  const library = createMinimalLibrary();
  library.params.dialogs = dialogs;
  return runtime.H5P.newRunnable(library, 112);
}

test('helper receives localized operator labels explicitly', () => {
  assert.equal(
    makeCurrentFilterName('alpha,beta', 'AND', 'DIRECT-AND', 'OR', 'NOT'),
    'alpha DIRECT-AND beta',
  );
});

test('filter helper reports mutations with explicit decks and clone dependency', () => {
  const authoredDialogs = [
    createFilterCard('Authored Alpha', 'alpha'),
    createFilterCard('Authored Beta', 'beta'),
  ];
  const currentDialogs = [authoredDialogs[1]];
  let clonedInput;
  const clone = (dialogs) => {
    clonedInput = dialogs;
    return dialogs.map((dialog) => ({ ...dialog }));
  };

  const result = applyFilter({
    currentDialogs,
    authoredDialogs,
    filterList: 'beta',
    filterOperator: 'OR',
    dryRun: false,
    clone,
  });

  assert.equal(result.emptyResult, false);
  assert.equal(result.replacementNbCards, 1);
  assert.equal(clonedInput[0], authoredDialogs[0]);
  assert.deepEqual(
    result.replacementDialogs.map((dialog) => dialog.text),
    ['Authored Alpha'],
  );
  assert.notEqual(result.replacementDialogs[0], authoredDialogs[0]);
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

test('AND uses the current token-count and substring semantics', () => {
  const instance = createFilteringInstance([
    createFilterCard('Alpha Beta', 'alpha,beta'),
    createFilterCard('Alpha Gamma', 'alpha,gamma'),
    createFilterCard('Alpha Beta Gamma', 'alpha,beta,gamma'),
    createFilterCard('Duplicate Alpha', 'alpha,alpha'),
    createFilterCard('Beta Alpha', 'beta,alpha'),
    createFilterCard('Alpha', 'alpha'),
  ]);

  assert.equal(instance.applyFilter('alpha,beta', 'AND', true), 4);
});

test('applyFilter remains an enumerable writable prototype method with two parameters', () => {
  const instance = createFilteringInstance([
    createFilterCard('Alpha', 'alpha'),
  ]);
  const Constructor = runtime.H5P.DialogcardsPapiJo;
  const descriptor = Object.getOwnPropertyDescriptor(
    Constructor.prototype,
    'applyFilter',
  );

  assert.equal(Object.hasOwn(instance, 'applyFilter'), false);
  assert.equal(instance.applyFilter, descriptor.value);
  assert.equal(descriptor.value.length, 2);
  assert.equal(descriptor.enumerable, true);
  assert.equal(descriptor.writable, true);
  assert.equal(descriptor.configurable, true);
  assert.equal(instance.applyFilter('alpha', 'OR', true), 1);
});

test('OR and NOT preserve current multi-term and uncategorized behavior', () => {
  const instance = createFilteringInstance([
    createFilterCard('Alpha Beta', 'alpha,beta'),
    createFilterCard('Beta Gamma', 'beta,gamma'),
    createFilterCard('Delta', 'delta'),
    createFilterCard('Alphabet', 'alphabet'),
    createFilterCard('Missing'),
    createFilterCard('Empty', ''),
  ]);

  assert.equal(instance.applyFilter('alpha,gamma,omega', 'OR', true), 3);
  assert.equal(instance.applyFilter('alpha,gamma', 'NOT', true), 2);
  assert.equal(instance.applyFilter('alpha', 'AND', true), 2);
  assert.equal(instance.applyFilter('alpha', 'OR', true), 2);
  assert.equal(instance.applyFilter('alpha', 'NOT', true), 3);
});

test('substring matching checks whether the filter list contains each card token', () => {
  const instance = createFilteringInstance([
    createFilterCard('Alpha', 'alpha'),
    createFilterCard('Alphabet', 'alphabet'),
    createFilterCard('Middle', 'pha'),
  ]);

  assert.equal(instance.applyFilter('alphabet', 'OR', true), 3);
  assert.equal(instance.applyFilter('alpha', 'OR', true), 2);
});

test('dry runs return counts without mutating deck or filter state', () => {
  const instance = createFilteringInstance([
    createFilterCard('Alpha', 'alpha'),
    createFilterCard('Beta', 'beta'),
    createFilterCard('Alpha Beta', 'alpha,beta'),
  ]);
  const originalDialogs = instance.currentDialogs;
  const originalSnapshot = structuredClone(instance.currentDialogs);
  instance.currentFilter = 'existing filter';
  instance.filterList = 'existing list';
  instance.filterOperator = 'existing operator';
  instance.noFilterMessage = 'existing message';

  assert.equal(instance.applyFilter('alpha,gamma,omega', 'OR', true), 2);
  assert.equal(instance.currentDialogs, originalDialogs);
  assert.deepEqual(instance.currentDialogs, originalSnapshot);
  assert.equal(instance.nbCards, 3);
  assert.equal(instance.currentFilter, 'existing filter');
  assert.equal(instance.filterList, 'existing list');
  assert.equal(instance.filterOperator, 'existing operator');
  assert.equal(instance.noFilterMessage, 'existing message');
});

test('successful filtering clones authored cards and only updates deck size', () => {
  const instance = createFilteringInstance([
    createFilterCard('Alpha', 'alpha'),
    createFilterCard('Beta', 'beta'),
    createFilterCard('Alpha Beta', 'alpha,beta'),
  ]);
  const authoredDialogs = instance.params.dialogs;
  const authoredSnapshot = structuredClone(authoredDialogs);
  instance.nbCardsSelected = 7;
  instance.cardsLeft = 11;
  instance.cardOrder = [2, 1, 0];
  instance.currentFilter = 'existing filter';
  instance.filterList = 'existing list';
  instance.filterOperator = 'existing operator';

  const filtered = instance.applyFilter('alpha', 'OR');

  assert.equal(filtered, instance.currentDialogs);
  assert.deepEqual(filtered.map((card) => card.text), ['Alpha', 'Alpha Beta']);
  assert.notEqual(filtered[0], authoredDialogs[0]);
  assert.notEqual(filtered[1], authoredDialogs[2]);
  assert.equal(instance.nbCards, 2);
  assert.equal(instance.nbCardsSelected, 7);
  assert.equal(instance.cardsLeft, 11);
  assert.deepEqual(Array.from(instance.cardOrder), [2, 1, 0]);
  assert.equal(instance.currentFilter, 'existing filter');
  assert.equal(instance.filterList, 'existing list');
  assert.equal(instance.filterOperator, 'existing operator');
  assert.equal(instance.params.dialogs, authoredDialogs);
  assert.deepEqual(instance.params.dialogs, authoredSnapshot);
});

test('empty results preserve the deck and set only the filter error message', () => {
  const instance = createFilteringInstance([
    createFilterCard('Alpha', 'alpha'),
    createFilterCard('Beta', 'beta'),
  ]);
  const originalDialogs = instance.currentDialogs;
  instance.currentFilter = 'existing filter';
  instance.filterList = 'existing list';
  instance.filterOperator = 'existing operator';

  assert.equal(instance.applyFilter('omega', 'AND', true), 0);
  assert.equal(instance.noFilterMessage, '');
  assert.equal(instance.applyFilter('omega', 'AND'), undefined);
  assert.equal(instance.currentDialogs, originalDialogs);
  assert.equal(instance.nbCards, 2);
  assert.equal(
    instance.noFilterMessage,
    'ERROR! categories filter returned an empty result. No filter will be applied.',
  );
  assert.equal(instance.currentFilter, 'existing filter');
  assert.equal(instance.filterList, 'existing list');
  assert.equal(instance.filterOperator, 'existing operator');
});

test('successive filters evaluate the working deck but project authored indexes', () => {
  const instance = createFilteringInstance([
    createFilterCard('Authored Alpha', 'alpha'),
    createFilterCard('Authored Beta', 'beta'),
    createFilterCard('Authored Gamma', 'gamma'),
  ]);

  const first = instance.applyFilter('beta', 'OR');
  assert.deepEqual(first.map((card) => card.text), ['Authored Beta']);

  const second = instance.applyFilter('beta', 'OR');
  assert.deepEqual(second.map((card) => card.text), ['Authored Alpha']);
  assert.equal(second[0].itemCategories, 'alpha');
  assert.equal(instance.nbCards, 1);
});
