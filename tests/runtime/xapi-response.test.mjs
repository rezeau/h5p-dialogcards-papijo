import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { buildXAPIResponse } from '../../src/scripts/scoring-xapi.js';
import { createMinimalLibrary } from './fixture.mjs';
import { createH5PRuntime } from './h5p-runtime.mjs';

let runtime;

afterEach(() => {
  runtime?.close();
  runtime = undefined;
});

function card(index) {
  return {
    text: `Card ${index}`,
    answer: `Answer ${index}`,
    imageMedia: {},
    audioMedia: {},
    tips: { front: '', back: '' },
  };
}

function createInstance({ dialogCount = 2, playMode = 'normalMode' } = {}) {
  runtime ??= createH5PRuntime();
  const library = createMinimalLibrary({ playMode });
  library.params.dialogs = Array.from(
    { length: dialogCount },
    (_, index) => card(index),
  );
  library.params.summaryCardsSelected = '[SELECTED]';
  library.params.summaryCardsCompleted = '[COMPLETED]';
  library.params.summaryCompletedRounds = '[ROUNDS]';
  library.params.summaryMatchesFound = '[MATCHED]';
  library.params.summaryMatchesNotFound = '[MISSED]';
  library.params.summaryOverallScore = '[SCORE]';
  return runtime.H5P.newRunnable(library, 151 + dialogCount);
}

function setResponseState(instance, overrides = {}) {
  Object.assign(instance, {
    nbCardsSelected: instance.params.dialogs.length,
    enableGotIt: false,
    repetition: false,
    matchIt: false,
    currentRound: 1,
    correct: 0,
    incorrect: 0,
    actualScore: 0,
    maxScore: instance.params.dialogs.length,
    helpText: '',
  }, overrides);
  return instance;
}

const helperLabels = {
  cardsSelected: '[SELECTED]',
  cardsCompleted: '[COMPLETED]',
  completedRounds: '[ROUNDS]',
  matchesFound: '[MATCHED]',
  matchesNotFound: '[MISSED]',
  overallScore: '[SCORE]',
};

test('helper preserves branch precedence and exact response formatting', () => {
  const response = buildXAPIResponse({
    selectedCards: 2,
    totalCards: 2,
    enableGotIt: true,
    repetition: false,
    matchIt: true,
    currentRound: 4,
    correct: 99,
    incorrect: 88,
    actualScore: 1,
    maxScore: 2,
    helpText: '',
    labels: helperLabels,
  });

  assert.equal(
    response,
    '[COMPLETED] 2/2\n[ROUNDS] 4\n[SCORE] : 1/2\n',
  );
});

test('helper preserves selected-card prefix and completion denominator behavior', () => {
  assert.equal(
    buildXAPIResponse({
      selectedCards: 0,
      totalCards: 4,
      enableGotIt: false,
      repetition: true,
      matchIt: true,
      currentRound: 2,
      correct: 0,
      incorrect: 0,
      actualScore: 0,
      maxScore: 0,
      helpText: 'help',
      labels: helperLabels,
    }),
    '[SELECTED] 0/4\n[COMPLETED] 0/0\n[ROUNDS] 2\n' +
      '[SCORE] : 0/0\nhelp',
  );
});

test('helper preserves undefined and NaN values without mutating its inputs', () => {
  const options = {
    selectedCards: undefined,
    totalCards: 2,
    enableGotIt: false,
    repetition: false,
    matchIt: false,
    currentRound: undefined,
    correct: undefined,
    incorrect: undefined,
    actualScore: Number.NaN,
    maxScore: undefined,
    helpText: undefined,
    labels: { ...helperLabels },
  };
  const before = structuredClone(options);

  assert.equal(
    buildXAPIResponse(options),
    '[SELECTED] undefined/2\nundefined\n[SCORE] : NaN/undefined\nundefined',
  );
  assert.deepEqual(options, before);
});

test('fresh unanswered normal state is callable and exposes undefined fields', () => {
  const instance = createInstance();

  assert.equal(instance.answered, false);
  assert.equal(
    instance.getxAPIResponse(),
    '[SELECTED] undefined/2\nundefined\n[SCORE] : 0/undefined\nundefined',
  );
});

test('normal browsing prints the uninitialized branch regardless of navigation state', () => {
  const oneCard = setResponseState(createInstance({ dialogCount: 1 }), {
    actualScore: 0,
    maxScore: 0,
  });
  assert.equal(
    oneCard.getxAPIResponse(),
    'undefined\n[SCORE] : 0/0\n',
  );

  const multipleCards = setResponseState(createInstance({ dialogCount: 3 }), {
    actualScore: 1,
    maxScore: 3,
  });
  const expected = 'undefined\n[SCORE] : 1/3\n';
  assert.equal(multipleCards.getxAPIResponse(), expected);

  multipleCards.progress = 2;
  multipleCards.taskFinished = true;
  multipleCards.currentDialogs = [multipleCards.params.dialogs[2]];
  assert.equal(multipleCards.getxAPIResponse(), expected);
});

test('side-by-side browsing directly formats the match branch', () => {
  const instance = setResponseState(createInstance({
    playMode: 'browseSideBySide',
  }), {
    matchIt: true,
    correct: 1,
    incorrect: 2,
    actualScore: 1,
    maxScore: 2,
  });

  assert.equal(
    instance.getxAPIResponse(),
    '[MATCHED] 1\n[MISSED] 2\n[SCORE] : 1/2\n',
  );
});

test('match mode preserves perfect, partial, and zero-result strings', () => {
  const instance = setResponseState(createInstance({ playMode: 'matchMode' }), {
    matchIt: true,
  });
  const cases = [
    {
      state: { correct: 2, incorrect: 0, actualScore: 2, maxScore: 2 },
      expected: '[MATCHED] 2\n[MISSED] 0\n[SCORE] : 2/2\n',
    },
    {
      state: { correct: 1, incorrect: 1, actualScore: 1, maxScore: 2 },
      expected: '[MATCHED] 1\n[MISSED] 1\n[SCORE] : 1/2\n',
    },
    {
      state: { correct: 0, incorrect: 3, actualScore: 0, maxScore: 2 },
      expected: '[MATCHED] 0\n[MISSED] 3\n[SCORE] : 0/2\n',
    },
  ];

  cases.forEach(({ state, expected }) => {
    Object.assign(instance, state);
    assert.equal(instance.getxAPIResponse(), expected);
  });
});

test('match mode uses authored deck length for subset and zero-card prefixes', () => {
  const subset = setResponseState(createInstance({
    dialogCount: 4,
    playMode: 'matchMode',
  }), {
    nbCardsSelected: 2,
    matchIt: true,
    correct: 2,
    incorrect: 1,
    actualScore: 2,
    maxScore: 2,
  });
  assert.equal(
    subset.getxAPIResponse(),
    '[SELECTED] 2/4\n[MATCHED] 2\n[MISSED] 1\n[SCORE] : 2/2\n',
  );

  subset.nbCardsSelected = 0;
  subset.actualScore = 0;
  subset.maxScore = 0;
  assert.equal(
    subset.getxAPIResponse(),
    '[SELECTED] 0/4\n[MATCHED] 2\n[MISSED] 1\n[SCORE] : 0/0\n',
  );

  const emptyDeck = setResponseState(createInstance({
    dialogCount: 0,
    playMode: 'matchMode',
  }), {
    matchIt: true,
    actualScore: 0,
    maxScore: 0,
  });
  assert.equal(
    emptyDeck.getxAPIResponse(),
    '[MATCHED] 0\n[MISSED] 0\n[SCORE] : 0/0\n',
  );
});

test('match repetition prints selected totals, completed totals, and round', () => {
  const instance = setResponseState(createInstance({
    dialogCount: 4,
    playMode: 'matchRepetition',
  }), {
    nbCardsSelected: 2,
    repetition: true,
    matchIt: true,
    currentRound: 3,
    correct: 99,
    incorrect: 88,
    actualScore: 1,
    maxScore: 2,
  });

  assert.equal(
    instance.getxAPIResponse(),
    '[SELECTED] 2/4\n[COMPLETED] 2/2\n[ROUNDS] 3\n[SCORE] : 1/2\n',
  );
});

test('self-correction and enableGotIt take the completion branch before matching', () => {
  const instance = setResponseState(createInstance({
    playMode: 'selfCorrectionMode',
  }), {
    enableGotIt: true,
    matchIt: true,
    currentRound: 4,
    correct: 7,
    incorrect: 6,
    actualScore: 1,
    maxScore: 2,
  });
  const expected =
    '[COMPLETED] 2/2\n[ROUNDS] 4\n[SCORE] : 1/2\n';

  assert.equal(instance.getxAPIResponse(), expected);
  instance.playMode = 'normalMode';
  instance.playModeUser = 'matchMode';
  instance.params.behaviour.playMode = 'browseSideBySide';
  assert.equal(instance.getxAPIResponse(), expected);
});

test('localized labels have no empty, undefined, or missing fallback', () => {
  const completion = setResponseState(createInstance(), {
    nbCardsSelected: 1,
    enableGotIt: true,
    currentRound: 2,
    actualScore: 1,
    maxScore: 2,
  });
  completion.params.summaryCardsSelected = '';
  completion.params.summaryCardsCompleted = undefined;
  delete completion.params.summaryCompletedRounds;
  completion.params.summaryOverallScore = false;

  assert.equal(
    completion.getxAPIResponse(),
    ' 1/2\nundefined 1/1\nundefined 2\nfalse : 1/2\n',
  );

  const matching = setResponseState(createInstance(), {
    matchIt: true,
    correct: 1,
    incorrect: 2,
    actualScore: 1,
    maxScore: 2,
  });
  matching.params.summaryMatchesFound = '';
  delete matching.params.summaryMatchesNotFound;
  matching.params.summaryOverallScore = '';

  assert.equal(
    matching.getxAPIResponse(),
    ' 1\nundefined 2\n : 1/2\n',
  );
});

test('help text is appended verbatim after the final newline', () => {
  const instance = setResponseState(createInstance(), {
    matchIt: true,
    correct: 1,
    incorrect: 0,
    actualScore: 1,
    maxScore: 2,
  });
  const prefix = '[MATCHED] 1\n[MISSED] 0\n[SCORE] : 1/2\n';

  for (const helpText of [
    '',
    'Penalty: 25%; keep going!',
    '<strong>Raw HTML help</strong>',
    undefined,
  ]) {
    instance.helpText = helpText;
    assert.equal(instance.getxAPIResponse(), `${prefix}${helpText}`);
  }
});

test('numeric and undefined values are stringified without normalization', () => {
  const matching = setResponseState(createInstance(), {
    matchIt: true,
    correct: -1,
    incorrect: Number.NaN,
    actualScore: 1.25,
    maxScore: -2,
  });
  assert.equal(
    matching.getxAPIResponse(),
    '[MATCHED] -1\n[MISSED] NaN\n[SCORE] : 1.25/-2\n',
  );

  const completion = setResponseState(createInstance(), {
    nbCardsSelected: undefined,
    repetition: true,
    currentRound: undefined,
    actualScore: Number.NaN,
    maxScore: undefined,
    helpText: undefined,
  });
  assert.equal(
    completion.getxAPIResponse(),
    '[SELECTED] undefined/2\n[COMPLETED] undefined/undefined\n' +
      '[ROUNDS] undefined\n[SCORE] : NaN/undefined\nundefined',
  );
});

test('uses direct response fields instead of deck, mode, or public score getters', () => {
  const instance = setResponseState(createInstance({ dialogCount: 4 }), {
    nbCardsSelected: 2,
    matchIt: true,
    correct: 3,
    incorrect: 4,
    actualScore: 7,
    maxScore: 8,
  });
  instance.nbCards = 99;
  instance.currentDialogs = [instance.params.dialogs[0]];
  instance.playMode = 'normalMode';
  instance.playModeUser = 'normalMode';
  instance.params.behaviour.playMode = 'normalMode';
  instance.getScore = () => {
    throw new Error('getScore must not be called');
  };
  instance.getMaxScore = () => {
    throw new Error('getMaxScore must not be called');
  };

  assert.equal(
    instance.getxAPIResponse(),
    '[SELECTED] 2/4\n[MATCHED] 3\n[MISSED] 4\n[SCORE] : 7/8\n',
  );

  instance.matchIt = false;
  instance.playModeUser = 'matchMode';
  assert.equal(
    instance.getxAPIResponse(),
    '[SELECTED] 2/4\nundefined\n[SCORE] : 7/8\n',
  );
});

test('repeated calls return the same primitive string without observable mutation', () => {
  const instance = setResponseState(createInstance({ dialogCount: 3 }), {
    nbCardsSelected: 2,
    repetition: true,
    currentRound: 5,
    actualScore: 1,
    maxScore: 2,
    helpText: '<em>help</em>',
  });
  const paramsReference = instance.params;
  const dialogsReference = instance.params.dialogs;
  const currentDialogsReference = instance.currentDialogs;
  const before = {
    nbCardsSelected: instance.nbCardsSelected,
    currentRound: instance.currentRound,
    actualScore: instance.actualScore,
    maxScore: instance.maxScore,
    helpText: instance.helpText,
  };
  let events = 0;
  instance.on('xAPI', () => events++);

  const first = instance.getxAPIResponse();
  const second = instance.getxAPIResponse();

  assert.equal(typeof first, 'string');
  assert.equal(first, second);
  assert.equal(instance.params, paramsReference);
  assert.equal(instance.params.dialogs, dialogsReference);
  assert.equal(instance.currentDialogs, currentDialogsReference);
  assert.deepEqual({
    nbCardsSelected: instance.nbCardsSelected,
    currentRound: instance.currentRound,
    actualScore: instance.actualScore,
    maxScore: instance.maxScore,
    helpText: instance.helpText,
  }, before);
  assert.equal(events, 0);
});

test('getxAPIResponse preserves its zero-argument prototype contract', () => {
  const instance = createInstance();
  const Constructor = runtime.H5P.DialogcardsPapiJo;
  const descriptor = Object.getOwnPropertyDescriptor(
    Constructor.prototype,
    'getxAPIResponse',
  );

  assert.equal(Object.hasOwn(instance, 'getxAPIResponse'), false);
  assert.equal(instance.getxAPIResponse, descriptor.value);
  assert.equal(descriptor.value.length, 0);
  assert.equal(descriptor.enumerable, true);
  assert.equal(descriptor.writable, true);
  assert.equal(descriptor.configurable, true);
});

test('addResponseToXAPI assigns the formatter result after scored result and duration', () => {
  const instance = setResponseState(createInstance({ playMode: 'matchMode' }), {
    matchIt: true,
    correct: 1,
    incorrect: 1,
    actualScore: 1,
    maxScore: 2,
  });
  instance.playModeUser = 'matchMode';
  instance.startTime = 1000;
  instance.endTime = 3499;
  const expected = instance.getxAPIResponse();
  let calls = 0;
  const getResponse = instance.getxAPIResponse;
  instance.getxAPIResponse = function () {
    calls++;
    assert.ok(this === instance);
    return getResponse.call(this);
  };
  const event = new runtime.H5P.XAPIEvent();

  instance.addResponseToXAPI(event);

  assert.equal(calls, 1);
  assert.equal(event.data.statement.result.response, expected);
  assert.equal(event.data.statement.result.duration, 'PT2S');
  assert.deepEqual(event.data.statement.result.score, {
    min: 0,
    max: 2,
    raw: 1,
    scaled: 0.5,
  });
});

test('addResponseToXAPI guards normal and side-by-side modes before formatting', () => {
  for (const playModeUser of ['normalMode', 'browseSideBySide']) {
    const instance = setResponseState(createInstance({ playMode: playModeUser }), {
      matchIt: true,
      actualScore: 1,
      maxScore: 2,
    });
    instance.playModeUser = playModeUser;
    let calls = 0;
    instance.getxAPIResponse = () => {
      calls++;
      return 'should not be assigned';
    };
    const event = new runtime.H5P.XAPIEvent();

    assert.equal(instance.addResponseToXAPI(event), undefined);
    assert.equal(calls, 0);
    assert.equal(event.data.statement.result, undefined);
  }
});
