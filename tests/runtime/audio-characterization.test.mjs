import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { createMinimalLibrary } from './fixture.mjs';
import { createH5PRuntime } from './h5p-runtime.mjs';

let runtime;

afterEach(() => {
  runtime?.close();
  runtime = undefined;
});

function audioFile(name) {
  return [{ path: `${name}.mp3`, mime: 'audio/mpeg' }];
}

function createAudioLibrary({
  backAudio = true,
  frontAudio = true,
  noText = false,
  playMode = 'normalMode',
} = {}) {
  const library = createMinimalLibrary({ playMode });
  library.params.behaviour.noTextOnCards = noText;
  library.params.dialogs.forEach((card, index) => {
    if (frontAudio) {
      card.audioMedia.audio = audioFile(`front-${index}`);
    }
    if (backAudio) {
      card.audioMedia.audio2 = audioFile(`back-${index}`);
    }
  });
  return library;
}

function attachActivity({ contentId, library }) {
  const { $, H5P, window } = runtime;
  const $container = $('<div></div>').appendTo(window.document.body);
  const instance = H5P.newRunnable(
    library,
    contentId,
    $container,
    false,
    { standalone: true },
  );
  return { $container, instance };
}

function playersFor(contentId) {
  return runtime.audioPlayers.filter((player) => player.contentId === contentId);
}

function clickCurrentMatchButton(instance) {
  const matchButton = instance.$current
    .find('.h5p-dialogcards-button-match')[0];
  assert.ok(matchButton, 'the current card has a Match button');
  matchButton.click();
}

function assertPlayerOrder(actual, expected) {
  assert.equal(actual.length, expected.length);
  expected.forEach((player, index) => {
    assert.equal(actual[index], player);
  });
}

test('audio creation exposes ownership without duplicating noText players', () => {
  runtime = createH5PRuntime();
  runtime.window.Math.random = () => 0;

  const { instance: ordinary } = attachActivity({
    contentId: 91,
    library: createAudioLibrary(),
  });
  const ordinaryPlayers = playersFor(91);
  assert.equal(ordinaryPlayers.length, 4);
  assert.equal(ordinaryPlayers[0].options.files[0].path, 'front-0.mp3');
  assert.equal(ordinaryPlayers[0].options.files[0].mime, 'audio/mpeg');
  assert.equal(ordinaryPlayers[0].contentId, 91);
  assert.equal(ordinaryPlayers[0].audio.preload, 'none');
  assert.equal(ordinaryPlayers[1].audio.preload, 'none');
  assert.equal(
    ordinaryPlayers[0].$container.hasClass('h5p-dialogcards-audio-wrapper'),
    true,
  );
  assert.equal(ordinaryPlayers.every((player) => player.domConnected), true);
  assertPlayerOrder(ordinary.audios, [ordinaryPlayers[0], ordinaryPlayers[2]]);
  assertPlayerOrder(ordinary.audios2, [ordinaryPlayers[1], ordinaryPlayers[3]]);

  const { $container: $audioOnlyContainer, instance: audioOnly } =
    attachActivity({
      contentId: 92,
      library: createAudioLibrary({ noText: true }),
    });
  const audioOnlyPlayers = playersFor(92);
  assert.equal(audioOnlyPlayers.length, 4);
  assert.equal(
    $audioOnlyContainer.find('.h5p-dialogcards-audio-wrapper').length,
    2,
  );
  assert.equal(
    $audioOnlyContainer.find('.h5p-dialogcards-audio-wrapper2').length,
    2,
  );
  assertPlayerOrder(audioOnly.audios, [
    audioOnlyPlayers[0],
    audioOnlyPlayers[2],
  ]);
  assertPlayerOrder(audioOnly.audios2, [
    audioOnlyPlayers[1],
    audioOnlyPlayers[3],
  ]);

  const { instance: matching } = attachActivity({
    contentId: 93,
    library: createAudioLibrary({ playMode: 'matchMode' }),
  });
  const matchingPlayers = playersFor(93);
  assert.equal(matchingPlayers.length, 8);
  assert.equal(matching.audios.length, 4);
  assert.equal(matching.audios2.length, 4);
  assertPlayerOrder(matching.audios, [
    matchingPlayers[0],
    matchingPlayers[2],
    matchingPlayers[4],
    matchingPlayers[6],
  ]);
  assertPlayerOrder(matching.audios2, [
    matchingPlayers[1],
    matchingPlayers[3],
    matchingPlayers[5],
    matchingPlayers[7],
  ]);

  const { instance: noAudio } = attachActivity({
    contentId: 94,
    library: createMinimalLibrary(),
  });
  assert.equal(playersFor(94).length, 0);
  assert.equal(noAudio.audios.length, 0);
  assert.equal(noAudio.audios2.length, 0);
});

test('browsing navigation and side changes stop without rewinding', () => {
  runtime = createH5PRuntime({ fakeTimers: true });
  const { instance } = attachActivity({
    contentId: 95,
    library: createAudioLibrary(),
  });
  const players = playersFor(95);
  const firstFront = instance.audios[0];
  const firstBack = instance.audios2[0];
  const secondFront = instance.audios[1];

  firstFront.currentTime = 37;
  firstFront.play();
  instance.nextCard();
  assert.equal(firstFront.playing, false);
  assert.equal(firstFront.stopCalls, 1);
  assert.equal(firstFront.currentTime, 37);
  assert.deepEqual(firstFront.seekToCalls, []);

  secondFront.currentTime = 12;
  secondFront.play();
  instance.prevCard();
  assert.equal(secondFront.playing, false);
  assert.equal(secondFront.stopCalls, 1);
  assert.equal(secondFront.currentTime, 12);

  const $frontWrapper = instance.$current.find(
    '.h5p-dialogcards-audio-wrapper',
  );
  const $backWrapper = instance.$current.find(
    '.h5p-dialogcards-audio-wrapper2',
  );
  firstFront.play();
  instance.turnCard(instance.$current);
  runtime.timers.advanceBy(199);
  assert.equal(firstFront.playing, true);
  assert.equal($frontWrapper.hasClass('hide'), false);
  assert.equal($backWrapper.hasClass('hide'), true);

  runtime.timers.advanceBy(1);
  assert.equal(firstFront.playing, false);
  assert.equal(firstFront.currentTime, 37);
  assert.equal($frontWrapper.hasClass('hide'), true);
  assert.equal($backWrapper.hasClass('hide'), false);
  assert.equal(firstFront.stopCalls, 3);
  assert.equal(firstBack.stopCalls, 3);
  runtime.timers.advanceBy(200);

  firstBack.currentTime = 8;
  firstBack.play();
  instance.turnCard(instance.$current);
  runtime.timers.advanceBy(200);
  assert.equal(firstBack.playing, false);
  assert.equal(firstBack.currentTime, 8);
  assert.equal($frontWrapper.hasClass('hide'), false);
  assert.equal($backWrapper.hasClass('hide'), true);
  assert.equal(playersFor(95).length, 4);
  assert.equal(players.every((player) => player.domConnected), true);
});

test('reset cleans up active players before replacing their DOM and references', () => {
  runtime = createH5PRuntime();
  const { instance } = attachActivity({
    contentId: 96,
    library: createAudioLibrary(),
  });
  const abandonedPlayers = playersFor(96).slice();
  const abandonedFront = abandonedPlayers[0];
  abandonedFront.currentTime = 21;
  abandonedFront.play();

  instance.resetTask();

  const allPlayers = playersFor(96);
  const replacementPlayers = allPlayers.slice(abandonedPlayers.length);
  assert.equal(allPlayers.length, 8);
  assert.equal(replacementPlayers.length, 4);
  assert.equal(abandonedFront.playing, false);
  assert.equal(abandonedFront.stopCalls, 1);
  assert.equal(abandonedFront.currentTime, 0);
  assert.deepEqual(abandonedFront.seekToCalls, [0]);
  assert.equal(
    abandonedPlayers.every((player) =>
      player.stopCalls === 1 && player.seekToCalls[0] === 0),
    true,
  );
  assert.equal(abandonedPlayers.every((player) => !player.domConnected), true);
  assert.equal(replacementPlayers.every((player) => player.domConnected), true);
  assert.equal(
    instance.audios.every((player) => replacementPlayers.includes(player)),
    true,
  );
  assert.equal(
    instance.audios2.every((player) => replacementPlayers.includes(player)),
    true,
  );
  assert.equal(instance.audios.includes(abandonedFront), false);
});

test('matching resets all players and removes matched audio references', () => {
  runtime = createH5PRuntime({ fakeTimers: true });
  runtime.window.Math.random = () => 0;
  const { $container, instance } = attachActivity({
    contentId: 97,
    library: createAudioLibrary({ playMode: 'matchMode' }),
  });
  const allPlayers = playersFor(97);
  allPlayers.forEach((player, index) => {
    player.currentTime = index + 1;
    player.play();
  });
  const $matchedRight = instance.$current;
  const $matchedLeft = instance.$currentLeft;
  const removedPlayers = allPlayers.filter((player) =>
    $matchedRight[0].contains(player.$audio[0]) ||
    $matchedLeft[0].contains(player.$audio[0]),
  );

  clickCurrentMatchButton(instance);

  assert.equal(
    allPlayers.every((player) =>
      !player.playing && player.stopCalls === 1 && player.seekToCalls[0] === 0),
    true,
  );
  assert.equal(
    removedPlayers.every((player) =>
      instance.audios.includes(player) || instance.audios2.includes(player)),
    true,
  );
  assert.equal(instance.audios.length, 4);
  assert.equal(instance.audios2.length, 4);

  runtime.timers.advanceBy(2000);
  assert.equal(removedPlayers.every((player) => !player.domConnected), true);
  assert.equal(
    removedPlayers.every((player) =>
      !instance.audios.includes(player) && !instance.audios2.includes(player)),
    true,
  );
  assert.equal(instance.audios.length, 2);
  assert.equal(instance.audios2.length, 2);

  const finalPlayers = [...instance.audios, ...instance.audios2];
  finalPlayers.forEach((player) => player.play());
  clickCurrentMatchButton(instance);
  assert.equal(
    finalPlayers.every((player) =>
      !player.playing && player.stopCalls === 2 && player.seekToCalls[1] === 0),
    true,
  );
  assert.equal(instance.audios.length, 2);
  assert.equal(instance.audios2.length, 2);
  finalPlayers.forEach((player) => player.play());
  runtime.timers.advanceBy(2000);

  assert.equal(instance.taskFinished, true);
  assert.equal(
    finalPlayers.every((player) =>
      !player.playing && player.stopCalls === 3 && player.seekToCalls[2] === 0),
    true,
  );
  assert.equal(instance.audios.length, 0);
  assert.equal(instance.audios2.length, 0);
  assert.equal($container.find('.h5p-dialogcards-final-summary-screen').length, 1);
  assert.equal(
    allPlayers.every((player) => !player.playing && !player.domConnected),
    true,
  );

  const { $container: $completionContainer, instance: completion } =
    attachActivity({
      contentId: 102,
      library: createAudioLibrary({ playMode: 'matchMode' }),
    });
  const completionPlayers = playersFor(102);
  completionPlayers.forEach((player) => player.play());
  completion.finishedScreen();
  assert.equal(
    completionPlayers.every((player) =>
      !player.playing && player.stopCalls === 1 && player.seekToCalls[0] === 0),
    true,
  );
  assert.equal(
    $completionContainer.find('.h5p-dialogcards-final-summary-screen').length,
    1,
  );
  assert.equal(
    completionPlayers.every((player) => !player.domConnected),
    true,
  );
});

test('audio ownership is instance-local and no-audio interactions are safe', () => {
  runtime = createH5PRuntime({ fakeTimers: true });
  runtime.window.Math.random = () => 0;
  const { instance: first } = attachActivity({
    contentId: 98,
    library: createAudioLibrary(),
  });
  const { instance: second } = attachActivity({
    contentId: 99,
    library: createAudioLibrary(),
  });
  const firstPlayer = first.audios[0];
  firstPlayer.currentTime = 15;
  firstPlayer.play();

  second.nextCard();
  second.resetTask();

  assert.equal(firstPlayer.playing, true);
  assert.equal(firstPlayer.stopCalls, 0);
  assert.equal(firstPlayer.currentTime, 15);
  assert.equal(first.audios.includes(firstPlayer), true);
  assert.equal(
    playersFor(98).every((player) => player.contentId === 98),
    true,
  );
  assert.equal(
    playersFor(99).every((player) => player.contentId === 99),
    true,
  );

  const { instance: noAudioBrowsing } = attachActivity({
    contentId: 100,
    library: createMinimalLibrary(),
  });
  assert.doesNotThrow(() => {
    noAudioBrowsing.nextCard();
    noAudioBrowsing.prevCard();
    noAudioBrowsing.resetTask();
  });
  assert.equal(noAudioBrowsing.audios.length, 0);
  assert.equal(noAudioBrowsing.audios2.length, 0);

  const { instance: noAudioMatching } = attachActivity({
    contentId: 101,
    library: createMinimalLibrary({ playMode: 'matchMode' }),
  });
  assert.doesNotThrow(() => clickCurrentMatchButton(noAudioMatching));
  assert.doesNotThrow(() => runtime.timers.advanceBy(2000));
  assert.equal(noAudioMatching.audios.length, 0);
  assert.equal(noAudioMatching.audios2.length, 0);
});
