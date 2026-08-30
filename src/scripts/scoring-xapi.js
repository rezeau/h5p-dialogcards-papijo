/**
 * Build the existing xAPI activity definition.
 * @param {object} options Definition source values.
 * @param {unknown} options.title Preferred description value.
 * @param {unknown} options.description Description fallback value.
 * @param {unknown} options.showSummary Final fallback value.
 * @returns {object} Fresh xAPI activity definition.
 */
export function buildXAPIDefinition({
  title,
  description,
  showSummary,
}) {
  let selectedValue = '';
  if (title !== '') {
    selectedValue = title;
  }
  else if (description !== '') {
    selectedValue = description;
  }
  else {
    selectedValue = showSummary;
  }

  return {
    description: {
      'en-US': selectedValue,
    },
    type: 'http://adlnet.gov/expapi/activities/cmi.interaction',
    interactionType: 'long-fill-in',
  };
}

/**
 * Build the existing human-readable xAPI response.
 * @param {object} options Response source values.
 * @param {unknown} options.selectedCards Selected card count.
 * @param {unknown} options.totalCards Authored card count.
 * @param {unknown} options.enableGotIt Whether self-correction is enabled.
 * @param {unknown} options.repetition Whether repetition mode is enabled.
 * @param {unknown} options.matchIt Whether matching is enabled.
 * @param {unknown} options.currentRound Current repetition round.
 * @param {unknown} options.correct Correct match count.
 * @param {unknown} options.incorrect Incorrect match count.
 * @param {unknown} options.actualScore Current score.
 * @param {unknown} options.maxScore Current maximum score.
 * @param {unknown} options.helpText Response help text.
 * @param {object} options.labels Localized response labels.
 * @returns {string} Human-readable score and completion summary.
 */
export function buildXAPIResponse({
  selectedCards,
  totalCards,
  enableGotIt,
  repetition,
  matchIt,
  currentRound,
  correct,
  incorrect,
  actualScore,
  maxScore,
  helpText,
  labels,
}) {
  let summary = '';
  let text1 = '';
  if (selectedCards !== totalCards) {
    text1 += `${labels.cardsSelected} ${selectedCards}/${totalCards}\n`;
    totalCards = selectedCards;
  }
  let text2;
  if (enableGotIt || repetition) {
    text2 = `${labels.cardsCompleted} ${totalCards}/${totalCards}\n${
      labels.completedRounds
    } ${currentRound}`;
  }
  else if (matchIt && !repetition) {
    text2 = `${labels.matchesFound} ${correct}\n${
      labels.matchesNotFound
    } ${incorrect}`;
  }
  const text3 = `${labels.overallScore} : ${actualScore}/${maxScore}`;
  summary += `${text1 + text2}\n${text3}\n${helpText}`;
  return summary;
}
