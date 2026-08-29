import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { createMinimalLibrary } from './fixture.mjs';
import { createH5PRuntime } from './h5p-runtime.mjs';

let runtime;

afterEach(() => {
  runtime?.close();
  runtime = undefined;
});

function attachMatchingActivity({
  contentId,
  playMode = 'matchMode',
  prepareLibrary,
}) {
  runtime = createH5PRuntime({ fakeTimers: true });
  const { $, H5P, timers, window } = runtime;
  window.Math.random = () => 0;
  const library = createMinimalLibrary({ playMode });
  prepareLibrary?.(library);
  const $container = $('<div></div>').appendTo(window.document.body);
  const instance = H5P.newRunnable(
    library,
    contentId,
    $container,
    false,
    { standalone: true },
  );

  return { $container, instance, timers, window };
}

function clickCurrentMatchButton(instance) {
  const matchButton = instance.$current
    .find('.h5p-dialogcards-button-match')[0];
  assert.ok(matchButton, 'the current card has a Match button');
  matchButton.click();
}

function completeFirstStandardMatch(instance, timers) {
  clickCurrentMatchButton(instance);
  timers.advanceBy(2000);
  assert.equal(instance.currentDialogs.length, 1);
}

test('standard non-final correct match cleans up once after 2000 ms', () => {
  const { instance, timers, window } = attachMatchingActivity({ contentId: 81 });
  let callbackContext;
  let nestedCallbackRan = false;
  const canceledTimer = window.setTimeout(() => {
    assert.fail('a cleared fake timeout must not run');
  }, 0);
  window.clearTimeout(canceledTimer);
  window.setTimeout(function () {
    callbackContext = this;
    window.setTimeout(() => {
      nestedCallbackRan = true;
    }, 0);
  }, 0);
  timers.advanceBy(0);
  assert.equal(callbackContext, window);
  assert.equal(nestedCallbackRan, true);
  assert.equal(timers.pendingCount(), 0);

  const $matchedRight = instance.$current;
  const $matchedLeft = instance.$currentLeft;
  const originalNextCardLeft = instance.nextCardLeft;
  let cleanupCalls = 0;
  instance.nextCardLeft = function (...args) {
    cleanupCalls++;
    return originalNextCardLeft.apply(this, args);
  };

  clickCurrentMatchButton(instance);

  assert.equal(instance.correct, 1);
  assert.equal(instance.incorrect, 0);
  assert.equal(instance.currentDialogs.length, 1);
  assert.equal($matchedRight.hasClass('h5p-dialogcards-gotitdone'), true);
  assert.equal($matchedLeft.hasClass('h5p-dialogcards-gotitdone'), true);
  assert.equal(instance.getScore(), 0);
  assert.equal(instance.getAnswerGiven(), false);
  assert.equal(timers.pendingCount(), 1);

  timers.advanceBy(1999);
  assert.equal(window.document.body.contains($matchedRight[0]), true);
  assert.equal(window.document.body.contains($matchedLeft[0]), true);
  assert.equal(cleanupCalls, 0);

  timers.advanceBy(1);
  assert.equal(window.document.body.contains($matchedRight[0]), false);
  assert.equal(window.document.body.contains($matchedLeft[0]), false);
  assert.equal(cleanupCalls, 1);
  assert.equal(instance.$current.hasClass('h5p-dialogcards-current'), true);
  assert.equal(instance.$current.hasClass('h5p-dialogcards-match-right'), true);
  assert.equal(instance.currentDialogs[0].text, 'Bravo');
  assert.equal(instance.$next.hasClass('h5p-dialogcards-inactive'), false);
  assert.equal(instance.$prev.hasClass('h5p-dialogcards-inactive'), false);
  assert.equal(timers.pendingCount(), 0);

  timers.advanceBy(2000);
  assert.equal(cleanupCalls, 1);
});

test('standard final match completes once after 2000 ms', () => {
  const { $container, instance, timers } = attachMatchingActivity({
    contentId: 82,
  });
  const answeredEvents = [];
  instance.on('xAPI', (event) => {
    if (event.data.statement.verb.id === 'answered') {
      answeredEvents.push(event);
    }
  });
  completeFirstStandardMatch(instance, timers);

  clickCurrentMatchButton(instance);

  assert.equal(instance.currentDialogs.length, 0);
  assert.notEqual(instance.taskFinished, true);
  assert.equal(instance.getAnswerGiven(), false);
  assert.equal(answeredEvents.length, 0);
  assert.equal(timers.pendingCount(), 2);

  timers.advanceBy(1999);
  assert.notEqual(instance.taskFinished, true);
  assert.equal(instance.getAnswerGiven(), false);
  assert.equal(answeredEvents.length, 0);

  timers.advanceBy(1);
  assert.equal(instance.taskFinished, true);
  assert.equal(instance.getAnswerGiven(), true);
  assert.equal(instance.getScore(), 2);
  assert.equal(instance.getMaxScore(), 2);
  assert.equal(instance.getCurrentState().taskFinished, true);
  assert.equal(
    $container.find('.h5p-dialogcards-final-summary-screen').length,
    1,
  );
  assert.equal(answeredEvents.length, 1);
  assert.equal(timers.pendingCount(), 0);

  timers.advanceBy(2000);
  assert.equal(answeredEvents.length, 1);
});

test('matchRepetition delays incorrect cleanup and presents Retry after the round', () => {
  const { $container, instance, timers } = attachMatchingActivity({
    contentId: 83,
    playMode: 'matchRepetition',
  });

  instance.nextCard();
  const $incorrectRight = instance.$current;
  const $incorrectLeft = instance.$currentLeft;
  clickCurrentMatchButton(instance);

  assert.equal(instance.cardsLeft, 1);
  assert.equal(instance.incorrect, 1);
  assert.equal(
    $incorrectRight
      .find('.h5p-dialogcards-match-incorrect')
      .hasClass('h5p-dialogcards-disabled'),
    false,
  );

  timers.advanceBy(1999);
  assert.equal(
    $incorrectRight
      .find('.h5p-dialogcards-match-incorrect')
      .hasClass('h5p-dialogcards-disabled'),
    false,
  );
  assert.equal(
    $incorrectLeft.hasClass('h5p-dialogcards-current-left'),
    true,
  );

  timers.advanceBy(1);
  assert.equal(
    $incorrectRight
      .find('.h5p-dialogcards-match-incorrect')
      .hasClass('h5p-dialogcards-disabled'),
    true,
  );
  assert.equal($incorrectLeft.hasClass('h5p-dialogcards-noMatch'), true);
  assert.equal(instance.$currentLeft.index(), 3);

  clickCurrentMatchButton(instance);
  assert.equal(instance.cardsLeft, 0);
  assert.equal(instance.correct, 1);
  assert.equal(instance.incorrect, 1);
  assert.equal(
    $container.find('.h5p-dialogcards-intermediary-summary-screen').length,
    0,
  );
  assert.equal(instance.$retry.hasClass('h5p-dialogcards-disabled'), true);

  timers.advanceBy(1999);
  assert.equal(
    $container.find('.h5p-dialogcards-intermediary-summary-screen').length,
    0,
  );
  assert.equal(instance.$retry.hasClass('h5p-dialogcards-disabled'), true);

  timers.advanceBy(1);
  assert.equal(
    $container.find('.h5p-dialogcards-intermediary-summary-screen').length,
    1,
  );
  assert.equal(instance.$retry.hasClass('h5p-dialogcards-disabled'), false);
  assert.equal(
    instance.$retry.text(),
    instance.params.nextRound.replace('@round', '2'),
  );
  assert.notEqual(instance.taskFinished, true);
  assert.equal(timers.pendingCount(), 0);
});

test('repetition timeout reads cardsSideMode from the activity instance', () => {
  const { instance, timers, window } = attachMatchingActivity({
    contentId: 84,
    playMode: 'matchRepetition',
  });
  const $matchedRight = instance.$current;
  const $matchedLeft = instance.$currentLeft;
  const $nextLeft = $matchedLeft
    .nextAll('.h5p-dialogcards-cardwrap-left-repetition')
    .first();
  const $nextLeftSecondImage = runtime.$(
    '<img class="h5p-dialogcards-image2" alt="Observable second image">',
  ).appendTo($nextLeft.find('.h5p-dialogcards-card-content'));

  assert.equal(instance.cardsSideMode, 'frontFirst');
  assert.equal(window.cardsSideMode, undefined);
  assert.equal($nextLeftSecondImage.hasClass('h5p-dialogcards-hide'), false);

  clickCurrentMatchButton(instance);
  timers.advanceBy(2000);

  assert.equal($nextLeftSecondImage.hasClass('h5p-dialogcards-hide'), true);
  assert.equal(window.document.body.contains($matchedRight[0]), false);
  assert.equal(window.document.body.contains($matchedLeft[0]), false);
  assert.equal(instance.currentDialogs.length, 1);
  assert.equal(instance.currentDialogs[0].text, 'Bravo');
  assert.equal(instance.$current.hasClass('h5p-dialogcards-current'), true);
  assert.equal(timers.pendingCount(), 0);
});

test('reset clears pending matching cleanup and completion', () => {
  const { $container, instance, timers } = attachMatchingActivity({
    contentId: 85,
  });
  const answeredEvents = [];
  instance.on('xAPI', (event) => {
    if (event.data.statement.verb.id === 'answered') {
      answeredEvents.push(event);
    }
  });
  completeFirstStandardMatch(instance, timers);
  clickCurrentMatchButton(instance);

  assert.equal(timers.pendingCount(), 2);
  instance.resetTask();
  assert.equal(instance.taskFinished, false);
  assert.equal(instance.getAnswerGiven(), false);
  assert.equal(instance.currentDialogs.length, 2);
  assert.equal(answeredEvents.length, 0);
  assert.equal(timers.pendingCount(), 0);

  timers.advanceBy(2000);

  assert.equal(instance.taskFinished, false);
  assert.equal(instance.getAnswerGiven(), false);
  assert.equal(instance.getScore(), 0);
  assert.equal(instance.currentDialogs.length, 2);
  assert.equal(instance.getCurrentState().taskFinished, false);
  assert.equal(
    $container.find('.h5p-dialogcards-final-summary-screen').length,
    0,
  );
  assert.equal($container.find('.h5p-dialogcards-cardwrap').length, 2);
  assert.equal(answeredEvents.length, 0);
  assert.equal(timers.pendingCount(), 0);
});
