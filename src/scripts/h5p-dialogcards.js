/**
 * Dialogcards module PapiJo
 * @param $
 */
H5P.DialogcardsPapiJo = (function ($, Audio, JoubelUI) {
  const XAPI_REPORTING_VERSION_EXTENSION =
    'https://h5p.org/x-api/h5p-reporting-version';
  const createButton = (options) =>
    $(H5P.Components.Button(options));
  /**
   * @param {object} params Behavior settings
   * @param {number} id Content identification
   * @param {object} contentData Saved content
   */
  function C(params, id, contentData) {
    const self = this;
    H5P.EventDispatcher.call(this);
    self.contentId = self.id = id;
    // Set default behavior.
    self.params = $.extend(
      {
        title: 'Dialogue',
        description:
          'Sit in pairs and make up sentences where you include the expressions ' +
          'below.<br/>Example: I should have said yes, HOWEVER I kept my mouth shut.',
        next: 'Next',
        prev: 'Previous',
        retry: 'Retry',
        resetTask: 'Reset task',
        answer: 'Turn',
        check: 'Check',
        correctAnswer: 'I got it right!',
        incorrectAnswer: 'I got it wrong',
        cardsLeft: 'Cards left: @number',
        round: 'Round @round',
        rounds: '@rounds round(s)',
        showSummary: 'Final summary',
        summary: 'Summary',
        summaryCardsRight: 'Cards you got right:',
        summaryCardsWrong: 'Cards you got wrong:',
        summaryOverallScore: 'Overall Score',
        summaryCardsCompleted: 'Cards you have completed learning:',
        summaryCardsSelected: 'Number of cards you selected from the pool:',
        summaryCompletedRounds: 'Completed rounds:',
        summaryAllDone: 'Well done! You got all @cards cards correct!',
        matchButtonLabel: 'Match',
        correctMatch: 'That\'s a match!',
        incorrectMatch: 'That\'s NOT a match!',
        matchesFound: 'Matches correct: @correct | incorrect: @incorrect',
        summaryMatchesFound: 'Correct matches:',
        summaryMatchesNotFound: 'Incorrect matches:',
        summaryMatchesAllDone: 'Well done!',
        nextRound: 'Proceed to round @round',
        randomizeCardsQuestion: 'Display the cards in random order?',
        randomizeRightCardsQuestion:
          'Display the cards on the right in random order?',
        no: 'No',
        yes: 'Yes',
        numCardsQuestion: 'How many cards do you want?',
        allCards: 'all',
        explainScoreGotIt: 'Each extra round cost you a penalty of @penalty%.',
        explainScoreMatch:
          'Each incorrect match cost you a penalty of 1 point.',
        progressText: 'Card @card of @total',
        cardFrontLabel: 'Card front',
        cardBackLabel: 'Card back',
        tipButtonLabel: 'Show tip',
        audioNotSupported: 'Your browser does not support this audio',
        scoreExplanationButtonLabel: 'Show score explanation',
        reverseSides: 'Switch the current display mode of card sides to @side?',
        currentSideNotice: 'Current display mode: First Side = ',
        currentOrderNotice: 'Current Cards Order mode = ',
        currentRightOrderNotice: 'Current Order mode of Cards on the right = ',
        reverseLeftSide:
          'Switch the current display mode of Left card side to @side?',
        currentLeftSideNotice: 'Current display mode: Left card = ',
        selectPlayMode: 'Select a play mode',
        currentFilterNotice: 'Current Filter = ',
        currentPlayModeNotice: 'Current Play Mode = ',
        selectFilter: 'Select a filter for the cards to be displayed',
        noFilter: 'No filter',
        boolean_AND: 'AND',
        boolean_OR: 'OR',
        boolean_NOT: 'NOT',
        normalOrder: 'Normal',
        randomOrder: 'Random',
        normalMode: 'Free browsing',
        browseSideBySide: 'Free browsing side by side',
        matchMode: 'Match',
        matchRepetition: 'Match with Repetition',
        selfCorrectionMode: 'Self Correction',
        noTextErrorNotice: 'ERROR You are using the NO TEXT option but your set of cards is not consistent.',
        categories: [
          {
            catName: 'Animal',
            catDescription: 'Animals',
          },
          {
            catName: 'Vegetal',
            catDescription: 'Vegetals',
          },
        ],
        dialogs: [
          {
            text: 'Horse',
            answer: 'Hest',
          },
          {
            text: 'Cow',
            answer: 'Ku',
          },
        ],
        behaviour: {
          enableRetry: true,
          noTextOnCards: false,
          hideTurnButton: false,
          scaleTextNotCard: false,
          playMode: 'user',
          cardsOrderChoice: 'user',
          enableCardsNumber: false,
          cardsSideChoice: 'user',
          penalty: 0,
          passPercentage: 100,
          noDupeFrontPicToBack: false,
          filterByCategories: 'user',
        },
      },
      params,
    );

    self._current = -1;
    self._turned = [];
    self.$images = [];
    self.$images2 = [];
    self.audios = [];
    self.audios2 = [];
    this.resetAll = false;
    this.currentRound = 1;
    this.lastCardIndex = 0;
    this.endOfStack = 0;
    this.correct = 0;
    this.incorrect = 0;
    this.lastCard = null;
    this.issetHeight = false;
    this.cardsOrderChoice = self.params.behaviour.cardsOrderChoice;
    this.cardsOrderMode = this.cardsOrderChoice;
    this.cardsSideChoice = self.params.behaviour.cardsSideChoice;
    this.cardsSideMode = this.cardsSideChoice;
    this.playMode = self.params.behaviour.playMode;
    this.playModeUser = this.playMode;
    this.enableCardsNumber = self.params.behaviour.enableCardsNumber;
    this.noText = self.params.behaviour.noTextOnCards;
    this.actualScore = 0;
    this.isReversed = false;
    this.matchIt = false;
    if (
      this.playModeUser === 'matchMode' ||
      this.playModeUser === 'browseSideBySide'
    ) {
      this.matchIt = true;
    }
    this.playModeNames = [
      { value: 'normalMode', label: self.params.normalMode },
      { value: 'browseSideBySide', label: self.params.browseSideBySide },
      { value: 'matchMode', label: self.params.matchMode },
      { value: 'matchRepetition', label: self.params.matchRepetition },
      { value: 'selfCorrectionMode', label: self.params.selfCorrectionMode },
    ];
    if (this.playMode === 'user') {
      this.allowedPlayModes = self.params.behaviour.allowedPlayModes;
      this.playModeNames = this.playModeNames.filter(
        (mode) => this.allowedPlayModes[mode.value],
      );
      if (this.playModeNames.length === 0) {
        this.playMode = 'normalMode';
      }
      else if (this.playModeNames.length === 1) {
        this.playMode = this.playModeNames[0].value;
      }
    }
    this.playModeUser = this.playMode;
    /* *************************************************** */
    this.report = '';
    if (this.noText) {
      this.report = checkConsistency(self);
    }

    /* *************************************************** */
    /* Note special treatment of self.params.title to get a correct display with theme 'black' */

    if (this.report) {
      let title = self.params.title;
      self.params.title = '';
      self.params.description =
        `<div class='h5p-error-message'${
          title
        }${self.params.description
        }<hr><h3>${this.params.noTextErrorNotice}</h3>`
        + `${ this.report}`;
    }

    // Reset all flags
    this.frontTextBackImage = false;
    this.frontAudioBackImage = false;
    this.frontImageBackAudio = false;
    this.has2Audio = false;
    this.hasTwoImages = false;
    this.audioOnly = false;

    // -------------------------
    // Flags that depend on text being present
    // -------------------------
    if (!this.noText) {
      // All dialogs must satisfy: empty answer + no front image + back image exists
      this.frontTextBackImage = self.params.dialogs.every((dialog) =>
        dialog.answer === '' &&
        dialog.imageMedia.image === undefined &&
        dialog.imageMedia.image2 !== undefined,
      );

      // All dialogs must satisfy: empty answer + no front audio + back audio exists
      this.frontTextBackAudio = self.params.dialogs.every((dialog) =>
        dialog.answer === '' &&
        dialog.audioMedia.audio === undefined &&
        dialog.audioMedia.audio2 !== undefined,
      );
    }
    this.hasOneImageOnFront = self.params.dialogs.some((d) => d.imageMedia.image);
    // -------------------------
    // Flags that depend on no text
    // -------------------------
    if (this.noText) {
    // All dialogs must have front audio and back image
      this.frontAudioBackImage = self.params.dialogs.every((dialog) =>
        dialog.audioMedia.audio &&
      dialog.imageMedia.image2 !== undefined,
      );

      // All dialogs must have front image and back audio
      this.frontImageBackAudio = self.params.dialogs.every((dialog) =>
        dialog.imageMedia.image !== undefined
        && dialog.audioMedia.audio2 !== undefined,
      );

      // All dialogs must have both front and back audio
      this.has2Audio = self.params.dialogs.every((dialog) =>
        dialog.audioMedia.audio && dialog.audioMedia.audio2,
      );

      // All dialogs must satisfy “audio only” condition
      this.audioOnly = self.params.dialogs.every((dialog) =>
        dialog.imageMedia.image === undefined &&
      dialog.audioMedia.audio !== undefined &&
      dialog.imageMedia.image2 === undefined &&
      dialog.audioMedia.audio2 !== undefined,
      );

      this.hasImageOnFront = self.params.dialogs.every((d) => d.imageMedia.image);
      this.hasImageOnBack = self.params.dialogs.every((d) => d.imageMedia.image2);
      this.hasTwoImages = this.hasImageOnFront && this.hasImageOnBack;
    }
    // IF categories filters enabled!!!
    if (self.params.enableCategories && self.params.behaviour.catFilters) {
      this.catFilters = self.params.behaviour.catFilters;
      // Remove potential filters with empty filterList
      for (let i = 0; i < this.catFilters.length; i++) {
        if (this.catFilters[i].filterList === undefined) {
          this.catFilters.splice(i, 1);
          i--;
        }
      }
      if (!$.isEmptyObject(this.catFilters)) {
        this.filterByCategories = self.params.behaviour.filterByCategories;
      }
    }

    this.userSelectedCategory = '';
    if (this.cardsOrderMode === 'normal') {
      this.enableCardsNumber = false;
    }
    this.matchCorrect = null;
    this.existsCardOrder = false;
    this.noDupeFrontPicToBack = self.params.behaviour.noDupeFrontPicToBack;

    // Copy parameters for further use if save content state. Use Clone for perfect copy.
    self.currentDialogs = structuredClone(self.params.dialogs); // ✅ best modern solution

    this.noFilterMessage = '';
    self.nbCards = self.currentDialogs.length;
    this.cardsLeftInStack = this.nbCardsSelected;
    this.nbCardsInCurrentRound = self.nbCards;
    self.enableCardsNumber = this.enableCardsNumber;
    // Var cardOrder stores order of cards to allow resuming of card set
    // AND removed cards if match or self-correction Mode.
    // Var progress stores current card index.

    this.contentData = contentData || {};

    // Bring card set up to date when resuming.
    if (this.contentData.previousState) {

      this.progress = this.contentData.previousState.progress;
      this.progressLeft = this.contentData.previousState.progressLeft;

      if (this.contentData.previousState.nbCardsSelected !== undefined) {
        this.nbCardsSelected = this.contentData.previousState.nbCardsSelected;
      }
      if (this.contentData.previousState.currentRound !== undefined) {
        this.currentRound = this.contentData.previousState.currentRound;
      }
      if (this.contentData.previousState.correct !== undefined) {
        this.correct = this.contentData.previousState.correct;
      }
      if (this.contentData.previousState.incorrect !== undefined) {
        this.incorrect = this.contentData.previousState.incorrect;
      }
      if (this.contentData.previousState.filterByCategories !== undefined) {
        this.filterByCategories =
          this.contentData.previousState.filterByCategories;
      }
      if (this.contentData.previousState.currentFilter !== undefined) {
        this.currentFilter = this.contentData.previousState.currentFilter;
      }
      if (this.contentData.previousState.filterList !== undefined) {
        this.filterList = this.contentData.previousState.filterList;
      }
      if (this.contentData.previousState.filterOperator !== undefined) {
        this.filterOperator = this.contentData.previousState.filterOperator;
      }
      if (this.contentData.previousState.cardsOrderChoice !== undefined) {
        this.cardsOrderChoice = this.contentData.previousState.cardsOrderChoice;
      }
      if (this.contentData.previousState.cardsOrderMode !== undefined) {
        this.cardsOrderMode = this.contentData.previousState.cardsOrderMode;
      }
      if (this.contentData.previousState.cardsSideChoice !== undefined) {
        this.cardsSideChoice = this.contentData.previousState.cardsSideChoice;
      }
      if (this.contentData.previousState.cardsSideMode !== undefined) {
        this.cardsSideMode = this.contentData.previousState.cardsSideMode;
      }
      if (this.contentData.previousState.playMode !== undefined) {
        this.playMode = this.contentData.previousState.playMode;
      }
      if (this.contentData.previousState.playModeUser !== undefined) {
        this.playModeUser = this.contentData.previousState.playModeUser;
      }

      if (this.contentData.previousState.currentDialogs !== undefined) {
        this.currentDialogs = this.contentData.previousState.currentDialogs;
      }

      if (this.repetition) {
        if (this.contentData.previousState.noMatchCards !== undefined) {
          this.noMatchCards = this.contentData.previousState.noMatchCards;
        }
      }

      if (this.contentData.previousState.filterByCategories !== undefined
        && this.cardsSideMode === 'backFirst') {
        this.isReversed = true;
      }

      this.nbCardsInCurrentRound =
        this.contentData.previousState.nbCardsInCurrentRound;
      this.cardsLeft = this.contentData.previousState.nbCardsLeft;
      this.cardOrder = contentData.previousState.order;
      if (this.repetition) {
        this.noMatchCards = this.contentData.previousState.noMatchCards;
      }
      if (this.contentData.previousState.lastCorrect !== undefined) {
        this.lastCorrect = this.contentData.previousState.lastCorrect;
      }
      if (this.contentData.noDupeFrontPicToBack !== undefined) {
        this.noDupeFrontPicToBack = this.contentData.noDupeFrontPicToBack;
      }
      this.taskFinished =
        contentData.previousState.taskFinished !== undefined
          ? contentData.previousState.taskFinished
          : false;
    }
  }

  C.prototype.constructor = C;
  /**
   * Attach the first part of the h5p inside the given container (title and description).
   * @param {HTMLElement} $container Contains the cards
   */
  C.prototype.attach = function ($container) {
    let self = this;
    self.$inner = $container.addClass('h5p-dialogcards h5p-theme');
    if (this.params.behaviour.scaleTextNotCard) {
      $container.addClass('h5p-text-scaling');
    }
    const title = $(`<div>${this.params.title}</div>`).text().trim();
    this.$header = $(`<div class="h5p-dialogcards-title-container">
      <div class="h5p-dialogcards-title-wrapper">
      ${title ? `<div class="h5p-dialogcards-title">
      <div class="h5p-dialogcards-title-inner h5p-theme-question-description">
      ${this.params.title}</div></div>` : ''}<div class="h5p-dialogcards-description">
      ${this.params.description}</div></div></div>`);

    // If we are resuming task from a previously finished task, Reset the task.
    if (this.taskFinished) {
      self.resetTask();
      return;
    }
    // Always create this.$round block even if selected mode does not use it: it will remain hidden.
    const $wrapper = $('<div>', {
      class: 'h5p-dialogcards-progress-wrapper',
    }).appendTo(this.$header);
    this.$round = $('<div>', {
      class: 'h5p-dialogcards-progress h5p-theme-progress h5p-dialogcards-round h5p-dialogcards-disabled',
    }).appendTo($wrapper);

    this.$progressTop = $('<div>', {
      id: `h5p-dialogcards-progress-${this.idCounter}`,
      class: 'h5p-dialogcards-progress h5p-theme-progress h5p-dialogcards-disabled',
      'aria-live': 'assertive',
    }).appendTo($wrapper);

    if (this.playModeUser === 'normalMode'
      || this.playModeUser === 'browseSideBySide'
      || this.playModeUser === 'matchMode') {
      this.$progressTop.text(this.params.progressText
        .replace('@card', 1)
        .replace('@total', self.currentDialogs.length),
      );
    }
    else {
      this.$progressTop.text(this.params.cardsLeft
        .replace('@number', self.currentDialogs.length),
      );
    }

    this.$mainContent = $('<div>')
      .append(this.$header)
      .append(this.$cardwrapperSet)
      .append(this.$cardSideAnnouncer)
      .append(this.nav)
      .appendTo(this.$inner);
    /* option notext was selected BUT dialogcards so not satisfy this option */
    if (this.report !== '') {
      return;
    }

    if (!$.isEmptyObject(this.cardOrder)) {
      this.existsCardOrder = true;
    }
    else {
      this.existsCardOrder = false;
    }

    // Create filterCard, cardOrder and cardNumber buttons only on first instanciation for logged in user.
    if (this.playModeUser === 'user') {
      self.createPlayMode().appendTo(self.$inner);
    }
    else if (
      this.filterByCategories === 'userFilter' &&
      this.currentFilter === undefined
    ) {
      self.createFilterCards().appendTo(self.$inner);
    }
    else if (
      this.cardsOrderChoice === 'user' &&
      this.cardOrder === undefined
    ) {
      self.createOrder().appendTo(self.$inner);
    }
    else if (
      this.enableCardsNumber &&
      this.nbCardsSelected === undefined /*&& self.nbCards > 5*/
    ) {
      self.createNumberCards().appendTo(self.$inner);
    }
    else if (
      this.cardsSideChoice === 'user' &&
      this.cardsSideMode === 'user'
    ) {
      self.createcardsSideChoice().appendTo(self.$inner);
    }
    else {
      self.attachContinue();
    }
  };

  /**
   * Attach the rest of the h5p inside the given container.
   */
  C.prototype.attachContinue = function () {

    let self = this;
    let text = '';

    /* Only display the progressTop object when all options selected ready */
    if (this.$progressTop) {
      this.$progressTop
        .removeClass('h5p-dialogcards-disabled')
        .removeClass('h5p-dialogcards-hide');
    }
    if (this.playModeUser === 'matchRepetition' || this.playModeUser === 'selfCorrectionMode') {
      if (this.$round) {
        this.$round.removeClass('h5p-dialogcards-disabled h5p-dialogcards-hide');
      }
    }
    if (this.playMode === 'user') {
      const value = this.playModeUser;
      // Use .find() to get the object with matching value
      const label =
        (this.playModeNames.find((i) => i.value === value) || {}).label || null;
      // Use backticks (`) and ${}
      if (label) {
        text += `
          <div class="h5p-dialogcards-option">
            <span class="h5p-current-options-label">
            ${this.params.currentPlayModeNotice}</span>&nbsp;<span class="h5p-current-options-content">
            ${label}</span>
          </div>
          `;
      }
    }
    // AUGUST 2022 Simplified code and fixed sides switching bug!
    // NOVEMBER 2025 Moved all params here attachContinue to use playmode selection by user.
    if (this.playModeUser === 'matchRepetition') {
      this.repetition = true;
    }
    if (
      this.playModeUser === 'matchMode' ||
      this.playModeUser === 'matchRepetition' ||
      this.playModeUser === 'browseSideBySide'
    ) {
      this.matchIt = true;
    }
    if (this.repetition) {
      if (
        this.contentData.previousState !== undefined &&
        this.contentData.previousState.noMatchCards !== undefined
      ) {
        this.noMatchCards = this.contentData.previousState.noMatchCards;
      }
      else {
        this.noMatchCards = [];
      }
    }

    this.cardsSideChoice = self.params.behaviour.cardsSideChoice;
    // Mode with cards displayed side by side.
    if (
      this.playModeUser === 'matchMode' ||
      this.playModeUser === 'browseSideBySide'
    ) {
      this.matchIt = true;
    }
    if (this.playModeUser === 'browseSideBySide') {
      this.sideBySide = true;
    }
    if (this.playModeUser === 'selfCorrectionMode') {
      this.enableGotIt = true;
      self.enableGotIt = true;
      this.hideTurnButton = self.params.behaviour.hideTurnButton;
      self.hideTurnButton = self.params.behaviour.hideTurnButton;
    }
    // Section to show the Display cards options if different from "normal".
    let order = '';
    if (this.currentFilter !== undefined) {
      text += `
        <div class="h5p-dialogcards-option">
          <span class="h5p-current-options-label">
          ${self.params.currentFilterNotice}</span> <span class="h5p-current-options-content">
          ${this.currentFilter}</span>
        </div>`;
    }
    if (this.cardsOrderChoice === 'user') {
      let orderNotice = self.params.currentOrderNotice;
      if (this.matchIt) {
        orderNotice = self.params.currentRightOrderNotice;
      }
      if (this.cardsOrderMode === 'normal') {
        order = self.params.normalOrder;
      }
      else {
        order = self.params.randomOrder;
      }
      text += `<div class="h5p-dialogcards-option"><span class="h5p-current-options-label">
      ${orderNotice} </span><span class="h5p-current-options-content">${order}</span></div>`;
    }
    // If matchIt the left side = back of card and the right side = front of card
    if (this.matchIt) {
      if (this.cardsSideChoice === 'user') {
        let currentSide = self.params.cardBackLabel;
        if (this.cardsSideMode === 'frontFirst') {
          currentSide = self.params.cardFrontLabel;
        }
        text += `<div class="h5p-dialogcards-option"><span class="h5p-current-options-label">
        ${self.params.currentLeftSideNotice}</span>&nbsp;<span class="h5p-current-options-content">
        ${currentSide}</span></div>`;
      }
    }
    else {

      if (this.cardsSideChoice === 'user') {
        let currentSide = self.params.cardFrontLabel;
        if (this.cardsSideMode === 'backFirst') {
          currentSide = self.params.cardBackLabel;
        }
        text += `
          <div class="h5p-dialogcards-option">
            <span class="h5p-current-options-label">
            ${self.params.currentSideNotice}</span>&nbsp;<span class="h5p-current-options-content">
            ${currentSide}</span>
          </div>`;
      }
    }
    if (text !== '') {
      let $optionsText = $('<div>', {
        class: 'h5p-dialogcards-current-options',
        html: text,
      });
      $optionsText.appendTo(self.$inner);
    }
    // Remove potential user interaction elements from DOM.
    $('.h5p-dialogcards-categories', self.$inner).remove();
    $('.h5p-dialogcards-number', self.$inner).remove();
    $('h5p-dialogcards-side, h5p-dialogcards-options', self.$inner).remove();
    $('.h5p-dialogcards-options', self.$inner).remove();
    $('.h5p-options-title', self.$inner).remove();
    $('.h5p-filter-wrapper', self.$inner).remove();

    if (self.params.behaviour.scaleTextNotCard) {
      self.$inner.addClass('h5p-text-scaling');
    }

    self.initCards(self.currentDialogs).appendTo(self.$inner);
    self.$cardSideAnnouncer = $('<div>', {
      html: self.params.cardFrontLabel,
      class: 'h5p-dialogcards-card-side-announcer',
      'aria-live': 'polite',
      'aria-hidden': 'true',
    }).appendTo(self.$inner);

    // Create a $matchFooter container for $matchfooterLeft containing the current score
    // and the normal navigation $footer

    if (this.matchIt && !this.sideBySide) {
      let $matchFooter = $('<div>', {
        class: 'h5p-dialogcards-match-footer',
      });

      self.createFooterLeft().appendTo($matchFooter);

      self.createFooter().appendTo($matchFooter);

      $matchFooter.appendTo(self.$inner);
    }
    else if (this.sideBySide) {
      self.$sideBySide = $('<div>', {
        class: 'h5p-dialogcards-side-by-side',
      });

      self.createFooter().appendTo(self.$sideBySide);

      self.$sideBySide.appendTo(self.$inner);
    }
    else {
      self.createFooter().appendTo(self.$inner);
    }

    self.updateNavigation();
    // Creating a Date Object used by XAPI
    this.startTime = new Date().getTime();
    this.triggerXAPI('attempted');

    self.on('retry', function () {
      self.retry();
    });

    self.on('resetTask', function () {
      self.resetTask();
    });

    self.on('resize', self.resize);
    self.trigger('resize');
    self.getCurrentState();

    // we are refreshing from a "next round" screen, so... reset everything to get there
    if (this.repetition && this.cardsLeft === 0) {
      // set parameters as they were on nextRound screen before refreshing page
      this.cardsLeft = 1;
      this.incorrect--;
      self.matchCardsRepetition($(this).parents('.h5p-dialogcards-cardwrap'));
    }
    if (this.playModeUser === 'selfCorrectionMode' && this.cardsLeft === 0) {
      // set parameters as they were on nextRound screen before refreshing page
      if (this.lastCorrect) {
        this.correct--;
        self.gotItCorrect($(this).parents('.h5p-dialogcards-cardwrap'));
      }
      else {
        this.incorrect--;
        self.gotItIncorrect();
      }
    }
    self.resize();
    self.resizeOverflowingText();
  };

  /**
   * Create orderCards option request
   * @returns {HTMLElement} Order element
   */
  C.prototype.createOrder = function () {
    let self = this;
    let randomizeQuestion = self.params.randomizeCardsQuestion;
    if (this.matchIt) {
      randomizeQuestion = self.params.randomizeRightCardsQuestion;
    }
    let $optionsTitle = $('<div>', {
      class: 'h5p-options-title',
      html: randomizeQuestion,
    });
    let $order = $('<div>', {
      class: 'h5p-dialogcards-options',
    }).appendTo($optionsTitle);

    let $optionButtons = $('<div>', {
      class: 'h5p-dialogcards-optionsbuttons',
    }).appendTo($order);

    let $classes = 'h5p-dialogcards-order-button';
    self.$normalOrder = createButton({
      classes: $classes,
      label: self.params.no,
      styleType: 'secondary',
    })
      .click(() => {
        this.cardsOrderMode = 'normal';
        self.randomizeOrder('normal');
      })
      .appendTo($optionButtons);

    self.$randomizeOrder = createButton({
      classes: $classes,
      label: self.params.yes,
      styleType: 'secondary',
    })
      .click(() => {
        this.cardsOrderMode = 'random';
        self.randomizeOrder('random');
      })
      .appendTo($optionButtons);

    return $optionsTitle;
  };

  /**
   * Create cardsSideChoice option request
   * @returns {HTMLElement} Side element
   */
  C.prototype.createcardsSideChoice = function () {
    let self = this;
    let currentSide;
    let reverseSide;
    if (self.cardsSideMode === 'user') {
      self.cardsSideMode = 'frontFirst';
      self.isReversed = false;
    }
    if (self.cardsSideMode === 'frontFirst') {
      currentSide = self.params.cardFrontLabel;
      reverseSide = self.params.cardBackLabel;
    }
    else {
      currentSide = self.params.cardBackLabel;
      reverseSide = self.params.cardFrontLabel;
    }
    let $optionsTitle = $('<div>', {
      class: 'h5p-options-title',
      html: `${self.params.currentSideNotice}&nbsp;${currentSide}`
        + `<p>${  this.params.reverseSides.replace('@side', reverseSide)  }</p>`,
    });
    let $side = $('<div>', {
      class: 'h5p-dialogcards-side h5p-dialogcards-options',
    });
    let $optionButtons = $('<div>', {
      class: 'h5p-dialogcards-optionsbuttons',
    }).appendTo($optionsTitle);

    self.$No = createButton({
      class: 'h5p-dialogcards-side-button-no',
      label: self.params.no,
      styleType: 'secondary',
    })
      .click(() => {
        // Do nothing, just continue with current card side.
        self.attachContinue();
      })
      .appendTo($optionButtons);

    self.$Yes = createButton({
      class: 'h5p-dialogcards-side-button-yes',
      label: self.params.yes,
      styleType: 'secondary',
    })
      .click(() => {
        if (self.cardsSideMode === 'backFirst') {
          self.cardsSideMode = 'frontFirst';
          self.isReversed = false;
        }
        else {
          self.cardsSideMode = 'backFirst';
        }
        self.reverse = true;
        self.attachContinue();
      })
      .appendTo($optionButtons);
    return $optionsTitle;
  };

  /**
   * Create numberCards option request
   * @returns {HTMLElement} numberCards element
   */
  C.prototype.createNumberCards = function () {
    let self = this;
    let numCards = self.currentDialogs.length;
    let $numberCards = $('<div>', {
      class: 'h5p-dialogcards-number h5p-dialogcards-options',
      html: self.params.numCardsQuestion,
    });

    let $optionButtons = $('<div>', {
      class: 'h5p-dialogcards-optionsbuttons',
    }).appendTo($numberCards);

    // Allow user to select a number of cards to play with, by displaying selectable buttons in increments of 5.
    let n = 0;
    if (numCards <= C.NB50) {
      n = C.NB5;
    }
    else {
      n = C.NB10;
    }
    let limit = Math.min(numCards, 100);
    for (let i = n; i < limit; i += n) {
      self.$button = createButton({
        class: 'h5p-dialogcards-number-button',
        label: i,
        styleType: 'secondary',
      })
        .click(() => {
          this.nbCards = i;
          this.nbCardsSelected = i;
          if (self.cardsSideChoice === 'user') {
            $('.h5p-dialogcards-options, .h5p-dialogcards-categories, .h5p-options-title', self.$inner).remove();
            self.createcardsSideChoice().appendTo(self.$inner);
          }
          else {
            self.attachContinue();
          }
        })
        .appendTo($optionButtons);
    }

    self.$button = createButton({
      class: 'h5p-dialogcards-number-button',
      label: `${self.params.allCards} (${numCards})`,
    })
      .click(() => {
        this.nbCards = numCards;
        if (self.cardsSideChoice === 'user') {
          $('.h5p-dialogcards-options, .h5p-dialogcards-categories, .h5p-options-title', self.$inner).remove();
          self.createcardsSideChoice().appendTo(self.$inner);
        }
        else {
          self.attachContinue();
        }
      })
      .appendTo($optionButtons);
    return $numberCards;
  };

  /**
   * Create filterCards option request
   * @returns {HTMLElement} self.currentDialogs array
   */
  C.prototype.createFilterCards = function () {
    const self = this;
    // Init params
    // Wrapper
    const $wrapper = $('<div>', {
      class: 'h5p-filter-wrapper',
    });
    let $optionsTitle = $('<div>', {
      class: 'h5p-options-title',
      html: self.params.selectFilter,
    }).appendTo($wrapper);
    const $filterCards = $('<div>', {
      class: 'h5p-dialogcards-categories',
    }).appendTo($wrapper);

    const $optionButtons = $('<div>', {
      class: 'h5p-dialogcards-optionsbuttons h5p-dialogcards-optionsbuttons',
    }).appendTo($filterCards);

    let $class;
    self.nofilter = false;
    let catNames = [];
    let filterList;
    let filterOperator;
    let numCardsInCats;
    let catName;
    for (let i = 0; i < this.catFilters.length + 1; i++) {
      if (i < this.catFilters.length) {
        filterList = this.catFilters[i].filterList;
        filterOperator = this.catFilters[i].filterOperator;
        numCardsInCats = self.applyFilter(filterList, filterOperator, true);
        catName = self.makeCurrentFilterName(filterList, filterOperator);
        // Prevent duplicate filters in list!
        if (catNames.includes(catName)) {
          continue;
        }
        catNames.push(catName);
      }
      else {
        catName = self.params.noFilter;
        $class = 'h5p-dialogcards-allCategories-button';
        numCardsInCats = self.params.dialogs.length;
      }

      this.filterList = undefined;
      this.filterOperator = undefined;

      if (numCardsInCats) {
        self.$button = createButton({
          class: $class,
          label: `${catName} (${numCardsInCats})`,
          styleType: 'secondary',
        })
          .click((event) => {
            $('.h5p-dialogcards-categories, .h5p-options-title', self.$inner).remove();
            if (i < this.catFilters.length) {
              self.filterList = self.catFilters[i].filterList;
              self.filterOperator = self.catFilters[i].filterOperator;
              self.applyFilter(self.filterList, self.filterOperator);
              self.currentFilter = self.makeCurrentFilterName(self.filterList, self.filterOperator);
            }
            else {
              self.currentFilter = self.params.noFilter;
            }
            if (
              self.cardsOrderChoice === 'user' &&
              self.cardOrder === undefined
            ) {
              self.createOrder().appendTo(self.$inner);
            }
            else if (
              self.enableCardsNumber &&
              self.nbCardsSelected === undefined &&
              self.nbCards > C.NB5
            ) {
              self.createNumberCards().appendTo(self.$inner);
            }
            else if (!self.matchIt && self.cardsSideChoice === 'user') {
              self.createcardsSideChoice().appendTo(self.$inner);
            }
            else {
              self.attachContinue();
            }
          })
          .appendTo($optionButtons);
      }
    }
    return $wrapper;
  };

  /**
   * Create filterCards option request
   * @returns {HTMLElement} self.currentDialogs array
   */

  C.prototype.createPlayMode = function () {
    const self = this;
    this.isReversed = false;
    let $optionsTitle = $('<div>', {
      class: 'h5p-options-title',
      html: self.params.selectPlayMode,
    });
    const $play = $('<div>', {
      class: 'h5p-dialogcards-categories',
    }).appendTo($optionsTitle);

    const $optionButtons = $('<div>', {
      class: 'h5p-dialogcards-optionsbuttons h5p-dialogcards-optionsbuttons',
    }).appendTo($play);

    for (let i = 0; i < self.playModeNames.length; i++) {
      let $class = 'h5p-joubelui-button';
      self.$button = createButton({
        class: $class,
        label: self.playModeNames[i].label,
        styleType: 'secondary',
      })
        .click(() => {
          $('.h5p-dialogcards-options, .h5p-dialogcards-categories, .h5p-options-title', self.$inner).remove();
          self.playModeUser = self.playModeNames[i].value;
          if (
            self.filterByCategories === 'userFilter' &&
            this.currentFilter === undefined
          ) {
            self.createFilterCards().appendTo(self.$inner);
          }
          else if (
            self.cardsOrderChoice === 'user' &&
            self.cardOrder === undefined
          ) {
            self.createOrder().appendTo(self.$inner);
          }
          else if (
            self.enableCardsNumber &&
            self.nbCardsSelected === undefined &&
            self.nbCards > C.NB5
          ) {
            self.createNumberCards().appendTo(self.$inner);
          }
          else if (!self.matchIt && self.cardsSideChoice === 'user') {
            self.createcardsSideChoice().appendTo(self.$inner);
          }
          else {
            self.attachContinue();
          }
        })
        .appendTo($optionButtons);
    }
    return $optionsTitle;
  };

  /**
   * Create footer/navigation line
   * @returns {HTMLElement} Footer element
   */
  C.prototype.createFooter = function () {
    let self = this;

    let $footer = $('<nav>', {
      class: 'h5p-navigation h5p-navigation--2-split-spread ',
      role: 'navigation',
    });
    if (this.matchIt) {
      if (this.repetition) {
        $footer.addClass('h5p-dialogcards-footer-match-right repetition');
      }
      else {
        $footer.addClass('h5p-dialogcards-footer-match-right');
      }
    }

    // 19/12/2025 added a timeout to the Prev and Next buttons to prevent double clicks
    if (!this.enableGotIt) {
      this.preventDoubleClick = function ($btn, action) {
        if ($btn.prop('disabled')) {
          return;
        }
        $btn.prop('disabled', true);
        action();
        setTimeout(function () {
          $btn.prop('disabled', false);
        }, C.NB300);
      };

      // PREV
      self.$prev = createButton({
        classes: 'h5p-theme-button h5p-theme-nav-button h5p-theme-previous h5p-dialogcards-button-hidden',
        styleType: 'nav',
        label: self.params.prev,
        icon: 'previous',
      })
        .click((event) => {
          this.preventDoubleClick($(event.currentTarget), () => {
            self.prevCard();
          });
          // In case the buttons was set to blinking in match mode.
          self.$next.removeClass('blinking-button');
          self.$prev.removeClass('blinking-button');
        })
        .appendTo($footer);

      // NEXT
      self.$next = createButton({
        classes: 'h5p-theme-button h5p-theme-nav-button',
        label: self.params.next,
        styleType: 'nav',
        icon: 'next',
      })
        .click((event) => {
          this.preventDoubleClick($(event.currentTarget), () => {
            self.nextCard();
          });
          // In case the buttons was set to blinking in match mode.
          self.$next.removeClass('blinking-button');
          self.$prev.removeClass('blinking-button');
        })
        .appendTo($footer);
    }

    let curClassses = 'h5p-dialogcards-disabled';
    let curHtml = '';
    if (this.enableGotIt || this.repetition) {
      curHtml = this.params.nextRound.replace('@round', this.currentRound + 1);
      curClassses: 'h5p-theme-continueh 5p-dialogcards-button-next-round h5p-dialogcards-disabled';
    }

    this.$retry = createButton({
      classes: curClassses,
      html: curHtml,
      styleType: 'primary',
      icon: 'continue',
    })
      .click((event) => {
        if (self.repetition) {
          self.retryRepetition();
        }
        else {
          self.retry();
        }
      })
      .appendTo($footer);

    if (!this.enableGotIt) {
      self.$progress = $('<div>', {
        class: 'h5p-dialogcards-progress',
        'aria-live': 'assertive',
      }).appendTo($footer);
    }
    else {
      self.$progress = $('<div>', {
        class: 'h5p-dialogcards-cards-left',
        'aria-live': 'assertive',
      }).appendTo($footer);
    }
    // Mode match with repetition. Under LEFT  card display footer similar to the GotIt mode.

    if (this.repetition) {
      self.$progress = $('<div>', {
        class: 'h5p-dialogcards-cards-left repetition',
        'aria-live': 'assertive',
      }).appendTo($footer);
    }

    return $footer;
  };

  C.prototype.createFooterLeft = function () {
    let $footerLeft = $('<div>', {
      class: 'h5p-dialogcards-match-footer-left',
    });
    this.$progressFooterLeft = $('<div>', {
      class: 'h5p-dialogcards-cards-matched h5p-theme-progress',
      'aria-live': 'assertive',
    }).appendTo($footerLeft);
    // Mode match with repetition. Under LEFT  card display footer similar to the GotIt mode.
    if (this.repetition) {
      self.$roundR = $('<div>', {
        class: 'h5p-dialogcards-round repetition',
      }).appendTo($footerLeft);

      self.$progressR = $('<div>', {
        class: 'h5p-dialogcards-cards-left repetition',
        'aria-live': 'assertive',
      }).appendTo($footerLeft);
    }
    return $footerLeft;
  };


  /**
   * Called when all cards have been loaded.
   */
  C.prototype.updateImageSize = function () {
    let self = this;
    // There is no current card in Interactive Book after a Restart.
    if (self.$current === undefined) {
      return;
    }

    // Find highest card content
    const relativeHeightCap = 15;
    let height = 0;
    let i;
    let foundImage = false;
    for (i = 0; i < self.currentDialogs.length; i++) {
      let card = self.currentDialogs[i];
      let $card = self.$current.find('.h5p-dialogcards-card-content');
      if (
        card.imageMedia.image === undefined &&
        card.imageMedia.image2 === undefined
      ) {
        continue;
      }
      foundImage = true;
      if (card.imageMedia.image) {
        let imageHeight =
          (card.imageMedia.image.height / card.imageMedia.image.width) *
          $card.get(0).getBoundingClientRect().width;
        if (imageHeight > height) {
          height = imageHeight;
        }
      }
      else if (card.imageMedia.image2) {
        let imageHeight =
          (card.imageMedia.image2.height / card.imageMedia.image2.width) *
          $card.get(0).getBoundingClientRect().width;
        if (imageHeight > height) {
          height = imageHeight;
        }
      }
    }
    if (foundImage) {
      let relativeImageHeight =
        height / parseFloat(self.$inner.css('font-size'));
      if (relativeImageHeight > relativeHeightCap) {
        relativeImageHeight = relativeHeightCap;
      }
      self.$images.forEach(function ($img) {
        $img.parent().css('height', `${relativeImageHeight}em`);
      });
      self.$images2.forEach(function ($img) {
        $img.parent().css('height', `${relativeImageHeight}em`);
      });
    }
  };

  /**
   * @param {object} [$card] Current card
   * @param {string} [side] Which side of the card
   * @param {number} [index] Index of card
   */
  C.prototype.addTipToCard = function ($card, side, index) {
    let self = this;

    // Make sure we have a side
    if (side !== 'back') {
      side = 'front';
    }

    // Make sure we have an index
    if (index === undefined) {
      index = self.$current.index();
    }

    // Remove any old tips
    $card.find('.joubel-tip-container').remove();

    // Add new tip if set and has length after trim
    let tips = self.currentDialogs[index].tips;
    if (tips !== undefined && tips[side] !== undefined) {
      let tip = tips[side].trim();
      if (!this.frontTextBackImage || (!this.matchIt && this.noText)) {
        if (tip.length) {
          if (!this.noText) {
            $card
              .find(
                '.h5p-dialogcards-card-text-wrapper',
              )
              .before(
                JoubelUI.createTip(tip, {
                  tipLabel: self.params.tipButtonLabel,
                }),
              );
          }
          else {
            const showAudioTip =
              this.has2Audio ||
              self.matchIt
              && ((self.cardsSideMode === 'frontFirst'
                && self.currentDialogs[index].audioMedia.audio2 === undefined)
                 || (self.cardsSideMode === 'backFirst' && side === 'front') ||
                this.has2Audio
              );
            $card.find('.h5p-dialogcards-image-wrapper').before(
              JoubelUI.createTip(tip, {
                tipLabel: self.params.tipButtonLabel,
                addclass: 'joubel-tip-notext',
              }),
            );

            if (showAudioTip) {
              $card.find('.h5p-dialogcards-audio-wrapper').before(
                JoubelUI.createTip(tip, {
                  tipLabel: self.params.tipButtonLabel,
                  addclass: 'joubel-tip-notext',
                }),
              );
            }
          }
        }
      }
      else {
        if (tip.length) {
          if (self.cardsSideMode === 'backFirst' && !this.matchIt && !this.noText) {
            side = { front: 'back', back: 'front' }[side];
          }
          switch (side) {
            case 'front':
              $card.find('.h5p-dialogcards-card-text-wrapper ').before(
                JoubelUI.createTip(tip, {
                  tipLabel: self.params.tipButtonLabel,
                }),
              );
              break;
            case 'back':
              $card.find('.h5p-dialogcards-image-wrapper').before(
                JoubelUI.createTip(tip, {
                  tipLabel: self.params.tipButtonLabel,
                }),
              );
          }
        }
      }
    }
  };

  /**
   * Creates all cards and appends them to card wrapper.
   * @param {Array} cards Card parameters
   * @returns {HTMLElement} Card wrapper set
   */
  C.prototype.initCards = function (cards) {
    if (this.nbCardsSelected !== undefined) {
      this.nbCards = this.nbCardsSelected;
    }
    else {
      this.nbCardsSelected = this.nbCards;
    }
    // Reversed cards array to be used in these options.
    // Check if switching sides is needed. Simplified and fixed 15:29 09/02/2026
    if (
      (this.cardsSideMode === 'backFirst') !== Boolean(this.matchIt) &&
      !this.isReversed
    ) {
      this.switchSides(cards);
    }

    let self = this;
    let loaded = 0;
    if ($.isEmptyObject(this.cardOrder)) {
      this.existsCardOrder = false;
    }
    let initLoad = C.NB2;
    // If keepstate then load all cards until last card previously reached by user.
    if (this.progress > 0) {
      initLoad += this.progress;
    }

    if (
      (this.cardsOrderMode === 'normal' || this.cardsOrderMode === 'random') &&
      !this.existsCardOrder
    ) {
      let cardOrdering = cards.map(function (cards, index) {
        return [cards, index];
      });
      // Shuffle the multidimensional array IF 'random' only.
      if (this.cardsOrderMode === 'random') {
        cardOrdering = H5P.shuffleArray(cardOrdering);
      }
      // Retrieve cards objects from the first index
      let randomCards = [];
      for (let i = 0; i < self.nbCards; i++) {
        randomCards[i] = cardOrdering[i][0];
      }

      // Retrieve the new shuffled order from the second index
      let newOrder = [];
      for (let i = 0; i < self.nbCards; i++) {
        newOrder[i] = cardOrdering[i][1];
      }
      this.cardOrder = newOrder;
      // Initialise the noMatchCards array
      if (this.repetition) {
        this.noMatchCards = [];
        for (let index = 0; index < this.cardOrder.length; ++index) {
          this.noMatchCards[index] = 0;
        }
      }
      cards = randomCards;
      this.cardsLeftInStack = this.nbCardsSelected;
      this.cardsLeft = this.nbCardsSelected;
    }

    if (this.contentData.previousState && !this.filterByCategories) {
      if (this.contentData.previousState.order && this.existsCardOrder) {
        this.cardOrder.splice(cards.length, this.cardOrder.length);
        let previousOrder = this.contentData.previousState.order;
        if (typeof previousOrder === 'string') {
          previousOrder = previousOrder.split(',').map(Number);
        }
        if (!Array.isArray(previousOrder)) {
          previousOrder = [previousOrder]; // fallback safety
        }
        let cardOrdering = cards.map(function (cards, index) {
          return [cards, index];
        });

        let newCards = [];

        for (let i = 0; i < previousOrder.length; i++) {
          const index = previousOrder[i];
          if (cardOrdering[index]) {
            newCards[i] = cardOrdering[index][0];
          }
        }
        cards = newCards;
      }
    }

    // Save data to content state for resuming later on.
    // Push the new 'cards array' into self.currentDialogs.
    self.currentDialogs = cards;

    self.$cardwrapperSet = $('<div>', {
      class: 'h5p-dialogcards-cardwrap-set',
    });

    let setCardSizeCallback = function () {
      loaded++;
      if (loaded === initLoad) {
        self.resize();
      }
    };
    if (this.progress !== undefined && this.progress !== -1 && this.matchIt) {
      this.progress = this.progress / C.NB2;
    }
    // Used to randomize first left card on starting game
    let x = Math.floor(Math.random() * cards.length);
    // Do not randomize left card in browse side by side mode.
    if (this.matchIt && this.sideBySide) {
      x = 0;
    }
    // ************* LOOP TO CREATE CARDS **********************************
    for (let i = 0; i < cards.length; i++) {
      /* Load cards progressively
       * If matchIt, all cards are loaded upon init, this is needed.
       * Set current card index
       * If there is a saved state, then set current card index to saved position (progress)
       * otherwise set it to zero.
       * Idem for current left card index
       */
      let $cardWrapper = self.createCard(cards[i], i, setCardSizeCallback);
      if (
        ((this.progress === undefined || this.progress === -1) && i === 0) ||
        (this.progress !== undefined && i === this.progress)
      ) {
        $cardWrapper.addClass('h5p-dialogcards-current');
        if (this.matchIt) {
          $cardWrapper.addClass('h5p-dialogcards-match-right');
        }
        self.$current = $cardWrapper;
      }
      // Only way I found to avoid jitter when resuming.
      if (this.progress !== undefined && i < this.progress) {
        $cardWrapper.addClass('h5p-dialogcards-previous');
      }

      if (!this.matchIt) {
        self.addTipToCard(
          $cardWrapper.find('.h5p-dialogcards-card-content'),
          'front',
          i,
        );
      }
      self.$cardwrapperSet.append($cardWrapper);

      // Create the matchLeft cards.
      if (this.matchIt) {
        let $cardWrapperLeft = self.createCardLeft(
          cards[i],
          i,
          setCardSizeCallback,
        );
        let indexLeft;
        if (
          (this.repetition && this.progressLeft) ||
          this.playModeUser === 'browseSideBySide'
        ) {
          indexLeft = (this.progressLeft - 1) / C.NB2;
        }

        if (
          ((this.progressLeft === undefined || this.progressLeft === -1) &&
            i === x) ||
          (this.progressLeft !== undefined && i === indexLeft)
        ) {
          $cardWrapperLeft.addClass('h5p-dialogcards-current-left');
          self.$currentLeft = $cardWrapperLeft;
        }
        $cardWrapperLeft.addClass('h5p-dialogcards-cardwrap-left');
        if (this.repetition && this.noMatchCards) {
          $cardWrapperLeft.addClass('h5p-dialogcards-cardwrap-left-repetition');
          if (
            this.noMatchCards[i] &&
            !$cardWrapperLeft.hasClass('h5p-dialogcards-current-left')
          ) {
            $cardWrapper.addClass('h5p-dialogcards-noMatch');
            $cardWrapperLeft.addClass('h5p-dialogcards-noMatch');
            $cardWrapperLeft.removeClass(
              'h5p-dialogcards-cardwrap-left-repetition h5p-dialogcards-current-left',
            );
          }
        }

        if (this.cardsSideMode === 'frontFirst') {
          self.addTipToCard(
            $cardWrapper.find('.h5p-dialogcards-card-content'),
            'back',
            i,
          );
          self.addTipToCard(
            $cardWrapperLeft.find('.h5p-dialogcards-card-content'),
            'front',
            i,
          );
        }
        else {
          self.addTipToCard(
            $cardWrapper.find('.h5p-dialogcards-card-content'),
            'front',
            i,
          );
          self.addTipToCard(
            $cardWrapperLeft.find('.h5p-dialogcards-card-content'),
            'back',
            i,
          );
        }
        self.$cardwrapperSet.append($cardWrapperLeft);
      }
    }

    // ********************************************** END LOOP TO CREATE CARDS **********************************

    return self.$cardwrapperSet;
  };

  /**
   * Create a single card card
   * @param {object} card Card parameters
   * @param {number} cardNumber Card number in order of appearance
   * @param {function} [setCardSizeCallback] Set card size callback
   * @returns {HTMLElement} Card wrapper
   */
  C.prototype.createCard = function (card, cardNumber, setCardSizeCallback) {
    let $cardWrapper = $('<div>', {
      class: 'h5p-dialogcards-cardwrap',
    });

    let $cardHolder = $('<div>', {
      class: 'h5p-dialogcards-cardholder',
    }).appendTo($cardWrapper);

    // Increase cardHolder max-width to 40em to account for the 3 buttons at the bottom;
    if (this.playModeUser === 'selfCorrectionMode') {
      $cardHolder.addClass(' selfCorrectionMode');
    }

    // Progress for assistive technologies
    if (this.playModeUser === 'normalMode'
      || this.playModeUser === 'browseSideBySide'
      || this.playModeUser === 'matchMode') {
      let progressText = this.params.progressText
        .replace('@card', (cardNumber + 1).toString())
        .replace('@total', this.params.dialogs.length.toString());
    }
    else {
      let progressText = this.params.cardsLeft
        .replace('@number', this.params.dialogs.length.toString());
    }

    this.createCardContent(card, cardNumber, setCardSizeCallback).appendTo(
      $cardHolder,
    );

    return $cardWrapper;
  };

  C.prototype.createCardLeft = function (
    rcard,
    cardNumber,
    setCardSizeCallback,
  ) {
    let $cardWrapperLeft = $('<div>', {
      class: 'h5p-dialogcards-cardwrap-left',
    });

    let $cardHolderLeft = $('<div>', {
      class: 'h5p-dialogcards-cardholder',
    }).appendTo($cardWrapperLeft);

    this.createCardContentLeft(rcard, cardNumber, setCardSizeCallback).appendTo(
      $cardHolderLeft,
    );

    return $cardWrapperLeft;
  };

  /**
   * Create content for a card
   * @param {object} card Card parameters
   * @param {number} cardNumber Card number in order of appearance
   * @param {function} [setCardSizeCallback] Set card size callback
   * @returns {HTMLElement} Card content wrapper
   */
  C.prototype.createCardContent = function (
    card,
    cardNumber,
    setCardSizeCallback,
  ) {
    let $cardContent = $('<div>', {
      class: 'h5p-dialogcards-card-content',
    });
    let isLeft = false;

    if (!this.audioOnly &&
      (card.imageMedia.image !== undefined ||
      (card.imageMedia.image2 !== undefined &&
        this.cardsSideMode === 'frontFirst')
        || !this.matchIt)
    ) {
      this.createCardImage(card, cardNumber, setCardSizeCallback, isLeft).appendTo(
        $cardContent,
      );
    }
    let hidetext = '';
    if (this.frontTextBackImage
      && this.cardsSideMode === 'backFirst'
      && !this.matchIt
    ) {
      hidetext = ' hide';
    }

    let $cardTextWrapper = $('<div>', {
      class: `h5p-dialogcards-card-text-wrapper ${hidetext}`.trim(),
    }).appendTo($cardContent);

    let $cardTextInner = $('<div>', {
      class: 'h5p-dialogcards-card-text-inner',
    }).appendTo($cardTextWrapper);

    let $cardTextInnerContent = $('<div>', {
      class: 'h5p-dialogcards-card-text-inner-content',
    }).appendTo($cardTextInner);

    if (card.audioMedia.audio !== undefined) {
      this.createCardAudio(card).appendTo($cardTextInnerContent);
    }
    if (card.audioMedia.audio2 !== undefined) {
      this.createCardAudio2(card).appendTo($cardTextInnerContent);
    }

    let $cardText = $('<div>', {
      class: 'h5p-dialogcards-card-text',
    }).appendTo($cardTextInnerContent);

    $('<div>', {
      class: 'h5p-dialogcards-card-text-area',
      tabindex: '-1',
      html: card.text,
    }).appendTo($cardText);

    if (!card.text || !card.text.length) {
      $cardText.addClass('hide');
    }

    const hideTextAndBuildContent = () => {
      if (this.matchIt && this.cardsSideMode === 'frontFirst' || this.noText) {
        $cardTextWrapper.addClass('hide');
      }
      if (card.audioMedia.audio !== undefined) {
        this.createCardAudio(card).appendTo($cardContent);
      }
      if (card.audioMedia.audio2 !== undefined) {
        this.createCardAudio2(card).appendTo($cardContent);
      }
      // todo check if spacer is needed always
      this.createCardFooter(card, $cardContent)
        .appendTo($cardContent)
        .addClass(this.audioOnly ? ' spacerAudioOnly' : '');
    };

    const shouldHideText =
      this.noText ||
    (this.frontTextBackImage &&
      this.matchIt);

    if (shouldHideText) {
      hideTextAndBuildContent();
    }
    else if (this.frontTextBackImage && !this.matchIt) {
    // NEW CONDITION: footer goes to card content
      this.createCardFooter().appendTo($cardContent);
    }
    else {
    // Default behavior
      this.createCardFooter().appendTo($cardTextWrapper);
    }
    if (this.frontTextBackImage) {
      $cardTextWrapper.css('min-height', '15em');
      let $c = $cardContent.find('.h5p-dialogcards-image-wrapper');
      if (this.cardsSideMode === 'frontFirst' && !this.matchIt) {
        $c.addClass('hide');
      }
      if (this.cardsSideMode === 'backFirst' || this.params.behaviour.scaleTextNotCard) {
        $c.addClass('front-text-back-image-reduced');
      }
    }
    return $cardContent;
  };

  /**
   * Create content for a card on the left (in Match modes)
   * @param {object} card Card parameters
   * @param {number} cardNumber Card number in order of appearance
   * @param {function} [setCardSizeCallback] Set card size callback
   * @returns {HTMLElement} Card content wrapper
   */
  C.prototype.createCardContentLeft = function (
    card,
    cardNumber,
    setCardSizeCallback,
  ) {
    let self = this;
    // Reverse all card elements which have been reversed before.
    let t = card.text;
    let a = card.answer;
    let au = card.audioMedia.audio;
    let au2 = card.audioMedia.audio2;
    let ialt = card.imageAltText;
    let ialt2 = card.imageAltText2;

    card.text = a;
    card.answer = t;
    card.audioMedia.audio = au2;
    card.audioMedia.audio2 = au;
    card.imageAltText = ialt2;
    card.imageAltText2 = ialt;

    // Need to revert tips for the left card if frontFirst

    if (this.cardsSideMode === 'frontFirst') {
      let tf = card.tips.front;
      let tb = card.tips.back;
      card.tips.front = tb;
      card.tips.back = tf;
    }

    let $cardContent = $('<div>', {
      class: 'h5p-dialogcards-card-content',
    });

    $cardContent.addClass('h5p-dialogcards-matchLeft');

    // Upon restore content state maybe necessary to hide previously incorrectly matched cards
    // Do not create image div is not necessary
    if (
      card.imageMedia.image !== undefined ||
      (card.imageMedia.image2 !== undefined &&
        this.cardsSideMode === 'backFirst')
    ) {
      let isLeft = true;
      self
        .createCardImage(card, cardNumber, setCardSizeCallback, isLeft)
        .appendTo($cardContent);
    }
    let $cardTextWrapper = $('<div>', {
      class: 'h5p-dialogcards-card-text-wrapper',
    }).appendTo($cardContent);

    let $cardTextInner = $('<div>', {
      class: 'h5p-dialogcards-card-text-inner',
    }).appendTo($cardTextWrapper);

    let $cardTextInnerContent = $('<div>', {
      class: 'h5p-dialogcards-card-text-inner-content',
    }).appendTo($cardTextInner);

    if (this.matchIt) {
      if (card.audioMedia.audio !== undefined) {
        self.createCardAudio(card).appendTo($cardContent);
      }
      if (card.audioMedia.audio2 !== undefined) {
        self.createCardAudio2(card).appendTo($cardContent);
      }
    }

    let $cardText = $('<div>', {
      class: 'h5p-dialogcards-card-text',
    }).appendTo($cardTextInnerContent);

    $('<div>', {
      class: 'h5p-dialogcards-card-text-area',
      tabindex: '-1',
      html: card.text,
    }).appendTo($cardText);

    if (!card.text || !card.text.length) {
      $cardText.addClass('hide');
    }

    // Dummy cardfooter to get a "correct" left card height if too much text...
    // Create it if needed by this.sideBySide
    if (this.noText) {
      $cardTextWrapper.addClass('hide');
      let $cardFooterLeft = $('<div>', {
        class: 'h5p-dialogcards-card-footer',
      });
      if (this.playModeUser !== 'browseSideBySide') {
        this.$buttonDummyMatch = createButton({
          classes: 'h5p-dialogcards-answer-button h5p-dialogcards-match-correct h5p-dialogcards-button-hidden dummy',
          label: 'dummy',
          disabled: true,
          styleType: 'secondary',
        })
          .appendTo($cardFooterLeft);
      }
      $cardFooterLeft.appendTo($cardContent);
    }

    if (this.frontTextBackImage && this.cardsSideMode === 'backFirst') {
      $cardTextWrapper.addClass('hide');
      if (card.audioMedia.audio !== undefined) {
        this.createCardAudio(card).appendTo($cardContent);
      }
      if (card.audioMedia.audio2 !== undefined) {
        this.createCardAudio2(card).appendTo($cardContent);
      }
      let $cardFooterLeft = $('<div>', {
        class: 'h5p-dialogcards-card-footer spacer',
      });
      $cardFooterLeft.appendTo($cardContent);
    }

    // Restore original card data!
    if (this.cardsSideMode === 'backFirst') {
      let t = card.text;
      let a = card.answer;
      let au = card.audio;
      let au2 = card.audio2;
      let ialt = card.imageAltText;
      let ialt2 = card.imageAltText2;
      card.text = a;
      card.answer = t;
      card.audio = au2;
      card.audio2 = au;
      card.imageAltText = ialt2;
      card.imageAltText2 = ialt;
    }

    return $cardContent;
  };

  /**
   * Create card footer
   * @param {object} card Card parameters
   * @param {HTMLElement} $cardContent Card content container
   * @returns {HTMLElement} Card footer element
   */
  C.prototype.createCardFooter = function (card, $cardContent) {

    let self = this;
    let footerClass;
    if (!this.enableGotIt) {
      footerClass = 'h5p-dialogcards-card-footer';
      if (this.frontTextBackImage && !this.matchIt) {
        footerClass += ' reduced-image';
      }
      if (this.noText && card.audioMedia.audio !== undefined) {
        let audioWrapper = $cardContent.find('.h5p-dialogcards-audio-wrapper');
        audioWrapper.addClass('display-audio-centered');
        footerClass += ' audio';
      }
    }
    else {
      if (!this.frontTextBackImage) {
        footerClass = 'h5p-dialogcards-card-footer-enablegotit';
      }
      else {
        footerClass = 'h5p-dialogcards-card-footer-enablegotit front-text-back-image';
      }
    }
    if (this.matchIt) {
      footerClass = 'h5p-dialogcards-card-footer-match';
    }
    let $cardFooter = $('<div>', {
      class: footerClass,
    });

    let classesRepetition = 'h5p-dialogcards-button-hidden';
    let attributeTabindex = '-1';

    if (this.enableGotIt || this.matchIt) {
      classesRepetition =
        'h5p-dialogcards-quick-progression h5p-dialogcards-disabled';
      attributeTabindex = '0';
    }

    if (this.enableGotIt) {
      this.$buttonIncorrect = createButton({
        classes: 'h5p-dialogcards-answer-button incorrect',
        label: 'this.params.incorrectAnswer',
        disabled: true,
        tabindex: attributeTabindex,
        styleType: 'secondary',
        onClick: () => {
          this.gotItIncorrect();
        },
      }).appendTo($cardFooter);
    }

    if (!this.matchIt) {
      let htmlText = self.hideTurnButton
        ? self.params.check
        : self.params.answer;
      this.$buttonTurn = createButton({
        classes: 'h5p-dialogcards-turn',
        label: htmlText,
        icon: 'flip',
        onClick: (event) => {
          const card = event.currentTarget.closest('.h5p-dialogcards-cardwrap');
          this.turnCard($(card));
        },
      })
        .appendTo($cardFooter);
    }
    else if (!this.sideBySide) {
      this.$buttonMatch = createButton({
        classes: 'h5p-dialogcards-button-match',
        label: self.params.matchButtonLabel,
        icon: 'flip',
        onClick: (event) => {
          const card = event.currentTarget.closest('.h5p-dialogcards-cardwrap');
          if (self.repetition) {
            +
            this.matchCardsRepetition($(card));
          }
          else {
            this.matchCards($(card));
          }
        },
      })
        .attr('tabindex', 1)
        .appendTo($cardFooter);

      let classesMatch =
        'h5p-dialogcards-answer-button ' +
        'h5p-dialogcards-match h5p-dialogcards-disabled';
      // JR dummy button for correct match.
      this.$buttonCorrectMatch = createButton({
        classes: 'h5p-dialogcards-answer-button h5p-dialogcards-match-correct'
          + ' h5p-dialogcards-quick-progression  h5p-dialogcards-disabled',
        label: self.params.correctMatch,
        disabled: true,
        styleType: 'secondary',
      })
        .attr('tabindex', -1)
        .appendTo($cardFooter);

      // JR dummy button for incorrect match.
      this.$buttonIncorrectMatch = createButton({
        classes: 'h5p-dialogcards-answer-button h5p-dialogcards-match-incorrect'
        + ' h5p-dialogcards-quick-progression  h5p-dialogcards-disabled',
        label: self.params.incorrectMatch,
        disabled: true,
        styleType: 'secondary',
      }).appendTo($cardFooter);
    }

    if (this.enableGotIt) {
      this.$buttonCorrect = createButton({
        classes: 'h5p-dialogcards-answer-button correct',
        label: this.params.correctAnswer,
        disabled: true,
        tabindex: attributeTabindex,
        styleType: 'secondary',
        onClick: () => {
          const $cardwrap = $(event.currentTarget).closest('.h5p-dialogcards-current');
          this.gotItCorrect($cardwrap);
        },
      }).appendTo($cardFooter);
    }
    return $cardFooter;
  };

  /**
   * Create card image
   * @param {object} card Card parameters
   * @param {function} [loadCallback] Function to call when loading image
   * @returns {HTMLElement} Card image wrapper
   */

  C.prototype.createCardImage = function (card, cardNumber, loadCallback, isLeft = false) {
    let self = this;
    let $image;
    let $image2;
    let i;
    let i2;
    let $imageWrapper = $('<div>', {
      class: 'h5p-dialogcards-image-wrapper',
    });
    // Case where only some cards have 2 images.
    let cardHasTwoImages = false;

    if (card.imageMedia.image !== undefined && card.imageMedia.image2 !== undefined) {
      cardHasTwoImages = true;
    }
    if (this.hasTwoImages || cardHasTwoImages) {
      if (isLeft) {
        i = card.imageMedia.image;
        i2 = card.imageMedia.image2;
        card.imageMedia.image = i2;
        card.imageMedia.image2 = i;
      }
    }

    const isFrontFirst = this.cardsSideMode === 'frontFirst';
    const isBackFirst = this.cardsSideMode === 'backFirst';

    if (card.imageMedia.image !== undefined) {
      $image = $(`<img class="h5p-dialogcards-image"
          src="${H5P.getPath(card.imageMedia.image.path, self.id)}"/>`);
      if (loadCallback) {
        $image.load(loadCallback);
      }
      if (card.imageAltText) {
        $image.attr('alt', card.imageAltText);
      }

      if (!this.matchIt && isBackFirst) {
        let imagePath = card.imageMedia.image.path;
        let image2Path = card.imageMedia.image2.path;
        if (imagePath === image2Path) {
          if (this.noDupeFrontPicToBack) {
            $image.addClass('h5p-dialogcards-hide');
          }
        }
      }

    }
    if (card.imageMedia.image2 !== undefined) {
      $image2 = $(`<img class="h5p-dialogcards-image2"
          src="${H5P.getPath(card.imageMedia.image2.path, self.id)}"/>`);
      const shouldShowImage2 =
        (isBackFirst && !self.matchIt && !card.imageMedia.image
        || self.matchIt
          && (isFrontFirst && !isLeft)
          || (isBackFirst && isLeft)
        );
      if (!shouldShowImage2) {
        $image2.addClass('h5p-dialogcards-hide');
      }

      if (loadCallback) {
        $image2.load(loadCallback);
      }
      if (card.imageAltText2) {
        $image2.attr('alt', card.imageAltText2);
      }
      self.$images2.push($image2);
      $image2.appendTo($imageWrapper);
    }

    if (card.imageMedia.image !== undefined
      && this.noDupeFrontPicToBack
      && card.imageMedia.image2 === undefined
      && isBackFirst
      && isLeft) {
      $image.addClass('h5p-dialogcards-hide');
    }

    // Needed for notext image + audio
    // this.noDupeFrontPicToBack must be enabled
    if (this.frontImageBackAudio && typeof $image !== 'undefined') {
      // Case 1: matchIt enabled
      if (this.matchIt) {
        if (isFrontFirst) {
          // both sides hide image WHY ?
          $image.addClass('h5p-dialogcards-hide');

          if (!isLeft && typeof $image2 !== 'undefined') {
            $image2.addClass('h5p-dialogcards-hide');
          }
        }
        else if (isBackFirst) {
          if (isLeft) {
            $image.addClass('h5p-dialogcards-hide');
          }
          else {
            $image.removeClass('h5p-dialogcards-hide');
          }
        }
      }
      // Case 2: matchIt disabled + backFirst
      else if (isBackFirst) {
        $image.addClass('h5p-dialogcards-hide');
      }
    }

    // Hides image on the left side if nodupe
    const { image, image2 } = card.imageMedia;
    const sameImage = image?.path === image2?.path;
    if (this.noDupeFrontPicToBack && this.matchIt && sameImage) {
      (isLeft ? $image : $image.add($image2))
        .addClass('h5p-dialogcards-hide');
    }
    /*******************************************************************************/

    if (typeof $image !== 'undefined') {
      self.$images.push($image);
      $image.appendTo($imageWrapper);
    }

    // Restore initial card images
    if (this.hasTwoImages || cardHasTwoImages && isLeft) {
      card.image = i;
      card.image2 = i2;
    }
    if (this.hasOneImageOnFront) {
      $imageWrapper.css('min-height', '15em');
    }
    return $imageWrapper;
  };

  /**
   * Create card audio
   * @param {object} card Card parameters
   * @returns {HTMLElement} Card audio element
   */
  C.prototype.createCardAudio = function (card) {
    let self = this;
    let audio = null;
    let audioClass = 'h5p-dialogcards-audio-wrapper';
    if (this.noText) {
      audioClass += ' spacer display-audio-centered';
    }
    let $audioWrapper = $('<div>', {
      class: audioClass,
    });
    if (card.audioMedia.audio !== undefined) {
      let audioDefaults = {
        files: card.audioMedia.audio,
        audioNotSupported: self.params.audioNotSupported,
      };
      audio = new Audio(audioDefaults, self.id);
      audio.attach($audioWrapper);
      // Have to stop else audio will take up a socket pending forever in chrome.
      if (audio.audioMedia && audio.audioMedia.preload) {
        audio.audio.preload = 'none';
      }
    }
    self.audios.push(audio);
    return $audioWrapper;
  };

  /**
   * Create card audio for the back of the card
   * @param {object} card Card parameters
   * @returns {HTMLElement} Card audio element
   */
  C.prototype.createCardAudio2 = function (card) {
    let self = this;
    let audio2 = null;
    let audioClass = 'h5p-dialogcards-audio-wrapper2 hide';
    if (this.noText) {
      audioClass += ' spacer display-audio-centered';
    }
    let $audioWrapper2 = $('<div>', {
      class: audioClass,
    });
    if (card.audioMedia.audio2 !== undefined) {
      let audioDefaults = {
        files: card.audioMedia.audio2,
        audioNotSupported: self.params.audioNotSupported,
      };
      audio2 = new Audio(audioDefaults, self.id);
      audio2.attach($audioWrapper2);
      // Have to stop else audio will take up a socket pending forever in chrome.
      if (audio2.audio && audio2.audio.preload) {
        audio2.audio.preload = 'none';
      }
    }
    self.audios2.push(audio2);
    return $audioWrapper2;
  };

  /**
   * Update navigation text and show or hide buttons.
   */
  C.prototype.updateNavigation = function () {
    let self = this;
    let $nextCard;
    let $prevCard;
    let $matchButton;
    const selectionIndex = self.$current.index();
    if (this.$progressTop) {
      this.$progressTop.removeClass('h5p-dialogcards-disabled');
    }

    let $card = self.$current.find('.h5p-dialogcards-card-content');

    if (this.matchIt && !this.sideBySide) {
      // Needed if $matchButton was just de-activated upon an incorrect match.
      let $matchButton = $card.find('.h5p-dialogcards-button-match');
      let $incorrectButton = $card.find('.h5p-dialogcards-match-incorrect');
      if (this.cardsLeft !== 0) {
        $matchButton.removeClass('h5p-dialogcards-disabled');
        $incorrectButton.addClass('h5p-dialogcards-disabled');
      }
      else {
        $matchButton.addClass('h5p-dialogcards-disabled');
      }
    }

    $nextCard = self.$current.nextAll('.h5p-dialogcards-cardwrap').eq(0);

    if (this.repetition) {
      while ($nextCard.hasClass('h5p-dialogcards-noMatch')) {
        $nextCard = $nextCard.nextAll('.h5p-dialogcards-cardwrap').eq(0);
      }
      if (this.$progressTop) {
        this.$progressTop.text(this.params.cardsLeft
          .replace('@number', this.cardsLeft),
        );
      }
    }
    if ($nextCard.length && !this.enableGotIt) {
      self.$next.removeClass('h5p-dialogcards-disabled');
      if (this.cardsLeft === 0) {
        self.$next.addClass('h5p-dialogcards-disabled');
      }
      self.$retry.addClass('h5p-dialogcards-disabled');
    }
    else if (!this.enableGotIt) {
      self.$next.addClass('h5p-dialogcards-disabled');
    }
    $prevCard = self.$current.prevAll('.h5p-dialogcards-cardwrap').eq(0);

    if (this.repetition) {
      if ($prevCard.hasClass('h5p-dialogcards-noMatch')) {
        $prevCard.removeClass('h5p-dialogcards-previous');
      }
      $prevCard = self.$current.prevAll('.h5p-dialogcards-previous').eq(0);
    }

    // enableGotIt mode does not have prev or next buttons
    if (!this.enableGotIt) {
      if ($prevCard.length) {
        self.$prev.removeClass('h5p-dialogcards-button-hidden');
      }
      else {
        self.$prev.addClass('h5p-dialogcards-button-hidden');
      }
    }

    if (this.enableGotIt) {
      if (this.hideTurnButton) {
        $card.find('.h5p-dialogcards-turn').removeClass('h5p-dialogcards-hide');
      }

      if (this.$round !== undefined && this.$round !== null) {
        self.$round.text(this.params.round.replace('@round', this.currentRound));
      }
      if (self.$progressTop) {
        self.$progressTop.text(
          self.params.cardsLeft
            .replace('@number', self.currentDialogs.length - selectionIndex - this.endOfStack),
        );
      }
    }
    else if (this.matchIt && !this.sideBySide) {
      self.$progressFooterLeft.text(
        this.params.matchesFound
          .replace('@correct', this.correct)
          .replace('@incorrect', this.incorrect),
      );
      this.matchCorrect = null;
      if (!this.repetition) {
        if (self.$progressTop) {
          self.$progressTop.text(
            self.params.progressText
              .replace('@card', self.$current.index() / C.NB2 + 1)
              .replace('@total', self.currentDialogs.length),
          );
        }
      }
      if (this.repetition) {
        if (this.$round !== undefined && this.$round !== null) {
          this.$round.text(
            this.params.round.replace('@round', this.currentRound),
          );
        }
      }
    }
    else if (this.sideBySide) {
      if (self.$progressTop) {
        self.$progressTop.text(
          self.params.progressText
            .replace('@card', self.$current.index() / C.NB2 + 1)
            .replace('@total', self.currentDialogs.length),
        );
      }
      if ($nextCard.length === 0) {
        const retryOrReset = self.getRetryOrReset();
        let message = retryOrReset[0];
        let thisclass = retryOrReset[1];
        self.$retry
          .removeClass('h5p-dialogcards-disabled h5p-dialogcards-button-retry')
          .addClass(thisclass)
          .html(message)
          .attr('title', message);
      }
    }
    else {
      if (self.$progressTop) {
        self.$progressTop.text(
          self.params.progressText
            .replace('@card', self.$current.index() + 1)
            .replace('@total', self.currentDialogs.length),
        );
      }
    }
  };

  /**
   * Show next card. If matchIt show next card on the right.
   */
  C.prototype.nextCard = function () {
    let self = this;

    // In those 2 modes, consider activity answered when first card is clicked.
    if (
      this.playModeUser === 'normalMode' ||
      this.playModeUser === 'browseSideBySide'
    ) {
      self.triggerAnswered();
    }
    self.stopAudio(self.$current.index());
    if (this.matchIt) {
      let $leftCard = self.$currentLeft;
      self.stopAudio($leftCard.index());
    }

    let $nextCard = self.$current.nextAll('.h5p-dialogcards-cardwrap').eq(0);

    if (this.repetition) {
      while (
        $nextCard.length &&
        $nextCard.hasClass('h5p-dialogcards-noMatch')
      ) {
        $nextCard = $nextCard.nextAll('.h5p-dialogcards-cardwrap').eq(0);
      }
    }

    if ($nextCard.length) {
      self.$current
        .removeClass('h5p-dialogcards-current h5p-dialogcards-match-right')
        .addClass('h5p-dialogcards-previous');
      self.$current = $nextCard.addClass('h5p-dialogcards-current');
      if (this.matchIt) {
        self.$current.addClass('h5p-dialogcards-match-right');
      }
      self.setCardFocus(self.$current);
      // If matchIt, all cards are loaded upon init, this is needed.
      // Add next card.
      if (!this.matchIt) {
        let $loadCard = self.$current.next('.h5p-dialogcards-cardwrap');
        if (
          !$loadCard.length &&
          self.$current.index() + 1 < self.currentDialogs.length
        ) {
          let $cardWrapper = self
            .createCard(
              self.currentDialogs[self.$current.index() + 1],
              self.$current.index() + 1,
            )
            .appendTo(self.$cardwrapperSet);
          self.addTipToCard(
            $cardWrapper.find('.h5p-dialogcards-card-content'),
            'front',
            self.$current.index() + 1,
          );
        }
      }
      //needed?
      self.resize();
      if (!this.matchIt) {
        self.turnCardToFront();
      }
    }
    else {
      // Next card not loaded or end of cards.
      // End of stack reached
      self.resetButtons('retry button');
    }

    self.updateNavigation();

    if (this.sideBySide) {
      let $leftCard = self.$currentLeft;
      $leftCard.removeClass('h5p-dialogcards-current-left');
      // Set Timeout to avoid blink between 2 left cards
      setTimeout(function () {
        self.nextCardLeft();
        self.updateNavigation();
      }, C.NB300);
    }
  };

  C.prototype.nextCardLeft = function () {
    let self = this;
    let x = Math.floor(Math.random() * self.currentDialogs.length);
    if (this.matchIt && this.sideBySide) {
      x = 0;
    }
    let $nextCardLeft = self.$currentLeft
      .nextAll('.h5p-dialogcards-cardwrap-left')
      .eq(x);
    if ($nextCardLeft.length) {
      self.$currentLeft = $nextCardLeft.addClass(
        'h5p-dialogcards-current-left',
      );
      self.$currentLeft.removeClass('h5p-dialogcards-disabled');
      self.resize();
    }
    else {
      let $prevCardLeft = self.$currentLeft
        .prevAll('.h5p-dialogcards-cardwrap-left')
        .eq(x);
      while (!$prevCardLeft.length) {
        let y = Math.round(Math.random());
        if (this.matchIt && this.sideBySide) {
          y = 0;
        }
        if (y === 0) {
          $prevCardLeft = $('.h5p-dialogcards-cardwrap-left').first();
        }
        else {
          $prevCardLeft = $('.h5p-dialogcards-cardwrap-left').last();
        }
      }
      self.$currentLeft = $prevCardLeft.addClass(
        'h5p-dialogcards-current-left',
      );
      self.$currentLeft.removeClass(
        'h5p-dialogcards-previous-left h5p-dialogcards-disabled',
      );
    }
  };

  C.prototype.nextCardLeftRepetition = function () {
    let self = this;
    let x = Math.floor(Math.random() * this.cardsLeft);
    let $nextCardLeft = self.$currentLeft
      .nextAll('.h5p-dialogcards-cardwrap-left-repetition')
      .eq(x);

    if ($nextCardLeft.length) {
      self.$currentLeft = $nextCardLeft.addClass(
        'h5p-dialogcards-current-left',
      );
      self.$currentLeft.removeClass('h5p-dialogcards-disabled');
      self.resize();
    }
    else {
      let $prevCardLeft = self.$currentLeft
        .prevAll('.h5p-dialogcards-cardwrap-left-repetition')
        .eq(x);
      while (!$prevCardLeft.length) {
        let y = Math.round(Math.random());
        if (y === 0) {
          $prevCardLeft = $(
            '.h5p-dialogcards-cardwrap-left-repetition',
          ).first();
        }
        else {
          $prevCardLeft = $('.h5p-dialogcards-cardwrap-left-repetition').last();
        }
      }
      self.$currentLeft = $prevCardLeft.addClass(
        'h5p-dialogcards-current-left',
      );
      self.$currentLeft.removeClass(
        'h5p-dialogcards-previous-left h5p-dialogcards-disabled',
      );
    }
  };

  /**
   * Show next card after user clicked on the incorrectAnswer button.
   */
  C.prototype.gotItIncorrect = function () {
    const self = this;
    let $next = self.$current.next('.h5p-dialogcards-cardwrap');
    const $cardContent = self.$current.find('.h5p-dialogcards-card-content');
    $cardContent.removeClass('h5p-dialogcards-turned');
    const selectionIndex = self.$current.index();
    let cardsLeftInStack =
      self.currentDialogs.length - selectionIndex - this.endOfStack;
    this.incorrect++;
    if ($next.length) {
      let audioIndex = self.nbCards - self.currentDialogs.length;
      self.stopAudio(audioIndex);
      self.$current
        .removeClass('h5p-dialogcards-current h5p-dialogcards-turned')
        .addClass('h5p-dialogcards-previous');
      self.$current = $next.addClass('h5p-dialogcards-current');
      self.setCardFocus(self.$current);
      self.turnCardToFront();
      // Add next card if not loaded yet.
      let $loadCard = self.$current.next('.h5p-dialogcards-cardwrap');
      if (
        !$loadCard.length &&
        self.$current.index() + 1 < self.currentDialogs.length
      ) {
        let $cardWrapper = self
          .createCard(
            self.currentDialogs[self.$current.index() + 1],
            self.$current.index() + 1,
          )
          .appendTo(self.$cardwrapperSet);
        self.addTipToCard(
          $cardWrapper.find('.h5p-dialogcards-card-content'),
          'front',
          self.$current.index() + 1,
        );
        self.resize();
      }
      self.turnCardToFront();

      // Update navigation
      self.updateNavigation();
      self.resetButtons('answer buttons');

      // Next card not loaded or end of cards.
      self.$current
        .find('.h5p-dialogcards-answer-button')
        .removeClass('h5p-dialogcards-disabled');
    }
    else if (cardsLeftInStack) {
      this.endOfStack = 1;
      self.updateNavigation();
      self.resetButtons('retry button');

      // Hack to fix display bug on last incorrect card.
      self.$current
        .find('.h5p-dialogcards-card-text-inner')
        .css('height', '10.6em');
    }
  };

  /**
   * Show previous card.
   */
  C.prototype.prevCard = function () {
    let self = this;
    if (this.matchIt) {
      const $leftCard = self.$currentLeft;
      self.stopAudio($leftCard.index());
      if (this.sideBySide) {
        $leftCard.removeClass('h5p-dialogcards-current-left');
        let $prevCardLeft = self.$currentLeft
          .prevAll('.h5p-dialogcards-cardwrap-left')
          .eq(0);
        if (!$prevCardLeft.length) {
          $prevCardLeft = $('.h5p-dialogcards-cardwrap-left').first();
        }
        setTimeout(function () {
          self.$currentLeft = $prevCardLeft.addClass(
            'h5p-dialogcards-current-left',
          );
          self.$currentLeft.removeClass(
            'h5p-dialogcards-previous-left h5p-dialogcards-disabled',
          );
        }, C.NB300);
      }
    }
    let $prevCard = self.$current.prevAll('.h5p-dialogcards-cardwrap').eq(0);
    while ($prevCard.length && $prevCard.hasClass('h5p-dialogcards-noMatch')) {
      $prevCard = $prevCard.prevAll('.h5p-dialogcards-cardwrap').eq(0);
    }
    if ($prevCard.length) {
      self.stopAudio(self.$current.index());
      self.$current.removeClass('h5p-dialogcards-current');
      self.$current = $prevCard
        .addClass('h5p-dialogcards-current')
        .removeClass('h5p-dialogcards-previous');
      if (this.matchIt) {
        self.$current.addClass('h5p-dialogcards-match-right');
      }
      self.resize();
      self.resizeOverflowingText();
      self.setCardFocus(self.$current);
    }
    if (!this.matchIt) {
      self.turnCardToFront();
    }
    self.updateNavigation();
  };

  /**
   * @param {object} cardsOrder User selected cards order option (normal/random).
   */
  C.prototype.randomizeOrder = function (cardsOrder) {
    let self = this;
    this.cardsOrderMode = cardsOrder;
    $('.h5p-dialogcards-options, .h5p-dialogcards-categories, .h5p-options-title', self.$inner).remove();
    if (
      this.enableCardsNumber &&
      cardsOrder === 'random' &&
      self.nbCards > C.NB5
    ) {
      self.createNumberCards().appendTo(self.$inner);
    }
    else {
      if (this.cardsSideChoice === 'user') {
        $('.h5p-dialogcards-options, .h5p-dialogcards-categories, .h5p-options-title', self.$inner).remove();
        // Just in case user clicked twice on the No button!
        setTimeout(function () {
          self.createcardsSideChoice().appendTo(self.$inner);
        }, C.NB300);
      }
      else {
        self.attachContinue();
      }
    }
  };

  /**
   * When navigating forward or backward, reset card to front view if has previously been turned
   * so that user can see the Question side, not the Answer side of the card.
   */

  C.prototype.turnCardToFront = function () {
    let self = this;
    let $c = self.$current.find('.h5p-dialogcards-card-content');
    let turned = $c.hasClass('h5p-dialogcards-turned');
    if (turned) {
      self.turnCard(self.$current);
      if (self.enableGotIt) {
        let $cg = self.$current.find('.h5p-dialogcards-answer-button');
        $cg.addClass('h5p-dialogcards-disabled');
      }
    }
  };

  /**
   * Show the opposite site of the card.
   * @param {object} [$card] Current card
   */
  C.prototype.turnCard = function ($card) {
    let self = this;
    let $cg;
    let $c = self.$current.find('.h5p-dialogcards-card-content');
    let $ci = $card.find('.h5p-dialogcards-image');
    let $ci2 = $card.find('.h5p-dialogcards-image2');
    let $au = $card.find('.h5p-audio-wrapper');
    let turned = $c.hasClass('h5p-dialogcards-turned');
    let $ch = $card
      .find('.h5p-dialogcards-cardholder')
      .addClass('h5p-dialogcards-collapse');
    if (this.enableGotIt) {
      $cg = $card.find('.h5p-dialogcards-answer-button');
    }

    // Removes tip, since it destroys the animation:
    $c.find('.joubel-tip-container').remove();

    // Check if card has been turned before
    self.$cardSideAnnouncer.html(
      turned ? self.params.cardFrontLabel : self.params.cardBackLabel,
    );

    // Update HTML class for card
    $c.toggleClass('h5p-dialogcards-turned', !turned);

    setTimeout(function () {
      $ch.removeClass('h5p-dialogcards-collapse');
      if (!this.noText) {
        // Manage front & back texts.
        let $cardText = $card.find('.h5p-dialogcards-card-text');
        if (self.cardsSideMode === 'frontFirst') {
          if (self.currentDialogs[$card.index()].answer) {
            self.changeText(
              $c,
              self.currentDialogs[$card.index()][turned ? 'text' : 'answer'],
            );
            $cardText.removeClass('hide');
          }
          else {
            // We need to reset text to its original front card state.
            $cardText.toggleClass('hide', !turned);
          }
        }
        else if ($ci2.attr('src')
          || self.frontTextBackAudio && $au
        ) {
          // backFirst & image2
          self.changeText(
            $c,
            self.currentDialogs[$card.index()][turned ? 'text' : 'answer'],
          );
          $cardText.removeClass('hide');
        }
        else {
          self.changeText(
            $c,
            self.currentDialogs[$card.index()][turned ? 'text' : 'answer'],
          );
        }
      }

      // Manage front & back images.
      // If exists image2
      if ($ci2.attr('src')) {
        if (self.cardsSideMode === 'frontFirst') {
          $ci.toggleClass('h5p-dialogcards-hide');
          $ci2.toggleClass('h5p-dialogcards-hide');
        }
        else {
          // If exists image
          if ($ci.attr('src') && $ci.attr('src') !== $ci2.attr('src')) {
            $ci.toggleClass('h5p-dialogcards-hide');
          }
          $ci2.toggleClass('h5p-dialogcards-hide');
        }
      }
      else {
        if (self.cardsSideMode === 'frontFirst' && self.noDupeFrontPicToBack) {
          $ci.toggleClass('h5p-dialogcards-hide');
          $ci2.toggleClass('h5p-dialogcards-hide');
        }
        else {
          if (self.noDupeFrontPicToBack) {
            $ci.toggleClass('h5p-dialogcards-hide');
          }
          else {
            $ci2.removeClass('h5p-dialogcards-hide');
          }
        }
      }
      // Manage front & back images.
      let audioIndex = self.$current.index();
      /* why?
      if (this.enableGotIt) {
        audioIndex = (self.nbCards - self.currentDialogs.length);
      }
      */
      let audio = self.audios[audioIndex];
      if (audio || self.noText) {
        $ch.find('.h5p-dialogcards-audio-wrapper').toggleClass('hide');
        self.stopAudio(audioIndex);
      }

      let audio2 = self.audios2[audioIndex];
      if (audio2 || self.noText) {
        $ch.find('.h5p-dialogcards-audio-wrapper2').toggleClass('hide');
        self.stopAudio(audioIndex);
      }

      if (self.enableGotIt) {
        $cg.removeClass('h5p-dialogcards-disabled');
        $cg.prop('disabled', false);
      }
      if (self.frontTextBackImage) {
        $card
          .find('.h5p-dialogcards-image-wrapper')
          .toggleClass('hide');
        $card
          .find('.h5p-dialogcards-card-text-wrapper')
          .toggleClass('hide');
      }
      // Toggle state for gotIt buttons
      if (self.enableGotIt) {
        if (!turned && self.hideTurnButton) {
          let $buttonTurn;
          $buttonTurn = self.$current.find('.h5p-dialogcards-turn');
          $buttonTurn.addClass('h5p-dialogcards-hide');
        }
        const $answerButtons = $card.find('.h5p-dialogcards-answer-button');

        if (!turned) {
          $answerButtons
            .addClass('h5p-dialogcards-quick-progression')
            .attr('tabindex', 0);
        }
        else {
          $answerButtons
            .removeClass('h5p-dialogcards-quick-progression')
            .prop('disabled', true);
        }
      }

      // Add backside tip
      // Had to wait a little, if not Chrome will displace tip icon
      setTimeout(function () {
        self.addTipToCard($c, turned ? 'front' : 'back');
        if (
          !self.$current.next('.h5p-dialogcards-cardwrap').length &&
          self.currentDialogs.length > 1
        ) {
          if (self.params.behaviour.enableRetry && !this.enableGotIt) {
            self.resizeOverflowingText();
          }
        }
      }, C.NB200);

      self.resizeOverflowingText();

      // Focus text
      $card.find('.h5p-dialogcards-card-text-area').focus();
    }, C.NB200);

    let $nextCard = self.$current.next('.h5p-dialogcards-cardwrap');
    if (
      self.params.behaviour.enableRetry &&
      $nextCard.length === 0 &&
      !this.enableGotIt
    ) {
      self.resetButtons('retry button');
    }
    if (this.endOfStack) {
      self.updateNavigation();
    }
  };

  /**
   * Change text of card, used when turning cards.
   * @param {object} [$card] Current card
   * @param {string}text Current card text
   */
  C.prototype.changeText = function ($card, text) {
    let $cardText = $card.find('.h5p-dialogcards-card-text-area');
    $cardText.html(text);
    $cardText.toggleClass('hide', !text || !text.length);
  };

  /**
   * Stop audio of card with cardindex
   * @param {number} cardIndex Index of card
   */
  C.prototype.stopAudio = function (cardIndex) {
    let self = this;
    let audio = self.audios[cardIndex];
    if (audio && audio.stop) {
      audio.stop();
    }
    let audio2 = self.audios2[cardIndex];
    if (audio2 && audio2.stop) {
      audio2.stop();
    }
  };

  /**
   * Reset audio of card with cardindex
   * @param {number} cardIndex Index of card
   */
  C.prototype.resetAudio = function (cardIndex) {
    let self = this;
    let audio = self.audios[cardIndex];
    if (audio && audio.stop) {
      audio.stop();
      audio.seekTo(0);
    }
    let audio2 = self.audios2[cardIndex];
    if (audio2 && audio2.stop) {
      audio2.stop();
      audio2.seekTo(0);
    }
  };

  /**
   // hide and show audio not used in papi Jo version
   /**
    Hide audio button
   * @param $card
   */

  C.prototype.removeAudio = function ($card) {
    let self = this;
    self.stopAudio($card.closest('.h5p-dialogcards-cardwrap').index());
    $card.find('.h5p-audio-inner').addClass('hide');
  };

  C.prototype.showAllAudio = function () {
    let self = this;
    self.$cardwrapperSet.find('.h5p-audio-inner').removeClass('hide');
  };

  /**
   * Reset the task so that the user can re-start from first card.
   */
  C.prototype.retry = function () {
    let self = this;
    let $card = $(this);
    // To hide the summary text upon retrying
    if (this.noText || this.frontTextBackImage) {
      $card.find('.h5p-dialogcards-card-text-wrapper').addClass('hide');
    }
    // In case a dark background was set for the cards.
    $card
      .find('.h5p-dialogcards-card-content')
      .removeClass('h5p-dialogcards-summary-screen');
    self.stopAudio(self.$current.index());
    if (!this.enableGotIt) {
      this.taskFinished = true;
      let $cards = self.$inner.find('.h5p-dialogcards-cardwrap');
      $cards.each(function (index) {
        self.resetAudio(index);
        if (this.repetition) {
          self.removeClass('h5p-dialogcards-noMatch');
        }
      });

      self.resetTask();

      // Needed to re-start on first card if user saved state at another card.
      this.progress = 0;
      return;
    }
    if (this.enableGotIt) {
      let $cards = self.$inner.find('.h5p-dialogcards-cardwrap');
      $cards.each(function (index) {
        let $card = $(this);
        const $answerButtons = $card.find('.h5p-dialogcards-answer-button');
        $answerButtons
          .removeClass('h5p-dialogcards-quick-progression')
          .prop('disabled', true);
      });
    }
    if (
      this.taskFinished &&
      this.playModeUser !== 'normalMode' &&
      this.playModeUser !== 'browseSideBySide'
    ) {
      self.finishedScreen();
    }
    else {
      // Do not increase nb of rounds if task is finished, causes bug in Interactive Book.
      this.currentRound++;
    }
    this.endOfStack = 0;
    this.nbCardsInCurrentRound = this.incorrect;
    this.correct = 0;
    this.incorrect = 0;
    this.$progress.removeClass('h5p-dialogcards-hide');

    if (this.lastCardIndex) {
      // Now remove the current 'gotitdone' card from the cards and cardOrder arrays.
      self.currentDialogs.splice(this.lastCardIndex, 1);
      if (!$.isEmptyObject(this.cardOrder)) {
        self.cardOrder.splice(this.lastCardIndex, 1);
      }
      // TODO JR not sure this is actually used!
      if (!self.params.behaviour.scaleTextNotCard) {
        self.cardSizeDetermined.splice(this.lastCardIndex + C.NB2, 1);
      }
      // Remove the 'gotitdone' card from DOM
      $('.h5p-dialogcards-gotitdone', self.$inner).remove();

      this.lastCardIndex = 0;
    }
    let $cards = self.$inner.find('.h5p-dialogcards-cardwrap');
    self.stopAudio(self.$current.index());
    self.$current.removeClass('h5p-dialogcards-current');
    self.$current = $cards.filter(':first').addClass('h5p-dialogcards-current');

    self.updateNavigation();
    // audio buttons
    let paused = 'h5p-audio-minimal-play-paused';
    let play = 'h5p-audio-minimal-play';

    $cards.each(function (index) {
      let $card = $(this).removeClass(
        'h5p-dialogcards-previous h5p-dialogcards-turned',
      );
      if (!this.noText) {
        self.changeText($card, self.currentDialogs[$card.index()].text);
      }
      let $cardContent = $card.find('.h5p-dialogcards-card-content');
      // Show all front images (ci) and hide all back images (ci2)
      let $ci = $card.find('.h5p-dialogcards-image');
      let $ci2 = $card.find('.h5p-dialogcards-image2');

      if (self.cardsSideMode === 'backFirst') {
        if (self.hasTwoImages) {
          $ci.removeClass('h5p-dialogcards-hide');
          $ci2.addClass('h5p-dialogcards-hide');
        }
        else {
          $ci2.removeClass('h5p-dialogcards-hide');
        }
      }
      else {
        $ci.removeClass('h5p-dialogcards-hide');
        $ci2.addClass('h5p-dialogcards-hide');
      }
      // Show all front audios (ca) and hide all back audios (ca2)
      let $ca = $card.find('.h5p-dialogcards-audio-wrapper');
      let $ca2 = $card.find('.h5p-dialogcards-audio-wrapper2');
      $ca.removeClass('hide');
      $ca2.addClass('hide');
      self.resetAudio(index);
      $cardContent.removeClass('h5p-dialogcards-turned');
      self.addTipToCard($cardContent, 'front', index);

      // In case it was hidden on the summary screen.
      $card
        .find('.h5p-dialogcards-image-wrapper')
        .removeClass('h5p-dialogcards-hide');
      $card
        .find('.h5p-dialogcards-card-text')
        .removeClass('hide');

      if (self.frontTextBackImage) {
        const showText = self.cardsSideMode === 'frontFirst';
        $card
          .find('.h5p-dialogcards-image-wrapper')
          .toggleClass('hide', showText);
        $card
          .find('.h5p-dialogcards-card-text-wrapper')
          .toggleClass('hide', !showText);
      }

    });
    // hide and show audio not used in papi Jo version BUT SHOULD DO A GENERAL RESET OF ALL AUDIO BUTTONS upon retry
    self.resizeOverflowingText();
    self.setCardFocus(self.$current);
    self.$current
      .find('.h5p-dialogcards-answer-button')
      .removeClass('h5p-dialogcards-disabled');
    self.resetButtons('restart');
  };

  /**
   * Reset the task so that the user can re-start from first card.
   */
  C.prototype.retryRepetition = function () {
    let self = this;
    let $card = $(this);
    // Now remove the current 'gotitdone' card from the cards and cardOrder arrays.
    let index = this.lastCardIndex;
    self.currentDialogs.splice(index, 1);
    if (!$.isEmptyObject(this.cardOrder)) {
      self.cardOrder.splice(index, 1);
    }

    // Remove the 'gotitdone' card from DOM
    $('.h5p-dialogcards-gotitdone', self.$inner).remove();
    this.cardsLeft = this.incorrect;

    // In case a dark background was set for the cards.
    $card
      .find('.h5p-dialogcards-card-content')
      .removeClass('h5p-dialogcards-summary-screen');

    self.stopAudio(self.$current.index());
    if (this.taskFinished) {
      self.finishedScreen();
    }

    this.currentRound++;
    this.endOfStack = 0;
    this.nbCardsInCurrentRound = this.incorrect;
    this.correct = 0;
    this.incorrect = 0;
    this.noMatchCards = [];
    this.$progress.removeClass('h5p-dialogcards-hide');
    let $cards = self.$inner.find('.h5p-dialogcards-cardwrap');

    self.$current = $cards.filter(':first').addClass('h5p-dialogcards-current');
    self.$current.addClass('h5p-dialogcards-match-right');
    // audio buttons
    let paused = 'h5p-audio-minimal-play-paused';
    let play = 'h5p-audio-minimal-play';
    $cards.each(function (index) {
      let $card = $(this).removeClass(
        'h5p-dialogcards-previous h5p-dialogcards-noMatch',
      );

      // Show all front audios (ca) and hide all back audios (ca2)
      let $ca = $card.find('.h5p-dialogcards-audio-wrapper');
      $ca.removeClass('hide');
      self.resetAudio(index);
      $card
        .find('.h5p-audio-minimal-button')
        .toggleClass('paused play');
      // In case it was hidden on the summary screen.
      $card
        .find('.h5p-dialogcards-image-wrapper')
        .removeClass('h5p-dialogcards-hide');
    });
    // hide and show audio not used in papi Jo version BUT SHOULD DO A GENERAL RESET OF ALL AUDIO BUTTONS upon retry
    // cardsLeft ****************************************************************************
    $cards = self.$inner.find('.h5p-dialogcards-cardwrap-left');
    let x = Math.floor(Math.random() * $cards.length);
    $cards.each(function (index) {
      let $card = $(this).removeClass('h5p-dialogcards-noMatch');
      $card.addClass('h5p-dialogcards-cardwrap-left-repetition');
      if (index === x) {
        $card.addClass('h5p-dialogcards-current-left');
      }
    });

    self.resizeOverflowingText();
    self.setCardFocus(self.$current);
    self.$currentLeft = self.$inner.find('.h5p-dialogcards-current-left');
    this.$progressFooterLeft.removeClass('h5p-dialogcards-hide');
    self.updateNavigation();
    self.resetButtons('restart');
  };

  /**
   * Update the dimensions of the task when resizing the task.
   */
  C.prototype.resize = function () {
    let self = this;
    let maxHeight = 0;
    
    // To prevent error inside Interactive Book PapiJo.
    // also to prevent infinite vertical scrolling upon resize in MS-Edge and Chrome navigators.
    if (this.taskFinished || this.issetHeight) {
      return;
    }
    self.updateImageSize();
    if (!self.params.behaviour.scaleTextNotCard) {
      self.determineCardSizes();
    }
    
    // Reset card-wrapper-set height
    self.$cardwrapperSet.css('height', 'auto');

    //Find max required height for all cards
    self.$cardwrapperSet.children().each(function () {
      let wrapperHeight = $(this).css('height', 'initial').outerHeight();
      $(this).css('height', 'inherit');
      maxHeight = wrapperHeight > maxHeight ? wrapperHeight : maxHeight;

      // Check height
      if (!$(this).next('.h5p-dialogcards-cardwrap').length) {
        let initialHeight = $(this)
          .find('.h5p-dialogcards-cardholder')
          .outerHeight();
        maxHeight = initialHeight > maxHeight ? initialHeight : maxHeight;
      }
    });

    let relativeMaxHeight =
      maxHeight / parseFloat(self.$cardwrapperSet.css('font-size'));
    self.$cardwrapperSet.css('height', `${relativeMaxHeight}em`);

    // Set fixed pixel height
    self.$cardwrapperSet.css('height', `${Math.ceil(maxHeight)}px`);

    self.scaleToFitHeight();
    if (!this.$retry) {
      self.truncateRetryButton();
    }
    if (this.playModeUser === 'selfCorrectionMode') {
      self.truncateAnswerButtons();
    }

    self.resizeOverflowingText();
    this.issetHeight = true;
  };
  

  /**
   * Resizes each card to fit its text
   */
  C.prototype.determineCardSizes = function () {
    let self = this;

    if (
      self.cardSizeDetermined === undefined ||
      (this.repetition && this.contentData.previousState)
    ) {
      // Keep track of which cards we've already determined size for
      // JR empty this array if this.repetition && this.contentData.previousState otherwise hard to reset it
      // not a nice workaround but...
      self.cardSizeDetermined = [];
    }

    // Go through each card
    self.$cardwrapperSet.children(':visible').each(function (i) {
      if (self.cardSizeDetermined.indexOf(i) !== -1) {
        return; // Already determined, no need to determine again.
      }
      self.cardSizeDetermined.push(i);

      let $content = $('.h5p-dialogcards-card-content', this);
      let $text = $('.h5p-dialogcards-card-text-inner-content', $content);

      // Grab size with text
      let textHeight = $text[0].getBoundingClientRect().height;

      // Change to answer
      if (!self.matchIt) {
        if (!this.noText) {
          self.changeText($content, self.currentDialogs[i].answer);
        }
      }

      // Grab size with answer
      let answerHeight = $text[0].getBoundingClientRect().height;

      // Use highest
      let useHeight = textHeight > answerHeight ? textHeight : answerHeight;

      // Min. limit
      let minHeight = parseFloat($text.parent().parent().css('minHeight'));
      if (useHeight < minHeight) {
        useHeight = minHeight;
      }

      // Convert to em
      let fontSize = parseFloat($content.css('fontSize'));
      useHeight /= fontSize;

      // Set height
      $text.parent().css('height', `${useHeight}em`);

      // Change back to text
      if (!self.matchIt) {
        if (!this.noText) {
          self.changeText($content, self.currentDialogs[i].text);
        }
      }
    });
  };

  C.prototype.scaleToFitHeight = function () {
    let self = this;

    if (
      !self.$cardwrapperSet ||
      !self.$cardwrapperSet.is(':visible') ||
      !self.params.behaviour.scaleTextNotCard
    ) {
      return;
    }
    // Resize font size to fit inside CP
    if (self.$inner.parents('.h5p-course-presentation').length) {
      let $parentContainer = self.$inner.parent();
      if (self.$inner.parents('.h5p-popup-container').length) {
        $parentContainer = self.$inner.parents('.h5p-popup-container');
      }
      let containerHeight = $parentContainer
        .get(0)
        .getBoundingClientRect().height;
      let getContentHeight = function () {
        let contentHeight = 0;
        self.$inner.children().each(function () {
          contentHeight +=
            $(this).get(0).getBoundingClientRect().height +
            parseFloat($(this).css('margin-top')) +
            parseFloat($(this).css('margin-bottom'));
        });
        return contentHeight;
      };
      let contentHeight = getContentHeight();
      let parentFontSize = parseFloat(self.$inner.parent().css('font-size'));
      let newFontSize = parseFloat(self.$inner.css('font-size'));

      // Decrease font size
      if (containerHeight < contentHeight) {
        while (containerHeight < contentHeight) {
          newFontSize -= C.SCALEINTERVAL;
          // Cap at min font size
          if (newFontSize < C.MINSCALE) {
            break;
          }
          // Set relative font size to scale with full screen.
          self.$inner.css('font-size', `${newFontSize / parentFontSize}em`);
          contentHeight = getContentHeight();
        }
      }
      else {
        // Increase font size
        let increaseFontSize = true;
        while (increaseFontSize) {
          newFontSize += C.SCALEINTERVAL;
          // Cap max font size
          if (newFontSize > C.MAXSCALE) {
            increaseFontSize = false;
            break;
          }
          // Set relative font size to scale with full screen.
          let relativeFontSize = newFontSize / parentFontSize;
          self.$inner.css('font-size', `${relativeFontSize}em`);
          contentHeight = getContentHeight();
          if (containerHeight <= contentHeight) {
            increaseFontSize = false;
            relativeFontSize = (newFontSize - C.SCALEINTERVAL) / parentFontSize;
            self.$inner.css('font-size', `${relativeFontSize}em`);
          }
        }
      }
    }
    else {
      // Resize mobile view
      self.resizeOverflowingText();
    }
  };

  /**
   * Resize the font-size of text areas that tend to overflow when dialog cards
   * is squeezed into a tiny container.
   */
  C.prototype.resizeOverflowingText = function () {
    let self = this;
    let $textContainer;
    let $text;
    if (
      !self.params.behaviour.scaleTextNotCard ||
      self.$current === undefined
    ) {
      return; // No text scaling today
    }
    // Resize card text if needed
    $textContainer = self.$current.find('.h5p-dialogcards-card-text');
    $text = $textContainer.children();
    self.resizeTextToFitContainer($textContainer, $text);
    if (this.matchIt && self.$currentLeft) {
      let $currentLeft = self.$currentLeft;
      $textContainer = $currentLeft.find('.h5p-dialogcards-card-text');
      $text = $textContainer.children();
      self.resizeTextToFitContainer($textContainer, $text);
    }
  };

  /**
   * Increase or decrease font size so text wil fit inside container.
   * @param {HTMLElement} $textContainer Outer container, must have a set size.
   * @param {HTMLElement} $text Inner text container
   */
  C.prototype.resizeTextToFitContainer = function ($textContainer, $text) {
    let self = this;
    // Final feedback screen, text container has been emptied.
    if ($textContainer.get(0) === undefined) {
      return;
    }

    // Reset text size
    $text.css('font-size', '');
    // Measure container and text height
    let currentTextContainerHeight = $textContainer
      .get(0)
      .getBoundingClientRect().height;
    let currentTextHeight = $text.get(0).getBoundingClientRect().height;
    let parentFontSize = parseFloat($textContainer.css('font-size'));
    let fontSize = parseFloat($text.css('font-size'));
    let mainFontSize = parseFloat(self.$inner.css('font-size'));

    // Decrease font size
    if (currentTextHeight > currentTextContainerHeight) {
      let decreaseFontSize = true;
      while (decreaseFontSize) {
        fontSize -= C.SCALEINTERVAL;
        if (fontSize < C.MINSCALE) {
          decreaseFontSize = false;
          break;
        }
        // JR added 0.4 em to make reduced font size not so reduced.
        $text.css('font-size', `${fontSize / parentFontSize + C.NB04}em`);
        currentTextHeight = $text.get(0).getBoundingClientRect().height;
        if (currentTextHeight <= currentTextContainerHeight) {
          decreaseFontSize = false;
        }
      }
    }
    else {
      // Increase font size
      let increaseFontSize = true;
      while (increaseFontSize) {
        fontSize += C.SCALEINTERVAL;

        // Cap at  16px
        if (fontSize > mainFontSize) {
          increaseFontSize = false;
          break;
        }

        // Set relative font size to scale with full screen.
        $text.css('font-size', `${fontSize / parentFontSize}em`);
        currentTextHeight = $text.get(0).getBoundingClientRect().height;
        if (currentTextHeight >= currentTextContainerHeight) {
          increaseFontSize = false;
          fontSize = fontSize - C.SCALEINTERVAL;
          $text.css('font-size', `${fontSize / parentFontSize}em`);
        }
      }
    }
  };

  /**
   * Set focus to a given card
   * @param {object} $card Card that should get focus
   */
  C.prototype.setCardFocus = function ($card) {
    // Wait for transition, then set focus
    $card.one('transitionend', function () {
      $card.find('.h5p-dialogcards-card-text-area').focus();
    });
  };

  /**
   * Truncate retry button if width is small.
   */
  C.prototype.truncateRetryButton = function () {
    let self = this;
    if (!self.$retry) {
      return;
    }

    // Reset button to full size
    self.$retry.removeClass('truncated');
    self.$retry.html(
      this.params.nextRound.replace('@round', this.currentRound),
    );

    // Measure button
    const maxWidthPercentages = 0.3;
    let retryWidth =
      self.$retry.get(0).getBoundingClientRect().width +
      parseFloat(self.$retry.css('margin-left')) +
      parseFloat(self.$retry.css('margin-right'));
    let retryWidthPercentage =
      retryWidth / self.$retry.parent().get(0).getBoundingClientRect().width;
    // Truncate button
    if (retryWidthPercentage > maxWidthPercentages) {
      self.$retry.addClass('truncated');
      self.$retry.html('');
    }
  };

  /**
   * Truncate "got it right/wrong" buttons if width is small, e.g. on smartphones.
   * This will simply enable or disable their HTML text.
   */
  C.prototype.truncateAnswerButtons = function () {
    let self = this;
    // Reset html text
    let $answerButtonCorrect = self.$inner.find(
      '.h5p-dialogcards-answer-button.correct',
    );

    $answerButtonCorrect.html(this.params.correctAnswer);

    let $answerButtonInCorrect = self.$inner.find(
      '.h5p-dialogcards-answer-button.incorrect',
    );
    $answerButtonInCorrect.html(this.params.incorrectAnswer);
    // Truncate button
    // Supposed to be a smartphone
    let w = $(window).width();
    if (w < C.NB400) {
      $answerButtonCorrect.html('');
      $answerButtonInCorrect.html('');
    }
  };

  /**
   * Task is finished.
   */

  C.prototype.finishedScreen = function () {
    let self = this;
    self.taskFinished = true;
    self.answered = true;
    self.progress = -1;
    self.progressLeft = -1;
    let penalty;
    let selectedCards = this.nbCardsSelected;
    this.maxScore = selectedCards;
    let actualScore = this.maxScore;
    self.$progress
      .addClass('h5p-dialogcards-hide');
    if (this.enableGotIt || this.repetition) {
      if (this.currentRound > 1) {
        penalty = this.params.behaviour.penalty;
        if (penalty !== undefined || penalty > 0) {
          let penalty = this.params.behaviour.penalty / 100;
          let nbRounds = this.currentRound;
          for (let i = 0; i < nbRounds - 1; i++) {
            actualScore = actualScore - actualScore * penalty;
          }
        }
        else {
          penalty = 0;
        }
      }
    }
    else if (this.matchIt && !this.repetition) {
      actualScore =
        ((this.nbCardsSelected - this.incorrect) / this.nbCardsSelected) *
        this.maxScore;
      if (actualScore < 0) {
        actualScore = 0;
      }
    }
    // Rounded result.
    actualScore = Math.round(actualScore);

    this.actualScore = actualScore;
    if (
      this.playModeUser === 'normalMode' ||
      this.playModeUser === 'browseSideBySide'
    ) {
      return;
    }

    // Remove all these elements.
    $(
      '.h5p-dialogcards-cardwrap-set, .h5p-dialogcards-match-footer, .h5p-dialogcards-footer,' +
        ' .h5p-dialogcards-options, .h5p-options-title',
      self.$inner,
    ).remove();

    // Display task finished feedback message.

    let $feedback = $('<div>', {
      class:
        'h5p-dialogcards-summary-screen h5p-dialogcards-final-summary-screen',
    }).appendTo(self.$inner);
    let rounds = self.params.rounds;
    rounds.replace('@rounds', this.currentRound.toString());

    // Feedback text

    let totalCards = self.params.dialogs.length;
    let summary = self.params.summary;
    let thisRound = this.currentRound;
    let overallScore = self.params.summaryOverallScore;
    let cardsSelected = self.params.summaryCardsSelected;
    let cardsCompleted = self.params.summaryCardsCompleted;
    let completedRounds = self.params.summaryCompletedRounds;
    let selectedMessage = '';
    if (selectedCards !== totalCards) {
      selectedMessage =
        `<td class="h5p-dialogcards-summary-table-row-category">${
          cardsSelected
        }<td>&nbsp;</td>` +
        `<td class="h5p-dialogcards-summary-table-row-score">${
          selectedCards
        }&nbsp;<span class="h5p-dialogcards-summary-table-row-score-divider">/</span>&nbsp;${
          totalCards
        }</td></tr>`;
      totalCards = selectedCards;
    }

    let text1 =
      `<div class="h5p-dialogcards-summary-header">${summary}</div>` +
      `<div class="h5p-dialogcards-summary-subheader">${overallScore}</div>` +
      '<table class="h5p-dialogcards-summary-table">' +
      `<tr>${selectedMessage}`;

    let allDone = '';
    let text2;
    if (this.enableGotIt || this.repetition) {
      if (this.actualScore === this.maxScore) {
        allDone = self.params.summaryAllDone.replace('@cards', totalCards);
      }
      text2 =
        `<td class="h5p-dialogcards-summary-table-row-category">${cardsCompleted}</td>` +
        '<td class="h5p-dialogcards-summary-table-row-symbol h5p-dialogcards-check">&nbsp;</td>' +
        `<td class="h5p-dialogcards-summary-table-row-score">${
          totalCards
        }&nbsp;<span class="h5p-dialogcards-summary-table-row-score-divider">/</span>&nbsp;${
          totalCards
        }</td></tr>` +
        `<tr><td class="h5p-dialogcards-summary-table-row-category">${completedRounds}</td>` +
        '<td class="h5p-dialogcards-summary-table-row-symbol"></td>' +
        `<td class="h5p-dialogcards-summary-table-row-score">${thisRound}</td></tr>`;
    }
    else if (this.matchIt && !this.repetition) {
      if (this.actualScore === this.maxScore) {
        allDone = self.params.summaryMatchesAllDone;
      }
      text2 =
        `<td class="h5p-dialogcards-summary-table-row-category">${self.params.summaryMatchesFound}</td>` +
        '<td class="h5p-dialogcards-summary-table-row-symbol h5p-dialogcards-check">&nbsp;</td>' +
        `<td class="h5p-dialogcards-summary-table-row-score">${
          this.correct
        }<tr><td class="h5p-dialogcards-summary-table-row-category">${
          self.params.summaryMatchesNotFound
        }</td>` +
        '<td class="h5p-dialogcards-summary-table-row-symbol h5p-dialogcards-times">&nbsp;</td>' +
        `<td class="h5p-dialogcards-summary-table-row-score">${this.incorrect}</td></tr>`;
    }
    let text3 =
      '</table>' +
      `<div class="h5p-dialogcards-summary-message">${allDone}</div>`;
    let text = text1 + text2 + text3;

    $('<div>', {
      class: 'h5p-dialogcards-cardwrap-set ',
      html: text,
    }).appendTo($feedback);

    let $feedbackFooter = $('<div>', {
      class: 'h5p-dialogcards-cardwrap-set ',
    }).appendTo($feedback);
    this.helpText = '';

    let explainScore = '';
    if (this.enableGotIt || this.repetition) {
      if (thisRound !== 1 && penalty) {
        explainScore = self.params.explainScoreGotIt.replace(
          '@penalty',
          self.params.behaviour.penalty,
        );
      }
    }
    else if (this.matchIt) {
      if (this.incorrect) {
        explainScore = self.params.explainScoreMatch;
      }
    }
    let scoreExplanationButtonLabel = self.params.scoreExplanationButtonLabel;
    let label = scoreExplanationButtonLabel;
    this.helpText = explainScore;
    const scoreBar = JoubelUI.createScoreBar(
      this.maxScore,
      label,
      this.helpText,
      scoreExplanationButtonLabel,
    );
    scoreBar.setScore(actualScore);
    scoreBar.appendTo($feedbackFooter);

    $('<div>', {
      class: 'h5p-dialogcards-cardwrap-set ',
      html: scoreBar,
    }).appendTo($feedback);

    // We only trigger XAPI at the end of the activity
    this.endTime = new Date().getTime();
    self.triggerAnswered();

    // Display reset button to enable user to do the task again IF Retry option enabled.
    if (this.$progressTop) {
      this.$progressTop
        .addClass('h5p-dialogcards-hide');
    }
    if (self.params.behaviour.enableRetry) {
      const retryOrReset = self.getRetryOrReset();
      let message = retryOrReset[0];
      let thisclass = retryOrReset[1];
      self.$retryButton = createButton({
        class: thisclass,
        label: message,
        styleType: 'secondary',
        icon: 'retry',
      })
        .click(() => {
          self.resetTask();
        })
        .appendTo($feedbackFooter);
    }
  };

  /**
   * Remove card from DOM and from cards stack after user has checked the "gotit" button.
   */

  C.prototype.gotItCorrect = function ($card) {
    let self = this;
    let index = $card.index();
    this.endOfStack = 0;
    this.correct++;
    let audioIndex = self.nbCards - self.currentDialogs.length;
    self.stopAudio(audioIndex);

    // Mark current card with a 'gotitdone' class.
    self.$current.addClass('h5p-dialogcards-gotitdone');

    // Move to next card if exists.
    let $nextCard = self.$current.next('.h5p-dialogcards-cardwrap');
    let $prevCard = self.$current.prev('.h5p-dialogcards-cardwrap');

    if ($nextCard.length) {
      self.nextCard();
      self.resetButtons('answer buttons');
    }
    else if ($prevCard.length) {
      // No next card left - go to previous.
      this.lastCardIndex = index;
      this.endOfStack = 1;
      self.updateNavigation();
      this.endOfStack = 0;
      self.resetButtons('retry button');

      return;
    }
    else {
      // No cards left: task is finished.
      self.resetButtons('finished button');
      return;
    }

    // Now remove the current 'gotitdone' card from the cards and cardOrder arrays.
    self.currentDialogs.splice(index, 1);
    if (!$.isEmptyObject(this.cardOrder)) {
      self.cardOrder.splice(index, 1);
    }
    if (!self.params.behaviour.scaleTextNotCard) {
      self.cardSizeDetermined.splice(index + C.NB2, 1);
    }
    // Remove the 'gotitdone' card from DOM
    $('.h5p-dialogcards-gotitdone', self.$inner).remove();
    // Update navigation
    self.updateNavigation();
  };

  C.prototype.matchCards = function ($card) {
    let self = this;
    for (let i = 0; i < self.nbCards + 1; i++) {
      self.resetAudio(i);
    }

    const delayInMilliseconds = 2000;
    let index = $card.index() / C.NB2;
    let $leftCard = self.$currentLeft;
    let indexLeft = ($leftCard.index() - 1) / C.NB2;

    let $correctButton = $card.find('.h5p-dialogcards-match-correct');
    let $incorrectButton = $card.find('.h5p-dialogcards-match-incorrect');
    let $matchButton = $card.find('.h5p-dialogcards-button-match');

    if (index === indexLeft) {
    // De-activate all buttons during the Timeout if match-correct
      $matchButton
        .addClass('h5p-dialogcards-disabled');
      self.$next.toggleClass('h5p-dialogcards-inactive');
      self.$prev.toggleClass('h5p-dialogcards-inactive');
      this.correct++;
      $matchButton.addClass('h5p-dialogcards-disabled');
      $correctButton.toggleClass('h5p-dialogcards-disabled');
      self.$current.addClass('h5p-dialogcards-gotitdone');
      $leftCard.addClass('h5p-dialogcards-gotitdone');
      let $parentSet = self.$current.parent('.h5p-dialogcards-cardwrap-set');

      setTimeout(function () {
        self.nextCardLeft();
        self.resizeOverflowingText();
        $correctButton.toggleClass('h5p-dialogcards-disabled');
        let $matchButton = $card.find('h5p-theme-flip');
        $matchButton.addClass('h5p-dialogcards-disabled');
        self.$next.toggleClass('h5p-dialogcards-inactive');
        self.$prev.toggleClass('h5p-dialogcards-inactive');
        self.$current
          .removeClass('h5p-dialogcards-current h5p-dialogcards-match-right')
          .addClass('h5p-dialogcards-previous');
        // Remove the 'gotitdone' card from DOM
        $('.h5p-dialogcards-gotitdone', self.$inner).remove();
        // SEP 2021
        self.$current = $parentSet.find('.h5p-dialogcards-cardwrap').first();
        self.$current.addClass(
          'h5p-dialogcards-current h5p-dialogcards-match-right',
        );
        self.updateNavigation();
      }, delayInMilliseconds);

      // Now remove the current 'gotitdone' card from the cards and cardOrder arrays.
      self.currentDialogs.splice(index, 1);
      if (!$.isEmptyObject(this.cardOrder)) {
        self.cardOrder.splice(index, 1);
      }
      if (!self.params.behaviour.scaleTextNotCard) {
        self.cardSizeDetermined.splice(index + C.NB2, 1);
      }
    }
    else {
      this.incorrect++;
      $matchButton.addClass('h5p-dialogcards-disabled');
      $incorrectButton.toggleClass('h5p-dialogcards-disabled');
      // Set the next & prev buttons to blinking to attract student's attention.
      self.$next.addClass('blinking-button');
      self.$prev.addClass('blinking-button');
    }

    // No cards left in stack. End game.
    if (self.currentDialogs.length === 0) {
      setTimeout(function () {
        self.finishedScreen();
      }, delayInMilliseconds);
    }
  };


  C.prototype.matchCardsRepetition = function ($card) {
    let self = this;
    for (let i = 0; i < self.nbCards + 1; i++) {
      self.resetAudio(i);
    }
    const delayInMilliseconds = 2000; // Make it a parameters setting?
    let index = $card.index() / C.NB2;
    let $leftCard = self.$currentLeft;
    let indexLeft = ($leftCard.index() - 1) / C.NB2;

    // De-activate all buttons during the Timeout.
    let $correctButton = $card.find('.h5p-dialogcards-match-correct');
    let $incorrectButton = $card.find('.h5p-dialogcards-match-incorrect');


    let $matchButton = $card.find('.h5p-dialogcards-button-match');
    $matchButton.toggleClass('h5p-dialogcards-disabled');
    self.$next.toggleClass('h5p-dialogcards-inactive');
    self.$prev.toggleClass('h5p-dialogcards-inactive');
    this.cardsLeft--;
    if (index === indexLeft) {
      // We have a match.
      this.correct++;
    }
    else {
      // No match.
      this.incorrect++;
    }
    let $parentSet = self.$current.parent('.h5p-dialogcards-cardwrap-set');
    let $cards = $parentSet.find('.h5p-dialogcards-cardwrap');

    if (this.cardsLeft !== 0) {
      if (index === indexLeft) {
        // We have a match.
        $matchButton.addClass('h5p-dialogcards-disabled');
        self.$buttonMatch.addClass('h5p-dialogcards-disabled');
        $correctButton
          .removeClass('h5p-dialogcards-disabled');
        $incorrectButton
          .addClass('h5p-dialogcards-disabled');
        let correctClasses = $correctButton.attr('class');
        self.$current.addClass('h5p-dialogcards-gotitdone');

        setTimeout(function () {
          self.nextCardLeftRepetition();
          self.resizeOverflowingText();
          let $cardLeft = self.$currentLeft.find(
            '.h5p-dialogcards-card-content.h5p-dialogcards-matchLeft',
          );
          $leftCard.addClass('h5p-dialogcards-gotitdone');
          $leftCard.removeClass(
            'h5p-dialogcards-cardwrap-left-repetition h5p-dialogcards-current-left',
          );
          if (this.cardsSideMode === 'frontFirst') {
            let $ci2 = $cardLeft.find('.h5p-dialogcards-image2');
            $ci2.addClass('h5p-dialogcards-hide');
          }
          $correctButton.addClass('h5p-dialogcards-disabled');
          let correctClasses = $correctButton.attr('class');
          self.$next.toggleClass('h5p-dialogcards-inactive');
          self.$prev.toggleClass('h5p-dialogcards-inactive');
          self.$current.removeClass(
            'h5p-dialogcards-current h5p-dialogcards-match-right',
          );

          // Remove the 'gotitdone' card from DOM
          $('.h5p-dialogcards-gotitdone', self.$inner).remove();

          // SEP. 2021
          self.$current = $parentSet.find('.h5p-dialogcards-cardwrap').first();
          while (self.$current.hasClass('h5p-dialogcards-noMatch')) {
            self.$current = self.$current
              .nextAll('.h5p-dialogcards-cardwrap')
              .eq(0);
          }
          self.$current.addClass(
            'h5p-dialogcards-current h5p-dialogcards-match-right',
          );
          let $nextCard = self.$current.next('.h5p-dialogcards-cardwrap');
          if ($nextCard.length) {
            self.nextCard();
          }
          self.updateNavigation();
        }, delayInMilliseconds);

        // Now remove the current 'gotitdone' card from the cards and cardOrder arrays.
        self.currentDialogs.splice(index, 1);
        if (!$.isEmptyObject(this.cardOrder)) {
          self.cardOrder.splice(index, 1);
        }
        if (!$.isEmptyObject(this.cardOrder)) {
          this.noMatchCards.splice(index, 1);
        }
        if (!self.params.behaviour.scaleTextNotCard) {
          self.cardSizeDetermined.splice(index + C.NB2, 1);
        }
      }
      else {
        // We don't have a match
        // Find the matching right card from stack of cards
        $cards = self.$inner.find('.h5p-dialogcards-cardwrap');
        let $matchingRightCard;
        $cards.each(function (index) {
          if (index === indexLeft) {
            $matchingRightCard = $(this);
            return false; // break
          }
        });
        $matchingRightCard.addClass('h5p-dialogcards-noMatch');
        $matchingRightCard.removeClass(
          'h5p-dialogcards-previous h5p-dialogcards-current h5p-dialogcards-match-right',
        );
        $matchButton.addClass('h5p-dialogcards-disabled');
        $incorrectButton.toggleClass('h5p-dialogcards-disabled');
        $correctButton
          .addClass('h5p-dialogcards-disabled');
        this.noMatchCards[indexLeft] = 1;
        setTimeout(function () {
          $leftCard
            .addClass('h5p-dialogcards-noMatch')
            .removeClass('h5p-dialogcards-current-left');
          $leftCard.removeClass(
            'h5p-dialogcards-cardwrap-left-repetition h5p-dialogcards-current-left',
          );
          $incorrectButton.toggleClass('h5p-dialogcards-disabled');
          self.$next.toggleClass('h5p-dialogcards-inactive');
          self.$prev.toggleClass('h5p-dialogcards-inactive');
          $matchButton.removeClass('h5p-dialogcards-disabled');
          self.nextCardLeftRepetition(); // ???
          self.updateNavigation(); // line 1228
        }, delayInMilliseconds);
      }
    }

    // No cards left in stack. End game or end round.
    if (this.cardsLeft === 0) {
      self.getCurrentState();
      this.$buttonMatch.addClass('h5p-dialogcards-disabled');
      self.$prev.addClass('h5p-dialogcards-inactive');
      let correctClasses = $correctButton.attr('class');
      $correctButton
        .removeClass('h5p-dialogcards-disabled');
      correctClasses = $correctButton.attr('class');
      // WARNING! do not use 'this' inside a setTimeout function; use 'self' !
      setTimeout(function () {
        $correctButton.addClass('h5p-dialogcards-disabled');
        let correctClasses = $correctButton.attr('class');
        self.$current
          .addClass('h5p-dialogcards-gotitdone')
          .removeClass('h5p-dialogcards-noMatch');
        self.$next.toggleClass('h5p-dialogcards-inactive');
        self.$prev.toggleClass('h5p-dialogcards-inactive');
        self.$prev.addClass('h5p-visibility-hidden');
        $leftCard.remove();
        if (self.incorrect === 0) {
          self.resetButtons('finished button');
        }
        else {
          self.lastCardIndex = index;
          self.lastCardIndex = self.noMatchCards.indexOf(0);
          $matchButton.addClass('h5p-dialogcards-disabled');
          self.resetButtons('retry button');
          $matchButton.addClass('h5p-dialogcards-disabled');
        }
      }, delayInMilliseconds);
    }
  };

  /**
   * Resets the task.
   * Used in contracts. Used upon Restart in Interactive Book!
   */

  C.prototype.resetTask = function () {
    if (this.report !== '') {
      return;
    }
    this.issetHeight = false;
    const self = this;
    this.contentData.previousState = {};
    self.answered = false;
    this.actualScore = 0;
    this.cardsLeft = self.params.dialogs.length;
    this.currentRound = 1;
    this.correct = 0;
    this.incorrect = 0;
    this.$current = undefined;
    self.currentDialogs = structuredClone(self.params.dialogs);
    self.getCurrentState();
    this.enableGotIt = false;
    this.repetition = false;
    this.hideTurnButton = false;
    this.matchIt = false;
    this.sideBySide = false;
    self.progress = -1;
    self.progressLeft = -1;
    this.currentFilter = undefined;
    if (this.$progressTop) {
      this.$progressTop.addClass('h5p-dialogcards-disabled');
    }
    if (this.playModeUser === 'matchRepetition' || this.playModeUser === 'selfCorrectionMode') {
      if (this.$round) {
        this.$round.addClass('h5p-dialogcards-disabled');
      }
    }
    // JR for interactive book we need to remove the options upon Restart
    $('.h5p-dialogcards-options', self.$inner).remove();
    $('.h5p-dialogcards-current-options', self.$inner).remove();
    let $optionsText = self.$inner.find('.h5p-dialogcards-options');
    $optionsText.html('');

    if (this.repetition) {
      this.noMatchCards = []; // needed here ?
    }
    // Empty audios and audios2 arrays.
    self.audios = [];
    self.audios2 = [];
    // Removes all these elements to start afresh.

    $(
      '.h5p-dialogcards-cardwrap-set, .h5p-dialogcards-footer, .h5p-question-feedback-container,'
      + '.h5p-dialogcards-card-side-announcer, .h5p-dialogcards-button-reset, '
      + '.h5p-joubelui-score-bar, .h5p-dialogcards-match-footer,'
      + '.h5p-dialogcards-summary-screen, .h5p-dialogcards-summary-message,'
      + ' .h5p-dialogcards-feedback, .h5p-dialogcards-categories, '
      + '.h5p-dialogcards-sub-title, .h5p-dialogcards-options, .h5p-navigation, .h5p-theme-continue',
      self.$inner,
    ).remove();

    // Reset various parameters.
    self.taskFinished = false;
    self.nbCards = self.params.dialogs.length;
    this.nbCardsInCurrentRound = self.nbCards;
    this.cardsOrderChoice = self.params.behaviour.cardsOrderChoice;
    this.enableCardsNumber = self.params.behaviour.enableCardsNumber;
    this.cardsOrderMode = this.cardsOrderChoice;
    this.cardOrder = undefined;
    this.nbCardsSelected = undefined;
    self.cardSizeDetermined = [];
    self.cardsLeftInStack = self.nbCards;
    this.progress = 0;
    this.filterList = undefined;
    this.filterOperator = undefined;
    self.getCurrentState();

    if (this.playModeNames.length === 0) {
      this.playMode = 'normalMode';
      this.playModeUser = this.playMode;
    }
    else if (this.playModeNames.length === 1) {
      this.playMode = this.playModeNames.value;
      this.playModeUser = this.playMode;
    }
    if (this.playMode === 'user') {
      self.createPlayMode().appendTo(self.$inner);
    }
    else if (this.filterByCategories === 'userFilter') {
      self.createFilterCards().appendTo(self.$inner);
    }
    else if (this.cardsOrderChoice === 'user') {
      self.createOrder().appendTo(self.$inner);
    }
    else if (
      this.enableCardsNumber &&
      this.nbCardsSelected === undefined &&
      self.nbCards > C.NB5
    ) {
      self.createNumberCards().appendTo(self.$inner);
    }
    else if (
      this.cardsSideChoice === 'user' &&
      this.cardsSideMode === 'user'
    ) {

      self.createcardsSideChoice().appendTo(self.$inner);
    }
    else {
      self.attachContinue();
    }
  };

  /**
   * Switches all the cards elements from FRONT/text to BACK/answer OR vice-versa.
   * @param {object} card Card parameters
   */

  C.prototype.switchSides = function (cards) {
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
  };

  /**
   * Used with repetition modes: gotIt & Match with repetition if task not completed.
   */

  C.prototype.resetButtons = function (type) {
    let self = this;
    let $card = $(this);
    $card = self.$current;
    $card.removeClass('h5p-dialogcards-match-right');
    // Fixes possible hidden intermediary summary screen
    $card.removeClass('h5p-dialogcards-previous');
    self.stopAudio(self.$current.index());
    let $gotIt = this.enableGotIt;

    if ($gotIt) {
      $card
        .find('.h5p-dialogcards-card-text-area')
        .removeClass('h5p-dialogcards-intermediary-summary-screen');
      $card
        .find('.h5p-dialogcards-answer-button')
        .removeClass('h5p-dialogcards-disabled');
    }
    if (type === 'answer buttons') {
      // Unhide turn button & card text and Disable the Retry button.
      $card
        .find('.h5p-dialogcards-turn')
        .removeClass('h5p-dialogcards-disabled');
      if (this.noText) {
        $card
          .find('.h5p-dialogcards-card-text-inner')
          .addClass('h5p-dialogcards-hide');
      }
      this.$retry.addClass('h5p-dialogcards-disabled');
    }
    else if (type === 'retry button' || type === 'finished button') {
      // Disable answer buttons, turn button, Hide card text button and Enable the Retry button
      if ($gotIt || this.repetition) {
        if (this.noText || (this.frontTextBackImage /*&& this.repetition*/)) {
          let $el = $card.find('.h5p-dialogcards-card-text-wrapper');
          let aClass = '';
          if (this.noText) {
            aClass = 'noText';
          }
          if (this.audioOnly) {
            aClass = 'audioOnly';
          }
          $el.removeClass('hide').addClass(aClass);
          let w = $el.parent().width();
          $el.width(w);
        }
        $card
          .find('.h5p-dialogcards-turn')
          .addClass('h5p-dialogcards-disabled');
        $card
          .find('.h5p-dialogcards-image-wrapper')
          .addClass('h5p-dialogcards-hide');
        if (self.frontTextBackImage) {
          $card
            .find('.h5p-dialogcards-image-wrapper')
            .addClass('hide');
        }
        $card.find('.joubel-tip-container').addClass('h5p-dialogcards-hide');
        $card.find('.h5p-dialogcards-audio-wrapper').addClass('hide');
        $card.find('.h5p-dialogcards-audio-wrapper2').addClass('hide');
        $card
          .find('.h5p-dialogcards-progress')
          .addClass('h5p-dialogcards-hide');
        self.$progress
          .addClass('h5p-dialogcards-hide');
        /* needed for front & back images or audio (no text) */
        if (this.noText) {
          $card
            .find('.h5p-dialogcards-card-text')
            .css('width', '75%');
        }
        $card
          .find('.h5p-dialogcards-card-text-inner')
          .css('height', '12em');
        this.$progress.addClass('h5p-dialogcards-hide');
        $card
          .find('.h5p-dialogcards-answer-button')
          .addClass('h5p-dialogcards-disabled');
        if (this.$round) {
          this.$round.addClass('h5p-dialogcards-hide');
        }

        if (this.repetition) {
          this.$progressFooterLeft.addClass('h5p-dialogcards-hide');
        }
        let totalCorrect = this.correct;
        let totalInCorrect = this.incorrect;
        let totalCards = this.correct + this.incorrect;
        let summary = self.params.summary;
        let thisRound = this.currentRound;
        let roundTxt = self.params.round.replace(
          '@round',
          thisRound.toString(),
        );
        let cardsRight = self.params.summaryCardsRight;
        let cardsWrong = self.params.summaryCardsWrong;

        // Set this height to auto to make sure to fit the summary text inside it.
        // does not work with this.repetition plus save content state!
        if ($gotIt) {

          let $cardText = $card.find('.h5p-dialogcards-card-text');
          if (this.noText) {
            $card
              .find('.h5p-dialogcards-card-text-inner')
              .removeClass('h5p-dialogcards-hide');
          }
          else {
            $cardText.addClass('h5p-dialogcards-auto-height');
          }
        }

        let $cardTextArea = $card.find('.h5p-dialogcards-card-text-area');
        $cardTextArea.addClass('h5p-dialogcards-intermediary-summary-screen');
        let text =
          `<div class="h5p-dialogcards-summary-header">${summary}</div>` +
          `<div class="h5p-dialogcards-summary-subheader">${roundTxt}</div>` +
          `<table class="h5p-dialogcards-summary-table"><tr><td class="h5p-dialogcards-summary-table-row-category">${
            cardsRight
          }</td>` +
          '<td class="h5p-dialogcards-summary-table-row-symbol h5p-dialogcards-check">&nbsp;</td>' +
          `<td class="h5p-dialogcards-summary-table-row-score">${
            totalCorrect
          }&nbsp;<span class="h5p-dialogcards-summary-table-row-score-divider">/</span>&nbsp;${
            totalCards
          }</td></tr>` +
          `<tr><td class="h5p-dialogcards-summary-table-row-category">${
            cardsWrong
          }</td><td class="h5p-dialogcards-summary-table-row-symbol h5p-dialogcards-times">&nbsp;</td>` +
          `<td class="h5p-dialogcards-summary-table-row-score">${
            totalInCorrect
          }&nbsp;<span class="h5p-dialogcards-summary-table-row-score-divider">/</span>&nbsp;${
            totalCards
          }</td></tr></table>`;
        $cardTextArea.html(text);
        $card.find('.h5p-dialogcards-card-text').removeClass('hide');

        if (type === 'retry button') {
          this.cardsLeft = 0;
          let label = this.params.nextRound.replace('@round', this.currentRound + 1);
          this.$retry.html(
            label,
          );
        }
        else {
          let finalSummary = this.params.showSummary;
          this.$retry
            .html(finalSummary)
            .attr('title', finalSummary)
            .addClass('h5p-dialogcards-retry');
          this.taskFinished = true;
        }
      }
      else {
        const retryOrReset = self.getRetryOrReset();
        let message = retryOrReset[0];
        let thisclass = retryOrReset[1];
        this.$retry.html(message);
        this.$retry.addClass(thisclass);
      }
      this.$retry.removeClass('h5p-dialogcards-disabled');
      if (this.matchIt) {
        this.$retry.addClass('h5p-dialogcards-unset');
      }
      this.$progressTop.addClass('h5p-dialogcards-disabled');
    }
    else if (type === 'restart') {
      if (this.matchIt) {
        $card.addClass('h5p-dialogcards-match-right');
      }
      $card
        .find('.h5p-dialogcards-turn')
        .removeClass('h5p-dialogcards-disabled');
      $card
        .find('.h5p-dialogcards-card-text')
        .removeClass('h5p-dialogcards-auto-height');
      if (this.matchIt) {
        self.$prev.removeClass('h5p-dialogcards-hide h5p-visibility-hidden');
      }
      if (!this.taskFinished) {
        this.$round.removeClass('h5p-dialogcards-hide');
      }
      let $cardContent = $card.find('.h5p-dialogcards-card-content');
      $cardContent.removeClass('h5p-dialogcards-summary-screen');
      this.$retry.addClass('h5p-dialogcards-disabled');
      if (this.noText && !this.matchIt) {
        $card
          .find('.h5p-dialogcards-card-text-inner')
          .addClass('h5p-dialogcards-hide');
      }
    }
    // A resize is needed to make sure the content of cards is displayed on further rounds.
    if (this.playModeUser === 'matchRepetition') {
      self.resize();
    }
  };

  /**
   * Necessary for the Interactive Book content.
   * Used in contracts.
   * @public
   */

  C.prototype.showSolutions = function () {
    return;
  };

  /**
   * Get maximum score.
   * @returns {number} Max points. Used in Interactive Book content.
   */
  C.prototype.getMaxScore = function () {
    if (
      this.playModeUser === 'normalMode' ||
      this.playModeUser === 'browseSideBySide'
    ) {
      return 0;
    }
    if (this.nbCardsSelected) {
      return this.nbCardsSelected;
    }
    return C.NB10;
  };

  /**
   * @returns {number} Points. Used in Interactive Book content.
   */
  C.prototype.getScore = function () {
    if (!this.nbCardsSelected) {
      return 0;
    }
    if (
      this.params.behaviour.playMode === 'normalMode' ||
      this.playMode === 'browseSideBySide'
    ) {
      return 0;
    }
    return this.actualScore;
  };

  // Used when a dialog cards activity is included in an Interactive Book content.
  C.prototype.getAnswerGiven = function () {
    return this.answered;
  };

  /**
   * Returns an object containing content of each cloze
   * @returns {object} object containing content for each cloze
   */
  C.prototype.getCurrentState = function () {
    let state = {};
    if (this.$current !== undefined) {
      state.progress = this.$current.index();
    }

    if (this.repetition) {
      if (this.$currentLeft !== undefined) {
        state.progressLeft = this.$currentLeft.index();
      }
      if (state.progressLeft === -1) {
        state.progressLeft = state.progress + 1;
      }
    }

    if (this.sideBySide) {
      if (this.$currentLeft !== undefined) {
        state.progressLeft = this.$currentLeft.index();
      }
    }

    if (this.playModeUser === 'selfCorrectionMode') {
      state.lastCorrect = !this.endOfStack;
    }
    if (this.filterByCategories) {
      state.filterByCategories = this.filterByCategories;
      state.filterList = this.filterList;
      state.filterOperator = this.filterOperator;
      state.currentFilter = this.currentFilter;
      state.currentDialogs = this.currentDialogs;
    }
    if (this.noDupeFrontPicToBack) {
      state.noDupeFrontPicToBack = this.noDupeFrontPicToBack;
    }
    state.currentRound = this.currentRound;
    state.correct = this.correct;
    state.incorrect = this.incorrect;
    state.nbCardsInCurrentRound = this.nbCardsInCurrentRound;
    state.nbCardsSelected = this.nbCardsSelected;
    state.nbCardsLeft = this.cardsLeft;
    state.order = this.cardOrder;
    state.noMatchCards = this.noMatchCards;
    state.cardsOrderChoice = this.cardsOrderChoice;
    state.cardsOrderMode = this.cardsOrderMode;
    state.enableCardsNumber = this.enableCardsNumber;
    state.cardsSideChoice = this.cardsSideChoice;
    state.cardsSideMode = this.cardsSideMode;
    state.playMode = this.playMode;
    state.playModeUser = this.playModeUser;
    state.taskFinished = this.taskFinished;

    return state;
  };

  C.prototype.applyFilter = function (
    filterList,
    filterOperator,
    dryRun = false,
  ) {
    let self = this;
    let filterListLength = filterList.split(',').length;
    let catDialogs = [];
    let isSelected = 0;
    let notSelected = 0;
    let numCardsInCats = 0;
    for (let i = 0; i < self.currentDialogs.length; i++) {
      if (self.currentDialogs[i].itemCategories !== undefined) {
        let itemCats = self.currentDialogs[i].itemCategories.split(',');
        isSelected = 0;
        notSelected = 0;
        for (let j = 0; j < itemCats.length; j++) {
          if (filterOperator === 'AND' || filterOperator === 'OR') {
            if (filterList.includes(itemCats[j])) {
              isSelected++;
            }
          }
          else {
            if (filterList.includes(itemCats[j])) {
              notSelected++;
            }
          }
        }
        if (
          isSelected === filterListLength ||
          (filterOperator === 'OR' && isSelected !== 0) ||
          (filterOperator === 'NOT' && notSelected === 0)
        ) {
          if (dryRun) {
            numCardsInCats++;
          }
          else {
            catDialogs[i] = self.params.dialogs[i];
          }
        }
      }
    }
    if (dryRun) {
      return numCardsInCats;
    }
    let filtered = catDialogs.filter(function (el) {
      return el != null;
    });
    if (!filtered.length) {
      this.noFilterMessage =
        'ERROR! categories filter returned an empty result. No filter will be applied.';
    }
    else {
      self.currentDialogs = structuredClone(filtered);
      this.nbCards = self.currentDialogs.length;
      return self.currentDialogs;
    }
  };

  C.prototype.makeCurrentFilterName = function (catList, catOperator) {
    let self = this;
    let filterName;
    if (catOperator === 'AND') {
      filterName = catList.replace(/,/g, ` ${self.params.boolean_AND} `);
    }
    else if (catOperator === 'OR') {
      filterName = catList.replace(/,/g, ` ${self.params.boolean_OR} `);
    }
    else if (catOperator === 'NOT') {
      filterName = `${self.params.boolean_NOT} ${catList.replace(/,/g, ` ${self.params.boolean_NOT} `)}`;
    }
    return filterName;
  };

  /**
   * Trigger xAPI answered event
   */
  C.prototype.triggerAnswered = function () {
    this.answered = true;
    const xAPIEvent = this.createXAPIEventTemplate('answered');
    this.addQuestionToXAPI(xAPIEvent);
    this.addResponseToXAPI(xAPIEvent);
    this.trigger(xAPIEvent);
  };

  /**
   @returns {object} xAPI object definition
   */
  C.prototype.getxAPIDefinition = function () {
    const definition = {};

    let description = '';
    if (this.params.title !== '') {
      description = this.params.title;
    }
    else if (this.params.description !== '') {
      description = this.params.description;
    }
    else {
      description = this.params.showSummary;
    }

    definition.description = {
      'en-US': description,
    };
    definition.type = 'http://adlnet.gov/expapi/activities/cmi.interaction';
    definition.interactionType = 'long-fill-in';
    return definition;
  };

  /**
   * Add the question itself to the definition part of an xAPIEvent
   * @param {H5P.XAPIEvent} xAPIEvent to add a question to
   */
  C.prototype.addQuestionToXAPI = function (xAPIEvent) {
    const definition = xAPIEvent.getVerifiedStatementValue([
      'object',
      'definition',
    ]);
    $.extend(true, definition, this.getxAPIDefinition());

    // Set reporting module version if alternative extension is used
    if (this.hasAlternatives) {
      const context = xAPIEvent.getVerifiedStatementValue(['context']);
      context.extensions = context.extensions || {};
      context.extensions[XAPI_REPORTING_VERSION_EXTENSION] = '1.1.0';
    }
  };
  /**
   * Add the response part to an xAPI event
   * @param {H5P.XAPIEvent} xAPIEvent
   *  The xAPI event we will add a response to
   * change last param to this.isPassed() TODO!
   */
  C.prototype.addResponseToXAPI = function (xAPIEvent) {
    if (
      this.playModeUser === 'browseSideBySide' ||
      this.playModeUser === 'normalMode'
    ) {
      return;
    }
    let success =
      (100 * this.actualScore) / this.maxScore >=
      this.params.behaviour.passPercentage;
    xAPIEvent.setScoredResult(
      this.actualScore,
      this.maxScore,
      this,
      true,
      success,
    );
    // Note to self: put result.duration *before* result.response!
    let duration = `PT${Math.round((this.endTime - this.startTime) / C.NB1000)}S`;
    xAPIEvent.data.statement.result.duration = duration;
    xAPIEvent.data.statement.result.response = this.getxAPIResponse();
  };

  /**
   * Generate xAPI user response, used in xAPI statements.
   * @returns {string} User answers separated by the "[,]" pattern
   */
  C.prototype.getxAPIResponse = function () {
    let summary = '';
    let selectedCards = this.nbCardsSelected;
    let totalCards = this.params.dialogs.length;
    let text1 = '';
    if (selectedCards !== totalCards) {
      text1 += `${this.params.summaryCardsSelected} ${
        selectedCards
      }/${totalCards}\n`;
      totalCards = selectedCards;
    }
    let text2;
    if (this.enableGotIt || this.repetition) {
      text2 = `${this.params.summaryCardsCompleted} ${totalCards}/${totalCards}\n${
        this.params.summaryCompletedRounds
      } ${this.currentRound}`;
    }
    else if (this.matchIt && !this.repetition) {
      text2 = `${this.params.summaryMatchesFound} ${this.correct}\n${
        this.params.summaryMatchesNotFound
      } ${this.incorrect}`;
    }
    let text3 = `${this.params.summaryOverallScore} : ${this.actualScore}/${this.maxScore}`;
    summary += `${text1 + text2}\n${text3}\n${this.helpText}`;
    return summary;
  };

  C.prototype.getRetryOrReset = function () {
    let message = this.params.retry;
    let thisclass = 'h5p-dialogcards-button-retry';
    if (
      this.playMode === 'user' ||
      this.filterByCategories === 'userFilter' ||
      this.cardsOrderChoice === 'user' ||
      (this.cardsOrderMode === 'random' &&
        this.enableCardsNumber === undefined) ||
      this.cardsSideChoice === 'user'
    ) {
      message = this.params.resetTask;
      thisclass = 'h5p-dialogcards-papijo-button-reset';
    }
    return [message, thisclass];
  };
  /**
   * Checks media consistency across dialog cards.
   * @param {object} self - H5P content instance containing params and dialogs
   * @returns {string} HTML report string or empty string if valid
   */
  function checkConsistency(self) {
    const removedCards = [];

    if (!self.params.dialogs || self.params.dialogs.length === 0) {
      return '';
    }

    /**
     * Builds a front/back media availability map for a card.
     * @param {object} card - Dialog card configuration object
     * @returns {object} Media map for front and back sides
     */
    function getMediaMap(card) {
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
     * Produces a human-readable media layout description.
     * @param {object} media - Media map with front/back image/audio flags
     * @returns {string} Layout description
     */
    function describeLayout(media) {
      const parts = [];

      ['front', 'back'].forEach((side) => {
        ['image', 'audio'].forEach((type) => {
          if (media[side][type]) {
            parts.push(`${type.charAt(0).toUpperCase() + type.slice(1)} ${side}`);
          }
        });
      });

      return parts.join(' AND ');
    }

    const reference = getMediaMap(self.params.dialogs[0]);

    // --- VALIDATE FIRST CARD ---
    const frontCount =
      (reference.front.image ? 1 : 0) +
    (reference.front.audio ? 1 : 0);
    const backCount =
      (reference.back.image ? 1 : 0) +
    (reference.back.audio ? 1 : 0);

    if (frontCount !== 1 || backCount !== 1) {
      const text = self.params.dialogs[0].text.replace(/<[^>]*>/g, '').trim();
      const answer = self.params.dialogs[0].answer.replace(/<[^>]*>/g, '').trim();

      let report = '<div style="font-family:Arial,sans-serif;">';
      report += '<h2 style="color:#d9534f;">⚠️ Reference Card Invalid</h2>';
      report += '<p>The first card must contain exactly one media per side (front & back).</p>';
      report += `<p><strong>Current layout:</strong> ${describeLayout(reference)}</p>`;
      report += '<hr>';
      report += `
      <div style="margin-bottom:12px;">
        <strong>Card #1</strong><br>
        <strong>Text:</strong> "${text}"<br>
        <strong>Answer:</strong> "${answer}"
      </div>
    `;
      report += '</div>';

      return report;
    }

    // --- CHECK OTHER CARDS AGAINST REFERENCE ---
    self.params.dialogs.forEach((card, index) => {
      if (index === 0) {
        return;
      }

      const current = getMediaMap(card);
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

      if (missing.length || extra.length) {
        let reason = '';
        if (missing.length) {
          reason += missing.join(' and ');
        }
        if (extra.length) {
          reason += (reason ? ' AND ' : '') + extra.join(' and ');
        }
        let text;
        if (!card.text) {
          card.text = 'Missing text!';
          text = card.text.replace(/<[^>]*>/g, '').trim();
          text = '<span style="color:var(--h5p-theme-feedback-incorrect-main);">⚠️ Missing text!</span>';
        }
        else {
          text = card.text.replace(/<[^>]*>/g, '').trim();
        }
        const answer = card.answer.replace(/<[^>]*>/g, '').trim();

        removedCards.push({
          index,
          reason,
          text,
          answer,
        });
      }
    });

    if (removedCards.length > 0) {
      const deckSize = self.params.dialogs.length;
      self.params.dialogs = [];

      let report = '<div style="font-family:Arial,sans-serif;">';
      report += '<h2 style="color:var(--h5p-theme-feedback-incorrect-main);">⚠️ Deck Rejected</h2>';
      report += `<p><strong>Card #1 defines the required media layout:</strong> ${describeLayout(reference)}</p>`;
      report += '<hr>';

      removedCards.forEach((card) => {
        report += `
        <div style="margin-bottom:12px;">
          <strong>Card #${card.index + 1} — Rejection reason:</strong>⚠️  ${card.reason}<br>
          <strong>Text:</strong> "${card.text}"
        </div>
        <hr style="border:1px dashed #ccc;">
      `;
      });

      report += `<p><strong>Deck size:</strong> ${deckSize} cards</p>`;
      report += `<p><strong>Cards with mismatches:</strong> ${removedCards.length}</p>`;
      report += '</div>';

      return report;
    }

    return '';
  }

  C.SCALEINTERVAL = 0.2;
  C.MAXSCALE = 16;
  C.MINSCALE = 4;
  C.NB04 = 0.4;
  C.NB2 = 2;
  C.NB5 = 5;
  C.NB10 = 10;
  C.NB50 = 50;
  C.NB200 = 200;
  C.NB300 = 300;
  C.NB400 = 400;
  C.NB1000 = 1000;

  return C;
})(H5P.jQuery, H5P.Audio, H5P.JoubelUI, H5P.Question);
