import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { createMinimalLibrary } from './fixture.mjs';
import { createH5PRuntime } from './h5p-runtime.mjs';

let runtime;

afterEach(() => {
  runtime?.close();
  runtime = undefined;
});

function attachMatchingActivity(playMode, contentId) {
  runtime = createH5PRuntime();
  const { $, H5P, window } = runtime;
  window.Math.random = () => 0;
  const $container = $('<div></div>').appendTo(window.document.body);
  const instance = H5P.newRunnable(
    createMinimalLibrary({ playMode }),
    contentId,
    $container,
    false,
    { standalone: true },
  );

  return { $container, instance };
}

function clickCurrentMatchButton(instance) {
  const matchButton = instance.$current
    .find('.h5p-dialogcards-button-match')[0];
  assert.ok(matchButton, 'the current card has a Match button');
  matchButton.click();
}

test('matchMode records an incorrect interaction synchronously', () => {
  const { instance } = attachMatchingActivity('matchMode', 71);
  instance.nextCard();

  clickCurrentMatchButton(instance);

  assert.equal(instance.incorrect, 1);
  assert.equal(instance.correct, 0);
  assert.equal(instance.currentDialogs.length, 2);
  assert.deepEqual(Array.from(instance.cardOrder), [0, 1]);
  assert.equal(
    instance.$current
      .find('.h5p-dialogcards-match-incorrect')
      .hasClass('h5p-dialogcards-disabled'),
    false,
  );
  assert.equal(instance.$next.hasClass('blinking-button'), true);
  assert.equal(instance.$prev.hasClass('blinking-button'), true);
  assert.equal(instance.getScore(), 0);
  assert.equal(instance.getAnswerGiven(), false);

  const state = instance.getCurrentState();
  assert.equal(state.incorrect, 1);
  assert.equal(state.correct, 0);
});

test('matchMode records a correct interaction synchronously', () => {
  const { instance } = attachMatchingActivity('matchMode', 72);
  const $matchedRight = instance.$current;
  const $matchedLeft = instance.$currentLeft;

  clickCurrentMatchButton(instance);

  assert.equal(instance.correct, 1);
  assert.equal(instance.incorrect, 0);
  assert.equal(
    $matchedRight
      .find('.h5p-dialogcards-match-correct')
      .hasClass('h5p-dialogcards-disabled'),
    false,
  );
  assert.equal($matchedRight.hasClass('h5p-dialogcards-gotitdone'), true);
  assert.equal($matchedLeft.hasClass('h5p-dialogcards-gotitdone'), true);
  assert.equal(instance.currentDialogs.length, 1);
  assert.equal(instance.currentDialogs[0].text, 'Bravo');
  assert.deepEqual(Array.from(instance.cardOrder), [1]);
  assert.equal(instance.getMaxScore(), 2);
  assert.equal(instance.getScore(), 0);
  assert.equal(instance.getAnswerGiven(), false);
});

test('matchRepetition marks an incorrect attempt for replay synchronously', () => {
  const { $container, instance } = attachMatchingActivity(
    'matchRepetition',
    73,
  );

  assert.equal(instance.repetition, true);
  assert.equal(instance.cardsLeft, 2);
  assert.equal(instance.currentRound, 1);
  assert.equal(instance.$round.text(), 'Round 1');
  assert.deepEqual(Array.from(instance.noMatchCards), [0, 0]);

  instance.nextCard();
  clickCurrentMatchButton(instance);

  assert.equal(instance.cardsLeft, 1);
  assert.equal(instance.incorrect, 1);
  assert.equal(instance.correct, 0);
  assert.equal(instance.noMatchCards[0], 1);
  assert.equal(
    $container
      .find('.h5p-dialogcards-cardwrap')
      .eq(0)
      .hasClass('h5p-dialogcards-noMatch'),
    true,
  );
});
