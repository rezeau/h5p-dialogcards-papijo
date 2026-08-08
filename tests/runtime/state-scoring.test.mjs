import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { createMinimalLibrary } from './fixture.mjs';
import { createH5PRuntime } from './h5p-runtime.mjs';

let runtime;

afterEach(() => {
  runtime?.close();
  runtime = undefined;
});

function createScoredLibrary() {
  return createMinimalLibrary({ playMode: 'matchMode' });
}

function attachScoredActivity(H5P, $, window, contentId, previousState) {
  const $container = $('<div></div>').appendTo(window.document.body);
  const instance = H5P.newRunnable(
    createScoredLibrary(),
    contentId,
    $container,
    false,
    { standalone: true, previousState },
  );

  return { $container, instance };
}

test('round trips an incomplete scored state with position, counters, mode and order', () => {
  runtime = createH5PRuntime();
  const { $, H5P, window } = runtime;
  const { instance } = attachScoredActivity(H5P, $, window, 61);

  assert.equal(instance.getScore(), 0);
  assert.equal(instance.getMaxScore(), 2);
  assert.equal(instance.getAnswerGiven(), false);

  instance.nextCard();
  instance.correct = 1;
  instance.incorrect = 2;
  instance.currentRound = 3;

  const savedState = instance.getCurrentState();
  assert.equal(savedState.progress, 2);
  assert.equal(savedState.correct, 1);
  assert.equal(savedState.incorrect, 2);
  assert.equal(savedState.currentRound, 3);
  assert.equal(savedState.playMode, 'matchMode');
  assert.equal(savedState.playModeUser, 'matchMode');
  assert.deepEqual(Array.from(savedState.order), [0, 1]);
  assert.equal(savedState.taskFinished, undefined);

  const { instance: restored } = attachScoredActivity(
    H5P,
    $,
    window,
    62,
    savedState,
  );
  const restoredState = restored.getCurrentState();

  assert.equal(restored.$current.index(), 2);
  assert.equal(restoredState.progress, 2);
  assert.equal(restoredState.correct, 1);
  assert.equal(restoredState.incorrect, 2);
  assert.equal(restoredState.currentRound, 3);
  assert.equal(restoredState.playMode, 'matchMode');
  assert.equal(restoredState.playModeUser, 'matchMode');
  assert.deepEqual(Array.from(restoredState.order), [0, 1]);
  assert.equal(restored.getScore(), 0);
  assert.equal(restored.getMaxScore(), 2);
  assert.equal(restored.getAnswerGiven(), false);
});

test('reports completed scoring, state and one answered xAPI event', () => {
  runtime = createH5PRuntime();
  const { $, H5P, window } = runtime;
  const { $container, instance } = attachScoredActivity(H5P, $, window, 63);
  let answeredEvent;
  instance.on('xAPI', (event) => {
    if (event.data.statement.verb.id === 'answered') {
      answeredEvent = event;
    }
  });

  instance.correct = 1;
  instance.incorrect = 1;
  instance.finishedScreen();

  assert.equal(instance.getScore(), 1);
  assert.equal(instance.getMaxScore(), 2);
  assert.equal(instance.getAnswerGiven(), true);
  assert.equal(instance.getCurrentState().taskFinished, true);
  assert.equal(
    $container.find('.h5p-joubelui-score-bar').attr('data-score'),
    '1',
  );
  assert.equal(
    $container.find('.h5p-joubelui-score-bar').attr('data-max-score'),
    '2',
  );

  assert.ok(answeredEvent instanceof H5P.XAPIEvent);
  const statement = answeredEvent.data.statement;
  assert.equal(statement.verb.id, 'answered');
  assert.deepEqual(statement.actor, { objectType: 'Agent' });
  assert.equal(statement.object.id, 'content-63');
  assert.equal(
    statement.object.definition.type,
    'http://adlnet.gov/expapi/activities/cmi.interaction',
  );
  assert.equal(statement.object.definition.interactionType, 'long-fill-in');
  assert.deepEqual(statement.context, {});
  assert.deepEqual(statement.result.score, {
    min: 0,
    max: 2,
    raw: 1,
    scaled: 0.5,
  });
  assert.equal(statement.result.completion, true);
  assert.equal(statement.result.success, false);
  assert.match(statement.result.duration, /^PT\d+S$/);
  assert.match(statement.result.response, /Overall Score : 1\/2/);
});

test('resets an attached activity restored from a completed state', () => {
  runtime = createH5PRuntime();
  const { $, H5P, window } = runtime;
  const { instance } = attachScoredActivity(H5P, $, window, 64);

  instance.correct = 2;
  instance.finishedScreen();
  const completedState = instance.getCurrentState();
  assert.equal(completedState.taskFinished, true);

  const { instance: restored } = attachScoredActivity(
    H5P,
    $,
    window,
    65,
    completedState,
  );

  assert.equal(restored.taskFinished, false);
  assert.equal(restored.getScore(), 0);
  assert.equal(restored.getMaxScore(), 2);
  assert.equal(restored.getAnswerGiven(), false);
  assert.equal(restored.getCurrentState().taskFinished, false);
});
