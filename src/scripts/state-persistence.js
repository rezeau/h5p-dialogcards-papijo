/**
 * Build the existing resumable Dialog Cards state.
 * @param {object} options Current state source values.
 * @param {boolean} options.hasCurrent Whether a current card exists.
 * @param {unknown} options.progress Current card index.
 * @param {unknown} options.repetition Repetition-mode flag.
 * @param {unknown} options.sideBySide Side-by-side-mode flag.
 * @param {boolean} options.hasCurrentLeft Whether a current left card exists.
 * @param {unknown} options.progressLeft Current left-card index.
 * @param {unknown} options.playModeUser Effective play mode.
 * @param {unknown} options.endOfStack End-of-stack flag.
 * @param {unknown} options.filterByCategories Category-filter mode.
 * @param {unknown} options.filterList Current category filter list.
 * @param {unknown} options.filterOperator Current filter operator.
 * @param {unknown} options.currentFilter Current localized filter label.
 * @param {unknown} options.currentDialogs Current working deck.
 * @param {unknown} options.noDupeFrontPicToBack Image-duplication setting.
 * @param {unknown} options.currentRound Current repetition round.
 * @param {unknown} options.correct Correct-answer count.
 * @param {unknown} options.incorrect Incorrect-answer count.
 * @param {unknown} options.nbCardsInCurrentRound Cards in the current round.
 * @param {unknown} options.nbCardsSelected Selected-card count.
 * @param {unknown} options.cardsLeft Cards left in the current round.
 * @param {unknown} options.cardOrder Current card-order reference.
 * @param {unknown} options.noMatchCards Repetition replay markers.
 * @param {unknown} options.cardsOrderChoice Configured order choice.
 * @param {unknown} options.cardsOrderMode Effective order mode.
 * @param {unknown} options.enableCardsNumber Card-number selection setting.
 * @param {unknown} options.cardsSideChoice Configured side choice.
 * @param {unknown} options.cardsSideMode Effective side mode.
 * @param {unknown} options.playMode Configured play mode.
 * @param {unknown} options.taskFinished Completion flag.
 * @returns {object} Fresh resumable state object.
 */
export function buildCurrentState({
  hasCurrent,
  progress,
  repetition,
  sideBySide,
  hasCurrentLeft,
  progressLeft,
  playModeUser,
  endOfStack,
  filterByCategories,
  filterList,
  filterOperator,
  currentFilter,
  currentDialogs,
  noDupeFrontPicToBack,
  currentRound,
  correct,
  incorrect,
  nbCardsInCurrentRound,
  nbCardsSelected,
  cardsLeft,
  cardOrder,
  noMatchCards,
  cardsOrderChoice,
  cardsOrderMode,
  enableCardsNumber,
  cardsSideChoice,
  cardsSideMode,
  playMode,
  taskFinished,
}) {
  const state = {};
  if (hasCurrent) {
    state.progress = progress;
  }

  if (repetition) {
    if (hasCurrentLeft) {
      state.progressLeft = progressLeft;
    }
    if (state.progressLeft === -1) {
      state.progressLeft = state.progress + 1;
    }
  }

  if (sideBySide) {
    if (hasCurrentLeft) {
      state.progressLeft = progressLeft;
    }
  }

  if (playModeUser === 'selfCorrectionMode') {
    state.lastCorrect = !endOfStack;
  }
  if (filterByCategories) {
    state.filterByCategories = filterByCategories;
    state.filterList = filterList;
    state.filterOperator = filterOperator;
    state.currentFilter = currentFilter;
    state.currentDialogs = currentDialogs;
  }
  if (noDupeFrontPicToBack) {
    state.noDupeFrontPicToBack = noDupeFrontPicToBack;
  }
  state.currentRound = currentRound;
  state.correct = correct;
  state.incorrect = incorrect;
  state.nbCardsInCurrentRound = nbCardsInCurrentRound;
  state.nbCardsSelected = nbCardsSelected;
  state.nbCardsLeft = cardsLeft;
  state.order = cardOrder;
  state.noMatchCards = noMatchCards;
  state.cardsOrderChoice = cardsOrderChoice;
  state.cardsOrderMode = cardsOrderMode;
  state.enableCardsNumber = enableCardsNumber;
  state.cardsSideChoice = cardsSideChoice;
  state.cardsSideMode = cardsSideMode;
  state.playMode = playMode;
  state.playModeUser = playModeUser;
  state.taskFinished = taskFinished;

  return state;
}
