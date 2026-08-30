/**
 * Derive the canonical play-mode options and configured mode.
 * @param {object} options Play-mode configuration.
 * @param {string} options.playMode Authored play mode.
 * @param {object} options.allowedPlayModes Authored allowed-mode map.
 * @param {object} options.labels Localized play-mode labels.
 * @returns {object} Effective configured mode and canonical option list.
 */
export function derivePlayModeOptions({
  playMode,
  allowedPlayModes,
  labels,
}) {
  let playModeNames = [
    { value: 'normalMode', label: labels.normalMode },
    { value: 'browseSideBySide', label: labels.browseSideBySide },
    { value: 'matchMode', label: labels.matchMode },
    { value: 'matchRepetition', label: labels.matchRepetition },
    { value: 'selfCorrectionMode', label: labels.selfCorrectionMode },
  ];

  if (playMode === 'user') {
    playModeNames = playModeNames.filter(
      (mode) => allowedPlayModes[mode.value],
    );
    if (playModeNames.length === 0) {
      playMode = 'normalMode';
    }
    else if (playModeNames.length === 1) {
      playMode = playModeNames[0].value;
    }
  }

  return {
    playMode,
    playModeNames,
  };
}
