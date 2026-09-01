import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { afterEach, test } from 'node:test';

import { createMinimalLibrary } from './fixture.mjs';
import { createH5PRuntime } from './h5p-runtime.mjs';

let runtime;

afterEach(() => {
  runtime?.close();
  runtime = undefined;
});

function createResizeFixture() {
  runtime = createH5PRuntime();
  const { $, H5P, window } = runtime;
  const instance = new H5P.DialogcardsPapiJo(
    createMinimalLibrary().params,
    61,
    {},
  );

  instance.$cardwrapperSet = $(
    '<div style="font-size: 16px"><div style="height: 10px"></div></div>',
  ).appendTo(window.document.body);
  instance.$retry = $('<button></button>');
  instance.playModeUser = 'normalMode';
  instance.determineCardSizes = () => {};
  instance.scaleToFitHeight = () => {};
  instance.resizeOverflowingText = () => {};

  return instance;
}

test('resize keeps its public prototype contract', () => {
  runtime = createH5PRuntime();
  const descriptor = Object.getOwnPropertyDescriptor(
    runtime.H5P.DialogcardsPapiJo.prototype,
    'resize',
  );

  assert.equal(descriptor.value.length, 0);
  assert.equal(descriptor.enumerable, true);
  assert.equal(descriptor.writable, true);
  assert.equal(descriptor.configurable, true);
});

test('taskFinished prevents resize calculation', () => {
  const instance = createResizeFixture();
  let calculations = 0;
  instance.updateImageSize = () => calculations++;
  instance.taskFinished = true;

  instance.resize();

  assert.equal(calculations, 0);
});

test('resize suppresses synchronous reentrancy and unlocks afterward', () => {
  const instance = createResizeFixture();
  let calculations = 0;
  let attemptedReentry = false;
  instance.updateImageSize = () => {
    calculations++;
    if (!attemptedReentry) {
      attemptedReentry = true;
      instance.resize();
    }
  };

  instance.resize();

  assert.equal(attemptedReentry, true);
  assert.equal(calculations, 1);
});

test('resize allows later independent sequential calculations', () => {
  const instance = createResizeFixture();
  let calculations = 0;
  instance.updateImageSize = () => calculations++;

  instance.resize();
  instance.resize();
  instance.resize();

  assert.equal(calculations, 3);
});

test('resize allows a later independent calculation after an exception', () => {
  const instance = createResizeFixture();
  const failure = new Error('expected resize failure');
  instance.updateImageSize = () => {
    throw failure;
  };

  assert.throws(() => instance.resize(), failure);

  let calculations = 0;
  instance.updateImageSize = () => calculations++;
  instance.resize();

  assert.equal(calculations, 1);
});

test('five sequential resizes remain stable with the production cardholder box model', () => {
  const instance = createResizeFixture();
  const { $, window } = runtime;
  const stylesheet = window.document.createElement('style');
  stylesheet.textContent = readFileSync(
    new URL('../../src/styles/h5p-dialogcards.css', import.meta.url),
    'utf8',
  );
  window.document.head.append(stylesheet);

  instance.$cardwrapperSet.remove();
  const $root = $(
    '<div class="h5p-dialogcards">' +
      '<div class="h5p-dialogcards-cardwrap-set" style="font-size:16px;height:198px">' +
        '<div class="h5p-dialogcards-cardwrap">' +
          '<div class="h5p-dialogcards-cardholder" style="height:100%;border-width:3px"></div>' +
        '</div>' +
      '</div>' +
    '</div>',
  ).appendTo(window.document.body);
  instance.$cardwrapperSet = $root.find('.h5p-dialogcards-cardwrap-set');

  const originalOuterHeight = $.fn.outerHeight;
  const holder = instance.$cardwrapperSet.find('.h5p-dialogcards-cardholder')[0];
  let previousSetHeight = 198;
  $.fn.outerHeight = function modelPercentageHolderOuterHeight() {
    const element = this[0];
    const isMeasuredCard = element?.classList.contains('h5p-dialogcards-cardwrap') ||
      element?.classList.contains('h5p-dialogcards-cardholder');
    if (!isMeasuredCard) {
      return originalOuterHeight.apply(this, arguments);
    }

    const holderStyle = window.getComputedStyle(holder);
    const borderHeight = Number.parseFloat(holderStyle.borderTopWidth) +
      Number.parseFloat(holderStyle.borderBottomWidth);
    return previousSetHeight + (holderStyle.boxSizing === 'border-box' ? 0 : borderHeight);
  };

  const heights = [];
  try {
    for (let pass = 0; pass < 5; pass++) {
      instance.resize();
      previousSetHeight = Number.parseFloat(instance.$cardwrapperSet[0].style.height);
      heights.push(previousSetHeight);
    }
  }
  finally {
    $.fn.outerHeight = originalOuterHeight;
  }

  assert.equal(window.getComputedStyle(holder).boxSizing, 'border-box');
  assert.deepEqual(heights, [198, 198, 198, 198, 198]);
});
