import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import {
  compareMediaMaps,
  describeMediaLayout,
  getMediaMap,
  isValidNoTextMediaMap,
  switchSides as switchCardSides,
} from '../../src/scripts/media.js';
import { createMinimalLibrary } from './fixture.mjs';
import { createH5PRuntime } from './h5p-runtime.mjs';

let runtime;

afterEach(() => {
  runtime?.close();
  runtime = undefined;
});

function image(name) {
  return { path: `${name}.png`, mime: 'image/png' };
}

function audio(name) {
  return [{ path: `${name}.mp3`, mime: 'audio/mpeg' }];
}

function createCard({
  answer = '',
  backAudio,
  backImage,
  frontAudio,
  frontImage,
  text = '',
} = {}) {
  return {
    text,
    answer,
    imageMedia: {
      image: frontImage,
      image2: backImage,
      imageAltText: frontImage ? 'front alt' : undefined,
      imageAltText2: backImage ? 'back alt' : undefined,
    },
    audioMedia: {
      audio: frontAudio,
      audio2: backAudio,
    },
    tips: {
      front: 'front tip',
      back: 'back tip',
    },
    itemCategories: 'category',
  };
}

function createNoTextLibrary(dialogs) {
  const library = createMinimalLibrary();
  library.params.title = 'Media title';
  library.params.description = 'Media description';
  library.params.dialogs = dialogs;
  library.params.behaviour.noTextOnCards = true;
  return library;
}

function createNoTextInstance(dialogs, contentId = 121) {
  const library = createNoTextLibrary(dialogs);
  const instance = runtime.H5P.newRunnable(library, contentId);
  return { instance, library };
}

function mediaForLayout(layout, suffix) {
  const media = {};
  if (layout.front === 'image') {
    media.frontImage = image(`front-${suffix}`);
  }
  else {
    media.frontAudio = audio(`front-${suffix}`);
  }
  if (layout.back === 'image') {
    media.backImage = image(`back-${suffix}`);
  }
  else {
    media.backAudio = audio(`back-${suffix}`);
  }
  return media;
}

test('media helpers preserve truthiness, layout order, and complete-map comparison', () => {
  const card = {
    text: undefined,
    answer: '',
    imageMedia: {
      image: { path: 'front.png' },
      image2: '',
    },
    audioMedia: {
      audio: [],
      audio2: [{ path: 'back.mp3' }],
    },
  };
  const mediaMap = getMediaMap(card);

  assert.deepEqual(mediaMap, {
    front: { image: true, audio: true },
    back: { image: false, audio: true },
  });
  assert.equal(isValidNoTextMediaMap(mediaMap), false);
  assert.equal(
    describeMediaLayout(mediaMap),
    'Image front AND Audio front AND Audio back',
  );
  assert.deepEqual(
    compareMediaMaps(
      {
        front: { image: true, audio: false },
        back: { image: true, audio: false },
      },
      mediaMap,
    ),
    {
      missing: ['missing image back'],
      extra: ['extra audio media front', 'extra audio media back'],
    },
  );
  assert.deepEqual(
    getMediaMap({
      text: 'Text is ignored',
      answer: 'Answer is ignored',
      imageMedia: card.imageMedia,
      audioMedia: card.audioMedia,
    }),
    mediaMap,
  );
});

test('side transformation helper mutates supplied cards and nested objects in place', () => {
  const card = createCard({
    text: 'Front',
    answer: 'Back',
    frontImage: image('front'),
    backImage: image('back'),
    frontAudio: audio('front'),
    backAudio: audio('back'),
  });
  const imageMedia = card.imageMedia;
  const audioMedia = card.audioMedia;
  const tips = card.tips;

  assert.equal(switchCardSides([card]), undefined);
  assert.equal(card.text, 'Back');
  assert.equal(card.answer, 'Front');
  assert.equal(card.imageMedia, imageMedia);
  assert.equal(card.audioMedia, audioMedia);
  assert.equal(card.tips, tips);
  assert.equal(card.imageMedia.image.path, 'back.png');
  assert.equal(card.audioMedia.audio[0].path, 'back.mp3');
});

test('accepts exactly one image or audio on each side of every noText card', () => {
  runtime = createH5PRuntime();
  const layouts = [
    { front: 'image', back: 'image', flag: 'hasTwoImages' },
    { front: 'audio', back: 'audio', flag: 'has2Audio' },
    { front: 'image', back: 'audio', flag: 'frontImageBackAudio' },
    { front: 'audio', back: 'image', flag: 'frontAudioBackImage' },
  ];

  layouts.forEach((layout, index) => {
    const dialogs = [
      createCard({
        ...mediaForLayout(layout, `${index}-first`),
        text: undefined,
      }),
      createCard({
        ...mediaForLayout(layout, `${index}-second`),
        text: '',
      }),
    ];
    const snapshot = structuredClone(dialogs);
    const { instance } = createNoTextInstance(dialogs, 121 + index);

    assert.equal(instance.report, '');
    assert.equal(instance.params.dialogs, dialogs);
    assert.deepEqual(instance.params.dialogs, snapshot);
    assert.notEqual(instance.currentDialogs, dialogs);
    assert.deepEqual(instance.currentDialogs, snapshot);
    assert.equal(instance[layout.flag], true);
  });
});

test('classifies all first-card front and back media-presence combinations', () => {
  runtime = createH5PRuntime();
  let contentId = 130;

  for (let frontMask = 0; frontMask < 4; frontMask++) {
    for (let backMask = 0; backMask < 4; backMask++) {
      const frontImage = (frontMask & 1) !== 0;
      const frontAudio = (frontMask & 2) !== 0;
      const backImage = (backMask & 1) !== 0;
      const backAudio = (backMask & 2) !== 0;
      const card = createCard({
        text: 'Reference',
        answer: 'Reference answer',
        frontImage: frontImage ? image(`front-image-${contentId}`) : undefined,
        frontAudio: frontAudio ? audio(`front-audio-${contentId}`) : undefined,
        backImage: backImage ? image(`back-image-${contentId}`) : undefined,
        backAudio: backAudio ? audio(`back-audio-${contentId}`) : undefined,
      });
      const { instance } = createNoTextInstance([card], contentId++);
      const isValid = Number(frontImage) + Number(frontAudio) === 1 &&
        Number(backImage) + Number(backAudio) === 1;

      assert.equal(instance.report === '', isValid);
      if (!isValid) {
        assert.match(instance.report, /Reference Card Invalid/);
        assert.match(
          instance.report,
          /The first card must contain exactly one media per side \(front & back\)\./,
        );
        assert.equal(instance.params.dialogs.length, 1);
        assert.equal(instance.currentDialogs.length, 1);
      }
    }
  }
});

test('uses the first card media map and rejects the whole instance deck on a later mismatch', () => {
  runtime = createH5PRuntime();
  const first = createCard({
    text: '<strong>Reference</strong>',
    answer: 'Reference answer',
    frontImage: image('reference-front'),
    backImage: image('reference-back'),
  });
  const mismatch = createCard({
    text: '<em>Mismatch</em>',
    answer: 'Mismatch answer',
    frontAudio: audio('mismatch-front'),
    backAudio: audio('mismatch-back'),
  });
  const dialogs = [first, mismatch];
  const { instance, library } = createNoTextInstance(dialogs);

  assert.equal(library.params.dialogs, dialogs);
  assert.equal(dialogs.length, 2);
  assert.notEqual(instance.params.dialogs, dialogs);
  assert.equal(instance.params.dialogs.length, 0);
  assert.equal(instance.currentDialogs.length, 0);
  assert.equal(instance.nbCards, 0);
  assert.equal(instance.hasOneImageOnFront, false);
  assert.equal(instance.frontAudioBackImage, true);
  assert.equal(instance.frontImageBackAudio, true);
  assert.equal(instance.has2Audio, true);
  assert.equal(instance.audioOnly, true);
  assert.equal(instance.hasImageOnFront, true);
  assert.equal(instance.hasImageOnBack, true);
  assert.equal(instance.hasTwoImages, true);
  assert.match(instance.report, /Deck Rejected/);
  assert.match(
    instance.report,
    /Card #1 defines the required media layout:<\/strong> Image front AND Image back/,
  );
  assert.match(
    instance.report,
    /missing image front and missing image back AND extra audio media front and extra audio media back/,
  );
  assert.match(instance.report, /<strong>Text:<\/strong> "Mismatch"/);
  assert.match(instance.report, /Deck size:<\/strong> 2 cards/);
  assert.match(instance.report, /Cards with mismatches:<\/strong> 1/);
  assert.equal(instance.params.title, '');
  assert.equal(
    instance.params.description,
    "<div class='h5p-error-message'Media titleMedia description<hr><h3>" +
      `${instance.params.noTextErrorNotice}</h3>${instance.report}`,
  );
});

test('rewrites only falsy text on mismatching later cards before rejecting the deck', () => {
  runtime = createH5PRuntime();
  const first = createCard({
    text: 'Reference',
    frontImage: image('reference-front'),
    backAudio: audio('reference-back'),
  });
  const missingText = createCard({
    text: undefined,
    answer: 'Missing answer',
    frontAudio: audio('missing-front'),
    backImage: image('missing-back'),
  });
  const emptyText = createCard({
    text: '',
    answer: 'Empty answer',
    frontAudio: audio('empty-front'),
    backImage: image('empty-back'),
  });
  const missingFrontAudio = missingText.audioMedia.audio;
  const dialogs = [first, missingText, emptyText];
  const { instance } = createNoTextInstance(dialogs);

  assert.equal(missingText.text, 'Missing text!');
  assert.equal(emptyText.text, 'Missing text!');
  assert.equal(missingText.answer, 'Missing answer');
  assert.equal(emptyText.answer, 'Empty answer');
  assert.equal(missingText.audioMedia.audio, missingFrontAudio);
  assert.equal(instance.params.dialogs.length, 0);
  assert.equal(instance.currentDialogs.length, 0);
  assert.equal(
    instance.report.match(/⚠️ Missing text!/g)?.length,
    2,
  );
});

test('switchSides swaps two-sided card fields in place and preserves unrelated fields', () => {
  runtime = createH5PRuntime();
  const { instance } = createNoTextInstance([
    createCard({
      frontImage: image('instance-front'),
      backImage: image('instance-back'),
    }),
  ]);
  const frontImage = image('front');
  const backImage = image('back');
  const frontAudio = audio('front');
  const backAudio = audio('back');
  const card = createCard({
    text: 'Front text',
    answer: 'Back text',
    frontImage,
    backImage,
    frontAudio,
    backAudio,
  });
  const cards = [card];
  const imageMedia = card.imageMedia;
  const audioMedia = card.audioMedia;
  const tips = card.tips;

  const result = instance.switchSides(cards);

  assert.equal(result, undefined);
  assert.equal(cards[0], card);
  assert.equal(card.text, 'Back text');
  assert.equal(card.answer, 'Front text');
  assert.equal(card.tips, tips);
  assert.equal(card.tips.front, 'back tip');
  assert.equal(card.tips.back, 'front tip');
  assert.equal(card.audioMedia, audioMedia);
  assert.equal(card.audioMedia.audio, backAudio);
  assert.equal(card.audioMedia.audio2, frontAudio);
  assert.equal(card.imageMedia, imageMedia);
  assert.equal(card.imageMedia.image, backImage);
  assert.equal(card.imageMedia.image2, frontImage);
  assert.equal(card.imageMedia.imageAltText, 'back alt');
  assert.equal(card.imageMedia.imageAltText2, 'front alt');
  assert.equal(card.itemCategories, 'category');
});

test('switchSides remains an enumerable writable prototype method with one parameter', () => {
  runtime = createH5PRuntime();
  const { instance } = createNoTextInstance([
    createCard({
      frontImage: image('instance-front'),
      backImage: image('instance-back'),
    }),
  ]);
  const Constructor = runtime.H5P.DialogcardsPapiJo;
  const descriptor = Object.getOwnPropertyDescriptor(
    Constructor.prototype,
    'switchSides',
  );

  assert.equal(Object.hasOwn(instance, 'switchSides'), false);
  assert.equal(instance.switchSides, descriptor.value);
  assert.equal(descriptor.value.length, 1);
  assert.equal(descriptor.enumerable, true);
  assert.equal(descriptor.writable, true);
  assert.equal(descriptor.configurable, true);
});

test('switchSides twice restores an ordinary two-sided card exactly', () => {
  runtime = createH5PRuntime();
  const { instance } = createNoTextInstance([
    createCard({
      frontAudio: audio('instance-front'),
      backAudio: audio('instance-back'),
    }),
  ]);
  const card = createCard({
    text: 'Front text',
    answer: 'Back text',
    frontImage: image('front'),
    backImage: image('back'),
    frontAudio: audio('front'),
    backAudio: audio('back'),
  });
  const snapshot = structuredClone(card);
  const imageMedia = card.imageMedia;
  const audioMedia = card.audioMedia;
  const tips = card.tips;

  instance.switchSides([card]);
  instance.switchSides([card]);

  assert.deepEqual(card, snapshot);
  assert.equal(card.imageMedia, imageMedia);
  assert.equal(card.audioMedia, audioMedia);
  assert.equal(card.tips, tips);
});

test('switchSides duplicates a front-only image but only moves one-sided audio', () => {
  runtime = createH5PRuntime();
  const { instance } = createNoTextInstance([
    createCard({
      frontImage: image('instance-front'),
      backAudio: audio('instance-back'),
    }),
  ]);
  const frontImage = image('only-front-image');
  const frontAudio = audio('only-front-audio');
  const card = createCard({
    text: 'Front',
    answer: 'Back',
    frontImage,
    frontAudio,
  });

  instance.switchSides([card]);

  assert.equal(card.imageMedia.image, frontImage);
  assert.equal(card.imageMedia.image2, frontImage);
  assert.equal(card.imageMedia.imageAltText, undefined);
  assert.equal(card.imageMedia.imageAltText2, 'front alt');
  assert.equal(card.audioMedia.audio, undefined);
  assert.equal(card.audioMedia.audio2, frontAudio);

  instance.switchSides([card]);

  assert.equal(card.imageMedia.image, frontImage);
  assert.equal(card.imageMedia.image2, frontImage);
  assert.equal(card.imageMedia.imageAltText, 'front alt');
  assert.equal(card.imageMedia.imageAltText2, undefined);
  assert.equal(card.audioMedia.audio, frontAudio);
  assert.equal(card.audioMedia.audio2, undefined);
});

test('switchSides leaves a back-only image on the back while swapping its alt text', () => {
  runtime = createH5PRuntime();
  const { instance } = createNoTextInstance([
    createCard({
      frontAudio: audio('instance-front'),
      backImage: image('instance-back'),
    }),
  ]);
  const backImage = image('only-back-image');
  const card = createCard({
    text: 'Front',
    answer: 'Back',
    backImage,
  });

  instance.switchSides([card]);

  assert.equal(card.imageMedia.image, undefined);
  assert.equal(card.imageMedia.image2, backImage);
  assert.equal(card.imageMedia.imageAltText, 'back alt');
  assert.equal(card.imageMedia.imageAltText2, undefined);
});
