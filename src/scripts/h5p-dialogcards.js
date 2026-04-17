/**
 * Dialogcards module PapiJo
 * @param $
 */

const $ = H5P.jQuery;
const { JoubelUI } = H5P;
// Use the modern buttons from Components.
const createButton = (options) => 
  $(H5P.Components.Button(options));
      
class DialogcardsPapiJo extends H5P.EventDispatcher {
  /**
   * Initialize module.
   *
   * @constructor
   *
   * @param {Object} params Parameters.
   * @param {Number} id Content id.
   * @param {Object} contentData Content data, e.g. for saveContentState
   * @returns {DialogCards} self
   */
  constructor(params, id, contentData) {
    super();
    this.contentId = this.id = id;
    // Set default behavior.
    this.params = $.extend(
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
        cardsLeft: 'Cards left: @number',
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
        thisCorrectionMode: 'Self Correction',
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

    this._current = -1;
    this._turned = [];
    this.$images = [];
    this.$images2 = [];
    this.audios = [];
    this.audios2 = [];
    this.resetAll = false;
    this.currentRound = 1;
    this.lastCardIndex = 0;
    this.endOfStack = 0;
    this.correct = 0;
    this.incorrect = 0;
    this.lastCard = null;
    this.cardsOrderChoice = this.params.behaviour.cardsOrderChoice;
    this.cardsOrderMode = this.cardsOrderChoice;
    this.cardsSideChoice = this.params.behaviour.cardsSideChoice;
    this.cardsSideMode = this.cardsSideChoice;
    this.playMode = this.params.behaviour.playMode;
    this.playModeUser = this.playMode;
    this.enableCardsNumber = this.params.behaviour.enableCardsNumber;
    this.noText = this.params.behaviour.noTextOnCards;
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
      { value: 'normal', label: this.params.normalMode },
      { value: 'browseSideBySide', label: this.params.browseSideBySide },
      { value: 'matchMode', label: this.params.matchMode },
      { value: 'matchRepetition', label: this.params.matchRepetition },
      { value: 'selfCorrectionMode', label: this.params.selfCorrectionMode },
    ];

    if (this.playMode === 'user') {
      this.allowedPlayModes = this.params.behaviour.allowedPlayModes;
      this.playModeNames = this.playModeNames.filter(
        (mode) => this.allowedPlayModes[mode.value],
      );
      if (this.playModeNames.length === 0) {
        this.playMode = 'normal';
      }
      else if (this.playModeNames.length === 1) {
        this.playMode = this.playModeNames[0].value;
      }
    }
    this.playModeUser = this.playMode;
    /* *************************************************** */
    if (this.noText) {
      this.report = checkConsistency(this);
    }

    /* *************************************************** */
    // TODO Translate this error message
    if (!this.params.dialogs.length || this.report) {
      this.params.description +=
        '<hr><b>ERROR</b> You are using the "no text" option:' +
        '<br>but your set of cards is not consistent.'
        + `<br>${ this.report}`;
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
      this.frontTextBackImage = this.params.dialogs.every((dialog) =>
        dialog.answer === '' &&
        dialog.imageMedia.image === undefined &&
        dialog.imageMedia.image2 !== undefined,
      );

      // All dialogs must satisfy: empty answer + no front audio + back audio exists
      this.frontTextBackAudio = this.params.dialogs.every((dialog) =>
        dialog.answer === '' &&
        dialog.audioMedia.audio === undefined &&
        dialog.audioMedia.audio2 !== undefined,
      );
    }

    // -------------------------
    // Flags that depend on no text
    // -------------------------
    if (this.noText) {
    // All dialogs must have front audio and back image
      this.frontAudioBackImage = this.params.dialogs.every((dialog) =>
        dialog.audioMedia.audio &&
      dialog.imageMedia.image2 !== undefined,
      );

      // All dialogs must have front image and back audio
      this.frontImageBackAudio = this.params.dialogs.every((dialog) =>
        dialog.imageMedia.image !== undefined &&
      dialog.audioMedia.audio2 !== undefined,
      );

      // All dialogs must have both front and back audio
      this.has2Audio = this.params.dialogs.every((dialog) =>
        dialog.audioMedia.audio && dialog.audioMedia.audio2,
      );

      // All dialogs must satisfy “audio only” condition
      this.audioOnly = this.params.dialogs.every((dialog) =>
        dialog.imageMedia.image === undefined &&
      dialog.audioMedia.audio !== undefined &&
      dialog.imageMedia.image2 === undefined &&
      dialog.audioMedia.audio2 !== undefined,
      );

      const hasImageOnFront = this.params.dialogs.every((d) => d.imageMedia.image);
      const hasImageOnBack = this.params.dialogs.every((d) => d.imageMedia.image2);
      this.hasTwoImages = hasImageOnFront && hasImageOnBack;

    }
    // IF categories filters enabled!!!
    if (this.params.enableCategories && this.params.behaviour.catFilters) {
      this.catFilters = this.params.behaviour.catFilters;
      // Remove potential filters with empty filterList
      for (let i = 0; i < this.catFilters.length; i++) {
        if (this.catFilters[i].filterList === undefined) {
          this.catFilters.splice(i, 1);
          i--;
        }
      }
      if (!$.isEmptyObject(this.catFilters)) {
        this.filterByCategories = this.params.behaviour.filterByCategories;
      }
    }

    this.userSelectedCategory = '';
    if (this.cardsOrderMode === 'normal') {
      this.enableCardsNumber = false;
    }
    this.matchCorrect = null;
    this.existsCardOrder = false;
    this.noDupeFrontPicToBack = this.params.behaviour.noDupeFrontPicToBack;

    // Copy parameters for further use if save content state. Use Clone for perfect copy.
    this.currentDialogs = structuredClone(this.params.dialogs); // ✅ best modern solution
    

    this.noFilterMessage = '';
    this.nbCards = this.currentDialogs.length;
    this.cardsLeftInStack = this.nbCardsSelected;
    this.nbCardsInCurrentRound = this.nbCards;
    this.enableCardsNumber = this.enableCardsNumber;
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
  ///}

  
  /**
   * Attach the first part of the h5p inside the given container (title and description).
   * @param {HTMLElement} $container Contains the cards
   */
  this.attach = ($container) => {
    const title = $(`<div>${this.params.title}</div>`).text().trim();
        this.$header = $(`<div class="h5p-dialogcards-title-container"><div class="h5p-dialogcards-title-wrapper">${title ? `<div class="h5p-dialogcards-title"><div class="h5p-dialogcards-title-inner h5p-theme-question-description">${this.params.title}</div></div>` : ''}<div class="h5p-dialogcards-description">${this.params.description}</div></div></div>`);
    this.$inner = $container.addClass('h5p-dialogcards h5p-theme');
      if (this.params.behaviour.scaleTextNotCard) {
        $container.addClass('h5p-text-scaling');
      }
    this.$header.appendTo(this.$inner);

    if (!this.params.dialogs.length || this.report) {
      return;
    }

    // If we are resuming task from a previously finished task, Reset the task.
    if (this.taskFinished) {
      this.resetTask();
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
      this.createPlayMode().appendTo(this.$inner);
    }
    else if (
      this.filterByCategories === 'userFilter' &&
      this.currentFilter === undefined
    ) {
      this.createFilterCards().appendTo(this.$inner);
    }
    else if (
      this.cardsOrderChoice === 'user' &&
      this.cardOrder === undefined
    ) {
      this.createOrder().appendTo(this.$inner);
    }
    else if (
      this.enableCardsNumber &&
      this.nbCardsSelected === undefined /*&& this.nbCards > 5*/
    ) {
      this.createNumberCards().appendTo(this.$inner);
    }
    else if (
      this.cardsSideChoice === 'user' &&
      this.cardsSideMode === 'user'
    ) {
      this.createcardsSideChoice().appendTo(this.$inner);
    }
    else {
      this.attachContinue();
    }
  };

  /**
   * Attach the rest of the h5p inside the given container.
   */
  
  this.attachContinue = () => {
    console.log('this.playModeUser = ' + this.playModeUser);
    if (this.playModeUser !== 'selfCorrectionMode') {
      this.$progress = $('<div>', {
            id: `h5p-dialogcards-progress-${this.idCounter}`,
            class: 'h5p-dialogcards-progress h5p-theme-progress',
            'aria-live': 'assertive',
          }).appendTo(this.$header);
      // Init progress text when starting a new game.
      
      this.$progress.text(this.params.progressText
        .replace('@card', '1')
        .replace('@total', this.nbCards.toString()),
      );
    }

    let text = '';
    if (this.playMode === 'user') {
      const value = this.playModeUser;
      // Use .find() to get the object with matching value
      const label =
        (this.playModeNames.find((i) => i.value === value) || {}).label || null;
      // Use backticks (`) and ${}
      if (label) {
        text += `
          <div class="h5p-dialogcards-option">
            <b>${this.params.currentPlayModeNotice}</b>&nbsp;${label}
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

    this.cardsSideChoice = this.params.behaviour.cardsSideChoice;
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
      this.hideTurnButton = this.params.behaviour.hideTurnButton;
    }
    // Section to show the Display cards options if different from "normal".
    let order = '';
    if (this.currentFilter !== undefined) {
      text += `
        <div class="h5p-dialogcards-option">
          <b>${this.params.currentFilterNotice}</b> ${this.currentFilter}
        </div>`;
    }
    if (this.cardsOrderChoice === 'user') {
      let orderNotice = this.params.currentOrderNotice;
      if (this.matchIt) {
        orderNotice = this.params.currentRightOrderNotice;
      }
      if (this.cardsOrderMode === 'normal') {
        order = this.params.normalOrder;
      }
      else {
        order = this.params.randomOrder;
      }
      text += `<div class="h5p-dialogcards-option"><b>${orderNotice} </b>${order}</div>`;
    }
    // If matchIt the left side = back of card and the right side = front of card
    if (this.matchIt) {
      if (this.cardsSideChoice === 'user') {
        let currentSide = this.params.cardBackLabel;
        if (this.cardsSideMode === 'frontFirst') {
          currentSide = this.params.cardFrontLabel;
        }
        text += `<div class="h5p-dialogcards-option"><b>${this.params.currentLeftSideNotice}</b>&nbsp;${
          currentSide
        }</div>`;
      }
    }
    else {

      if (this.cardsSideChoice === 'user') {
        let currentSide = this.params.cardFrontLabel;
        if (this.cardsSideMode === 'backFirst') {
          currentSide = this.params.cardBackLabel;
        }
        text += `
          <div class="h5p-dialogcards-option">
            <b>${this.params.currentSideNotice}</b>&nbsp;${currentSide}
          </div>`;
      }
    }
    if (text !== '') {
      let $optionsText = $('<div>', {
        class: 'h5p-dialogcards-options',
        html: text,
      });
      $optionsText.appendTo(this.$inner);
    }
    // Remove potential user interaction elements from DOM.
    $('.h5p-dialogcards-categories', this.$inner).remove();
    $('.h5p-dialogcards-number', this.$inner).remove();
    $('.h5p-dialogcards-side', this.$inner).remove();

    if (this.params.behaviour.scaleTextNotCard) {
      this.$inner.addClass('h5p-text-scaling');
    }

    if (this.contentData.previousState && this.filterList !== undefined) {
      ///this.applyFilter(this.filterList, this.filterOperator, false);
    }

  this.initCards(this.currentDialogs).appendTo(this.$inner);
    console.log('this.playMode = ' + this.playMode);
    this.$cardSideAnnouncer = $('<div>', {
      html: this.params.cardFrontLabel,
      class: 'h5p-dialogcards-card-side-announcer',
      'aria-live': 'polite',
      'aria-hidden': 'true',
    }).appendTo(this.$inner);

    // Create a $matchFooter container for $matchfooterLeft containing the current score
    // and the normal navigation $footer

    if (this.matchIt && !this.sideBySide) {
      let $matchFooter = $('<div>', {
        class: 'h5p-dialogcards-match-footer',
      });

      this.createFooterLeft().appendTo($matchFooter);

      this.createFooter().appendTo($matchFooter);

      $matchFooter.appendTo(this.$inner);
    }
    else if (this.sideBySide) {
      this.$sideBySide = $('<div>', {
        class: 'h5p-dialogcards-side-by-side',
      });

      this.createSubTitleFooter().appendTo(this.$sideBySide);

      this.createFooter().appendTo(this.$sideBySide);

      this.$sideBySide.appendTo(this.$inner);
    }
    else {
      /// This footer is currently valid for the normal mode only.
      console.log('this.playMode = ' + this.playMode);
      if (this.playMode === 'selfCorrectionMode') {
        //this.nav = this.createFooter();
        this.nav = H5P.Components.Navigation();
        this.$round = $('<div>', {
          class: 'h5p-dialogcards-round',
        }).appendTo(this.nav);
        this.$progress = $('<div>', {
          class: 'h5p-dialogcards-round',
          'aria-live': 'assertive',
        }).appendTo(this.nav);
      this.nav = this.createFooter2();
      } else {
        this.nav = this.createFooter2();
      }
      this.$inner.append(this.nav);
    }
    //// not needed here?
    this.updateNavigation();
    // Creating a Date Object used by XAPI
    this.startTime = new Date().getTime();
    this.triggerXAPI('attempted');

    this.on('retry', function () {
      this.retry();
    });

    this.on('resetTask', function () {
      this.resetTask();
    });

    this.on('resize', this.resize);
    this.trigger('resize');
    this.getCurrentState();

    // we are refreshing from a "next round" screen, so... reset everything to get there
    if (this.repetition && this.cardsLeft === 0) {
      // set parameters as they were on nextRound screen before refreshing page
      this.cardsLeft = 1;
      this.incorrect--;
      this.matchCardsRepetition($(this).parents('.h5p-dialogcards-cardwrap'));
    }
    if (this.playModeUser === 'selfCorrectionMode' && this.cardsLeft === 0) {
      // set parameters as they were on nextRound screen before refreshing page
      if (this.lastCorrect) {
        this.correct--;
        this.gotItCorrect($(this).parents('.h5p-dialogcards-cardwrap'));
      }
      else {
        this.incorrect--;
        this.gotItIncorrect();
      }
    }
    this.resize();
    this.resizeOverflowingText();
  };

  /**
   * Create orderCards option request
   * @returns {HTMLElement} Order element
   */
  this.createOrder = () => {
    
    let randomizeQuestion = this.params.randomizeCardsQuestion;
    if (this.matchIt) {
      randomizeQuestion = this.params.randomizeRightCardsQuestion;
    }
    let $order = $('<div>', {
      class: 'h5p-dialogcards-order h5p-dialogcards-options',
      html: randomizeQuestion,
    });

    let $optionButtons = $('<div>', {
      class: 'h5p-dialogcards-buttons',
    }).appendTo($order);

    this.$normalOrder = createButton({
      class: 'h5p-dialogcards-order-button',
      label: this.params.no,
      title: this.params.no,
      icon: 'close',
      onClick: () => {
        this.cardsOrderMode = 'normal';
        this.randomizeOrder('normal');
      }
    }).appendTo($optionButtons);
    
    this.$randomizeOrder = createButton({
      class: 'h5p-dialogcards-order-button',
      label: this.params.yes,
      title: this.params.yes,
      icon: 'check',
      onClick: () => {
        this.cardsOrderMode = 'random';
        this.randomizeOrder('random');
      }
    }).appendTo($optionButtons);

    return $order;
  };

  /**
   * Create cardsSideChoice option request
   * @returns {HTMLElement} Side element
   */
  this.createcardsSideChoice = () => {
    let currentSide;
    let reverseSide;
    if (this.cardsSideMode === 'user') {
      this.cardsSideMode = 'frontFirst';
      this.isReversed = false;
    }
    if (this.cardsSideMode === 'frontFirst') {
      currentSide = this.params.cardFrontLabel;
      reverseSide = this.params.cardBackLabel;
    }
    else {
      currentSide = this.params.cardBackLabel;
      reverseSide = this.params.cardFrontLabel;
    }
    // Do not use the h5p-dialogcards-options flex display here.
    let $side = $('<div>', {
      class: 'h5p-dialogcards-side h5p-dialogcards-options show',
      html: `${this.params.currentSideNotice}&nbsp;${currentSide}`,
    });

    let $optionButtons = $('<div>', {
      class: 'h5p-dialogcards-buttons',
    }).appendTo($side);
    
    this.$No = createButton({
      class: 'h5p-dialogcards-side-button-no',
      label: this.params.no,
      title: this.params.no,
      icon: 'close',
      onClick: () => {
        // Do nothing, just continue with current card side.
        this.attachContinue();
      }
    }).appendTo($optionButtons);

    this.$Yes = createButton({
      class: 'h5p-dialogcards-side-button-yes',
      label: this.params.yes,
      title: this.params.yes,
      icon: 'check',
      onClick: () => {
        if (this.cardsSideMode === 'backFirst') {
          this.cardsSideMode = 'frontFirst';
          this.isReversed = false;
        }
        else {
          this.cardsSideMode = 'backFirst';
        }
        this.reverse = true;
        this.attachContinue();
      }
    })
    .appendTo($optionButtons);

    return $side;
  };

  /**
   * Create numberCards option request
   * @returns {HTMLElement} numberCards element
   */
  this.createNumberCards = () => {
    
  let self = this;
    let numCards = self.currentDialogs.length;
    let $numberCards = $('<div>', {
      class: 'h5p-dialogcards-number h5p-dialogcards-options',
      html: self.params.numCardsQuestion,
    });

    let $optionButtons = $('<div>', {
      class: 'h5p-dialogcards-buttons',
    }).appendTo($numberCards);

    // Allow user to select a number of cards to play with, by displaying selectable buttons in increments of 5.
    let n = 0;
    if (numCards <= DialogcardsPapiJo.NB50) {
      n = DialogcardsPapiJo.NB5;
    }
    else {
      n = DialogcardsPapiJo.NB10;
    }
    let limit = Math.min(numCards, 100);
    for (let i = n; i < limit; i += n) {
      this.$button = createButton({
        class: 'h5p-dialogcards-number-button',
        label: i,
        title: i,
        id: `dc-number-${i}`,
        icon: 'check',
        onClick: () => {
            this.nbCards = i;
            this.nbCardsSelected = i;
            if (this.cardsSideChoice === 'user') {
              $('.h5p-dialogcards-number', this.$inner).remove();
              this.createcardsSideChoice().appendTo(this.$inner);
            }
            else {
              self.attachContinue();
            }
        }
        }).appendTo($optionButtons);
      }

    this.$button = createButton({
      class: 'h5p-dialogcards-number-button',
      label: `${self.params.allCards} (${numCards})`,
      icon: 'check',
      onClick: () => {
        self.nbCards = numCards;
        if (self.cardsSideChoice === 'user') {
          $('.h5p-dialogcards-number', self.$inner).remove();
          self.createcardsSideChoice().appendTo(self.$inner);
        }
        else {
          self.attachContinue();
        }
      }
      })
      .appendTo($optionButtons);
    return $numberCards;
  };

  /**
   * Create filterCards option request
   * @returns {HTMLElement} this.currentDialogs array
   */

  this.createFilterCards = () => {
    console.log('************ this.createFilterCards');
    const self = this;
    // Init params
    const $filterCards = $('<div>', {
      class: 'h5p-dialogcards-categories',
      html: this.params.selectFilter,
    });

    const $optionButtons = $('<div>', {
      class: 'h5p-dialogcards-buttons',
    }).appendTo($filterCards);
/*
    let $class;
    this.nofilter = false;
    let catNames = [];
    let filterList;
    let filterOperator;
    let numCardsInCats;
    let catName;
    for (let i = 0; i < this.catFilters.length + 1; i++) {
      if (i < this.catFilters.length) {
        filterList = this.catFilters[i].filterList;
        filterOperator = this.catFilters[i].filterOperator;
        numCardsInCats = this.applyFilter(filterList, filterOperator, true);
        catName = this.makeCurrentFilterName(filterList, filterOperator);
        // Prevent duplicate filters in list!
        if (catNames.includes(catName)) {
          continue;
        }
        catNames.push(catName);
      }
      else {
        catName = this.params.noFilter;
        $class = 'h5p-dialogcards-allCategories-button';
        numCardsInCats = this.params.dialogs.length;
      }
      this.filterList = undefined;
      this.filterOperator = undefined;
      if (numCardsInCats) { 
        this.catFilters[i];
        this.$button = createButton({
          class: $class,
          title: catName,
          label: `${catName} (${numCardsInCats})`,
        })
          .click(() => {
            $('.h5p-dialogcards-categories', this.$inner).remove();
            if (i < this.catFilters.length) {
              this.filterList = this.catFilters[i].filterList;
              this.filterOperator = this.catFilters[i].filterOperator;
              this.applyFilter(this.filterList, this.filterOperator);
              this.currentFilter = this.title;
            }
            else {
              this.currentFilter = this.params.noFilter;
            }
            if (
              this.cardsOrderChoice === 'user' &&
              this.cardOrder === undefined
            ) {
              this.createOrder().appendTo(this.$inner);
            }
            else if (
              this.enableCardsNumber &&
              this.nbCardsSelected === undefined &&
              this.nbCards > DialogcardsPapiJo.NB5
            ) {
              this.createNumberCards().appendTo(this.$inner);
            }
            else if (!this.matchIt && this.cardsSideChoice === 'user') {
              this.createcardsSideChoice().appendTo(this.$inner);
            }
            else {
              this.attachContinue();
            }
          })
          .appendTo($optionButtons);
      }
    }
    return $filterCards;
    */
    this.nofilter = false;
const catNames = [];

// Shared click handler logic
const handleClick = (filterList, filterOperator, catName, isNoFilter = false) => {
  $('.h5p-dialogcards-categories', this.$inner).remove();

  if (!isNoFilter) {
    this.filterList = filterList;
    this.filterOperator = filterOperator;
    this.applyFilter(filterList, filterOperator);
    this.currentFilter = catName;
  } else {
    this.filterList = undefined;
    this.filterOperator = undefined;
    this.applyFilter();
    this.currentFilter = this.params.noFilter;
  }

  if (
    this.cardsOrderChoice === 'user' &&
    this.cardOrder === undefined
  ) {
    this.createOrder().appendTo(this.$inner);
  }
  else if (
    this.enableCardsNumber &&
    this.nbCardsSelected === undefined &&
    this.nbCards > DialogcardsPapiJo.NB5
  ) {
    this.createNumberCards().appendTo(this.$inner);
  }
  else if (!this.matchIt && this.cardsSideChoice === 'user') {
    this.createcardsSideChoice().appendTo(this.$inner);
  }
  else {
    this.attachContinue();
  }
};

// --- Real filters ---
this.catFilters.forEach(({ filterList, filterOperator }) => {
  const numCards = this.applyFilter(filterList, filterOperator, true);
  const catName = this.makeCurrentFilterName(filterList, filterOperator);

  if (!numCards || catNames.includes(catName)) return;
  catNames.push(catName);

  createButton({
    title: catName,
    label: `${catName} (${numCards})`,
  })
    .click(() => handleClick(filterList, filterOperator, catName))
    .appendTo($optionButtons);
});

// --- "No filter" button ---
const totalCards = this.params.dialogs.length;

createButton({
  class: 'h5p-dialogcards-allCategories-button',
  title: this.params.noFilter,
  label: `${this.params.noFilter} (${totalCards})`,
})
  .click(() => handleClick(null, null, this.params.noFilter, true))
  .appendTo($optionButtons);

return $filterCards;
  };

  /**
   * Create filterCards option request
   * @returns {HTMLElement} this.currentDialogs array
   */

  this.createPlayMode = () => {
    
    const self = this;
    this.isReversed = false;
    const $play = $('<div>', {
      class: 'h5p-dialogcards-categories h5p-dialogcards-options',
      html: this.params.selectPlayMode,
    });

    const $optionButtons = $('<div>', {
      class: 'h5p-dialogcards-buttons',
    }).appendTo($play);
    
    for (let i = 0; i < this.playModeNames.length; i++) {
      let $class = 'h5p-joubelui-button';
      this.$button = createButton({
        class: $class,
        title: this.playModeNames[i].value,
        label: this.playModeNames[i].label,
        id: i,
        icon: 'check',
        selectedMode: this.playModeNames[i].value,
      })
        .click(() => {
          $('.h5p-dialogcards-categories', this.$inner).remove();
          console.log('this.filterByCategories = ' + this.filterByCategories
            + '\nthis.currentFilter = ' + this.currentFilter
            );
          this.playModeUser = this.playModeNames[i].value;
          if (
            this.filterByCategories === 'userFilter' &&
            this.currentFilter === undefined
          ) {
            this.createFilterCards().appendTo(this.$inner);
          }
          else if (
            this.cardsOrderChoice === 'user' &&
            this.cardOrder === undefined
          ) {
            this.createOrder().appendTo(this.$inner);
          }
          else if (
            this.enableCardsNumber &&
            this.nbCardsSelected === undefined &&
            this.nbCards > DialogcardsPapiJo.NB5
          ) {
            this.createNumberCards().appendTo(this.$inner);
          }
          else if (!this.matchIt && this.cardsSideChoice === 'user') {
            this.createcardsSideChoice().appendTo(this.$inner);
          }
          else {
            this.attachContinue();
          }
        })
        .appendTo($optionButtons);
    }
    return $play;
  };

  /**
   * Create footer/navigation line
   * @returns {HTMLElement} Footer element
   */
  this.createFooter00 = () => {
    console.log('1081 this.createFooter00');
    let $footer = $('<nav>', {
      class: 'h5p-navigation h5p-navigation--3-split ',
      role: 'navigation',
    });
    if (this.matchIt) {
      $footer.addClass('h5p-dialogcards-footer-match-right');
    }

    // 19/12/2025 added a timeout to the Prev and Next buttons to prevent double clicks
    if (!this.enableGotIt) {
      const preventDoubleClick = function ($btn, action) {
        if ($btn.prop('disabled')) {
          return;
        }
        $btn.prop('disabled', true);
        action();
          setTimeout(() => {
          $btn.prop('disabled', false);
        }, DialogcardsPapiJo.NB300);
      };

      // NEXT
      this.$next = JoubelUI.createButton({
        class: 'h5p-dialogcards-footer-button h5p-dialogcards-next truncated',
        title: this.params.next,
      })
        .click(() => {
          preventDoubleClick($(this), function () {
            this.nextCard();
          });
        })
        .appendTo($footer);

      // PREV
      this.$prev = JoubelUI.createButton({
        class: 'h5p-dialogcards-footer-button h5p-dialogcards-prev truncated',
        title: this.params.prev,
      })
        .click(() => {
          preventDoubleClick($(this), function () {
            this.prevCard();
          });
        })
        .appendTo($footer);

    }

    let classesRetry =
      'h5p-dialogcards-footer-button h5p-dialogcards-button-retry h5p-dialogcards-disabled';
    let titleRetry = '';
    let htmlRetry = '';
    if (this.enableGotIt || this.repetition) {
      titleRetry = this.params.nextRound;
      htmlRetry = this.params.nextRound;
      classesRetry =
        'h5p-dialogcards-footer-button h5p-dialogcards-retry h5p-dialogcards-disabled';
    }
    else {
      classesRetry += ' h5p-dialogcards-button-reset';
      titleRetry = this.params.retry;
      htmlRetry = this.params.retry;
    }
    this.$retry = createButton({
      class: classesRetry,
      title: titleRetry,
      html: htmlRetry,
    })
      .click(() => {
        if (this.repetition) {
          this.retryRepetition();
        }
        else {
          this.retry();
        }
      })
      .appendTo($footer);

    if (!this.enableGotIt) {
      
      this.$progress = $('<div>', {
        class: 'h5p-dialogcards-progress',
        'aria-live': 'assertive',
      }).appendTo($footer);
      /*
      this.$progress = $('<div>', {
            id: `h5p-dialogcards-progress-${this.idCounter}`,
            class: 'h5p-dialogcards-progress h5p-theme-progress',
            'aria-live': 'assertive',
          }).appendTo(this.$header);
          */
    }
    else {
      console.log('***********');
      this.$round = $('<div>', {
        class: 'h5p-dialogcards-round',
      }).appendTo($footer);

      this.$progress = $('<div>', {
        class: 'h5p-dialogcards-cards-left',
        'aria-live': 'assertive',
      }).appendTo($footer);
    }
    // Mode match with repetition. Under right card display footer similar to the GotIt mode.
    if (this.repetition) {
      this.$round = $('<div>', {
        class: 'h5p-dialogcards-round repetition',
      }).appendTo($footer);

      this.$progress = $('<div>', {
        class: 'h5p-dialogcards-cards-left repetition',
        'aria-live': 'assertive',
      }).appendTo($footer);
    }
    console.log('before return footer');
    return $footer;
  };

  this.createFooter2 = () => {
    console.log('this createFooter2');
      let nav;
      let nbCards = this.currentDialogs.length;
      let isDisabled = false;
      if (!this.enableGotIt) {
        
        nav = H5P.Components.Navigation({
          index: this.currentCardId,
          variant: '2-split-spread',
          navigationLength: nbCards,
          handlePrevious: this.prevCard.bind(this),
          handleNext: this.nextCard.bind(this),
          texts: {
            previousButton: this.params.prev,
            nextButton: this.params.next,
          },
        });

        if (this.params.behaviour.disableBackwardsNavigation) {
          const previousButton = nav.querySelector('.h5p-theme-nav-button.h5p-theme-previous');
          previousButton?.classList.add('h5p-dialogcards-visibility-hidden');
        }
        // only insert Retry button if at the end of carda and isturned
       
        this.$retry = createButton({
          classes: 'h5p-dialogcards-footer-button h5p-dialogcards-disabled',
          styleType: 'secondary',
          label: this.params.retry,
          icon: 'retry',
          onClick: () => {
          this.nav.setCurrentIndex(0);
          this.trigger('resetTask');
          }
        }).appendTo(nav);
       
        
      }
      else {
        isDisabled = true;
        nav = H5P.Components.Navigation();

        this.$round = $('<div>', {
          class: 'h5p-dialogcards-round',
        }).appendTo(nav);

        this.$progress = $('<div>', {
          class: 'h5p-dialogcards-round',
          'aria-live': 'assertive',
        }).appendTo(nav);
      this.$retry = createButton({
          classes: 'h5p-dialogcards-footer-button h5p-dialogcards-disabled',
          styleType: 'secondary',
          label: this.params.nextRound.replace('@round', this.currentRound + 1),
          icon: 'retry',
        onClick: () => {
          this.retryRepetition();
        }
        }).appendTo(nav);
       
        }
      
     return nav;

    };

  this.createFooterLeft = () => {
    let $footerLeft = $('<div>', {
      class: 'h5p-dialogcards-match-footer-left',
    });
    this.$progressFooterLeft = $('<div>', {
      class: 'h5p-dialogcards-cards-matched',
      'aria-live': 'assertive',
    }).appendTo($footerLeft);
    return $footerLeft;
  };

  this.createSubTitleFooter = () => {
    this.$subTitle = $('<div>', {
      class: 'h5p-dialogcards-sub-title',
    });

    this.$displaySubTitleFooter = $('<div>', {}).appendTo(this.$subTitle);

    return this.$subTitle;
  };

  /**
   * Called when all cards have been loaded.
   */
  this.updateImageSize = () => {
    // There is no current card in Interactive Book after a Restart.
    if (this.$current === undefined) {
      return;
    }

    // Find highest card content
    const relativeHeightCap = 15;
    let height = 0;
    let i;
    let foundImage = false;
    for (i = 0; i < this.currentDialogs.length; i++) {
      let card = this.currentDialogs[i];
      let $card = this.$current.find('.h5p-dialogcards-card-content');
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
        height / parseFloat(this.$inner.css('font-size'));
      if (relativeImageHeight > relativeHeightCap) {
        relativeImageHeight = relativeHeightCap;
      }
      this.$images.forEach(function ($img) {
        $img.parent().css('height', `${relativeImageHeight}em`);
      });
      this.$images2.forEach(function ($img) {
        $img.parent().css('height', `${relativeImageHeight}em`);
      });
    }
  };

  /**
   * @param {object} [$card] Current card
   * @param {string} [side] Which side of the card
   * @param {number} [index] Index of card
   */
    this.addTipToCard = ($card, side, index) => {
    // Make sure we have a side
    if (side !== 'back') {
      side = 'front';
    }

    // Make sure we have an index
    if (index === undefined) {
      index = this.$current.index();
    }

    // Remove any old tips
    $card.find('.joubel-tip-container').remove();

    // Add new tip if set and has length after trim
    let tips = this.currentDialogs[index].tips;
    if (tips !== undefined && tips[side] !== undefined) {
      let tip = tips[side].trim();
      if (!this.frontTextBackImage || (!this.matchIt && this.noText)) {
        if (tip.length) {
          if (!this.noText) {
            $card
              .find(
                '.h5p-dialogcards-card-text-wrapper .h5p-dialogcards-card-text-inner',
              )
              .after(
                JoubelUI.createTip(tip, {
                  tipLabel: this.params.tipButtonLabel,
                }),
              );
          }
          else {
            const showAudioTip =
              this.has2Audio ||
              this.matchIt
              && ((this.cardsSideMode === 'frontFirst'
                && this.currentDialogs[index].audioMedia.audio2 === undefined)
                 || (this.cardsSideMode === 'backFirst' && side === 'front') ||
                this.has2Audio
              );
            $card.find('.h5p-dialogcards-image-wrapper').append(
              JoubelUI.createTip(tip, {
                tipLabel: this.params.tipButtonLabel,
                addclass: 'joubel-tip-notext',
              }),
            );

            if (showAudioTip) {
              $card.find('.h5p-dialogcards-audio-wrapper').before(
                JoubelUI.createTip(tip, {
                  tipLabel: this.params.tipButtonLabel,
                  addclass: 'joubel-tip-notext',
                }),
              );
            }
          }
        }
      }
      else {
        if (tip.length) {
          if (this.cardsSideMode === 'backFirst' && !this.matchIt && !this.noText) {
            side = { front: 'back', back: 'front' }[side];
          }
          switch (side) {
            case 'front':
              $card
                .find(
                  '.h5p-dialogcards-card-text-wrapper .h5p-dialogcards-card-text-inner',
                )
                .after(
                  JoubelUI.createTip(tip, {
                    tipLabel: this.params.tipButtonLabel,
                  }),
                );
              break;
            case 'back':
              $card.find('.h5p-dialogcards-image-wrapper').after(
                JoubelUI.createTip(tip, {
                  tipLabel: this.params.tipButtonLabel,
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
    this.initCards = (cards) => {
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

    let loaded = 0;
    ///let existsCardOrder = true;
    if ($.isEmptyObject(this.cardOrder)) {
      this.existsCardOrder = false;
    }
    let initLoad = DialogcardsPapiJo.NB2;
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
      for (let i = 0; i < this.nbCards; i++) {
        randomCards[i] = cardOrdering[i][0];
      }

      // Retrieve the new shuffled order from the second index
      let newOrder = [];
      for (let i = 0; i < this.nbCards; i++) {
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
    // Push the new 'cards array' into this.currentDialogs.
    this.currentDialogs = cards;

    this.$cardwrapperSet = $('<div>', {
      class: 'h5p-dialogcards-cardwrap-set',
    });

    let setCardSizeCallback = function () {
      loaded++;
      if (loaded === initLoad) {
        this.resize();
      }
    };
    if (this.progress !== undefined && this.progress !== -1 && this.matchIt) {
      this.progress = this.progress / DialogcardsPapiJo.NB2;
    }
    // Used to randomize first left card on starting game
    let x = Math.floor(Math.random() * cards.length);
    // Do not randomize left card in browse side by side mode.
    if (this.matchIt && this.sideBySide) {
      x = 0;
    }
    // ************* LOOP TO CREATE CARDS **********************************
    for (let i = 0; i < cards.length; i++) {
      // Load cards progressively
      // If matchIt, all cards are loaded upon init, this is needed.
      // Set current card index
      // If there is a saved state, then set current card index to saved position (progress)
      // otherwise set it to zero.
      // Idem for current left card index
      let $cardWrapper = this.createCard(cards[i], i, setCardSizeCallback);
      $cardWrapper.addClass(`h5p-dialogcards-mode-${this.playModeUser}`);
      if (
        ((this.progress === undefined || this.progress === -1) && i === 0) ||
        (this.progress !== undefined && i === this.progress)
      ) {
        $cardWrapper.addClass('h5p-dialogcards-current');
        if (this.matchIt) {
          $cardWrapper.addClass('h5p-dialogcards-match-right');
        }
        this.$current = $cardWrapper;
      }
      // Only way I found to avoid jitter when resuming.
      if (this.progress !== undefined && i < this.progress) {
        $cardWrapper.addClass('h5p-dialogcards-previous');
      }

      if (!this.matchIt) {
        this.addTipToCard(
          $cardWrapper.find('.h5p-dialogcards-card-content'),
          'front',
          i,
        );
      }
      this.$cardwrapperSet.append($cardWrapper);

      // Create the matchLeft cards.
      if (this.matchIt) {
        let $cardWrapperLeft = this.createCardLeft(
          cards[i],
          i,
          setCardSizeCallback,
        );
        let indexLeft;
        if (
          (this.repetition && this.progressLeft) ||
          this.playModeUser === 'browseSideBySide'
        ) {
          indexLeft = (this.progressLeft - 1) / DialogcardsPapiJo.NB2;
        }

        if (
          ((this.progressLeft === undefined || this.progressLeft === -1) &&
            i === x) ||
          (this.progressLeft !== undefined && i === indexLeft)
        ) {
          $cardWrapperLeft.addClass('h5p-dialogcards-current-left');
          this.$currentLeft = $cardWrapperLeft;
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
          this.addTipToCard(
            $cardWrapper.find('.h5p-dialogcards-card-content'),
            'back',
            i,
          );
          this.addTipToCard(
            $cardWrapperLeft.find('.h5p-dialogcards-card-content'),
            'front',
            i,
          );
        }
        else {
          this.addTipToCard(
            $cardWrapper.find('.h5p-dialogcards-card-content'),
            'front',
            i,
          );
          this.addTipToCard(
            $cardWrapperLeft.find('.h5p-dialogcards-card-content'),
            'back',
            i,
          );
        }
        this.$cardwrapperSet.append($cardWrapperLeft);
      }
    }

    // ********************************************** END LOOP TO CREATE CARDS **********************************

    return this.$cardwrapperSet;
  };

  /**
   * Create a single card card
   * @param {object} card Card parameters
   * @param {number} cardNumber Card number in order of appearance
   * @param {function} [setCardSizeCallback] Set card size callback
   * @returns {HTMLElement} Card wrapper
   */
    this.createCard = (card, cardNumber, setCardSizeCallback) => {
    let $cardWrapper = $('<div>', {
      class: 'h5p-dialogcards-cardwrap',
    });

    let $cardHolder = $('<div>', {
      class: 'h5p-dialogcards-cardholder h5p-cardholder',
    }).appendTo($cardWrapper);

    // Progress for assistive technologies
    let progressText = this.params.progressText
      .replace('@card', (cardNumber + 1).toString())
      .replace('@total', this.params.dialogs.length.toString());
    $('<div>', {
      class: 'h5p-dialogcards-at-progress',
      text: progressText,
    }).appendTo($cardHolder);

    this.createCardContent(card, cardNumber, setCardSizeCallback).appendTo(
      $cardHolder,
    );

    return $cardWrapper;
  };

  
    this.createCardLeft = (rcard,cardNumber,setCardSizeCallback) => {
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
  
  this.createCardContent = (card,
    cardNumber,
    setCardSizeCallback,) => {
  
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

      this.createCardFooter(card, $cardContent)
        .appendTo($cardContent)
        .addClass(this.audioOnly ? ' spacerAudioOnly' : ' spacer');
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
    this.createCardContentLeft = (    card,
    cardNumber,
    setCardSizeCallback) => {
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
      this
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
        this.createCardAudio(card).appendTo($cardTextInnerContent);
      }
      if (card.audioMedia.audio2 !== undefined) {
        this.createCardAudio2(card).appendTo($cardTextInnerContent);
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
  
    this.createCardFooter = (card, $cardContent) => {
    console.log('createCardFooter');
    let footerClass;
    if (!this.enableGotIt) {
      footerClass = 'h5p-dialogcards-card-footer';
      if (this.sideBySide) {
        footerClass += ' subtitle';
      }
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
      footerClass = 'h5p-dialogcards-card-footer';
      if (!this.frontTextBackImage) {
        //// todo
        ///footerClass = 'h5p-dialogcards-card-footer-enablegotit';
      }
      else {
        ///footerClass = 'h5p-dialogcards-card-footer-enablegotit front-text-back-image';
      }
    }
    let $cardFooter = $('<div>', {
      class: footerClass,
    });

    let classesRepetition = 'h5p-dialogcards-button-hidden';
    let classesRepetitionOff = '';
    let attributeTabindex = '-1';

    if (this.enableGotIt || this.matchIt) {
      classesRepetition =
        'h5p-dialogcards-quick-progression h5p-dialogcards-disabled';
      attributeTabindex = '0';
    }
    else {
      classesRepetitionOff = 'h5p-dialogcards-button-hidden';
    }

    if (this.enableGotIt) {
      
    }

    if (!this.matchIt) {      
        this.$buttonTurn = $(H5P.Components.Button({
          label: this.hideTurnButton
            ? this.params.check
            : this.params.answer,
          icon: 'flip',
          onClick: (event) => {
            const card = event.currentTarget.closest('.h5p-dialogcards-cardwrap');
            this.turnCard($(card));
          },
        }))
        .appendTo($cardFooter);
    
    }
    else if (!this.sideBySide) {
      this.$buttonMatch = $(H5P.Components.Button({
        class: 'h5p-dialogcards-button-match',
        label: this.params.matchButtonLabel,
        tabindex: 1,
        icon: 'check',
        onClick: (event) => {
          const $cardwrap = $(this).parents('.h5p-dialogcards-cardwrap');
          if (this.repetition) {
            this.matchCardsRepetition($cardwrap);
          }
          else {
            this.matchCards($cardwrap);
          }
        }
      })).appendTo($cardFooter);

      let classesMatch =
        'h5p-dialogcards-answer-button h5p-dialogcards-quick-progression' 
        + ' h5p-dialogcards-match h5p-dialogcards-disabled';
      // JR dummy button for correct match.
      this.$buttonCorrectMatch = H5P.JoubelUI.createButton({
        class: classesMatch,
        html: this.params.correctMatch,
      })
        .addClass('correct')
        .attr('tabindex', -1)
        .appendTo($cardFooter);

      // JR dummy button for incorrect match.
      this.$buttonIncorrectMatch = H5P.JoubelUI.createButton({
        class: classesMatch,
        html: this.params.incorrectMatch,
      })
        .addClass('incorrect')
        .attr('tabindex', -1)
        .appendTo($cardFooter);
    }

    if (this.enableGotIt) {
      classesRepetition = ''; 
      this.$buttonIncorrect = $(H5P.Components.Button({
        classes: `h5p-dialogcards-answer-button incorrect ${classesRepetition}`,
        label: 'this.params.incorrectAnswer',
        disabled: true,
        tabindex: attributeTabindex,
        styleType: 'secondary',
        onClick: (event) => {
          this.gotItIncorrect();
        }
      })).appendTo($cardFooter);

      this.$buttonCorrect = $(H5P.Components.Button({
        classes: `h5p-dialogcards-answer-button correct ${classesRepetition}`,
        label: this.params.correctAnswer,
        disabled: true,
        tabindex: attributeTabindex,
        styleType: 'secondary',
        onClick: (event) => {
          const $cardwrap = $(this).parents('.h5p-dialogcards-cardwrap');
          this.gotItCorrect($cardwrap);
        }
      })).appendTo($cardFooter);
    }

    return $cardFooter;
  };

  /**
   * Create card image
   * @param {object} card Card parameters
   * @param {function} [loadCallback] Function to call when loading image
   * @returns {HTMLElement} Card image wrapper
   */

  
    this.createCardImage = (card, cardNumber, loadCallback, isLeft = false) => {
    
    let $image;
    let $image2;
    let i;
    let i2;
    let $imageWrapper = $('<div>', {
      class: 'h5p-dialogcards-image-wrapper',
    });
    // Case where only some cards have 2 images.
    let cardHasTwoImages;
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
          src="${H5P.getPath(card.imageMedia.image.path, this.id)}"/>`);
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
          src="${H5P.getPath(card.imageMedia.image2.path, this.id)}"/>`);
      const shouldShowImage2 =
        (isBackFirst && !this.matchIt && !card.imageMedia.image) ||
        (this.matchIt && !this.hasTwoImages);
      if (!shouldShowImage2) {
        $image2.addClass('h5p-dialogcards-hide');
      }
      if (loadCallback) {
        $image2.load(loadCallback);
      }
      if (card.imageAltText2) {
        $image2.attr('alt', card.imageAltText2);
      }
      this.$images2.push($image2);
      $image2.appendTo($imageWrapper);
    }

    // Needed for notext image + audio
    // this.noDupeFrontPicToBack must be enabled
    if (this.frontImageBackAudio && typeof $image !== 'undefined') {
      // Case 1: matchIt enabled
      if (this.matchIt) {
        if (isFrontFirst) {
          // both sides hide image
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
    // Hides image on the left side is nodupe
    const { image, image2 } = card.imageMedia;
    const sameImage = image?.path === image2?.path;

    if (this.noDupeFrontPicToBack && this.matchIt) {
      if (!isLeft && sameImage) {
        $image.add($image2).addClass('h5p-dialogcards-hide');
      }
      else if (isLeft && image) {
        $image.addClass('h5p-dialogcards-hide');
      }
    }
    /*******************************************************************************/

    if (typeof $image !== 'undefined') {
      this.$images.push($image);
      $image.appendTo($imageWrapper);
    }

    // Restore initial card images
    if (this.hasTwoImages || cardHasTwoImages && isLeft) {
      card.image = i;
      card.image2 = i2;
    }

    return $imageWrapper;
  };

  /**
   * Create card audio
   * @param {object} card Card parameters
   * @returns {HTMLElement} Card audio element
   */
  
    this.createCardAudio = (card) => {
    
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
        audioNotSupported: this.params.audioNotSupported,
      };
      audio = new Audio(audioDefaults, this.id);
      audio.attach($audioWrapper);
      // Have to stop else audio will take up a socket pending forever in chrome.
      if (audio.audioMedia && audio.audioMedia.preload) {
        audio.audio.preload = 'none';
      }
    }
    this.audios.push(audio);
    return $audioWrapper;
  };

  /**
   * Create card audio for the back of the card
   * @param {object} card Card parameters
   * @returns {HTMLElement} Card audio element
   */
  
  this.createCardAudio2 = (card) => {
    
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
        audioNotSupported: this.params.audioNotSupported,
      };
      audio2 = new Audio(audioDefaults, this.id);
      audio2.attach($audioWrapper2);
      // Have to stop else audio will take up a socket pending forever in chrome.
      if (audio2.audio && audio2.audio.preload) {
        audio2.audio.preload = 'none';
      }
    }
    this.audios2.push(audio2);
    return $audioWrapper2;
  };

  /**
   * Update navigation text and show or hide buttons.
   */
  
  this.updateNavigation = () => {
    console.log('updateNavigation /// this.enableGotIt = ' + this.enableGotIt);
    // Moved this.$progress.text to here for correct progress updating.
    /*
    need to check value of this.$current.index()
    */
    if (this.playModeUser === 'normal') {
      this.$progress.text(this.params.progressText
          .replace('@card', this.$current.index() + 1)
          .replace('@total', this.nbCardsSelected.toString()),
        );
    }
    let $prevCard;
    let $matchButton;
    let $card = this.$current.find('.h5p-dialogcards-card-content');
    let $nextCard = this.$current.nextAll('.h5p-dialogcards-cardwrap').eq(0);
    
    
    if (this.sideBySide) {
      let $cardFooter = $card.find('.h5p-dialogcards-card-footer');
      $cardFooter.html(this.rightSubTitle);
      const i = this.$current.index() / DialogcardsPapiJo.NB2;
      // Clear subTitle text in case this.currentDialogs[i].cardSubtitle is undefined
      let cardSubTitle = this.currentDialogs[i].cardSubtitle;
      if (cardSubTitle === undefined) {
        cardSubTitle = '&nbsp;';
        this.$subTitle.addClass('h5p-dialogcards-hide');
      }
      else {
        this.$subTitle.removeClass('h5p-dialogcards-hide');
      }
      this.$displaySubTitleFooter.html('');
      if (this.params.enableCardSubTitle) {
        this.$displaySubTitleFooter.html(cardSubTitle);
      }
    }
    if (this.matchIt && !this.sideBySide) {
      // Needed if $matchButton was just de-activated upon an incorrect match.
      $matchButton = $card.find('.h5p-dialogcards-button-match');
      if (this.cardsLeft !== 0) {
        $matchButton.removeClass('h5p-dialogcards-disabled');
      }
      else {
        $matchButton.addClass('h5p-dialogcards-disabled');
      }
    }

    ///$nextCard = this.$current.nextAll('.h5p-dialogcards-cardwrap').eq(0);

    if (this.repetition) {
      while ($nextCard.hasClass('h5p-dialogcards-noMatch')) {
        $nextCard = $nextCard.nextAll('.h5p-dialogcards-cardwrap').eq(0);
      }
    }
    /* todo 
    if ($nextCard.length && !this.enableGotIt) {
      this.$next.removeClass('h5p-dialogcards-disabled');
      if (this.cardsLeft === 0) {
        this.$next.addClass('h5p-dialogcards-disabled');
      }
      this.$retry.addClass('h5p-dialogcards-disabled');
    }
    else if (!this.enableGotIt) {
      this.$next.addClass('h5p-dialogcards-disabled');
    }
    */
    $prevCard = this.$current.prevAll('.h5p-dialogcards-cardwrap').eq(0);

    if (this.repetition) {
      if ($prevCard.hasClass('h5p-dialogcards-noMatch')) {
        $prevCard.removeClass('h5p-dialogcards-previous');
      }
      $prevCard = this.$current.prevAll('.h5p-dialogcards-previous').eq(0);
    }
//// todo plantage sur normal mode ?
    // enableGotIt mode does not have prev or next buttons
    /*
    if (!this.enableGotIt) {
      if ($prevCard.length) {
        this.$prev.removeClass('h5p-dialogcards-disabled');
      }
      else {
        this.$prev.addClass('h5p-dialogcards-disabled');
      }
    }
*/
    if (this.enableGotIt) {
      // In case it was hidden when refreshing
      $card
        .find('.h5p-dialogcards-answer-button-off')
        .removeClass('h5p-dialogcards-hide');
      if (this.hideTurnButton) {
        $card.find('.h5p-dialogcards-turn').removeClass('h5p-dialogcards-hide');
      }
      const selectionIndex = this.$current.index();
      this.$progress.text(
        this.params.cardsLeft.replace(
          '@number',
          this.currentDialogs.length - selectionIndex - this.endOfStack,
        ),
      );
      console.log('this.currentRound = ' + this.currentRound);
      this.$round.text(this.params.round.replace('@round', this.currentRound));
    }
    else if (this.matchIt && !this.sideBySide) {
      this.$progressFooterLeft.text(
        this.params.matchesFound
          .replace('@correct', this.correct)
          .replace('@incorrect', this.incorrect),
      );
      this.matchCorrect = null;
      if (!this.repetition) {
        this.$progress.text(
          this.params.progressText
            .replace('@card', this.$current.index() / DialogcardsPapiJo.NB2 + 1)
            .replace('@total', this.currentDialogs.length),
        );
      }
      else {
        this.$progress.text(
          this.params.cardsLeft.replace('@number', this.cardsLeft),
        );
        this.$round.text(
          this.params.round.replace('@round', this.currentRound),
        );
      }
    }
    else if (this.sideBySide) {
      this.$progress.text(
        this.params.progressText
          .replace('@card', this.$current.index() / DialogcardsPapiJo.NB2 + 1)
          .replace('@total', this.currentDialogs.length),
      );
      if ($nextCard.length === 0) {
        const retryOrReset = this.getRetryOrReset();
        let message = retryOrReset[0];
        let thisclass = retryOrReset[1];
        this.$retry
          .removeClass('h5p-dialogcards-disabled h5p-dialogcards-button-retry')
          .addClass(thisclass)
          .html(message)
          .attr('title', message);
      }
    }
    else {
      this.$progress.text(
        this.params.progressText
          .replace('@card', this.$current.index() + 1)
          .replace('@total', this.currentDialogs.length),
      );
    }
  };

  /**
   * Show next card. If matchIt show next card on the right.
   */
  this.nextCard = () => {
  console.log('this.nextCard function');
    // In those 2 modes, consider activity answered when first card is clicked.
    if (
      this.playModeUser === 'normal' ||
      this.playModeUser === 'browseSideBySide'
    ) {
      this.triggerAnswered();
    }
    this.stopAudio(this.$current.index());
    if (this.matchIt) {
      let $leftCard = this.$currentLeft;
      this.stopAudio($leftCard.index());
    }

    let $nextCard = this.$current.nextAll('.h5p-dialogcards-cardwrap').eq(0);

    if (this.repetition) {
      while (
        $nextCard.length &&
        $nextCard.hasClass('h5p-dialogcards-noMatch')
      ) {
        $nextCard = $nextCard.nextAll('.h5p-dialogcards-cardwrap').eq(0);
      }
    }

    if ($nextCard.length) {
      this.$current
        .removeClass('h5p-dialogcards-current h5p-dialogcards-match-right')
        .addClass('h5p-dialogcards-previous');
      this.$current = $nextCard.addClass('h5p-dialogcards-current');
      if (this.matchIt) {
        this.$current.addClass('h5p-dialogcards-match-right');
      }
      this.setCardFocus(this.$current);
      // If matchIt, all cards are loaded upon init, this is needed.
      // Add next card.
      if (!this.matchIt) {
        let $loadCard = this.$current.next('.h5p-dialogcards-cardwrap');
        if (
          !$loadCard.length &&
          this.$current.index() + 1 < this.currentDialogs.length
        ) {
          let $cardWrapper = self
            .createCard(
              this.currentDialogs[this.$current.index() + 1],
              this.$current.index() + 1,
            )
            .appendTo(this.$cardwrapperSet);
          this.addTipToCard(
            $cardWrapper.find('.h5p-dialogcards-card-content'),
            'front',
            this.$current.index() + 1,
          );
        }
      }
      //needed?
      this.resize();
      if (!this.matchIt) {
        this.turnCardToFront();
      }
    }
    else {
      // Next card not loaded or end of cards.
      // End of stack reached
      this.resetButtons('retry button');
    }

    this.updateNavigation();

    if (this.sideBySide) {
      let $leftCard = this.$currentLeft;
      $leftCard.removeClass('h5p-dialogcards-current-left');
      // Set Timeout to avoid blink between 2 left cards
      setTimeout(() => {
        this.nextCardLeft();
        this.updateNavigation();
      }, DialogcardsPapiJo.NB300);
    }
  };

  
  this.nextCardLeft = () => {
    
    let x = Math.floor(Math.random() * this.currentDialogs.length);
    if (this.matchIt && this.sideBySide) {
      x = 0;
    }
    let $nextCardLeft = this.$currentLeft
      .nextAll('.h5p-dialogcards-cardwrap-left')
      .eq(x);
    if ($nextCardLeft.length) {
      this.$currentLeft = $nextCardLeft.addClass(
        'h5p-dialogcards-current-left',
      );
      this.$currentLeft.removeClass('h5p-dialogcards-disabled');
      this.resize();
    }
    else {
      let $prevCardLeft = this.$currentLeft
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
      this.$currentLeft = $prevCardLeft.addClass(
        'h5p-dialogcards-current-left',
      );
      this.$currentLeft.removeClass(
        'h5p-dialogcards-previous-left h5p-dialogcards-disabled',
      );
    }
  };

  
  this.nextCardLeftRepetition = () => {
    
    let x = Math.floor(Math.random() * this.cardsLeft);
    // let $leftCard = this.$currentLeft;
    let $nextCardLeft = this.$currentLeft
      .nextAll('.h5p-dialogcards-cardwrap-left-repetition')
      .eq(x);

    if ($nextCardLeft.length) {
      this.$currentLeft = $nextCardLeft.addClass(
        'h5p-dialogcards-current-left',
      );
      this.$currentLeft.removeClass('h5p-dialogcards-disabled');
      this.resize();
    }
    else {
      let $prevCardLeft = this.$currentLeft
        .prevAll('.h5p-dialogcards-cardwrap-left-repetition')
        .eq(x);
      // let i = 0;
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
      this.$currentLeft = $prevCardLeft.addClass(
        'h5p-dialogcards-current-left',
      );
      this.$currentLeft.removeClass(
        'h5p-dialogcards-previous-left h5p-dialogcards-disabled',
      );
    }
  };

  /**
   * Show next card after user clicked on the incorrectAnswer button.
   */
  
  this.gotItIncorrect = () => {
    const self = this;
    let $next = this.$current.next('.h5p-dialogcards-cardwrap');
    const $cardContent = this.$current.find('.h5p-dialogcards-card-content');
    $cardContent.removeClass('h5p-dialogcards-turned');
    const selectionIndex = this.$current.index();
    let cardsLeftInStack =
      this.currentDialogs.length - selectionIndex - this.endOfStack;
    this.incorrect++;
    if ($next.length) {
      let audioIndex = this.nbCards - this.currentDialogs.length;
      this.stopAudio(audioIndex);
      this.$current
        .removeClass('h5p-dialogcards-current h5p-dialogcards-turned')
        .addClass('h5p-dialogcards-previous');
      this.$current = $next.addClass('h5p-dialogcards-current');
      this.setCardFocus(this.$current);
      this.turnCardToFront();

      this.$current
        .find('.h5p-dialogcards-answer-button')
        /// todo do not disable for gotit
        ///.addClass('h5p-dialogcards-disabled');

      // Add next card if not loaded yet.
      let $loadCard = this.$current.next('.h5p-dialogcards-cardwrap');
      if (
        !$loadCard.length &&
        this.$current.index() + 1 < this.currentDialogs.length
      ) {
        let $cardWrapper = self
          .createCard(
            this.currentDialogs[this.$current.index() + 1],
            this.$current.index() + 1,
          )
          .appendTo(this.$cardwrapperSet);
        this.addTipToCard(
          $cardWrapper.find('.h5p-dialogcards-card-content'),
          'front',
          this.$current.index() + 1,
        );
        this.resize();
      }
      this.turnCardToFront();

      // Update navigation
      this.updateNavigation();
      this.resetButtons('answer buttons');

      // Next card not loaded or end of cards.
    }
    else if (cardsLeftInStack) {
      this.endOfStack = 1;
      this.updateNavigation();
      this.resetButtons('retry button');
    }
  };

  /**
   * Show previous card.
   */
  
  this.prevCard = () => {
    
    if (this.matchIt) {
      const $leftCard = this.$currentLeft;
      this.stopAudio($leftCard.index());
      if (this.sideBySide) {
        $leftCard.removeClass('h5p-dialogcards-current-left');
        let $prevCardLeft = this.$currentLeft
          .prevAll('.h5p-dialogcards-cardwrap-left')
          .eq(0);
        if (!$prevCardLeft.length) {
          $prevCardLeft = $('.h5p-dialogcards-cardwrap-left').first();
        }
        setTimeout(() => {
          this.$currentLeft = $prevCardLeft.addClass(
            'h5p-dialogcards-current-left',
          );
          this.$currentLeft.removeClass(
            'h5p-dialogcards-previous-left h5p-dialogcards-disabled',
          );
        }, DialogcardsPapiJo.NB300);
      }
    }
    let $prevCard = this.$current.prevAll('.h5p-dialogcards-cardwrap').eq(0);
    // let $nomatch = $prevCard.hasClass('h5p-dialogcards-noMatch');
    while ($prevCard.length && $prevCard.hasClass('h5p-dialogcards-noMatch')) {
      $prevCard = $prevCard.prevAll('.h5p-dialogcards-cardwrap').eq(0);
    }
    // let $nextCard = this.$current.nextAll('.h5p-dialogcards-cardwrap').eq(0);
    if ($prevCard.length) {
      this.stopAudio(this.$current.index());
      this.$current.removeClass('h5p-dialogcards-current');
      this.$current = $prevCard
        .addClass('h5p-dialogcards-current')
        .removeClass('h5p-dialogcards-previous');
      if (this.matchIt) {
        this.$current.addClass('h5p-dialogcards-match-right');
      }
      this.resize();
      this.resizeOverflowingText();
      this.setCardFocus(this.$current);
    }
    if (!this.matchIt) {
      this.turnCardToFront();
    }
    this.updateNavigation();
  };

  /**
   * @param {object} cardsOrder User selected cards order option (normal/random).
   */
  
  this.randomizeOrder = (cardsOrder) => {
    
    this.cardsOrderMode = cardsOrder;
    $('.h5p-dialogcards-order', this.$inner).remove();
    if (
      this.enableCardsNumber &&
      cardsOrder === 'random' &&
      this.nbCards > DialogcardsPapiJo.NB5
    ) {
      this.createNumberCards().appendTo(this.$inner);
    }
    else {
      if (this.cardsSideChoice === 'user') {
        $('.h5p-dialogcards-number', this.$inner).remove();
        // Just in case user clicked twice on the No button!
        
        setTimeout(() => {
          this.createcardsSideChoice().appendTo(this.$inner);
        }, DialogcardsPapiJo.NB300);
      }
      else {
        this.attachContinue();
      }
    }
  };

  /**
   * When navigating forward or backward, reset card to front view if has previously been turned
   * so that user can see the Question side, not the Answer side of the card.
   */
  this.turnCardToFront = () => {
    let $c = this.$current.find('.h5p-dialogcards-card-content');
    let turned = $c.hasClass('h5p-dialogcards-turned');
    if (turned) {
      this.turnCard(this.$current);
      if (this.enableGotIt) {
        let $cg = this.$current.find('.h5p-dialogcards-answer-button');
        $cg.addClass('h5p-dialogcards-disabled');
      }
    }
  };

  /**
   * Show the opposite site of the card.
   * @param {object} [$card] Current card
   */
  this.turnCard = ($card) => {
    let $cg;
    let $c = this.$current.find('.h5p-dialogcards-card-content');
    let $ci = $card.find('.h5p-dialogcards-image');
    let $ci2 = $card.find('.h5p-dialogcards-image2');
    let $au = $card.find('.h5p-audio-wrapper');
    let turned = $c.hasClass('h5p-dialogcards-turned');
    let $ch = $card
      .find('.h5p-dialogcards-cardholder')
      .addClass('h5p-dialogcards-collapse');
    if (this.enableGotIt) {
      $cg = $card.find('.h5p-dialogcards-answer-button');
      const $answerButtons = $card.find('.h5p-dialogcards-answer-button');
      $answerButtons
            .attr('disabled', false);
    }
    // Removes tip, since it destroys the animation:
    $c.find('.joubel-tip-container').remove();

    // Check if card has been turned before
    this.$cardSideAnnouncer.html(
      turned ? this.params.cardFrontLabel : this.params.cardBackLabel,
    );

    // Update HTML class for card
    $c.toggleClass('h5p-dialogcards-turned', !turned);

      setTimeout(() => {
      $ch.removeClass('h5p-dialogcards-collapse');
      if (!this.noText) {
        // Manage front & back texts.
        let $cardText = $card.find('.h5p-dialogcards-card-text');
        this.cardsSideMode = 'frontFirst';
        
        
        if (this.cardsSideMode === 'frontFirst') {
          if (this.currentDialogs[$card.index()].answer) {
            this.changeText(
              $c,
              this.currentDialogs[$card.index()][turned ? 'text' : 'answer'],
            );
            $cardText.removeClass('hide');
          }
          else {
            // We need to reset text to its original front card state.
            $cardText.toggleClass('hide', !turned);
          }
        }
        else if ($ci2.attr('src')
          || this.frontTextBackAudio && $au
        ) {
          // backFirst & image2
          this.changeText(
            $c,
            this.currentDialogs[$card.index()][turned ? 'text' : 'answer'],
          );
          $cardText.removeClass('hide');
        }
        else {
          this.changeText($c,this.currentDialogs[$card.index()][turned ? 'text' : 'answer'],
          );
        }
      }
      let $off = this.$current.find('.h5p-dialogcards-answer-button-off');

      // Manage front & back images.
      // If exists image2
      if ($ci2.attr('src')) {
        if (this.cardsSideMode === 'frontFirst') {
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
        if (this.cardsSideMode === 'frontFirst' && this.noDupeFrontPicToBack) {
          $ci.toggleClass('h5p-dialogcards-hide');
          $ci2.toggleClass('h5p-dialogcards-hide');
        }
        else {
          if (this.noDupeFrontPicToBack) {
            $ci.toggleClass('h5p-dialogcards-hide');
          }
          else {
            $ci2.removeClass('h5p-dialogcards-hide');
          }
        }
      }
      // Manage front & back images.
      let audioIndex = this.$current.index();
      /* why?
      if (this.enableGotIt) {
        audioIndex = (this.nbCards - this.currentDialogs.length);
      }
      */
      let audio = this.audios[audioIndex];
      if (audio || this.noText) {
        $ch.find('.h5p-dialogcards-audio-wrapper').toggleClass('hide');
        this.stopAudio(audioIndex);
      }

      let audio2 = this.audios2[audioIndex];
      if (audio2 || this.noText) {
        $ch.find('.h5p-dialogcards-audio-wrapper2').toggleClass('hide');
        this.stopAudio(audioIndex);
      }

      if (this.enableGotIt) {
        $cg.toggleClass('h5p-dialogcards-disabled');
        $off.toggleClass('h5p-dialogcards-disabled');
      }
      if (this.frontTextBackImage) {
        $card
          .find('.h5p-dialogcards-image-wrapper')
          .toggleClass('hide');
        $card
          .find('.h5p-dialogcards-card-text-wrapper')
          .toggleClass('hide');
      }
      // Toggle state for gotIt buttons
      if (this.enableGotIt) {
        if (!turned && this.hideTurnButton) {
          let $buttonTurn;
          $buttonTurn = this.$current.find('.h5p-dialogcards-turn');
          $buttonTurn.addClass('h5p-dialogcards-hide');
        }
        const $answerButtons = $card.find('.h5p-dialogcards-answer-button');
          $answerButtons
            .addClass('h5p-dialogcards-quick-progression')
            .removeClass('h5p-dialogcards-disabled')
            .attr('tabindex', 0);
      }

      // Add backside tip
      // Had to wait a little, if not Chrome will displace tip icon
        setTimeout(() => {
        this.addTipToCard($c, turned ? 'front' : 'back');
        if (
          !this.$current.next('.h5p-dialogcards-cardwrap').length &&
          this.currentDialogs.length > 1
        ) {
          if (this.params.behaviour.enableRetry && !this.enableGotIt) {
            this.resizeOverflowingText();
          }
        }
      }, DialogcardsPapiJo.NB200);

      this.resizeOverflowingText();

      // Focus text
      $card.find('.h5p-dialogcards-card-text-area').focus();
    }, DialogcardsPapiJo.NB200);

    let $nextCard = this.$current.next('.h5p-dialogcards-cardwrap');
    
    if (
      this.params.behaviour.enableRetry &&
      $nextCard.length === 0 &&
      !this.enableGotIt
    ) {
      this.$retry.removeClass('h5p-dialogcards-disabled');
      ///this.$next.addClass('h5p-dialogcards-disabled');
      this.resetButtons('retry button');
    }
    if (this.endOfStack) {
      this.updateNavigation();
    }
  };

  /**
   * Change text of card, used when turning cards.
   * @param {object} [$card] Current card
   * @param {string}text Current card text
   */
  
  this.changeText = ($card, text) => {
    let $cardText = $card.find('.h5p-dialogcards-card-text-area');
    $cardText.html(text);
    $cardText.toggleClass('hide', !text || !text.length);
  };

  /**
   * Stop audio of card with cardindex
   * @param {number} cardIndex Index of card
   */
  
  this.stopAudio = (cardIndex) => {
    
    let audio = this.audios[cardIndex];
    if (audio && audio.stop) {
      audio.stop();
    }
    let audio2 = this.audios2[cardIndex];
    if (audio2 && audio2.stop) {
      audio2.stop();
    }
  };

  /**
   * Reset audio of card with cardindex
   * @param {number} cardIndex Index of card
   */
  
  this.resetAudio = (cardIndex) => {
    
    let audio = this.audios[cardIndex];
    if (audio && audio.stop) {
      audio.stop();
      audio.seekTo(0);
    }
    let audio2 = this.audios2[cardIndex];
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

  
  this.removeAudio = ($card) => {
    
    this.stopAudio($card.closest('.h5p-dialogcards-cardwrap').index());
    $card.find('.h5p-audio-inner').addClass('hide');
  };

  
  this.showAllAudio = () => {
    
    this.$cardwrapperSet.find('.h5p-audio-inner').removeClass('hide');
  };

  /**
   * Reset the task so that the user can re-start from first card.
   */
  
  this.retry = () => {
    console.log('this.retry');
    let $card = $(this);
    // To hide the summary text upon retrying
    if (this.noText || this.frontTextBackImage) {
      $card.find('.h5p-dialogcards-card-text-wrapper').addClass('hide');
    }
    // In case a dark background was set for the cards.
    $card
      .find('.h5p-dialogcards-card-content')
      .removeClass('h5p-dialogcards-summary-screen');
    this.stopAudio(this.$current.index());
    if (!this.enableGotIt) {
      this.taskFinished = true;
      let $cards = this.$inner.find('.h5p-dialogcards-cardwrap');
      $cards.each(function (index) {
        this.resetAudio(index);
        if (this.repetition) {
          this.removeClass('h5p-dialogcards-noMatch');
        }
      });
      this.resetTask();

      // Needed to re-start on first card if user saved state at another card.
      this.progress = 0;
      return;
    }
    if (
      this.taskFinished &&
      this.playModeUser !== 'normal' &&
      this.playModeUser !== 'browseSideBySide'
    ) {
      this.finishedScreen();
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
      this.currentDialogs.splice(this.lastCardIndex, 1);
      if (!$.isEmptyObject(this.cardOrder)) {
        this.cardOrder.splice(this.lastCardIndex, 1);
      }
      // TODO JR not sure this is actually used!
      if (!this.params.behaviour.scaleTextNotCard) {
        this.cardSizeDetermined.splice(this.lastCardIndex + DialogcardsPapiJo.NB2, 1);
      }
      // Remove the 'gotitdone' card from DOM
      $('.h5p-dialogcards-gotitdone', this.$inner).remove();

      this.lastCardIndex = 0;
    }
    let $cards = this.$inner.find('.h5p-dialogcards-cardwrap');
    this.stopAudio(this.$current.index());
    this.$current.removeClass('h5p-dialogcards-current');
    this.$current = $cards.filter(':first').addClass('h5p-dialogcards-current');

    this.updateNavigation();
    // audio buttons
    let paused = 'h5p-audio-minimal-play-paused';
    let play = 'h5p-audio-minimal-play';

    $cards.each(function (index) {
      let $card = $(this).removeClass(
        'h5p-dialogcards-previous h5p-dialogcards-turned',
      );
      if (!this.noText) {
        this.changeText($card, this.currentDialogs[$card.index()].text);
      }
      let $cardContent = $card.find('.h5p-dialogcards-card-content');
      // Show all front images (ci) and hide all back images (ci2)
      let $ci = $card.find('.h5p-dialogcards-image');
      let $ci2 = $card.find('.h5p-dialogcards-image2');

      if (this.cardsSideMode === 'backFirst') {
        if (this.hasTwoImages) {
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
      this.resetAudio(index);

      // Replace potential "paused" button with "ready to play" button
      // Not needed? 19:05 21/02/2026
      /*
      let $caButton = $card.find('.h5p-audio-minimal-button');
      if ($caButton.hasClass(paused)) {
        $caButton.switchClass(paused, play);
      }
      */
      $cardContent.removeClass('h5p-dialogcards-turned');
      this.addTipToCard($cardContent, 'front', index);

      // In case it was hidden on the summary screen.
      $card
        .find('.h5p-dialogcards-image-wrapper')
        .removeClass('h5p-dialogcards-hide');
      $card
        .find('.h5p-dialogcards-card-text')
        .removeClass('hide');

      if (this.frontTextBackImage) {
        const showText = this.cardsSideMode === 'frontFirst';
        $card
          .find('.h5p-dialogcards-image-wrapper')
          .toggleClass('hide', showText);
        $card
          .find('.h5p-dialogcards-card-text-wrapper')
          .toggleClass('hide', !showText);
      }

    });
    // hide and show audio not used in papi Jo version BUT SHOULD DO A GENERAL RESET OF ALL AUDIO BUTTONS upon retry

    //this.showAllAudio();
    this.resizeOverflowingText();
    this.setCardFocus(this.$current);
    this.$current
      .find('.h5p-dialogcards-answer-button-off')
      .removeClass('h5p-dialogcards-disabled');

    this.resetButtons('restart');
  };

  /**
   * Reset the task so that the user can re-start from first card.
   */
  
  this.retryRepetition = () => {
    console.log('this.retryRepetition');
    let $card = $(this);
    // Now remove the current 'gotitdone' card from the cards and cardOrder arrays.
    let index = this.lastCardIndex;
    this.currentDialogs.splice(index, 1);
    if (!$.isEmptyObject(this.cardOrder)) {
      this.cardOrder.splice(index, 1);
    }

    // Remove the 'gotitdone' card from DOM
    $('.h5p-dialogcards-gotitdone', this.$inner).remove();
    this.cardsLeft = this.incorrect;

    // In case a dark background was set for the cards.
    $card
      .find('.h5p-dialogcards-card-content')
      .removeClass('h5p-dialogcards-summary-screen');

    this.stopAudio(this.$current.index());
    if (this.taskFinished) {
      this.finishedScreen();
    }

    this.currentRound++;
    this.endOfStack = 0;
    this.nbCardsInCurrentRound = this.incorrect;
    this.correct = 0;
    this.incorrect = 0;
    this.noMatchCards = [];
    this.$progress.removeClass('h5p-dialogcards-hide');
    let $cards = this.$inner.find('.h5p-dialogcards-cardwrap');

    this.$current = $cards.filter(':first').addClass('h5p-dialogcards-current');
    this.$current.addClass('h5p-dialogcards-match-right');
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
//      this.resetAudio(index);

      // Replace potential "paused" button with "ready to play" button
      /*
      let $caButton = $card.find('.h5p-audio-minimal-button');
      if ($caButton.hasClass(paused)) {
        $caButton.switchClass(paused, play);
      }
      */
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
    $cards = this.$inner.find('.h5p-dialogcards-cardwrap-left');
    let x = Math.floor(Math.random() * $cards.length);
    $cards.each(function (index) {
      let $card = $(this).removeClass('h5p-dialogcards-noMatch');
      $card.addClass('h5p-dialogcards-cardwrap-left-repetition');
      if (index === x) {
        $card.addClass('h5p-dialogcards-current-left');
      }
    });

    this.resizeOverflowingText();
    this.setCardFocus(this.$current);
    this.$current
      .find('.h5p-dialogcards-answer-button-off')
      .removeClass('h5p-dialogcards-disabled');
    this.$currentLeft = this.$inner.find('.h5p-dialogcards-current-left');
    ///this.$progressFooterLeft.removeClass('h5p-dialogcards-hide');
    this.updateNavigation();
    this.resetButtons('restart');
  };

  /**
   * Update the dimensions of the task when resizing the task.
   */
  
  this.resize = () => {
    
    let maxHeight = 0;
    // To prevent error inside Interactive Book PapiJo.
    if (this.taskFinished) {
      return;
    }
    this.updateImageSize();
    if (!this.params.behaviour.scaleTextNotCard) {
      ///this.determineCardSizes();
    }

    // Reset card-wrapper-set height
    this.$cardwrapperSet.css('height', 'auto');

    //Find max required height for all cards
    this.$cardwrapperSet.children().each(function () {
      let wrapperHeight = $(this).css('height', 'initial').outerHeight();
      $(this).css('height', 'inherit');
      maxHeight = wrapperHeight > maxHeight ? wrapperHeight : maxHeight;

      // Check height
      if (!$(this).next('.h5p-dialogcards-cardwrap').length) {
        let initialHeight = $(this)
          .find('.h5p-dialogcards-cardholder')
          .css('height', 'initial')
          .outerHeight();
        maxHeight = initialHeight > maxHeight ? initialHeight : maxHeight;
        // Fixed wrong css height value in old style
        $(this).find('.h5p-dialogcards-cardholder').css('height', '');
      }
    });

    let relativeMaxHeight =
      maxHeight / parseFloat(this.$cardwrapperSet.css('font-size'));
    this.$cardwrapperSet.css('height', `${relativeMaxHeight}em`);

    this.scaleToFitHeight();
    if (!this.$retry) {
      this.truncateRetryButton();
    }
    if (this.playModeUser === 'selfCorrectionMode') {
      this.truncateAnswerButtons();
    }

    this.resizeOverflowingText();
  };

  /**
   * Resizes each card to fit its text
   */
  
   this.determineCardSizes00 = () => {
     const self = this;
    if (
      this.cardSizeDetermined === undefined ||
      (this.repetition && this.contentData.previousState)
    ) {
      // Keep track of which cards we've already determined size for
      // JR empty this array if this.repetition && this.contentData.previousState otherwise hard to reset it
      // not a nice workaround but...
      this.cardSizeDetermined = [];
    }

    // Go through each card
    this.$cardwrapperSet.children(':visible').each(function (i) {
      if (this.cardSizeDetermined.indexOf(i) !== -1) {
        return; // Already determined, no need to determine again.
      }
      this.cardSizeDetermined.push(i);

      let $content = $('.h5p-dialogcards-card-content', this);
      let $text = $('.h5p-dialogcards-card-text-inner-content', $content);

      // Grab size with text
      let textHeight = $text[0].getBoundingClientRect().height;

      // Change to answer
      if (!this.matchIt) {
        if (!this.noText) {
          this.changeText($content, this.currentDialogs[i].answer);
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
      if (!this.matchIt) {
        if (!this.noText) {
          this.changeText($content, this.currentDialogs[i].text);
        }
      }
    });
  };
this.determineCardSizes = () => {
      const self = this;

      if (this.cardSizeDetermined === undefined) {
        // Keep track of which cards we've already determined size for
        this.cardSizeDetermined = [];
      }

      // Go through each card
      this.$cardwrapperSet.children(':visible').each((i) => {
        const cardId = self.cards[i].id;

        if (self.cardSizeDetermined.indexOf(cardId) !== -1) {
          return; // Already determined, no need to determine again.
        }
        self.cardSizeDetermined.push(cardId);

        // Change to answer
        const currentCard = self.cards[i];
        currentCard.changeText(currentCard.getAnswer());

        // Change back to text
        currentCard.changeText(currentCard.getText());
      });
    };
  
  this.scaleToFitHeight = () => {
    

    if (
      !this.$cardwrapperSet ||
      !this.$cardwrapperSet.is(':visible') ||
      !this.params.behaviour.scaleTextNotCard
    ) {
      return;
    }
    // Resize font size to fit inside CP
    if (this.$inner.parents('.h5p-course-presentation').length) {
      let $parentContainer = this.$inner.parent();
      if (this.$inner.parents('.h5p-popup-container').length) {
        $parentContainer = this.$inner.parents('.h5p-popup-container');
      }
      let containerHeight = $parentContainer
        .get(0)
        .getBoundingClientRect().height;
      let getContentHeight = function () {
        let contentHeight = 0;
        this.$inner.children().each(function () {
          contentHeight +=
            $(this).get(0).getBoundingClientRect().height +
            parseFloat($(this).css('margin-top')) +
            parseFloat($(this).css('margin-bottom'));
        });
        return contentHeight;
      };
      let contentHeight = getContentHeight();
      let parentFontSize = parseFloat(this.$inner.parent().css('font-size'));
      let newFontSize = parseFloat(this.$inner.css('font-size'));

      // Decrease font size
      if (containerHeight < contentHeight) {
        while (containerHeight < contentHeight) {
          newFontSize -= DialogcardsPapiJo.SCALEINTERVAL;
          // Cap at min font size
          if (newFontSize < DialogcardsPapiJo.MINSCALE) {
            break;
          }
          // Set relative font size to scale with full screen.
          this.$inner.css('font-size', `${newFontSize / parentFontSize}em`);
          contentHeight = getContentHeight();
        }
      }
      else {
        // Increase font size
        let increaseFontSize = true;
        while (increaseFontSize) {
          newFontSize += DialogcardsPapiJo.SCALEINTERVAL;
          // Cap max font size
          if (newFontSize > DialogcardsPapiJo.MAXSCALE) {
            increaseFontSize = false;
            break;
          }
          // Set relative font size to scale with full screen.
          let relativeFontSize = newFontSize / parentFontSize;
          this.$inner.css('font-size', `${relativeFontSize}em`);
          contentHeight = getContentHeight();
          if (containerHeight <= contentHeight) {
            increaseFontSize = false;
            relativeFontSize = (newFontSize - DialogcardsPapiJo.SCALEINTERVAL) / parentFontSize;
            this.$inner.css('font-size', `${relativeFontSize}em`);
          }
        }
      }
    }
    else {
      // Resize mobile view
      this.resizeOverflowingText();
    }
  };

  /**
   * Resize the font-size of text areas that tend to overflow when dialog cards
   * is squeezed into a tiny container.
   */
  
   this.resizeOverflowingText = () => {
    
    let $textContainer;
    let $text;
    if (
      !this.params.behaviour.scaleTextNotCard ||
      this.$current === undefined
    ) {
      return; // No text scaling today
    }
    // Resize card text if needed
    $textContainer = this.$current.find('.h5p-dialogcards-card-text');
    $text = $textContainer.children();
    this.resizeTextToFitContainer($textContainer, $text);
    if (this.matchIt && this.$currentLeft) {
      let $currentLeft = this.$currentLeft;
      $textContainer = $currentLeft.find('.h5p-dialogcards-card-text');
      $text = $textContainer.children();
      this.resizeTextToFitContainer($textContainer, $text);
    }
  };

  /**
   * Increase or decrease font size so text wil fit inside container.
   * @param {HTMLElement} $textContainer Outer container, must have a set size.
   * @param {HTMLElement} $text Inner text container
   */
  
  this.resizeTextToFitContainer = ($textContainer, $text) => {
    
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
    let mainFontSize = parseFloat(this.$inner.css('font-size'));

    // Decrease font size
    if (currentTextHeight > currentTextContainerHeight) {
      let decreaseFontSize = true;
      while (decreaseFontSize) {
        fontSize -= DialogcardsPapiJo.SCALEINTERVAL;
        if (fontSize < DialogcardsPapiJo.MINSCALE) {
          decreaseFontSize = false;
          break;
        }
        // JR added 0.4 em to make reduced font size not so reduced.
        $text.css('font-size', `${fontSize / parentFontSize + DialogcardsPapiJo.NB04}em`);
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
        fontSize += DialogcardsPapiJo.SCALEINTERVAL;

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
          fontSize = fontSize - DialogcardsPapiJo.SCALEINTERVAL;
          $text.css('font-size', `${fontSize / parentFontSize}em`);
        }
      }
    }
  };

  /**
   * Set focus to a given card
   * @param {object} $card Card that should get focus
   */
    // Wait for transition, then set focus
  this.setCardFocus = ($card) => {
    $card.one('transitionend', function () {
      $card.find('.h5p-dialogcards-card-text-area').focus();
    });
  };

  /**
   * Truncate retry button if width is small.
   */
  
  this.truncateRetryButton = () => {
    
    if (!this.$retry) {
      return;
    }

    // Reset button to full size
    this.$retry.removeClass('truncated');
    this.$retry.html(
      this.params.nextRound.replace('@round', this.currentRound),
    );

    // Measure button
    const maxWidthPercentages = 0.3;
    let retryWidth =
      this.$retry.get(0).getBoundingClientRect().width +
      parseFloat(this.$retry.css('margin-left')) +
      parseFloat(this.$retry.css('margin-right'));
    let retryWidthPercentage =
      retryWidth / this.$retry.parent().get(0).getBoundingClientRect().width;
    // Truncate button
    if (retryWidthPercentage > maxWidthPercentages) {
      this.$retry.addClass('truncated');
      this.$retry.html('');
    }
  };

  /**
   * Truncate "got it right/wrong" buttons if width is small, e.g. on smartphones.
   * This will simply enable or disable their HTML text.
   */
  
  this.truncateAnswerButtons = () => {
    
    // Reset html text
    let $answerButtonCorrect = this.$inner.find(
      '.h5p-dialogcards-answer-button.correct',
    );
    let $answerButtonCorrectOff = this.$inner.find(
      '.h5p-dialogcards-answer-button-off.h5p-joubelui-button.correct',
    );
    $answerButtonCorrect.html(this.params.correctAnswer);
    $answerButtonCorrectOff.html(this.params.correctAnswer);

    let $answerButtonInCorrect = this.$inner.find(
      '.h5p-dialogcards-answer-button.incorrect',
    );
    let $answerButtonInCorrectOff = this.$inner.find(
      '.h5p-dialogcards-answer-button-off.h5p-joubelui-button.incorrect',
    );
    $answerButtonInCorrect.html(this.params.incorrectAnswer);
    $answerButtonInCorrectOff.html(this.params.incorrectAnswer);

    // Truncate button

    // TODO revise this truncation system
    /*
    let $footerWidth = $answerButtonCorrect.parent()[0].getBoundingClientRect().width;
    let $card = this.$current.find('.h5p-dialogcards-card-content');
    */
    // Supposed to be a smartphone
    let w = $(window).width();
    if (w < DialogcardsPapiJo.NB400) {
      $answerButtonCorrect.html('');
      $answerButtonCorrectOff.html('');
      $answerButtonInCorrect.html('');
      $answerButtonInCorrectOff.html('');
    }
  };

  /**
   * Task is finished.
   */

  
  this.finishedScreen = () => {    
    $('.h5p-navigation--3-split').remove();
    this.taskFinished = true;
    this.answered = true;
    this.progress = -1;
    this.progressLeft = -1;
    let penalty;
    let selectedCards = this.nbCardsSelected;
    this.maxScore = selectedCards;
    let actualScore = this.maxScore;

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
      this.playModeUser === 'normal' ||
      this.playModeUser === 'browseSideBySide'
    ) {
      return;
    }

    // Remove all these elements.
    
    $(
      '.h5p-dialogcards-cardwrap-set, .h5p-dialogcards-match-footer, .h5p-dialogcards-footer,' +
        ' .h5p-dialogcards-options ',
      this.$inner,
    ).remove();


    // Display task finished feedback message.

    let $feedback = $('<div>', {
      class:
        'h5p-dialogcards-summary-screen h5p-dialogcards-final-summary-screen',
    }).appendTo(this.$inner);
    let rounds = this.params.rounds;
    rounds.replace('@rounds', this.currentRound.toString());

    // Feedback text

    let totalCards = this.params.dialogs.length;
    //let totalCorrect = this.correct;
    //let totalInCorrect = this.incorrect;
    let summary = this.params.summary;
    let thisRound = this.currentRound;
    let overallScore = this.params.summaryOverallScore;
    let cardsSelected = this.params.summaryCardsSelected;
    let cardsCompleted = this.params.summaryCardsCompleted;
    let completedRounds = this.params.summaryCompletedRounds;
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
        allDone = this.params.summaryAllDone.replace('@cards', totalCards);
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
        allDone = this.params.summaryMatchesAllDone;
      }
      text2 =
        `<td class="h5p-dialogcards-summary-table-row-category">${this.params.summaryMatchesFound}</td>` +
        '<td class="h5p-dialogcards-summary-table-row-symbol h5p-dialogcards-check">&nbsp;</td>' +
        `<td class="h5p-dialogcards-summary-table-row-score">${
          this.correct
        }<tr><td class="h5p-dialogcards-summary-table-row-category">${
          this.params.summaryMatchesNotFound
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
        explainScore = this.params.explainScoreGotIt.replace(
          '@penalty',
          this.params.behaviour.penalty,
        );
      }
    }
    else if (this.matchIt) {
      if (this.incorrect) {
        explainScore = this.params.explainScoreMatch;
      }
    }
    let scoreExplanationButtonLabel = this.params.scoreExplanationButtonLabel;
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
    this.triggerAnswered();

    // Display reset button to enable user to do the task again IF Retry option enabled.

    if (this.params.behaviour.enableRetry) {
      const retryOrReset = this.getRetryOrReset();
      let message = retryOrReset[0];
      let thisclass = retryOrReset[1];
      this.$retryButton = createButton({
        class: thisclass,
        label: message,
        icon: 'check',
        onClick: () => {
          this.resetTask();
        }
       })
        .appendTo($feedbackFooter);
    }
  };

  /**
   * Remove card from DOM and from cards stack after user has checked the "gotit" button.
   */

  
  this.gotItCorrect = ($card) => {
    
    let index = $card.index();
    this.endOfStack = 0;
    this.correct++;
    //const selectionIndex = this.$current.index();
    let audioIndex = this.nbCards - this.currentDialogs.length;
    this.stopAudio(audioIndex);

    // Mark current card with a 'gotitdone' class.
    this.$current.addClass('h5p-dialogcards-gotitdone');

    // Move to next card if exists.
    let $nextCard = this.$current.next('.h5p-dialogcards-cardwrap');
    let $prevCard = this.$current.prev('.h5p-dialogcards-cardwrap');

    if ($nextCard.length) {
      this.nextCard();
      this.resetButtons('answer buttons');
    }
    else if ($prevCard.length) {
      // No next card left - go to previous.
      this.lastCardIndex = index;
      this.endOfStack = 1;
      this.updateNavigation();
      this.endOfStack = 0;
      this.resetButtons('retry button');

      return;
    }
    else {
      // No cards left: task is finished.
      this.resetButtons('finished button');
      return;
    }

    // Now remove the current 'gotitdone' card from the cards and cardOrder arrays.
    this.currentDialogs.splice(index, 1);
    if (!$.isEmptyObject(this.cardOrder)) {
      this.cardOrder.splice(index, 1);
    }
    if (!this.params.behaviour.scaleTextNotCard) {
      this.cardSizeDetermined.splice(index + DialogcardsPapiJo.NB2, 1);
    }
    // Remove the 'gotitdone' card from DOM
    $('.h5p-dialogcards-gotitdone', this.$inner).remove();
    // Update navigation
    this.updateNavigation();
  };

  
  this.matchCards = ($card) => {
    
    for (let i = 0; i < this.nbCards + 1; i++) {
      this.resetAudio(i);
    }

    const delayInMilliseconds = 2000;
    let index = $card.index() / DialogcardsPapiJo.NB2;
    let $leftCard = this.$currentLeft;
    let indexLeft = ($leftCard.index() - 1) / DialogcardsPapiJo.NB2;

    // De-activate all buttons during the Timeout.
    let $correctButton = $card.find('.h5p-dialogcards-match.correct');
    let $incorrectButton = $card.find('.h5p-dialogcards-match.incorrect');
    let $matchButton = $card.find('.h5p-dialogcards-button-match');
    $matchButton.toggleClass('h5p-dialogcards-disabled');
    this.$next.toggleClass('h5p-dialogcards-inactive');
    this.$prev.toggleClass('h5p-dialogcards-inactive');

    if (index === indexLeft) {
      this.correct++;
      $matchButton.addClass('h5p-dialogcards-disabled');
      $correctButton.toggleClass('h5p-dialogcards-disabled');
      this.$current.addClass('h5p-dialogcards-gotitdone');
      $leftCard.addClass('h5p-dialogcards-gotitdone');
      let $parentSet = this.$current.parent('.h5p-dialogcards-cardwrap-set');

      setTimeout(() => {
        this.nextCardLeft();
        this.resizeOverflowingText();
        $correctButton.toggleClass('h5p-dialogcards-disabled');
        this.$next.toggleClass('h5p-dialogcards-inactive');
        this.$prev.toggleClass('h5p-dialogcards-inactive');
        this.$current
          .removeClass('h5p-dialogcards-current h5p-dialogcards-match-right')
          .addClass('h5p-dialogcards-previous');
        // Remove the 'gotitdone' card from DOM
        $('.h5p-dialogcards-gotitdone', this.$inner).remove();
        // SEP 2021
        this.$current = $parentSet.find('.h5p-dialogcards-cardwrap').first();
        this.$current.addClass(
          'h5p-dialogcards-current h5p-dialogcards-match-right',
        );
        this.updateNavigation();
      }, delayInMilliseconds);

      // Now remove the current 'gotitdone' card from the cards and cardOrder arrays.
      this.currentDialogs.splice(index, 1);
      if (!$.isEmptyObject(this.cardOrder)) {
        this.cardOrder.splice(index, 1);
      }
      if (!this.params.behaviour.scaleTextNotCard) {
        this.cardSizeDetermined.splice(index + DialogcardsPapiJo.NB2, 1);
      }
    }
    else {
      this.incorrect++;
      this.updateNavigation();
      $matchButton.addClass('h5p-dialogcards-disabled');
      $incorrectButton.toggleClass('h5p-dialogcards-disabled');
      setTimeout(function () {
        $incorrectButton.toggleClass('h5p-dialogcards-disabled');
        this.$next.toggleClass('h5p-dialogcards-inactive');
        this.$prev.toggleClass('h5p-dialogcards-inactive');
      }, delayInMilliseconds);
    }

    // No cards left in stack. End game.
    if (this.currentDialogs.length === 0) {
      setTimeout(() => {
        this.finishedScreen();
      }, delayInMilliseconds);
    }
  };

  
   this.matchCardsRepetition = ($card) => {
    
    for (let i = 0; i < this.nbCards + 1; i++) {
      this.resetAudio(i);
    }
    const delayInMilliseconds = 2000; // Make it a parameters setting?
    let index = $card.index() / DialogcardsPapiJo.NB2;
    let $leftCard = this.$currentLeft;
    let indexLeft = ($leftCard.index() - 1) / DialogcardsPapiJo.NB2;

    // De-activate all buttons during the Timeout.
    let $correctButton = $card.find('.h5p-dialogcards-match.correct');
    let $incorrectButton = $card.find('.h5p-dialogcards-match.incorrect');
    let $matchButton = $card.find('.h5p-dialogcards-button-match');
    $matchButton.toggleClass('h5p-dialogcards-disabled');
    this.$next.toggleClass('h5p-dialogcards-inactive');
    this.$prev.toggleClass('h5p-dialogcards-inactive');
    this.cardsLeft--;
    if (index === indexLeft) {
      // We have a match.
      this.correct++;
    }
    else {
      // No match.
      this.incorrect++;
    }
    let $parentSet = this.$current.parent('.h5p-dialogcards-cardwrap-set');
    let $cards = $parentSet.find('.h5p-dialogcards-cardwrap');

    if (this.cardsLeft !== 0) {
      if (index === indexLeft) {
        // We have a match.
        $matchButton.addClass('h5p-dialogcards-disabled');
        this.$buttonMatch.addClass('h5p-dialogcards-disabled');
        $correctButton.toggleClass('h5p-dialogcards-disabled');
        this.$current.addClass('h5p-dialogcards-gotitdone');

        setTimeout(() => {
          this.nextCardLeftRepetition();
          this.resizeOverflowingText();
          let $cardLeft = this.$currentLeft.find(
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
          $correctButton.toggleClass('h5p-dialogcards-disabled');
          this.$next.toggleClass('h5p-dialogcards-inactive');
          this.$prev.toggleClass('h5p-dialogcards-inactive');
          this.$current.removeClass(
            'h5p-dialogcards-current h5p-dialogcards-match-right',
          );

          // Remove the 'gotitdone' card from DOM
          $('.h5p-dialogcards-gotitdone', this.$inner).remove();

          // SEP. 2021
          this.$current = $parentSet.find('.h5p-dialogcards-cardwrap').first();
          while (this.$current.hasClass('h5p-dialogcards-noMatch')) {
            this.$current = this.$current
              .nextAll('.h5p-dialogcards-cardwrap')
              .eq(0);
          }
          this.$current.addClass(
            'h5p-dialogcards-current h5p-dialogcards-match-right',
          );
          let $nextCard = this.$current.next('.h5p-dialogcards-cardwrap');
          if ($nextCard.length) {
            this.nextCard();
          }
          this.updateNavigation();
        }, delayInMilliseconds);

        // Now remove the current 'gotitdone' card from the cards and cardOrder arrays.
        this.currentDialogs.splice(index, 1);
        if (!$.isEmptyObject(this.cardOrder)) {
          this.cardOrder.splice(index, 1);
        }
        if (!$.isEmptyObject(this.cardOrder)) {
          this.noMatchCards.splice(index, 1);
        }
        if (!this.params.behaviour.scaleTextNotCard) {
          this.cardSizeDetermined.splice(index + DialogcardsPapiJo.NB2, 1);
        }
      }
      else {
        // We don't have a match
        // Find the matching right card from stack of cards
        $cards = this.$inner.find('.h5p-dialogcards-cardwrap');
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
        this.noMatchCards[indexLeft] = 1;
        setTimeout(() => {
          $leftCard
            .addClass('h5p-dialogcards-noMatch')
            .removeClass('h5p-dialogcards-current-left');
          $leftCard.removeClass(
            'h5p-dialogcards-cardwrap-left-repetition h5p-dialogcards-current-left',
          );
          $incorrectButton.toggleClass('h5p-dialogcards-disabled');
          this.$next.toggleClass('h5p-dialogcards-inactive');
          this.$prev.toggleClass('h5p-dialogcards-inactive');
          $matchButton.removeClass('h5p-dialogcards-disabled');
          this.nextCardLeftRepetition(); // ???
          this.updateNavigation(); // line 1228
        }, delayInMilliseconds);
      }
    }

    // No cards left in stack. End game or end round.
    if (this.cardsLeft === 0) {
      this.getCurrentState();
      this.$buttonMatch.addClass('h5p-dialogcards-disabled');
      this.$prev.addClass('h5p-dialogcards-inactive');
      $correctButton.toggleClass('h5p-dialogcards-disabled');
      // WARNING! do not use 'this' inside a setTimeout function; use 'self' !
      if ($card.index() === -1) {
        delayInMilliseconds = 0;
      }
      setTimeout(() => {
        this.$current
          .addClass('h5p-dialogcards-gotitdone')
          .removeClass('h5p-dialogcards-noMatch');
        this.$next.toggleClass('h5p-dialogcards-inactive');
        this.$prev.toggleClass('h5p-dialogcards-inactive');
        this.$prev.addClass('h5p-dialogcards-hide');
        $leftCard.remove();
        if (this.incorrect === 0) {
          this.resetButtons('finished button');
        }
        else {
          this.lastCardIndex = index;
          this.lastCardIndex = this.noMatchCards.indexOf(0);
          $matchButton.addClass('h5p-dialogcards-disabled');
          this.resetButtons('retry button');
          $matchButton.addClass('h5p-dialogcards-disabled');
        }
      }, delayInMilliseconds);
    }
  };

  /**
   * Resets the task.
   * Used in contracts. Used upon Restart in Interactive Book!
   */

  
  this.resetTask = () => {
    console.log('this.resetTask');
    const self = this;
    this.contentData.previousState = {};
    this.answered = false;
    this.actualScore = 0;
    this.cardsLeft = this.params.dialogs.length;
    this.currentRound = 1;
    this.correct = 0;
    this.incorrect = 0;
    this.$current = undefined;
    this.currentDialogs = structuredClone(this.params.dialogs);
    this.getCurrentState();
    this.enableGotIt = false;
    this.repetition = false;
    this.hideTurnButton = false;
    this.matchIt = false;
    this.sideBySide = false;
    this.currentFilter = undefined;
    this.progress = -1;
    this.progressLeft = -1;
    // JR for interactive book we need to remove the options upon Restart
    $('.h5p-dialogcards-options ', this.$inner).remove();    
    let $optionsText = this.$inner.find('.h5p-dialogcards-options');
    $optionsText.html('');

    if (this.repetition) {
      this.noMatchCards = []; // needed here ?
    }
    // Empty audios and audios2 arrays.
    this.audios = [];
    this.audios2 = [];
    // Removes all these elements to start afresh.

    $(
      '.h5p-dialogcards-cardwrap-set, .h5p-dialogcards-footer, .h5p-question-feedback-container,' +
        '.h5p-dialogcards-card-side-announcer, .h5p-dialogcards-button-reset, .h5p-dialogcards-order,' +
        '.h5p-joubelui-score-bar, .h5p-dialogcards-match-footer,' +
        '.h5p-dialogcards-summary-screen, .h5p-dialogcards-summary-message, .h5p-dialogcards-feedback,' +
        '.h5p-dialogcards-sub-title, .h5p-dialogcards-options, .h5p-navigation, .h5p-dialogcards-progress',
      this.$inner,
    ).remove();

    // Reset various parameters.
    this.taskFinished = false;
    this.nbCards = this.params.dialogs.length;
    this.nbCardsInCurrentRound = this.nbCards;
    this.cardsOrderChoice = this.params.behaviour.cardsOrderChoice;
    this.enableCardsNumber = this.params.behaviour.enableCardsNumber;
    this.cardsOrderMode = this.cardsOrderChoice;
    this.cardOrder = undefined;
    this.nbCardsSelected = undefined;
    this.cardSizeDetermined = [];
    this.cardsLeftInStack = this.nbCards;
    this.progress = 0;
    this.filterList = undefined;
    this.filterOperator = undefined;
    this.getCurrentState();
console.log('this.filterByCategories = ' + this.filterByCategories);
    if (this.playModeNames.length === 0) {
      this.playMode = 'normal';
      this.playModeUser = this.playMode;
    }
    else if (this.playModeNames.length === 1) {
      this.playMode = this.playModeNames.value;
      this.playModeUser = this.playMode;
    }
    if (this.playMode === 'user') {
      console.log('goto createPlayMode');
      this.createPlayMode().appendTo(this.$inner);
    }
    
    else if (this.filterByCategories === 'userFilter') {
      this.createFilterCards().appendTo(this.$inner);
    }
    else if (this.cardsOrderChoice === 'user') {
      this.createOrder().appendTo(this.$inner);
    }
    else if (
      this.enableCardsNumber &&
      this.nbCardsSelected === undefined &&
      this.nbCards > DialogcardsPapiJo.NB5
    ) {
      this.createNumberCards().appendTo(this.$inner);
    }
    else if (
      this.cardsSideChoice === 'user' &&
      this.cardsSideMode === 'user'
    ) {

      this.createcardsSideChoice().appendTo(this.$inner);
    }
    else {
      this.attachContinue();
    }
  };

  /**
   * Switches all the cards elements from FRONT/text to BACK/answer OR vice-versa.
   * @param {object} card Card parameters
   */

  
  this.switchSides = (cards) => {
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

  this.resetButtons = (type) => {
    /// why?
    console.log('this.resetButtons type = ' + type);
    let $card = $(this);
    $card = this.$current;
    $card.removeClass('h5p-dialogcards-match-right');
    // Fixes possible hidden intermediary summary screen
    $card.removeClass('h5p-dialogcards-previous');
    this.stopAudio(this.$current.index());
    let $gotIt = this.enableGotIt;
    $card
      .find('.h5p-dialogcards-answer-button')
      /// todo do not disable if gotit
      //addClass('h5p-dialogcards-disabled');
    if ($gotIt) {
      $card
        .find('.h5p-dialogcards-card-text-area')
        .removeClass('h5p-dialogcards-intermediary-summary-screen');
    }
    if (type === 'answer buttons') {return;////
      // Enable answer-buttons-off ; Unhide turn button & card text and Disable the Retry button.
      $card
        .find('.h5p-dialogcards-turn')
        .removeClass('h5p-dialogcards-disabled');
      $card
        .find('.h5p-dialogcards-answer-button-off')
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
        // hide cardfooter
        $card
          .find('.h5p-dialogcards-card-footer')
          .addClass('h5p-dialogcards-disabled');
        // unhide retry button
        this.$retry
          .prop('disabled', false)
          .removeClass('h5p-dialogcards-disabled');
                
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
        if (this.frontTextBackImage) {
          $card
            .find('.h5p-dialogcards-image-wrapper')
            .addClass('hide');
        }
        $card.find('.joubel-tip-container').addClass('h5p-dialogcards-hide');
        $card.find('.h5p-dialogcards-audio-wrapper').addClass('hide');
        $card
          .find('.h5p-dialogcards-audio-wrapper2')
          .addClass('h5p-dialogcards-hide');
        $card
          .find('.h5p-dialogcards-answer-button-off')
          .addClass('h5p-dialogcards-hide');
        this.$progress.addClass('h5p-dialogcards-hide');
        if (this.repetition) {
          this.$progressFooterLeft.addClass('h5p-dialogcards-hide');
        }
        let totalCorrect = this.correct;
        let totalInCorrect = this.incorrect;
        let totalCards = this.correct + this.incorrect;
        let summary = this.params.summary;
        let thisRound = this.currentRound;
        let roundTxt = this.params.round.replace(
          '@round',
          thisRound.toString(),
        );
        let cardsRight = this.params.summaryCardsRight;
        let cardsWrong = this.params.summaryCardsWrong;

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
          this.$retry.html(
            this.params.nextRound.replace('@round', this.currentRound + 1),
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
        const retryOrReset = this.getRetryOrReset();
        let message = retryOrReset[0];
        let thisclass = retryOrReset[1];
        this.$retry.html(message);
        this.$retry.addClass(thisclass);
      }
      this.$retry.removeClass('h5p-hidden');
      if (this.matchIt) {
        this.$retry.addClass('h5p-dialogcards-unset');
      }
    }
    else if (type === 'restart') {
      if (this.matchIt) {
        $card.addClass('h5p-dialogcards-match-right');
      }
      $card
        .find('.h5p-dialogcards-answer-button-off')
        .removeClass('h5p-dialogcards-disabled');
      $card
        .find('.h5p-dialogcards-turn')
        .removeClass('h5p-dialogcards-disabled');
      $card
        .find('.h5p-dialogcards-card-text')
        .removeClass('h5p-dialogcards-auto-height');
      if (this.matchIt) {
        this.$prev.removeClass('h5p-dialogcards-hide');
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
      this.resize();
    }
  };

  /**
   * Necessary for the Interactive Book content.
   * Used in contracts.
   * @public
   */

  
  this.showSolutions = () => {
    return;
  };

  /**
   * Get maximum score.
   * @returns {number} Max points. Used in Interactive Book content.
   */
  
  this.getMaxScore = () => {
    if (
      this.playModeUser === 'normal' ||
      this.playModeUser === 'browseSideBySide'
    ) {
      return 0;
    }
    if (this.nbCardsSelected) {
      return this.nbCardsSelected;
    }
    return DialogcardsPapiJo.NB10;
  };

  /**
   * @returns {number} Points. Used in Interactive Book content.
   */
  
  this.getScore = () => {
    if (!this.nbCardsSelected) {
      return 0;
    }
    if (
      this.params.behaviour.playMode === 'normal' ||
      this.playMode === 'browseSideBySide'
    ) {
      return 0;
    }
    return this.actualScore;
  };

  // Used when a dialog cards activity is included in an Interactive Book content.
  
  this.getAnswerGiven = () => {
    return this.answered;
  };

  /**
   * Returns an object containing content of each cloze
   * @returns {object} object containing content for each cloze
   */
  
  this.getCurrentState = () => {
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
  
  this.applyFilter = (filterList,filterOperator,dryRun = false) => {
    
    let filterListLength = filterList.split(',').length;
    let catDialogs = [];
    let isSelected = 0;
    let notSelected = 0;
    let numCardsInCats = 0;
    for (let i = 0; i < this.currentDialogs.length; i++) {
      if (this.currentDialogs[i].itemCategories !== undefined) {
        let itemCats = this.currentDialogs[i].itemCategories.split(',');
        isSelected = 0;
        notSelected = 0;
        for (let j = 0; j < itemCats.length; j++) {
          if (filterOperator === 'AND' || filterOperator === 'OR') {
            if (filterList.includes(itemCats[j])) {
              isSelected++;
            }
          }
          else {
            // filterOperator === 'NOT'
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
            catDialogs[i] = this.params.dialogs[i];
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
      this.currentDialogs = structuredClone(filtered);
      this.nbCards = this.currentDialogs.length;
      return this.currentDialogs;
    }
  };

  
  this.makeCurrentFilterName = (catList, catOperator) => {
    
    let filterName;
    if (catOperator === 'AND') {
      filterName = catList.replace(/,/g, ` ${this.params.boolean_AND} `);
    }
    else if (catOperator === 'OR') {
      filterName = catList.replace(/,/g, ` ${this.params.boolean_OR} `);
    }
    else if (catOperator === 'NOT') {
      filterName = `${this.params.boolean_NOT} ${catList.replace(/,/g, ` ${this.params.boolean_NOT} `)}`;
    }
    return filterName;
  };

  /**
   * Trigger xAPI answered event
   */
  
  this.triggerAnswered = () => {
    this.answered = true;
    const xAPIEvent = this.createXAPIEventTemplate('answered');
    this.addQuestionToXAPI(xAPIEvent);
    this.addResponseToXAPI(xAPIEvent);
    this.trigger(xAPIEvent);
  };

  /**
   @returns {object} xAPI object definition
   */
  
  this.getxAPIDefinition = () => {
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
  
  this.addQuestionToXAPI = (xAPIEvent) => {
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
  
  this.addResponseToXAPI = (xAPIEvent) => {
    if (
      this.playModeUser === 'browseSideBySide' ||
      this.playModeUser === 'normal'
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
    let duration = `PT${Math.round((this.endTime - this.startTime) / DialogcardsPapiJo.NB1000)}S`;
    xAPIEvent.data.statement.result.duration = duration;
    xAPIEvent.data.statement.result.response = this.getxAPIResponse();
  };

  /**
   * Generate xAPI user response, used in xAPI statements.
   * @returns {string} User answers separated by the "[,]" pattern
   */
  
  this.getxAPIResponse = () => {
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

  
  this.getRetryOrReset = () => {
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

    if (!this.params.dialogs || this.params.dialogs.length === 0) {
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

    const reference = getMediaMap(this.params.dialogs[0]);

    // --- VALIDATE FIRST CARD ---
    const frontCount =
      (reference.front.image ? 1 : 0) +
    (reference.front.audio ? 1 : 0);
    const backCount =
      (reference.back.image ? 1 : 0) +
    (reference.back.audio ? 1 : 0);

    if (frontCount !== 1 || backCount !== 1) {
      const text = this.params.dialogs[0].text.replace(/<[^>]*>/g, '').trim();
      const answer = this.params.dialogs[0].answer.replace(/<[^>]*>/g, '').trim();

      let report = '<div style="font-family:Arial,sans-serif;">';
      report += '<h2 style="color:#d9534f;">⚠️ Reference Card Invalid</h2>';
      report += '<p>The first card must contain exactly one media per side (front & back).</p>';
      report += `<p><strong>Current layout:</strong> ${describeLayout(reference)}</p>`;
      report += '<hr>';
      report += `
      <div style="margin-bottom:12px;color:black;">
        <strong>Card #1</strong><br>
        <strong>Text:</strong> "${text}"<br>
        <strong>Answer:</strong> "${answer}"
      </div>
    `;
      report += '</div>';

      return report;
    }

    // --- CHECK OTHER CARDS AGAINST REFERENCE ---
    this.params.dialogs.forEach((card, index) => {
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

        const text = card.text.replace(/<[^>]*>/g, '').trim();
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
      const deckSize = this.params.dialogs.length;
      this.params.dialogs = [];

      let report = '<div style="font-family:Arial,sans-serif;">';
      report += '<h2 style="color:#d9534f;">⚠️ Deck Rejected</h2>';
      report += `<p><strong>Card #1 defines the required media layout:</strong> ${describeLayout(reference)}</p>`;
      report += '<hr>';

      removedCards.forEach((card) => {
        report += `
        <div style="margin-bottom:12px;color:black;">
          <strong>Card #${card.index + 1} — Rejection reason:</strong> ${card.reason}<br>
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
}
  }
  DialogcardsPapiJo.SCALEINTERVAL = 0.2;
  DialogcardsPapiJo.MAXSCALE = 16;
  DialogcardsPapiJo.MINSCALE = 4;
  DialogcardsPapiJo.NB04 = 0.4;
  DialogcardsPapiJo.NB2 = 2;
  DialogcardsPapiJo.NB5 = 5;
  DialogcardsPapiJo.NB10 = 10;
  DialogcardsPapiJo.NB50 = 50;
  DialogcardsPapiJo.NB200 = 200;
  DialogcardsPapiJo.NB300 = 300;
  DialogcardsPapiJo.NB400 = 400;
  DialogcardsPapiJo.NB1000 = 1000;
  
  export default DialogcardsPapiJo;
/*
  return C;
})(H5P.jQuery, H5P.Audio, H5P.JoubelUI, H5P.Question);
*/