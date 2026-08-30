import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { derivePlayModeOptions } from '../../src/scripts/configuration.js';
import { createMinimalLibrary } from './fixture.mjs';
import { createH5PRuntime } from './h5p-runtime.mjs';

const MODE_LABELS = {
  normalMode: '<span>LOCAL NORMAL</span>',
  browseSideBySide: 'LOCAL SIDE BY SIDE',
  matchMode: 'LOCAL MATCH',
  matchRepetition: 'LOCAL REPETITION',
  selfCorrectionMode: 'LOCAL SELF CORRECTION',
};

const EXPECTED_MODE_NAMES = [
  { value: 'normalMode', label: MODE_LABELS.normalMode },
  { value: 'browseSideBySide', label: MODE_LABELS.browseSideBySide },
  { value: 'matchMode', label: MODE_LABELS.matchMode },
  { value: 'matchRepetition', label: MODE_LABELS.matchRepetition },
  { value: 'selfCorrectionMode', label: MODE_LABELS.selfCorrectionMode },
];

const OMIT_ALLOWED_MODES = Symbol('omit allowed modes');

let runtime;

afterEach(() => {
  runtime?.close();
  runtime = undefined;
});

function createPlayModeLibrary(
  playMode,
  allowedPlayModes = OMIT_ALLOWED_MODES,
) {
  const library = createMinimalLibrary({ playMode });
  Object.assign(library.params, MODE_LABELS);
  if (allowedPlayModes !== OMIT_ALLOWED_MODES) {
    library.params.behaviour.allowedPlayModes = allowedPlayModes;
  }
  return library;
}

function createInstance({
  playMode,
  allowedPlayModes = OMIT_ALLOWED_MODES,
  previousState,
  attach = false,
  contentId = 201,
}) {
  runtime = createH5PRuntime();
  const { $, H5P, window } = runtime;
  const library = createPlayModeLibrary(playMode, allowedPlayModes);
  const extras = { standalone: true, previousState };
  const $container = attach
    ? $('<div></div>').appendTo(window.document.body)
    : undefined;
  const instance = H5P.newRunnable(
    library,
    contentId,
    $container,
    false,
    extras,
  );

  return { $container, instance, library };
}

function getLifecycleFlags(instance) {
  return {
    matchIt: instance.matchIt,
    repetition: instance.repetition,
    sideBySide: instance.sideBySide,
    enableGotIt: instance.enableGotIt,
  };
}

function getModeNames(instance) {
  return Array.from(instance.playModeNames, ({ value, label }) => ({
    value,
    label,
  }));
}

test('helper returns the exact fresh canonical list for non-user modes', () => {
  const labels = Object.freeze({
    normalMode: '<b>NORMAL</b>',
    browseSideBySide: '',
    matchMode: undefined,
    matchRepetition: ' REPETITION ',
    selfCorrectionMode: 'SELF!',
  });
  const unreadableAllowedModes = new Proxy({}, {
    get() {
      throw new Error('non-user mode inspected allowedPlayModes');
    },
  });

  const first = derivePlayModeOptions({
    playMode: 'matchMode',
    allowedPlayModes: unreadableAllowedModes,
    labels,
  });
  const second = derivePlayModeOptions({
    playMode: 'matchMode',
    allowedPlayModes: unreadableAllowedModes,
    labels,
  });

  assert.deepEqual(first, {
    playMode: 'matchMode',
    playModeNames: [
      { value: 'normalMode', label: '<b>NORMAL</b>' },
      { value: 'browseSideBySide', label: '' },
      { value: 'matchMode', label: undefined },
      { value: 'matchRepetition', label: ' REPETITION ' },
      { value: 'selfCorrectionMode', label: 'SELF!' },
    ],
  });
  assert.deepEqual(
    first.playModeNames.map((entry) => Object.keys(entry)),
    Array.from({ length: 5 }, () => ['value', 'label']),
  );
  assert.notEqual(first, second);
  assert.notEqual(first.playModeNames, second.playModeNames);
  assert.notEqual(first.playModeNames[0], second.playModeNames[0]);
});

test('helper preserves zero, one, and multiple user-mode collapse rules', () => {
  const labels = Object.freeze({ ...MODE_LABELS });
  const zeroMap = Object.freeze({
    normalMode: false,
    browseSideBySide: 0,
    matchMode: '',
    matchRepetition: null,
    selfCorrectionMode: undefined,
  });
  const oneMap = Object.freeze({
    normalMode: false,
    browseSideBySide: false,
    matchMode: false,
    matchRepetition: true,
    selfCorrectionMode: false,
  });
  const multipleMap = Object.freeze({
    selfCorrectionMode: 'yes',
    matchMode: 1,
    normalMode: true,
    matchRepetition: 0,
    browseSideBySide: '',
  });

  assert.deepEqual(derivePlayModeOptions({
    playMode: 'user',
    allowedPlayModes: zeroMap,
    labels,
  }), {
    playMode: 'normalMode',
    playModeNames: [],
  });
  assert.deepEqual(derivePlayModeOptions({
    playMode: 'user',
    allowedPlayModes: oneMap,
    labels,
  }), {
    playMode: 'matchRepetition',
    playModeNames: [EXPECTED_MODE_NAMES[3]],
  });
  assert.deepEqual(derivePlayModeOptions({
    playMode: 'user',
    allowedPlayModes: multipleMap,
    labels,
  }), {
    playMode: 'user',
    playModeNames: [
      EXPECTED_MODE_NAMES[0],
      EXPECTED_MODE_NAMES[2],
      EXPECTED_MODE_NAMES[4],
    ],
  });
});

test('helper uses raw allowed-mode truthiness without mutating inputs', () => {
  const labels = { ...MODE_LABELS };
  const allowedPlayModes = {
    normalMode: {},
    browseSideBySide: [],
    matchMode: undefined,
    matchRepetition: null,
    selfCorrectionMode: false,
  };
  const labelsBefore = { ...labels };
  const allowedBefore = { ...allowedPlayModes };

  const result = derivePlayModeOptions({
    playMode: 'user',
    allowedPlayModes,
    labels,
  });

  assert.equal(result.playMode, 'user');
  assert.deepEqual(
    result.playModeNames.map(({ value }) => value),
    ['normalMode', 'browseSideBySide'],
  );
  assert.deepEqual(labels, labelsBefore);
  assert.deepEqual(allowedPlayModes, allowedBefore);
});

test('helper preserves the synchronous missing-map TypeError', () => {
  assert.throws(
    () => derivePlayModeOptions({
      playMode: 'user',
      allowedPlayModes: undefined,
      labels: MODE_LABELS,
    }),
    TypeError,
  );
});

test('exposes five localized mode entries in the fixed production order', () => {
  const { instance } = createInstance({ playMode: 'normalMode' });

  assert.deepEqual(getModeNames(instance), EXPECTED_MODE_NAMES);
  assert.deepEqual(
    Array.from(instance.playModeNames, (entry) => Object.keys(entry)),
    Array.from({ length: 5 }, () => ['value', 'label']),
  );
  assert.equal(instance.playModeNames[0].label, '<span>LOCAL NORMAL</span>');
  assert.equal(
    Object.hasOwn(instance, 'allowedPlayModes'),
    false,
  );
});

const FIXED_MODE_CASES = [
  {
    mode: 'normalMode',
    constructed: {
      matchIt: false,
      repetition: undefined,
      sideBySide: undefined,
      enableGotIt: undefined,
    },
    attached: {
      matchIt: false,
      repetition: undefined,
      sideBySide: undefined,
      enableGotIt: undefined,
    },
  },
  {
    mode: 'browseSideBySide',
    constructed: {
      matchIt: true,
      repetition: undefined,
      sideBySide: undefined,
      enableGotIt: undefined,
    },
    attached: {
      matchIt: true,
      repetition: undefined,
      sideBySide: true,
      enableGotIt: undefined,
    },
  },
  {
    mode: 'matchMode',
    constructed: {
      matchIt: true,
      repetition: undefined,
      sideBySide: undefined,
      enableGotIt: undefined,
    },
    attached: {
      matchIt: true,
      repetition: undefined,
      sideBySide: undefined,
      enableGotIt: undefined,
    },
  },
  {
    mode: 'matchRepetition',
    constructed: {
      matchIt: false,
      repetition: undefined,
      sideBySide: undefined,
      enableGotIt: undefined,
    },
    attached: {
      matchIt: true,
      repetition: true,
      sideBySide: undefined,
      enableGotIt: undefined,
    },
  },
  {
    mode: 'selfCorrectionMode',
    constructed: {
      matchIt: false,
      repetition: undefined,
      sideBySide: undefined,
      enableGotIt: undefined,
    },
    attached: {
      matchIt: false,
      repetition: undefined,
      sideBySide: undefined,
      enableGotIt: true,
    },
  },
];

for (const modeCase of FIXED_MODE_CASES) {
  test(`${modeCase.mode} preserves constructor and attach-time flags`, () => {
    const { instance } = createInstance({ playMode: modeCase.mode });

    assert.equal(instance.playMode, modeCase.mode);
    assert.equal(instance.playModeUser, modeCase.mode);
    assert.deepEqual(getModeNames(instance), EXPECTED_MODE_NAMES);
    assert.equal(instance.allowedPlayModes, undefined);
    assert.deepEqual(getLifecycleFlags(instance), modeCase.constructed);

    const { $, window } = runtime;
    const $container = $('<div></div>').appendTo(window.document.body);
    instance.attach($container);

    assert.equal(instance.playMode, modeCase.mode);
    assert.equal(instance.playModeUser, modeCase.mode);
    assert.deepEqual(getLifecycleFlags(instance), modeCase.attached);
  });
}

test('user mode with zero allowed modes collapses to normalMode', () => {
  const allowedPlayModes = {
    normalMode: false,
    browseSideBySide: 0,
    matchMode: '',
    matchRepetition: null,
    selfCorrectionMode: undefined,
  };
  const before = { ...allowedPlayModes };
  const { instance, library } = createInstance({
    playMode: 'user',
    allowedPlayModes,
  });

  assert.equal(instance.playMode, 'normalMode');
  assert.equal(instance.playModeUser, 'normalMode');
  assert.deepEqual(getModeNames(instance), []);
  assert.equal(instance.allowedPlayModes, allowedPlayModes);
  assert.equal(
    instance.allowedPlayModes,
    library.params.behaviour.allowedPlayModes,
  );
  assert.deepEqual(allowedPlayModes, before);
  assert.deepEqual(getLifecycleFlags(instance), {
    matchIt: false,
    repetition: undefined,
    sideBySide: undefined,
    enableGotIt: undefined,
  });
});

test('user mode with one allowed repetition mode collapses before attach', () => {
  const allowedPlayModes = {
    selfCorrectionMode: false,
    matchRepetition: true,
    matchMode: false,
    browseSideBySide: false,
    normalMode: false,
  };
  const before = { ...allowedPlayModes };
  const { instance } = createInstance({
    playMode: 'user',
    allowedPlayModes,
  });

  assert.equal(instance.playMode, 'matchRepetition');
  assert.equal(instance.playModeUser, 'matchRepetition');
  assert.deepEqual(getModeNames(instance), [EXPECTED_MODE_NAMES[3]]);
  assert.equal(instance.allowedPlayModes, allowedPlayModes);
  assert.deepEqual(allowedPlayModes, before);
  assert.deepEqual(getLifecycleFlags(instance), {
    matchIt: false,
    repetition: undefined,
    sideBySide: undefined,
    enableGotIt: undefined,
  });

  const { $, window } = runtime;
  instance.attach($('<div></div>').appendTo(window.document.body));

  assert.deepEqual(getLifecycleFlags(instance), {
    matchIt: true,
    repetition: true,
    sideBySide: undefined,
    enableGotIt: undefined,
  });
});

test('user mode with multiple entries preserves canonical option order', () => {
  const allowedPlayModes = {
    selfCorrectionMode: 'enabled',
    normalMode: 1,
    matchRepetition: false,
    matchMode: true,
    browseSideBySide: 0,
  };
  const beforeEntries = Object.entries(allowedPlayModes);
  const { instance, library } = createInstance({
    playMode: 'user',
    allowedPlayModes,
  });

  assert.equal(instance.playMode, 'user');
  assert.equal(instance.playModeUser, 'user');
  assert.deepEqual(getModeNames(instance), [
    EXPECTED_MODE_NAMES[0],
    EXPECTED_MODE_NAMES[2],
    EXPECTED_MODE_NAMES[4],
  ]);
  assert.equal(instance.allowedPlayModes, allowedPlayModes);
  assert.equal(
    instance.allowedPlayModes,
    library.params.behaviour.allowedPlayModes,
  );
  assert.deepEqual(Object.entries(allowedPlayModes), beforeEntries);
  assert.equal(library.params.behaviour.playMode, 'user');
  for (const [name, label] of Object.entries(MODE_LABELS)) {
    assert.equal(library.params[name], label);
  }
  assert.deepEqual(getLifecycleFlags(instance), {
    matchIt: false,
    repetition: undefined,
    sideBySide: undefined,
    enableGotIt: undefined,
  });
});

test('allowed-mode filtering uses raw JavaScript truthiness', () => {
  const firstMap = {
    normalMode: true,
    browseSideBySide: false,
    matchMode: 1,
    matchRepetition: 0,
    selfCorrectionMode: 'yes',
  };
  const { instance: first } = createInstance({
    playMode: 'user',
    allowedPlayModes: firstMap,
  });

  assert.deepEqual(
    Array.from(first.playModeNames, ({ value }) => value),
    ['normalMode', 'matchMode', 'selfCorrectionMode'],
  );

  runtime.close();
  runtime = undefined;
  const secondMap = {
    normalMode: '',
    browseSideBySide: null,
    matchMode: undefined,
    matchRepetition: {},
    selfCorrectionMode: [],
  };
  const { instance: second } = createInstance({
    playMode: 'user',
    allowedPlayModes: secondMap,
  });

  assert.deepEqual(
    Array.from(second.playModeNames, ({ value }) => value),
    ['matchRepetition', 'selfCorrectionMode'],
  );
});

test('user mode without allowedPlayModes throws synchronously', () => {
  runtime = createH5PRuntime();
  const { H5P } = runtime;
  const library = createPlayModeLibrary('user');

  assert.throws(
    () => H5P.newRunnable(library, 211),
    (error) => error.name === 'TypeError',
  );
});

test('saved modes override normalized configuration before attach flags', () => {
  const allowedPlayModes = {
    normalMode: true,
    browseSideBySide: false,
    matchMode: false,
    matchRepetition: false,
    selfCorrectionMode: false,
  };
  const previousState = {
    playMode: 'matchRepetition',
    playModeUser: 'matchRepetition',
  };
  const { instance, library } = createInstance({
    playMode: 'user',
    allowedPlayModes,
    previousState,
  });

  assert.equal(library.params.behaviour.playMode, 'user');
  assert.deepEqual(getModeNames(instance), [EXPECTED_MODE_NAMES[0]]);
  assert.equal(instance.playMode, 'matchRepetition');
  assert.equal(instance.playModeUser, 'matchRepetition');
  assert.deepEqual(getLifecycleFlags(instance), {
    matchIt: false,
    repetition: undefined,
    sideBySide: undefined,
    enableGotIt: undefined,
  });

  const { $, window } = runtime;
  instance.attach($('<div></div>').appendTo(window.document.body));

  assert.equal(instance.playMode, 'matchRepetition');
  assert.equal(instance.playModeUser, 'matchRepetition');
  assert.deepEqual(getLifecycleFlags(instance), {
    matchIt: true,
    repetition: true,
    sideBySide: undefined,
    enableGotIt: undefined,
  });
});

test('known defective baseline: one allowed mode becomes undefined on reset', () => {
  const allowedPlayModes = {
    normalMode: false,
    browseSideBySide: false,
    matchMode: false,
    matchRepetition: true,
    selfCorrectionMode: false,
  };
  const { $container, instance } = createInstance({
    playMode: 'user',
    allowedPlayModes,
    attach: true,
    contentId: 212,
  });

  assert.equal(instance.playMode, 'matchRepetition');
  assert.equal(instance.playModeUser, 'matchRepetition');
  assert.equal(instance.repetition, true);

  instance.resetTask();

  assert.equal(instance.playMode, undefined);
  assert.equal(instance.playModeUser, undefined);
  assert.equal(instance.matchIt, false);
  assert.equal(instance.repetition, false);
  assert.equal(instance.sideBySide, false);
  assert.equal(instance.enableGotIt, false);
  assert.equal($container.find('.h5p-dialogcards-options').length, 0);
  assert.equal($container.find('.h5p-dialogcards-cardwrap-set').length, 1);
  assert.equal(instance.allowedPlayModes, allowedPlayModes);
});
