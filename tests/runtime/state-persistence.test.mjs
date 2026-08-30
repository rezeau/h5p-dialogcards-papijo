import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { buildCurrentState } from '../../src/scripts/state-persistence.js';
import { createMinimalLibrary } from './fixture.mjs';
import { createH5PRuntime } from './h5p-runtime.mjs';

let contentId = 200;
let runtime;

afterEach(() => {
  runtime?.close();
  runtime = undefined;
});

function createInstance({
  attach = false,
  outerContentData = {},
  playMode = 'normalMode',
  prepareLibrary,
  previousState,
} = {}) {
  runtime ??= createH5PRuntime();
  const { $, H5P, window } = runtime;
  const library = createMinimalLibrary({ playMode });
  prepareLibrary?.(library);
  const $container = attach
    ? $('<div></div>').appendTo(window.document.body)
    : undefined;
  const instance = H5P.newRunnable(
    library,
    contentId++,
    $container,
    false,
    {
      standalone: true,
      previousState,
      ...outerContentData,
    },
  );

  return { $container, instance };
}

function helperOptions(overrides = {}) {
  return {
    hasCurrent: false,
    progress: undefined,
    repetition: false,
    sideBySide: false,
    hasCurrentLeft: false,
    progressLeft: undefined,
    playModeUser: 'normalMode',
    endOfStack: 0,
    filterByCategories: undefined,
    filterList: undefined,
    filterOperator: undefined,
    currentFilter: undefined,
    currentDialogs: [],
    noDupeFrontPicToBack: false,
    currentRound: 1,
    correct: 0,
    incorrect: 0,
    nbCardsInCurrentRound: 2,
    nbCardsSelected: undefined,
    cardsLeft: undefined,
    cardOrder: undefined,
    noMatchCards: undefined,
    cardsOrderChoice: 'normal',
    cardsOrderMode: 'normal',
    enableCardsNumber: false,
    cardsSideChoice: 'frontFirst',
    cardsSideMode: 'frontFirst',
    playMode: 'normalMode',
    taskFinished: undefined,
    ...overrides,
  };
}

test('helper preserves the exact unconditional key order', () => {
  const state = buildCurrentState(helperOptions());

  assert.deepEqual(Object.keys(state), [
    'currentRound',
    'correct',
    'incorrect',
    'nbCardsInCurrentRound',
    'nbCardsSelected',
    'nbCardsLeft',
    'order',
    'noMatchCards',
    'cardsOrderChoice',
    'cardsOrderMode',
    'enableCardsNumber',
    'cardsSideChoice',
    'cardsSideMode',
    'playMode',
    'playModeUser',
    'taskFinished',
  ]);
  assert.equal(Object.hasOwn(state, 'nbCardsSelected'), true);
  assert.equal(state.nbCardsSelected, undefined);
  assert.equal(Object.hasOwn(state, 'taskFinished'), true);
  assert.equal(state.taskFinished, undefined);
});

test('helper preserves progress and left-progress edge precedence', () => {
  const missingProgress = buildCurrentState(helperOptions({
    repetition: true,
    hasCurrentLeft: true,
    progressLeft: -1,
  }));
  assert.equal(Object.hasOwn(missingProgress, 'progress'), false);
  assert.equal(Number.isNaN(missingProgress.progressLeft), true);

  const bothModes = buildCurrentState(helperOptions({
    hasCurrent: true,
    progress: 4,
    repetition: true,
    sideBySide: true,
    hasCurrentLeft: true,
    progressLeft: -1,
  }));
  assert.equal(bothModes.progress, 4);
  assert.equal(bothModes.progressLeft, -1);

  const suppliedUndefined = buildCurrentState(helperOptions({
    hasCurrent: true,
    progress: undefined,
  }));
  assert.equal(Object.hasOwn(suppliedUndefined, 'progress'), true);
  assert.equal(suppliedUndefined.progress, undefined);
});

test('helper preserves conditional fields, references, and pure fresh results', () => {
  const currentDialogs = [{ text: 'Alpha' }];
  const cardOrder = [0];
  const noMatchCards = [1];
  const options = helperOptions({
    playModeUser: 'selfCorrectionMode',
    endOfStack: 1,
    filterByCategories: 'active',
    filterList: undefined,
    filterOperator: 'AND',
    currentFilter: 'Alpha',
    currentDialogs,
    noDupeFrontPicToBack: true,
    cardOrder,
    noMatchCards,
  });

  const first = buildCurrentState(options);
  const second = buildCurrentState(options);

  assert.notEqual(first, second);
  assert.deepEqual(first, second);
  assert.equal(first.lastCorrect, false);
  assert.equal(Object.hasOwn(first, 'filterList'), true);
  assert.equal(first.filterList, undefined);
  assert.equal(first.noDupeFrontPicToBack, true);
  assert.equal(first.currentDialogs, currentDialogs);
  assert.equal(first.order, cardOrder);
  assert.equal(first.noMatchCards, noMatchCards);
  assert.equal(options.currentDialogs, currentDialogs);
  assert.equal(options.cardOrder, cardOrder);
  assert.equal(options.noMatchCards, noMatchCards);

  currentDialogs.push({ text: 'Bravo' });
  cardOrder.push(1);
  noMatchCards[0] = 0;
  assert.equal(first.currentDialogs.length, 2);
  assert.deepEqual(first.order, [0, 1]);
  assert.deepEqual(first.noMatchCards, [0]);
});

test('emits the exact always-present schema including undefined values', () => {
  const { instance } = createInstance();

  const state = instance.getCurrentState();

  assert.deepEqual(Object.keys(state), [
    'currentRound',
    'correct',
    'incorrect',
    'nbCardsInCurrentRound',
    'nbCardsSelected',
    'nbCardsLeft',
    'order',
    'noMatchCards',
    'cardsOrderChoice',
    'cardsOrderMode',
    'enableCardsNumber',
    'cardsSideChoice',
    'cardsSideMode',
    'playMode',
    'playModeUser',
    'taskFinished',
  ]);
  assert.deepEqual({
    currentRound: state.currentRound,
    correct: state.correct,
    incorrect: state.incorrect,
    nbCardsInCurrentRound: state.nbCardsInCurrentRound,
    cardsOrderChoice: state.cardsOrderChoice,
    cardsOrderMode: state.cardsOrderMode,
    enableCardsNumber: state.enableCardsNumber,
    cardsSideChoice: state.cardsSideChoice,
    cardsSideMode: state.cardsSideMode,
    playMode: state.playMode,
    playModeUser: state.playModeUser,
  }, {
    currentRound: 1,
    correct: 0,
    incorrect: 0,
    nbCardsInCurrentRound: 2,
    cardsOrderChoice: 'normal',
    cardsOrderMode: 'normal',
    enableCardsNumber: false,
    cardsSideChoice: 'frontFirst',
    cardsSideMode: 'frontFirst',
    playMode: 'normalMode',
    playModeUser: 'normalMode',
  });
  for (const key of [
    'nbCardsSelected',
    'nbCardsLeft',
    'order',
    'noMatchCards',
    'taskFinished',
  ]) {
    assert.equal(Object.hasOwn(state, key), true, `${key} is present`);
    assert.equal(state[key], undefined);
  }
  for (const conditionalKey of [
    'progress',
    'progressLeft',
    'lastCorrect',
    'filterByCategories',
    'filterList',
    'filterOperator',
    'currentFilter',
    'currentDialogs',
    'noDupeFrontPicToBack',
  ]) {
    assert.equal(Object.hasOwn(state, conditionalKey), false);
  }
});

test('progress is conditional and comes directly from the current DOM index', () => {
  const unattached = createInstance().instance;
  assert.equal(Object.hasOwn(unattached.getCurrentState(), 'progress'), false);

  const attached = createInstance({ attach: true }).instance;
  assert.equal(attached.$current.index(), 0);
  assert.equal(attached.getCurrentState().progress, 0);

  attached.$current = attached.$cardwrapperSet.children().eq(1);
  assert.equal(attached.$current.index(), 1);
  assert.equal(attached.getCurrentState().progress, 1);
});

test('progressLeft preserves repetition and side-by-side index and fallback rules', () => {
  const repetition = createInstance().instance;
  repetition.repetition = true;
  repetition.$current = { index: () => 4 };
  repetition.$currentLeft = { index: () => -1 };
  assert.deepEqual({
    progress: repetition.getCurrentState().progress,
    progressLeft: repetition.getCurrentState().progressLeft,
  }, {
    progress: 4,
    progressLeft: 5,
  });

  repetition.$current = undefined;
  const missingProgress = repetition.getCurrentState();
  assert.equal(Object.hasOwn(missingProgress, 'progress'), false);
  assert.equal(Number.isNaN(missingProgress.progressLeft), true);

  repetition.$currentLeft = undefined;
  assert.equal(
    Object.hasOwn(repetition.getCurrentState(), 'progressLeft'),
    false,
  );

  const sideBySide = createInstance().instance;
  sideBySide.sideBySide = true;
  sideBySide.$currentLeft = { index: () => 3 };
  assert.equal(sideBySide.getCurrentState().progressLeft, 3);

  sideBySide.$currentLeft = { index: () => -1 };
  assert.equal(sideBySide.getCurrentState().progressLeft, -1);
});

test('self-correction emits lastCorrect as the negation of endOfStack', () => {
  const { instance } = createInstance({ playMode: 'selfCorrectionMode' });

  instance.endOfStack = 0;
  assert.equal(instance.getCurrentState().lastCorrect, true);
  instance.endOfStack = 1;
  assert.equal(instance.getCurrentState().lastCorrect, false);

  instance.playModeUser = 'normalMode';
  assert.equal(Object.hasOwn(instance.getCurrentState(), 'lastCorrect'), false);
});

test('filter and noDupe fields use truthy gates and preserve deck references', () => {
  const { instance } = createInstance();
  const dialogs = instance.currentDialogs;

  instance.filterByCategories = 'userFilter';
  instance.filterList = undefined;
  instance.filterOperator = undefined;
  instance.currentFilter = undefined;
  instance.noDupeFrontPicToBack = true;
  const active = instance.getCurrentState();

  assert.equal(active.filterByCategories, 'userFilter');
  for (const key of ['filterList', 'filterOperator', 'currentFilter']) {
    assert.equal(Object.hasOwn(active, key), true);
    assert.equal(active[key], undefined);
  }
  assert.equal(active.currentDialogs, dialogs);
  assert.equal(active.noDupeFrontPicToBack, true);

  instance.filterByCategories = false;
  instance.noDupeFrontPicToBack = false;
  const inactive = instance.getCurrentState();
  for (const key of [
    'filterByCategories',
    'filterList',
    'filterOperator',
    'currentFilter',
    'currentDialogs',
    'noDupeFrontPicToBack',
  ]) {
    assert.equal(Object.hasOwn(inactive, key), false);
  }
});

test('returns fresh outer objects while retaining mutable internal references', () => {
  const { instance } = createInstance();
  instance.filterByCategories = 'active';
  instance.cardOrder = [1, 0];
  instance.noMatchCards = [0, 1];
  const dialogsReference = instance.currentDialogs;
  const orderReference = instance.cardOrder;
  const noMatchReference = instance.noMatchCards;
  const before = {
    correct: instance.correct,
    currentRound: instance.currentRound,
    incorrect: instance.incorrect,
    nbCardsInCurrentRound: instance.nbCardsInCurrentRound,
  };
  let createdEvents = 0;
  let dispatchedEvents = 0;
  instance.createXAPIEventTemplate = () => {
    createdEvents++;
  };
  instance.on('xAPI', () => dispatchedEvents++);

  const first = instance.getCurrentState();
  const second = instance.getCurrentState();

  assert.notEqual(first, second);
  assert.deepEqual(first, second);
  for (const state of [first, second]) {
    assert.equal(state.currentDialogs, dialogsReference);
    assert.equal(state.order, orderReference);
    assert.equal(state.noMatchCards, noMatchReference);
  }
  assert.deepEqual({
    correct: instance.correct,
    currentRound: instance.currentRound,
    incorrect: instance.incorrect,
    nbCardsInCurrentRound: instance.nbCardsInCurrentRound,
  }, before);
  assert.deepEqual(instance.cardOrder, [1, 0]);
  assert.deepEqual(instance.noMatchCards, [0, 1]);
  assert.equal(createdEvents, 0);
  assert.equal(dispatchedEvents, 0);

  instance.currentDialogs.push({ text: 'Shared dialog' });
  instance.cardOrder.push(2);
  instance.noMatchCards[0] = 1;
  assert.equal(first.currentDialogs.length, 3);
  assert.deepEqual(first.order, [1, 0, 2]);
  assert.deepEqual(first.noMatchCards, [1, 1]);
});

test('representative modes expose only their current conditional state', () => {
  const normal = createInstance().instance;
  normal.$current = { index: () => 0 };
  assert.equal(normal.getCurrentState().progress, 0);
  assert.equal(Object.hasOwn(normal.getCurrentState(), 'progressLeft'), false);

  const matching = createInstance({ playMode: 'matchMode' }).instance;
  matching.$current = { index: () => 2 };
  matching.$currentLeft = { index: () => 1 };
  const matchingState = matching.getCurrentState();
  assert.equal(matchingState.progress, 2);
  assert.equal(Object.hasOwn(matchingState, 'progressLeft'), false);

  const repetition = createInstance({ playMode: 'matchRepetition' }).instance;
  repetition.repetition = true;
  repetition.$current = { index: () => 2 };
  repetition.$currentLeft = { index: () => 3 };
  repetition.noMatchCards = [1, 0];
  assert.equal(repetition.getCurrentState().progressLeft, 3);
  assert.equal(repetition.getCurrentState().noMatchCards, repetition.noMatchCards);

  const selfCorrection = createInstance({
    playMode: 'selfCorrectionMode',
  }).instance;
  selfCorrection.enableGotIt = true;
  const selfCorrectionState = selfCorrection.getCurrentState();
  assert.equal(selfCorrectionState.lastCorrect, true);
  assert.equal(Object.hasOwn(selfCorrectionState, 'enableGotIt'), false);

  const backFirst = createInstance().instance;
  backFirst.cardsSideMode = 'backFirst';
  const backFirstState = backFirst.getCurrentState();
  assert.equal(backFirstState.cardsSideMode, 'backFirst');
  assert.equal(Object.hasOwn(backFirstState, 'isReversed'), false);
});

test('documents the three current serializer and restorer asymmetries', () => {
  const source = createInstance().instance;
  source.enableCardsNumber = true;
  source.noDupeFrontPicToBack = true;
  source.cardsSideChoice = 'backFirst';
  const savedState = source.getCurrentState();

  assert.equal(savedState.enableCardsNumber, true);
  assert.equal(savedState.noDupeFrontPicToBack, true);
  assert.equal(savedState.cardsSideChoice, 'backFirst');

  const restored = createInstance({ previousState: savedState }).instance;
  assert.equal(restored.enableCardsNumber, false);
  assert.equal(restored.noDupeFrontPicToBack, false);
  assert.equal(restored.cardsSideChoice, 'backFirst');

  const restoredFromOuterField = createInstance({
    outerContentData: { noDupeFrontPicToBack: true },
    previousState: savedState,
  }).instance;
  assert.equal(restoredFromOuterField.noDupeFrontPicToBack, true);

  const $container = runtime.$('<div></div>')
    .appendTo(runtime.window.document.body);
  restored.attach($container);
  assert.equal(restored.cardsSideChoice, 'frontFirst');
  assert.equal(restored.params.behaviour.cardsSideChoice, 'frontFirst');
});

test('getCurrentState preserves its zero-argument prototype contract', () => {
  const { instance } = createInstance();
  const Constructor = runtime.H5P.DialogcardsPapiJo;
  const descriptor = Object.getOwnPropertyDescriptor(
    Constructor.prototype,
    'getCurrentState',
  );

  assert.equal(Object.hasOwn(instance, 'getCurrentState'), false);
  assert.equal(instance.getCurrentState, descriptor.value);
  assert.equal(descriptor.value.length, 0);
  assert.equal(descriptor.enumerable, true);
  assert.equal(descriptor.writable, true);
  assert.equal(descriptor.configurable, true);
});
