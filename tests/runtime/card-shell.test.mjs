import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { createMinimalLibrary } from './fixture.mjs';
import { createH5PRuntime } from './h5p-runtime.mjs';

let runtime;

afterEach(() => {
  runtime?.close();
  runtime = undefined;
});

const createInstance = (playMode = 'normalMode') => {
  runtime = createH5PRuntime();
  return runtime.H5P.newRunnable(
    createMinimalLibrary({ playMode }),
    70,
  );
};

const getAttributes = ($element) => Object.fromEntries(
  Array.from(
    $element[0].attributes,
    ({ name, value }) => [name, value],
  ),
);

const assertNoDirectHandlers = ($element) => {
  assert.equal(runtime.$._data($element[0], 'events'), undefined);
};

const captureReferenceList = (items) => ({
  items: Array.from(items),
  reference: items,
});

const captureGameplayState = (instance, card) => ({
  actualScore: instance.actualScore,
  audios: captureReferenceList(instance.audios),
  audios2: captureReferenceList(instance.audios2),
  card: JSON.stringify(card),
  cardOrder: instance.cardOrder,
  cardOrderValue: JSON.stringify(instance.cardOrder),
  correct: instance.correct,
  currentDialogs: instance.currentDialogs,
  currentDialogsValue: JSON.stringify(instance.currentDialogs),
  currentRound: instance.currentRound,
  images: captureReferenceList(instance.$images),
  images2: captureReferenceList(instance.$images2),
  incorrect: instance.incorrect,
});

const assertReferenceList = (actual, before) => {
  assert.equal(actual, before.reference);
  assert.equal(actual.length, before.items.length);
  before.items.forEach((item, index) => assert.equal(actual[index], item));
};

const assertGameplayState = (instance, card, before) => {
  assert.equal(instance.actualScore, before.actualScore);
  assertReferenceList(instance.audios, before.audios);
  assertReferenceList(instance.audios2, before.audios2);
  assert.equal(JSON.stringify(card), before.card);
  assert.equal(instance.cardOrder, before.cardOrder);
  assert.equal(JSON.stringify(instance.cardOrder), before.cardOrderValue);
  assert.equal(instance.correct, before.correct);
  assert.equal(instance.currentDialogs, before.currentDialogs);
  assert.equal(
    JSON.stringify(instance.currentDialogs),
    before.currentDialogsValue,
  );
  assert.equal(instance.currentRound, before.currentRound);
  assertReferenceList(instance.$images, before.images);
  assertReferenceList(instance.$images2, before.images2);
  assert.equal(instance.incorrect, before.incorrect);
};

test('createCard assembles only the normal right shell and forwards content arguments', () => {
  const instance = createInstance();
  const { $ } = runtime;
  const card = { marker: 'right-card', nested: { unchanged: true } };
  const cardNumber = 1;
  let callbackCalls = 0;
  const setCardSizeCallback = () => callbackCalls++;
  const $sentinel = $('<section>', { class: 'right-content-sentinel' });
  let delegatedCall;

  instance.cardOrder = [1, 0];
  instance.actualScore = 7;
  instance.correct = 3;
  instance.incorrect = 2;
  instance.currentRound = 4;
  instance.createCardContent = function (...args) {
    delegatedCall = { args, receiver: this };
    return $sentinel;
  };
  const before = captureGameplayState(instance, card);

  const $wrapper = instance.createCard(
    card,
    cardNumber,
    setCardSizeCallback,
  );
  const $holder = $wrapper.children();

  assert.equal($wrapper.jquery, $.fn.jquery);
  assert.deepEqual(getAttributes($wrapper), {
    class: 'h5p-dialogcards-cardwrap',
  });
  assert.equal($wrapper.contents().length, 1);
  assert.equal($holder.length, 1);
  assert.equal($holder.parent()[0], $wrapper[0]);
  assert.deepEqual(getAttributes($holder), {
    class: 'h5p-dialogcards-cardholder',
  });
  assert.equal($holder.contents().length, 1);
  assert.equal($holder.children()[0], $sentinel[0]);
  assert.equal($sentinel.parent()[0], $holder[0]);

  assertNoDirectHandlers($wrapper);
  assertNoDirectHandlers($holder);
  assert.deepEqual(delegatedCall.args, [
    card,
    cardNumber,
    setCardSizeCallback,
  ]);
  assert.equal(delegatedCall.receiver, instance);
  assert.equal(callbackCalls, 0);
  assertGameplayState(instance, card, before);
});

test('createCard adds selfCorrectionMode only to the right holder', () => {
  const instance = createInstance('selfCorrectionMode');
  const { $ } = runtime;
  const $sentinel = $('<div>', { class: 'self-correction-sentinel' });

  instance.createCardContent = () => $sentinel;

  const $wrapper = instance.createCard({}, 0, () => {});
  const $holder = $wrapper.children();

  assert.deepEqual(getAttributes($wrapper), {
    class: 'h5p-dialogcards-cardwrap',
  });
  assert.deepEqual(getAttributes($holder), {
    class: 'h5p-dialogcards-cardholder selfCorrectionMode',
  });
  assert.equal($wrapper.hasClass('selfCorrectionMode'), false);
  assert.deepEqual(
    $holder.attr('class').split(/\s+/),
    ['h5p-dialogcards-cardholder', 'selfCorrectionMode'],
  );
});

test('createCardLeft assembles its actual shell and forwards content arguments', () => {
  const instance = createInstance('selfCorrectionMode');
  const { $ } = runtime;
  const card = { marker: 'left-card', nested: { unchanged: true } };
  const cardNumber = 9;
  let callbackCalls = 0;
  const setCardSizeCallback = () => callbackCalls++;
  const $sentinel = $('<aside>', { class: 'left-content-sentinel' });
  let delegatedCall;

  instance.cardOrder = [0, 1];
  instance.actualScore = 5;
  instance.correct = 1;
  instance.incorrect = 6;
  instance.currentRound = 3;
  instance.createCardContentLeft = function (...args) {
    delegatedCall = { args, receiver: this };
    return $sentinel;
  };
  const before = captureGameplayState(instance, card);

  const $wrapper = instance.createCardLeft(
    card,
    cardNumber,
    setCardSizeCallback,
  );
  const $holder = $wrapper.children();

  assert.equal($wrapper.jquery, $.fn.jquery);
  assert.deepEqual(getAttributes($wrapper), {
    class: 'h5p-dialogcards-cardwrap-left',
  });
  assert.equal($wrapper.contents().length, 1);
  assert.equal($holder.length, 1);
  assert.equal($holder.parent()[0], $wrapper[0]);
  assert.deepEqual(getAttributes($holder), {
    class: 'h5p-dialogcards-cardholder',
  });
  assert.equal($holder.contents().length, 1);
  assert.equal($holder.children()[0], $sentinel[0]);
  assert.equal($sentinel.parent()[0], $holder[0]);
  assert.equal($holder.hasClass('selfCorrectionMode'), false);

  assertNoDirectHandlers($wrapper);
  assertNoDirectHandlers($holder);
  assert.deepEqual(delegatedCall.args, [
    card,
    cardNumber,
    setCardSizeCallback,
  ]);
  assert.equal(delegatedCall.receiver, instance);
  assert.equal(callbackCalls, 0);
  assertGameplayState(instance, card, before);
});

test('repeated shell calls create fresh wrappers and holders around each sentinel', () => {
  const instance = createInstance();
  const { $ } = runtime;
  const rightSentinels = [
    $('<div>', { class: 'right-one' }),
    $('<div>', { class: 'right-two' }),
  ];
  const leftSentinels = [
    $('<div>', { class: 'left-one' }),
    $('<div>', { class: 'left-two' }),
  ];
  let rightIndex = 0;
  let leftIndex = 0;

  instance.createCardContent = () => rightSentinels[rightIndex++];
  instance.createCardContentLeft = () => leftSentinels[leftIndex++];

  const $rightOne = instance.createCard({}, 0, () => {});
  const $rightTwo = instance.createCard({}, 1, () => {});
  const $leftOne = instance.createCardLeft({}, 0, () => {});
  const $leftTwo = instance.createCardLeft({}, 1, () => {});

  assert.notEqual($rightOne[0], $rightTwo[0]);
  assert.notEqual($rightOne.children()[0], $rightTwo.children()[0]);
  assert.equal($rightOne.find('.right-one')[0], rightSentinels[0][0]);
  assert.equal($rightTwo.find('.right-two')[0], rightSentinels[1][0]);

  assert.notEqual($leftOne[0], $leftTwo[0]);
  assert.notEqual($leftOne.children()[0], $leftTwo.children()[0]);
  assert.equal($leftOne.find('.left-one')[0], leftSentinels[0][0]);
  assert.equal($leftTwo.find('.left-two')[0], leftSentinels[1][0]);
});

test('card shell methods retain their public prototype contracts', () => {
  const instance = createInstance();
  const { DialogcardsPapiJo } = runtime.H5P;

  for (const methodName of ['createCard', 'createCardLeft']) {
    const descriptor = Object.getOwnPropertyDescriptor(
      DialogcardsPapiJo.prototype,
      methodName,
    );

    assert.equal(Object.hasOwn(instance, methodName), false);
    assert.equal(instance[methodName], DialogcardsPapiJo.prototype[methodName]);
    assert.equal(instance[methodName].length, 3);
    assert.equal(descriptor.enumerable, true);
    assert.equal(descriptor.writable, true);
    assert.equal(descriptor.configurable, true);
  }
});
