/**
 * Build a front/back media-presence map for a card.
 * @param {object} card Dialog card configuration.
 * @returns {object} Boolean image/audio presence by side.
 */
export function getMediaMap(card) {
  return {
    front: {
      image: !!card.imageMedia?.image,
      audio: !!card.audioMedia?.audio,
    },
    back: {
      image: !!card.imageMedia?.image2,
      audio: !!card.audioMedia?.audio2,
    },
  };
}

/**
 * Test whether a media map contains exactly one medium on each side.
 * @param {object} mediaMap Boolean image/audio presence by side.
 * @returns {boolean} Whether the media map is valid for no-text cards.
 */
export function isValidNoTextMediaMap(mediaMap) {
  const frontCount =
    (mediaMap.front.image ? 1 : 0) +
    (mediaMap.front.audio ? 1 : 0);
  const backCount =
    (mediaMap.back.image ? 1 : 0) +
    (mediaMap.back.audio ? 1 : 0);
  return frontCount === 1 && backCount === 1;
}

/**
 * Produce the existing human-readable media layout description.
 * @param {object} mediaMap Boolean image/audio presence by side.
 * @returns {string} Layout description.
 */
export function describeMediaLayout(mediaMap) {
  const parts = [];

  ['front', 'back'].forEach((side) => {
    ['image', 'audio'].forEach((type) => {
      if (mediaMap[side][type]) {
        parts.push(`${type.charAt(0).toUpperCase() + type.slice(1)} ${side}`);
      }
    });
  });

  return parts.join(' AND ');
}

/**
 * Compare every media-presence field with a reference layout.
 * @param {object} reference Reference media map.
 * @param {object} current Current media map.
 * @returns {{missing: string[], extra: string[]}} Existing mismatch descriptions.
 */
export function compareMediaMaps(reference, current) {
  const missing = [];
  const extra = [];

  ['front', 'back'].forEach((side) => {
    ['image', 'audio'].forEach((type) => {
      if (reference[side][type] && !current[side][type]) {
        missing.push(`missing ${type} ${side}`);
      }
      if (!reference[side][type] && current[side][type]) {
        extra.push(`extra ${type} media ${side}`);
      }
    });
  });

  return { missing, extra };
}

/**
 * Switch front/back card values using the existing in-place behavior.
 * @param {object[]} cards Dialog cards to mutate.
 */
export function switchSides(cards) {
  for (let i = 0; i < cards.length; i++) {
    let t = cards[i].text;
    let a = cards[i].answer;
    cards[i].text = a;
    cards[i].answer = t;
    let tf = cards[i].tips.front;
    let tb = cards[i].tips.back;
    cards[i].tips.front = tb;
    cards[i].tips.back = tf;
    let au = cards[i].audioMedia.audio;
    let au2 = cards[i].audioMedia.audio2;
    cards[i].audioMedia.audio = au2;
    cards[i].audioMedia.audio2 = au;
    let i0 = cards[i].imageMedia.image;
    let i2 = cards[i].imageMedia.image2;
    if (!cards[i].imageMedia.image2 && cards[i].imageMedia.image) {
      i2 = i0;
    }
    if (!cards[i].imageMedia.image && cards[i].imageMedia.image2) {
      i2 = i0;
      i0 = cards[i].imageMedia.image2;
    }
    cards[i].imageMedia.image = i2;
    cards[i].imageMedia.image2 = i0;
    let ialt = cards[i].imageMedia.imageAltText;
    let ialt2 = cards[i].imageMedia.imageAltText2;
    cards[i].imageMedia.imageAltText = ialt2;
    cards[i].imageMedia.imageAltText2 = ialt;
  }
}
