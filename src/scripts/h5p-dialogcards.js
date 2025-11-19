/**
 * Dialogcards module PapiJo
 *
 * @param {jQuery} $
 */
H5P.DialogcardsPapiJo = (function ($, Audio, JoubelUI) {
  const XAPI_REPORTING_VERSION_EXTENSION = 'https://h5p.org/x-api/h5p-reporting-version';
  /**
   * Initialize module.
   *
   * @param {Object} params Behavior settings
   * @param {Number} id Content identification
   * @returns {C} self
   */
  function C(params, id, contentData) {
    const self = this;
    H5P.EventDispatcher.call(this);
    self.contentId = self.id = id;
    // Set default behavior.
    self.params = $.extend({
      title: "Dialogue",
      description: "Sit in pairs and make up sentences where you include the expressions below.<br/>Example: I should have said yes, HOWEVER I kept my mouth shut.",
      next: "Next",
      prev: "Previous",
      retry: "Retry",
      answer: "Turn",
      check: "Check",
      correctAnswer: 'I got it right!',
      incorrectAnswer: 'I got it wrong',
      round: 'Round @round',
      rounds: "@rounds round(s)",
      showSummary: 'Final summary',
      summary: 'Summary',
      summaryCardsRight: 'Cards you got right:',
      summaryCardsWrong: 'Cards you got wrong:',
      summaryOverallScore: 'Overall Score',
      summaryCardsCompleted: 'Cards you have completed learning:',
      summaryCardsSelected: 'Number of cards you selected from the pool:',
      summaryCompletedRounds: 'Completed rounds:',
      summaryAllDone: 'Well done! You got all @cards cards correct!',
      cardsLeft: "Cards left: @number",
      matchButtonLabel: "Match",
      correctMatch: "That's a match!",
      incorrectMatch: "That's NOT a match!",
      matchesFound: "Matches correct: @correct | incorrect: @incorrect",
      summaryMatchesFound: 'Correct matches:',
      summaryMatchesNotFound: 'Incorrect matches:',
      summaryMatchesAllDone: 'Well done!',
      nextRound: 'Proceed to round @round',
      randomizeCardsQuestion: "Display the cards in random order?",
      randomizeRightCardsQuestion: "Display the cards on the right in random order?",
      no: "No",
      yes: "Yes",
      numCardsQuestion: "How many cards do you want?",
      allCards: "all",
      explainScoreGotIt: "Each extra round cost you a penalty of @penalty%.",
      explainScoreMatch: "Each incorrect match cost you a penalty of 1 point.",
      progressText: "Card @card of @total",
      cardFrontLabel: "Card front",
      cardBackLabel: "Card back",
      tipButtonLabel: 'Show tip',
      audioNotSupported: 'Your browser does not support this audio',
      scoreExplanationButtonLabel: 'Show score explanation',
      reverseSides: 'Switch the current display mode of card sides to @side?',
      currentSideNotice: "Current display mode: First Side = ",
      currentOrderNotice: "Current Cards Order mode = ",
      currentRightOrderNotice: "Current Order mode of Cards on the right = ",
      reverseLeftSide: 'Switch the current display mode of Left card side to @side?',
      currentLeftSideNotice: "Current display mode: Left card = ",
      currentFilterNotice: "Current Filter = ",
      selectFilter: "Select a filter for the cards to be displayed",
      noFilter: "No filter",
      boolean_AND: "AND",
      boolean_OR: "OR",
      boolean_NOT: "NOT",
      normalOrder: "Normal",
      randomOrder: "Random",
      categories: [
        {
          catName: 'Animal',
          catDescription: 'Animals'
        },
        {
          catName: 'Vegetal',
          catDescription: 'Vegetals'
        }
      ],
      dialogs: [
        {
          text: 'Horse',
          answer: 'Hest'
        },
        {
          text: 'Cow',
          answer: 'Ku'
        }
      ],
      behaviour: {
        enableRetry: true,
        noTextOnCards: false,
        hideTurnButton: false,
        scaleTextNotCard: false,
        playMode: 'normalMode',
        cardsOrderChoice: 'user',
        enableCardsNumber: false,
        cardsSideChoice: 'user',
        penalty: 0,
        passPercentage: 100,
        backgroundColor: undefined,
        backgroundColorBack: undefined,
        noDupeFrontPicToBack: false,
        filterByCategories: 'noFilter'
      }
    }, params);

    self._current = -1;
    self._turned = [];
    self.$images = [];
    self.$images2 = [];
    self.audios = [];
    self.audios2 = [];

    this.currentRound = 1;
    this.lastCardIndex = 0;
    this.endOfStack = 0;
    this.correct = 0;
    this.incorrect = 0;
    this.lastCard = null;
    this.cardsOrderChoice = self.params.behaviour.cardsOrderChoice;
    this.cardsOrderMode = this.cardsOrderChoice;
    this.cardsSideChoice = self.params.behaviour.cardsSideChoice;
    this.cardsSideMode = this.cardsSideChoice;
    this.enableCardsNumber = self.params.behaviour.enableCardsNumber;
    this.noText = self.params.behaviour.noTextOnCards;    
    this.actualScore = 0;
    this.firstText = self.params.dialogs[0].text;

    // Remove potential cards with empty front or empty back, i.e. no text, no audio, no image!
    for (let i = 0; i < self.params.dialogs.length; i++) {
      if (((self.params.dialogs[i]['text'] === undefined || this.noText)
        && self.params.dialogs[i]['imageMedia']['image'] === undefined
        && self.params.dialogs[i]['audioMedia']['audio'] === undefined)
        || (self.params.dialogs[i]['answer'] === undefined
        && self.params.dialogs[i]['imageMedia']['image2'] === undefined
        && self.params.dialogs[i]['audioMedia']['audio2'] === undefined)) {
        self.params.dialogs.splice(i, 1);
        i--;
      }
    }
    this.hasAudio = false;

    for (let i = 0; i < self.params.dialogs.length; i++) {
      if (self.params.dialogs[i]['audioMedia']['audio']) {
        this.hasAudio = true;
        break;
      }
    }

    this.hasImageOnBack = false;
    for (let i = 0; i < self.params.dialogs.length; i++) {
      if (self.params.dialogs[i]['imageMedia']['image2']) {
        this.hasImageOnBack = true;
        break;
      }
    }

    if (this.hasAudio && this.noText) {
      this.audioOnly = false;
      for (let i = 0; i < self.params.dialogs.length; i++) {
        if (self.params.dialogs[i]['imageMedia']['image'] === undefined
          && self.params.dialogs[i]['audioMedia']['audio'] !== undefined
          && self.params.dialogs[i]['imageMedia']['image2'] === undefined
          && self.params.dialogs[i]['audioMedia']['audio2'] !== undefined) {
          this.audioOnly = true;
        }
        else {
          this.audioOnly = false;
          break;
        }
      }
    }

    // IF categories filters enabled!!!
    if (self.params.enableCategories && self.params.behaviour.catFilters) {
      this.catFilters = self.params.behaviour.catFilters;
      // Remove potential filters with empty filterList
      for (let i = 0; i < this.catFilters.length; i++) {
        if (this.catFilters[i]["filterList"] === undefined) {
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
    this.repetition = false;
    this.noDupeFrontPicToBack = self.params.behaviour.noDupeFrontPicToBack;
    // If at least one card has an image on back, de-activate potential noDupeFrontPicToBack
    // on those cards without back image, the front image will be used, as per this activity default!
    if (this.hasImageOnBack) {
      this.noDupeFrontPicToBack = false;
    }

    if (self.params.behaviour.playMode === 'browseSideBySide') {
      this.sideBySide = true;
    }

    // AUGUST 2022 Simplified code and fixed sides switching bug!
    this.playMode = self.params.behaviour.playMode;
    if (this.playMode === 'matchRepetition') {
      this.playMode = 'matchMode';
      this.repetition = true;
    }

    // Mode with cards displayed side by side.
    if (this.playMode === 'matchMode' || this.playMode === 'browseSideBySide') {
      this.matchIt = true;
    }
    if (this.playMode === 'browseSideBySide') {
      this.sideBySide = true;
    }
    if (this.playMode === 'selfCorrectionMode') {
      this.enableGotIt = true;
      self.enableGotIt = true;
      this.hideTurnButton = self.params.behaviour.hideTurnButton;
      self.hideTurnButton = self.params.behaviour.hideTurnButton;
      
    }

    // Used in the retry() function to determine if the options screen must be displayed upon re-trying the activity.
    if (this.cardsOrderChoice === 'user' || this.cardsSideChoice === 'user'
      || this.enableCardsNumber || this.filterByCategories === 'userFilter') {
      this.userChoice = true;
    }

    // Copy parameters for further use if save content state.
    self.dialogs = self.copy(self.params.dialogs);

    this.noFilterMessage = '';
    if (self.params.enableCategories && this.filterByCategories === 'authorFilter') {
      this.filterList = self.params.behaviour.catFilters[0]["filterList"];
      this.filterOperator = self.params.behaviour.catFilters[0]["filterOperator"];
      self.applyFilter(this.filterList, this.filterOperator, false);
      this.currentFilter = self.makeCurrentFilterName(this.filterList, this.filterOperator);
    }

    self.nbCards = self.dialogs.length;
    this.cardsLeftInStack = this.nbCardsSelected;
    this.nbCardsInCurrentRound = self.nbCards;
    self.enableCardsNumber = this.enableCardsNumber;
    this.backgroundColor = (self.params.behaviour.backgroundColor === "rgba(0, 0, 0, 0)") ? undefined : self.params.behaviour.backgroundColor;
    this.backgroundColorBack = (self.params.behaviour.backgroundColorBack === "rgba(0, 0, 0, 0)") ? undefined : self.params.behaviour.backgroundColorBack;
    // No backgroundColor given for back side, use front side background color
    if (this.backgroundColorBack === undefined) {
      this.backgroundColorBack = this.backgroundColor;
    }
    // Var cardOrder stores order of cards to allow resuming of card set AND removed cards if match or self-correction Mode.
    // Var progress stores current card index.

    if (this.repetition) {
      this.noMatchCards = [];
    }

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
        this.filterByCategories = this.contentData.previousState.filterByCategories;
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
      if (this.repetition) {
        if (this.contentData.previousState.noMatchCards !== undefined) {
          this.noMatchCards = this.contentData.previousState.noMatchCards;
        }
      }
      this.nbCardsInCurrentRound = this.contentData.previousState.nbCardsInCurrentRound;
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
      this.taskFinished = (contentData.previousState.taskFinished !== undefined ? contentData.previousState.taskFinished : false);

    }

  }

  C.prototype.constructor = C;

  /**
   * Attach the first part of the h5p inside the given container (title and description).
   *
   * @param {jQuery} $container
   */
  C.prototype.attach = function ($container) {
    let self = this;

    self.$inner = $container
      .addClass('h5p-dialogcards')
      .append($('' +
        '<div class="h5p-dialogcards-title"><div class="h5p-dialogcards-title-inner">' + self.params.title
        + '</div></div>' +
        '<div class="h5p-dialogcards-description">' + self.params.description + '</div>'
        + '<div class="h5p-dialogcards-audio-wrapper h5p-audio-not-supported">' + this.noFilterMessage + '</div>'
      ));

    // If we are resuming task from a previously finished task, Reset the task.
    if (this.taskFinished) {
      self.resetTask();
      return;
    }

    if (!$.isEmptyObject(this.cardOrder)) {
      this.existsCardOrder = true;
    }
    else {
      this.existsCardOrder = false;
    }

    // Create filterCard, cardOrder and cardNumber buttons only on first instanciation for logged in user.
    if (this.filterByCategories === 'userFilter' && this.currentFilter === undefined) {
      self.createFilterCards().appendTo(self.$inner);
    }
    else if (this.cardsOrderChoice === 'user' && this.cardOrder === undefined) {
      self.createOrder().appendTo(self.$inner);
    }
    else if (this.enableCardsNumber && this.nbCardsSelected === undefined && self.nbCards > 5) {
      self.createNumberCards().appendTo(self.$inner);
    }
    else if (this.cardsSideChoice === 'user' && this.cardsSideMode === 'user') {
      self.createcardsSideChoice().appendTo(self.$inner);
    }
    else {
      self.attachContinue();
    }
  };

  /**
   * Attach the rest of the h5p inside the given container.
   *
   * @param {jQuery} $container
   */
  C.prototype.attachContinue = function () {
    let self = this;
    // Section to show the Display cards options if different from "normal".
    let text = '';
    let order = '';
    if (this.currentFilter !== undefined) {
      let filterNotice = self.params.currentFilterNotice;
      text += filterNotice + ' ' + this.currentFilter + '<br>';
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
      text += orderNotice + ' ' + order + '<br>';
    }
    // If matchIt the left side = back of card and the right side = front of card
    if (this.matchIt) {
      if (this.cardsSideChoice === 'user') {
        let currentSide = self.params.cardBackLabel;
        if (this.cardsSideMode === 'frontFirst') {
          currentSide = self.params.cardFrontLabel;
        }
        text += self.params.currentLeftSideNotice + currentSide;
      }
    }
    else {
      if (this.cardsSideChoice === 'user') {
        let currentSide = self.params.cardFrontLabel;
        if (this.cardsSideMode === 'backFirst') {
          currentSide = self.params.cardBackLabel;
        }
        text += self.params.currentSideNotice + currentSide;
      }
    }
    if (text !== '') {
      let $optionsText = $('<div>', {
        'class': 'h5p-dialogcards-options',
        'html': text
      });
      $optionsText.appendTo(self.$inner);
    }
    // Remove potential user interaction elements from DOM.
    $( '.h5p-dialogcards-categories', self.$inner ).remove();
    $( '.h5p-dialogcards-number', self.$inner ).remove();
    $( '.h5p-dialogcards-side', self.$inner ).remove();

    if (self.params.behaviour.scaleTextNotCard) {
      self.$inner.addClass('h5p-text-scaling');
    }

    if (this.contentData.previousState && this.filterList !== undefined) {
      self.applyFilter(this.filterList, this.filterOperator, false);
    }
    self.initCards(self.dialogs)
      .appendTo(self.$inner);
    self.$cardSideAnnouncer = $('<div>', {
      html: self.params.cardFrontLabel,
      'class': 'h5p-dialogcards-card-side-announcer',
      'aria-live': 'polite',
      'aria-hidden': 'true'
    }).appendTo(self.$inner);

    // Create a $matchFooter container for $matchfooterLeft containing the current score
    // and the normal navigation $footer
    if (this.matchIt && !this.sideBySide) {
      let $matchFooter = $('<div>', {
        'class': 'h5p-dialogcards-match-footer'
      });

      self.createFooterLeft()
        .appendTo($matchFooter);

      self.createFooter()
        .appendTo($matchFooter);

      $matchFooter.appendTo(self.$inner);

    }
    else if (this.sideBySide) {
      self.$sideBySide = $('<div>', {
        'class': 'h5p-dialogcards-side-by-side'
      });

      self.createSubTitleFooter()
        .appendTo(self.$sideBySide);

      self.createFooter()
        .appendTo(self.$sideBySide);

      self.$sideBySide.appendTo(self.$inner);

    }
    else {
      self.createFooter()
        .appendTo(self.$inner);
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
    // TOdo resize only needed in some modes?
    self.trigger('resize');
    self.getCurrentState();

    // we are refreshing from a "next round" screen, so... reset everything to get there
    if (this.repetition && this.cardsLeft === 0) {
      // set parameters as they were on nextRound screen before refreshing page
      this.cardsLeft = 1;
      this.incorrect--;
      self.matchCardsRepetition($(this).parents('.h5p-dialogcards-cardwrap'));
    }
    if (this.playMode === 'selfCorrectionMode' && this.cardsLeft === 0) {
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
  };

  /**
   * Create orderCards option request
   *
   * @returns {*|jQuery|HTMLElement} Order element
   */
  C.prototype.createOrder = function () {
    let self = this;
    let randomizeQuestion = self.params.randomizeCardsQuestion;
    if (this.matchIt) {
      randomizeQuestion = self.params.randomizeRightCardsQuestion;
    }
    let $order = $('<div>', {
      'class': 'h5p-dialogcards-order h5p-dialogcards-options',
      'html': randomizeQuestion
    });

    let $optionButtons = $('<div>', {
      'class': 'h5p-dialogcards-optionsbuttons'
    }).appendTo($order);

    self.$normalOrder = JoubelUI.createButton({
      'class': 'h5p-dialogcards-order-button',
      'title': self.params.no,
      'html': self.params.no
    }).click(function () {
      this.cardsOrderMode = 'normal';
      self.randomizeOrder("normal");
    }).appendTo($optionButtons);

    self.$randomizeOrder = JoubelUI.createButton({
      'class': 'h5p-dialogcards-order-button',
      'title': self.params.yes,
      'html': self.params.yes
    }).click(function () {
      this.cardsOrderMode = 'random';
      self.randomizeOrder("random");
    }).appendTo($optionButtons);

    return $order;
  };

  /**
   * Create cardsSideChoice option request
   *
   * @returns {*|jQuery|HTMLElement} Side element
   */
  C.prototype.createcardsSideChoice = function () {
    let self = this;
    let currentSide;
    let reverseSide;
    if (self.cardsSideMode === 'user') {
      self.cardsSideMode = 'frontFirst';
      currentSide = self.params.cardFrontLabel;
    }
    if (self.cardsSideMode === 'frontFirst') {
      currentSide = self.params.cardFrontLabel;
      reverseSide = self.params.cardBackLabel;
    }
    else {
      currentSide = self.params.cardBackLabel;
      reverseSide = self.params.cardFrontLabel;
    }

    let $side = $('<div>', {
      'class': 'h5p-dialogcards-side h5p-dialogcards-options',
      'html': self.params.currentSideNotice + currentSide
    });
    let $optionButtons = $('<div>', {
      'class': 'h5p-dialogcards-optionsbuttons',
      'html': this.params.reverseSides.replace('@side', reverseSide)
    }).appendTo($side);

    self.$No = JoubelUI.createButton({
      'class': 'h5p-dialogcards-side-button-no',
      'title': self.params.no,
      'html': self.params.no
    }).click(function () {
      // Do nothing, just continue with current card side.
      self.attachContinue();
    }).appendTo($optionButtons);

    self.$Yes = JoubelUI.createButton({
      'class': 'h5p-dialogcards-side-button-yes',
      'title': self.params.yes,
      'html': self.params.yes
    }).click(function () {
      if (self.cardsSideMode === 'backFirst') {
        self.cardsSideMode = 'frontFirst';
      }
      else {
        self.cardsSideMode = 'backFirst';
      }
      self.reverse = true;
      self.attachContinue();
    }).appendTo($optionButtons);
    return $side;
  };

  /**
   * Create numberCards option request
   *
   * @returns {*|jQuery|HTMLElement} numberCards element
   */
  C.prototype.createNumberCards = function () {
    let self = this;
    let numCards = self.dialogs.length;
    let $numberCards = $('<div>', {
      'class': 'h5p-dialogcards-number h5p-dialogcards-options',
      'html': self.params.numCardsQuestion
    });

    let $optionButtons = $('<div>', {
      'class': 'h5p-dialogcards-optionsbuttons'
    }).appendTo($numberCards);

    // Allow user to select a number of cards to play with, by displaying selectable buttons in increments of 5.
    let n = 0;
    if (numCards <= 50) {
      n = 5;
    }
    else {
      n = 10;
    }
    let limit = Math.min(numCards, 100);
    for (let i = n; i < limit; i += n) {
      self.$button = JoubelUI.createButton({
        'class': 'h5p-dialogcards-number-button',
        'title': i,
        'html': i,
        'id': 'dc-number-' + i
      }).click(function () {
        self.nbCards = this.title;
        this.nbCards = this.title;       
          if (self.cardsSideChoice === 'user') {
            $( '.h5p-dialogcards-number', self.$inner ).remove();
            self.createcardsSideChoice().appendTo(self.$inner);
          }
          else {
            self.attachContinue();
          }
      }).appendTo($optionButtons);
    }

    self.$button = JoubelUI.createButton({
      'class': 'h5p-dialogcards-number-button',
      'title': numCards,
      'html': self.params.allCards + " (" + numCards + ")"
    }).click(function () {
      self.nbCards = numCards;
        if (self.cardsSideChoice === 'user') {
          $( '.h5p-dialogcards-number', self.$inner ).remove();
          self.createcardsSideChoice().appendTo(self.$inner);
        }
        else {
          self.attachContinue();
        }
    }).appendTo($optionButtons);
    return $numberCards;
  };


  /**
   * Create filterCards option request
   *
   * @returns {*|jQuery|HTMLElement} self.dialogs array
   */

  C.prototype.createFilterCards = function () {
    const self = this;
    // Init params
    const $filterCards = $('<div>', {
      'class': 'h5p-dialogcards-categories h5p-dialogcards-options',
      'html': self.params.selectFilter
    });

    const $optionButtons = $('<div>', {
      'class': 'h5p-dialogcards-optionsbuttons'
    }).appendTo($filterCards);

    let $class;
    self.nofilter = false;
    let catNames = [];
    let i;
    let filterList;
    let filterOperator;
    let numCardsInCats;
    let catName;
    for (i = 0; i < this.catFilters.length + 1; i++) {
      if (i < this.catFilters.length) {
        filterList = this.catFilters[i]["filterList"];
        filterOperator = this.catFilters[i]["filterOperator"];
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
        self.$button = JoubelUI.createButton({
          'class': $class,
          'title': catName,
          'html': catName + ' (' + numCardsInCats + ')',
          'id': i,
          'filterList': filterList,
          'filterOperator': filterOperator
        }).click(function () {
          $( '.h5p-dialogcards-categories', self.$inner ).remove();
          if (this.id < i - 1) {
            self.filterList = self.catFilters[this.id]["filterList"];
            self.filterOperator = self.catFilters[this.id]["filterOperator"];
            self.applyFilter(self.filterList, self.filterOperator);
            self.currentFilter = this.title;
          }
          else {
            self.currentFilter = self.params.noFilter;
          }
          if (self.cardsOrderChoice === 'user' && self.cardOrder === undefined) {
            self.createOrder().appendTo(self.$inner);
          }
          else  if (self.enableCardsNumber && self.nbCardsSelected === undefined && self.nbCards > 5) {
            self.createNumberCards().appendTo(self.$inner);
          }
          else if (!self.matchIt && self.cardsSideChoice === 'user' && self.cardsSideMode === 'user') {
            self.createcardsSideChoice().appendTo(self.$inner);
          }
          else {
            self.attachContinue();
          }
        }).appendTo($optionButtons);
      }
    }
    return $filterCards;
  };

  /**
   * Create footer/navigation line
   *
   * @returns {*|jQuery|HTMLElement} Footer element
   */
  C.prototype.createFooter = function () {
    let self = this;
    let $footer = $('<nav>', {
      'class': 'h5p-dialogcards-footer',
      'role': 'navigation'
    });
    if (this.matchIt) {
      $footer.addClass('h5p-dialogcards-footer-match-right');
    }
    if (!this.enableGotIt) {
      self.$prev = JoubelUI.createButton({
        'class': 'h5p-dialogcards-footer-button h5p-dialogcards-prev truncated',
        'title': self.params.prev
      }).click(function () {
        self.prevCard();
      }).appendTo($footer);

      self.$next = JoubelUI.createButton({
        'class': 'h5p-dialogcards-footer-button h5p-dialogcards-next truncated',
        'title': self.params.next
      }).click(function () {
        self.nextCard();
      }).appendTo($footer);
    }

    let classesRetry = 'h5p-dialogcards-footer-button h5p-dialogcards-retry h5p-dialogcards-disabled';
    let titleRetry = '';
    let htmlRetry = '';
    if (this.enableGotIt || this.repetition) {
      titleRetry = self.params.nextRound;
      htmlRetry = self.params.nextRound;
    }
    else {
      classesRetry += ' h5p-dialogcards-button-reset';
      titleRetry = self.params.retry;
      htmlRetry = self.params.retry;
    }
    self.$retry = JoubelUI.createButton({
      'class': classesRetry,
      'title': titleRetry,
      'html':  htmlRetry
    }).click(function () {
      if (self.repetition) {
        self.retryRepetition();
      }
      else {
        self.retry();
      }
    }).appendTo($footer);

    if (!this.enableGotIt) {
      self.$progress = $('<div>', {
        'class': 'h5p-dialogcards-progress',
        'aria-live': 'assertive'
      }).appendTo($footer);
    }
    else {
      self.$round = $('<div>', {
        'class': 'h5p-dialogcards-round'
      }).appendTo($footer);

      self.$progress = $('<div>', {
        'class': 'h5p-dialogcards-cards-left',
        'aria-live': 'assertive'
      }).appendTo($footer);
      
    }
    // Mode match with repetition. Under right card display footer similar to the GotIt mode.
    if (this.repetition) {
      self.$round = $('<div>', {
        'class': 'h5p-dialogcards-round repetition'
      }).appendTo($footer);

      self.$progress = $('<div>', {
        'class': 'h5p-dialogcards-cards-left repetition',
        'aria-live': 'assertive'
      }).appendTo($footer);
    }

    return $footer;
  };

  C.prototype.createFooterLeft = function () {
    let $footerLeft = $('<div>', {
      'class': 'h5p-dialogcards-match-footer-left'
    });
    this.$progressFooterLeft = $('<div>', {
      'class': 'h5p-dialogcards-cards-matched',
      'aria-live': 'assertive'
    }).appendTo($footerLeft);
    return $footerLeft;
  };


  C.prototype.createSubTitleFooter = function () {
    this.$subTitle = $('<div>', {
      'class': 'h5p-dialogcards-sub-title'
    });

    this.$displaySubTitleFooter = $('<div>', {
    }).appendTo(this.$subTitle);

    return this.$subTitle;

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
    let relativeHeightCap = 15;
    let height = 0;
    let i;
    let foundImage = false;
    for (i = 0; i < self.dialogs.length; i++) {
      let card = self.dialogs[i];

      let $card = self.$current.find('.h5p-dialogcards-card-content');
      if (card.imageMedia.image === undefined && card.imageMedia.image2 === undefined) {
        continue;
      }
      foundImage = true;
      if (card.imageMedia.image) {
        let imageHeight = card.imageMedia.image.height / card.imageMedia.image.width * $card.get(0).getBoundingClientRect().width;
        if (imageHeight > height) {
          height = imageHeight;
        }
      }
      else if (card.imageMedia.image2) {
        let imageHeight = card.imageMedia.image2.height / card.imageMedia.image2.width * $card.get(0).getBoundingClientRect().width;
        if (imageHeight > height) {
          height = imageHeight;
        }
      }
    }
    if (foundImage) {
      let relativeImageHeight = height / parseFloat(self.$inner.css('font-size'));
      if (relativeImageHeight > relativeHeightCap) {
        relativeImageHeight = relativeHeightCap;
      }
      self.$images.forEach(function ($img) {
        $img.parent().css('height', relativeImageHeight + 'em');
      });
      self.$images2.forEach(function ($img) {
        $img.parent().css('height', relativeImageHeight + 'em');
      });
    }
  };

  /**
   * Adds tip to a card
   *
   * @param {jQuery} $card The card
   * @param {String} [side=front] Which side of the card
   * @param {Number} [index] Index of card
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
    let tips = self.dialogs[index].tips;
    if (tips !== undefined && tips[side] !== undefined) {
      let tip = tips[side].trim();
      if (tip.length) {
        if (!this.noText) {
          $card.find('.h5p-dialogcards-card-text-wrapper .h5p-dialogcards-card-text-inner')
            .after(JoubelUI.createTip(tip, {
              tipLabel: self.params.tipButtonLabel
            }));
        }
        else {
          $card.find('.h5p-dialogcards-image-wrapper')
            .append(JoubelUI.createTip(tip, {
              tipLabel: self.params.tipButtonLabel,
              addclass: 'joubel-tip-notext'
            }));
          $card.find('.joubel-tip-container').addClass('noText');
        }
      }
    }
  };

  /**
   * Creates all cards and appends them to card wrapper.
   *
   * @param {Array} cards Card parameters
   * @returns {*|jQuery|HTMLElement} Card wrapper set
   */
  C.prototype.initCards = function (cards) {
    // Reversed cards array to be used in these options.
    // Check if switching sides is needed.    
    let mustSwitch = false;
    const isReversed = cards[0].text !== this.firstText && !this.catFilters;
    // concise version by ChatGPT 18:26 09/11/2025
    mustSwitch = (this.cardsSideMode === 'backFirst') !== !!this.matchIt;
    if (!isReversed && mustSwitch || isReversed && !mustSwitch) {
      this.switchSides(cards);
    }

    let self = this;
    let loaded = 0;
    let existsCardOrder = true;
    if ($.isEmptyObject(this.cardOrder)) {
      existsCardOrder = false;
    }
    let initLoad = 2;

    // If keepstate then load all cards until last card previously reached by user.
    if (this.progress > 0) {
      initLoad += this.progress;
    }

    if ( (this.cardsOrderMode === 'normal' || this.cardsOrderMode === 'random') && !existsCardOrder) {
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
      this.nbCardsSelected = cards.length;
      this.cardsLeftInStack = this.nbCardsSelected;
      this.cardsLeft = this.nbCardsSelected;
    }

    // Use a previous order if it exists.
    if (this.contentData.previousState) {
      if (this.contentData.previousState.order && existsCardOrder) {
        this.cardOrder.splice(cards.length, this.cardOrder.length);
        let previousOrder = this.contentData.previousState.order;
        let cardOrdering = cards.map(function (cards, index) {
          return [cards, index];
        });
        let newCards = [];
        for (let i = 0; i < previousOrder.length; i++) {
          newCards[i] = cardOrdering[previousOrder[i]][0];
        }
        cards = newCards;
      }
    }

    // Save data to content state for resuming later on.
    // Push the new 'cards array' into self.dialogs.

    self.dialogs = cards;

    self.$cardwrapperSet = $('<div>', {
      'class': 'h5p-dialogcards-cardwrap-set'
    });

    let setCardSizeCallback = function () {
      loaded++;
      if (loaded === initLoad) {
        self.resize();
      }
    };
    if (this.progress !== undefined && this.progress !== -1 && this.matchIt) {
      this.progress = this.progress / 2;
    }
    // Used to randomize first left card on starting game
    let x = Math.floor((Math.random() * (cards.length)) );
    // Do not randomize left card in browse side by side mode.
    if (this.matchIt && this.sideBySide) {
      x = 0;
    }
    // ********************************************** LOOP TO CREATE CARDS **********************************
    for (let i = 0; i < cards.length; i++) {
      // Load cards progressively
      // If matchIt, all cards are loaded upon init, this is needed.
      if (!this.matchIt) {
        if (i >= initLoad) {
          //break; // DEV remove break to load all cards for testing. REMOVED this because causes problem with cards with different heights JR 07 MARCH 2021
        }
      }
      // Set current card index
      // If there is a saved state, then set current card index to saved position (progress)
      // otherwise set it to zero.
      // Idem for current left card index
      let $cardWrapper = self.createCard(cards[i], i, setCardSizeCallback);
      if (((this.progress === undefined || this.progress === -1) && i === 0) || (this.progress !== undefined && i === this.progress)) {
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
        self.addTipToCard($cardWrapper.find('.h5p-dialogcards-card-content'), 'front', i);
      }
      self.$cardwrapperSet.append($cardWrapper);

      // Create the matchLeft cards.
      if (this.matchIt) {
        let $cardWrapperLeft = self.createCardLeft(cards[i], i, setCardSizeCallback);
        let indexLeft;
        if (this.repetition && this.progressLeft || this.playMode === 'browseSideBySide') {
          indexLeft = (this.progressLeft - 1) / 2;
        }

        if (((this.progressLeft === undefined || this.progressLeft === -1) && i === x)
          || (this.progressLeft !== undefined && i === indexLeft)) {
          $cardWrapperLeft.addClass('h5p-dialogcards-current-left');
          self.$currentLeft = $cardWrapperLeft;
        }
        $cardWrapperLeft.addClass('h5p-dialogcards-cardwrap-left');
        if (this.repetition && this.noMatchCards) {
          $cardWrapperLeft.addClass('h5p-dialogcards-cardwrap-left-repetition');
          if (this.noMatchCards[i]
            && !$cardWrapperLeft.hasClass('h5p-dialogcards-current-left')
          ) {
            $cardWrapper.addClass('h5p-dialogcards-noMatch');
            $cardWrapperLeft.addClass('h5p-dialogcards-noMatch');
            $cardWrapperLeft.removeClass('h5p-dialogcards-cardwrap-left-repetition h5p-dialogcards-current-left');
          }
        }

        if (this.cardsSideMode === 'frontFirst') {
          self.addTipToCard($cardWrapper.find('.h5p-dialogcards-card-content'), 'back', i);
          self.addTipToCard($cardWrapperLeft.find('.h5p-dialogcards-card-content'), 'front', i);
        }
        else {
          self.addTipToCard($cardWrapper.find('.h5p-dialogcards-card-content'), 'front', i);
          self.addTipToCard($cardWrapperLeft.find('.h5p-dialogcards-card-content'), 'back', i);
        }
        self.$cardwrapperSet.append($cardWrapperLeft);
      }
    }

    // ********************************************** END LOOP TO CREATE CARDS **********************************

    return self.$cardwrapperSet;
  };

  /**
   * Create a single card card
   *
   * @param {Object} card Card parameters
   * @param {number} cardNumber Card number in order of appearance
   * @param {Function} [setCardSizeCallback] Set card size callback
   * @returns {*|jQuery|HTMLElement} Card wrapper
   */
  C.prototype.createCard = function (card, cardNumber, setCardSizeCallback) {

    let $cardWrapper = $('<div>', {
      'class': 'h5p-dialogcards-cardwrap'
    });

    let $cardHolder = $('<div>', {
      'class': 'h5p-dialogcards-cardholder'
    }).appendTo($cardWrapper);

    // Progress for assistive technologies
    let progressText = this.params.progressText
      .replace('@card', (cardNumber + 1).toString())
      .replace('@total', (this.params.dialogs.length).toString());
    $('<div>', {
      'class': 'h5p-dialogcards-at-progress',
      'text': progressText
    }).appendTo($cardHolder);

    this.createCardContent(card, cardNumber, setCardSizeCallback)
      .appendTo($cardHolder);

    return $cardWrapper;

  };

  C.prototype.createCardLeft = function (rcard, cardNumber, setCardSizeCallback) {
    let $cardWrapperLeft = $('<div>', {
      'class': 'h5p-dialogcards-cardwrap-left'
    });

    let $cardHolderLeft = $('<div>', {
      'class': 'h5p-dialogcards-cardholder'
    }).appendTo($cardWrapperLeft);

    this.createCardContentLeft(rcard, cardNumber, setCardSizeCallback)
      .appendTo($cardHolderLeft);

    return $cardWrapperLeft;

  };

  /**
   * Create content for a card
   *
   * @param {Object} card Card parameters
   * @param {number} cardNumber Card number in order of appearance
   * @param {Function} [setCardSizeCallback] Set card size callback
   * @returns {*|jQuery|HTMLElement} Card content wrapper
   */
  C.prototype.createCardContent = function (card, cardNumber, setCardSizeCallback) {
    let $cardContent = $('<div>', {
      'class': 'h5p-dialogcards-card-content'
    });
    let isLeft = false;
    $cardContent.css('background-color', this.backgroundColor);
    if (this.matchIt && this.cardsSideMode === 'frontFirst') {
      $cardContent.css('background-color', this.backgroundColorBack);
    }
    if (card.imageMedia.image !== undefined || card.imageMedia.image2 !== undefined) {

      this.createCardImage(card, setCardSizeCallback, isLeft)
        .appendTo($cardContent);
    }

    let $cardTextWrapper = $('<div>', {
      'class': 'h5p-dialogcards-card-text-wrapper'
    }).appendTo($cardContent);

    let $cardTextInner = $('<div>', {
      'class': 'h5p-dialogcards-card-text-inner'
    }).appendTo($cardTextWrapper);

    let $cardTextInnerContent = $('<div>', {
      'class': 'h5p-dialogcards-card-text-inner-content'
    }).appendTo($cardTextInner);

    if (this.hasAudio && !this.noText) {
      this.createCardAudio(card)
        .appendTo($cardTextInnerContent);

      this.createCardAudio2(card)
        .appendTo($cardTextInnerContent);
    }

    let $cardText = $('<div>', {
      'class': 'h5p-dialogcards-card-text'
    }).appendTo($cardTextInnerContent);

    $('<div>', {
      'class': 'h5p-dialogcards-card-text-area',
      'tabindex': '-1',
      'html': card.text
    }).appendTo($cardText);

    if (!card.text || !card.text.length) {
      $cardText.addClass('hide');
    }

    if (!this.noText) {
      this.createCardFooter()
        .appendTo($cardTextWrapper);
    }
    else {
      $cardTextWrapper.addClass('hide');
      if (this.hasAudio) {
        this.createCardAudio(card)
          .appendTo($cardContent);
        this.createCardAudio2(card)
          .appendTo($cardContent);
      }
      this.createCardFooter()
        .appendTo($cardContent)
        .addClass('spacer');
    }

    return $cardContent;
  };

  /**
   * Create content for a card on the left (in Match modes)
   *
   * @param {Object} card Card parameters
   * @param {number} cardNumber Card number in order of appearance
   * @param {Function} [setCardSizeCallback] Set card size callback
   * @returns {*|jQuery|HTMLElement} Card content wrapper
   */
  C.prototype.createCardContentLeft = function (card, cardNumber, setCardSizeCallback) {
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
      'class': 'h5p-dialogcards-card-content'
    });

    $cardContent.addClass('h5p-dialogcards-matchLeft');
    if (this.cardsSideMode === 'frontFirst') {
      $cardContent.css('background-color', this.backgroundColor);
    }
    else {
      $cardContent.css('background-color', this.backgroundColorBack);
    }

    // Upon restore content state maybe necessary to hide previously incorrectly matched cards
    // Do not create image div is not necessary
    if (card.imageMedia.image !== undefined || card.imageMedia.image2 !== undefined) {
      let isLeft = true;
      self.createCardImage(card, setCardSizeCallback, isLeft)
        .appendTo($cardContent);
    }

    let $cardTextWrapper = $('<div>', {
      'class': 'h5p-dialogcards-card-text-wrapper'
    }).appendTo($cardContent);

    let $cardTextInner = $('<div>', {
      'class': 'h5p-dialogcards-card-text-inner'
    }).appendTo($cardTextWrapper);

    let $cardTextInnerContent = $('<div>', {
      'class': 'h5p-dialogcards-card-text-inner-content'
    }).appendTo($cardTextInner);

    if (this.matchIt) {
      if (card.audioMedia.audio !== undefined) {
        self.createCardAudio(card)
          .appendTo($cardTextInnerContent);
      }
      if (card.audioMedia.audio2 !== undefined) {
        self.createCardAudio2(card)
          .appendTo($cardTextInnerContent);
      }
    }

    let $cardText = $('<div>', {
      'class': 'h5p-dialogcards-card-text'
    }).appendTo($cardTextInnerContent);

    $('<div>', {
      'class': 'h5p-dialogcards-card-text-area',
      'tabindex': '-1',
      'html': card.text
    }).appendTo($cardText);

    if (!card.text || !card.text.length) {
      $cardText.addClass('hide');
    }

    // Dummy cardfooter to get a "correct" left card height if too much text...
    // Create it if needed by this.sideBySide
    if (!this.noText) {
      if (self.params.behaviour.scaleTextNotCard === false || this.sideBySide) {
        let $cardFooterLeft = $('<div>', {
          'class': 'h5p-dialogcards-card-footer subtitle'
        });
        $cardFooterLeft.appendTo($cardTextWrapper);
      }
    }
    else {
      $cardTextWrapper.addClass('hide');
      if (this.hasAudio) {
        self.createCardAudio(card)
          .appendTo($cardContent);
        self.createCardAudio2(card)
          .appendTo($cardContent);
      }
      let $cardFooterLeft = $('<div>', {
        'class': 'h5p-dialogcards-card-footer spacer'
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
   *
   * @returns {*|jQuery|HTMLElement} Card footer element
   */
  C.prototype.createCardFooter = function () {
    let self = this;
    let footerClass;
    if (!this.enableGotIt) {
      footerClass = 'h5p-dialogcards-card-footer';
      if (this.sideBySide) {
        footerClass = 'h5p-dialogcards-card-footer subtitle';
      }
    }
    else {
      footerClass = 'h5p-dialogcards-card-footer-enablegotit';
    }
    let $cardFooter = $('<div>', {
      'class': footerClass
    });

    let classesRepetition = 'h5p-dialogcards-button-hidden';
    let classesRepetitionOff = '';
    let attributeTabindex = '-1';

    if (this.enableGotIt || this.matchIt) {
      classesRepetition = 'h5p-dialogcards-quick-progression h5p-dialogcards-disabled';
      attributeTabindex = '0';
    }
    else {
      classesRepetitionOff = 'h5p-dialogcards-button-hidden';
    }

    if (this.enableGotIt) {
      this.$buttonIncorrect = H5P.JoubelUI.createButton({
        'class': 'h5p-dialogcards-answer-button',
        'html': this.params.incorrectAnswer
      }).click(function () {
        self.gotItIncorrect();
      }).addClass('incorrect')
        .addClass(classesRepetition)
        .attr('tabindex', attributeTabindex)
        .appendTo($cardFooter);

      // JR dummy incorrect button for front of card only
      this.$buttonIncorrectOff = H5P.JoubelUI.createButton({
        'class': 'h5p-dialogcards-answer-button-off',
        'html': this.params.incorrectAnswer
      }).addClass('incorrect')
        .addClass(classesRepetitionOff)
        .attr('tabindex', -1)
        .appendTo($cardFooter);
    }

    if (!this.matchIt) {
      htmlText = self.hideTurnButton ? self.params.check : self.params.answer;
      this.$buttonTurn = H5P.JoubelUI.createButton({
        'class': 'h5p-dialogcards-turn',
        'html': htmlText
      }).click(function () {
        self.turnCard($(this).parents('.h5p-dialogcards-cardwrap'));
      }).attr('tabindex', 0)
        .appendTo($cardFooter);
    }
    else if (!this.sideBySide) {
      this.$buttonMatch = H5P.JoubelUI.createButton({
        'class': 'h5p-dialogcards-button-match',
        'html': self.params.matchButtonLabel
      }).click(function () {
        if (self.repetition) {
          self.matchCardsRepetition($(this).parents('.h5p-dialogcards-cardwrap'));
        }
        else {
          self.matchCards($(this).parents('.h5p-dialogcards-cardwrap'));
        }
      }).attr('tabindex', 1)
        .appendTo($cardFooter);

      let classesMatch = 'h5p-dialogcards-answer-button h5p-dialogcards-quick-progression h5p-dialogcards-match h5p-dialogcards-disabled';
      // JR dummy button for correct match.
      this.$buttonCorrectMatch = H5P.JoubelUI.createButton({
        'class': classesMatch,
        'html': self.params.correctMatch
      }) .addClass('correct')
        .attr('tabindex', -1)
        .appendTo($cardFooter);

      // JR dummy button for incorrect match.
      this.$buttonIncorrectMatch = H5P.JoubelUI.createButton({
        'class': classesMatch,
        'html': self.params.incorrectMatch
      }).addClass('incorrect')
        .attr('tabindex', -1)
        .appendTo($cardFooter);
    }

    if (this.enableGotIt) {
      this.$buttonCorrect = H5P.JoubelUI.createButton({
        'class': 'h5p-dialogcards-answer-button',
        'html': this.params.correctAnswer
      }).click(function () {
        self.gotItCorrect($(this).parents('.h5p-dialogcards-cardwrap'));
      }).addClass('correct')
        .addClass(classesRepetition)
        .attr('tabindex', 0)
        .appendTo($cardFooter);

      // JR dummy incorrect button for front of card only
      this.$buttonCorrectOff = H5P.JoubelUI.createButton({
        'class': 'h5p-dialogcards-answer-button-off',
        'html': this.params.correctAnswer
      }).addClass('correct')
        .addClass(classesRepetitionOff)
        .attr('tabindex', -1)
        .appendTo($cardFooter);
    }

    return $cardFooter;
  };

  /**
   * Create card image
   *
   * @param {Object} card Card parameters
   * @param {Function} [loadCallback] Function to call when loading image
   * @returns {*|jQuery|HTMLElement} Card image wrapper
   */

  C.prototype.createCardImage = function (card, loadCallback, isLeft = false) {
    let self = this;
    let $image;
    let $image2;
    let i;
    let i2;
    let $2images = false;
    let $imageWrapper = $('<div>', {
      'class': 'h5p-dialogcards-image-wrapper'
    });

    if (this.matchIt && card.imageMedia.image !== undefined && card.imageMedia.image2 !== undefined) {
      $2images = true;
      if (isLeft) {
        i = card.imageMedia.image;
        i2 = card.imageMedia.image2;
        card.imageMedia.image = i2;
        card.imageMedia.image2 = i;
      }
    }

    if (card.imageMedia.image !== undefined) { // Alternative conditions for (front) image to be displayed.
      if (this.cardsSideMode === 'frontFirst' || !this.noDupeFrontPicToBack || this.matchIt) {
        $image = $('<img class="h5p-dialogcards-image" src="' + H5P.getPath(card.imageMedia.image.path, self.id) + '"/>');
      }
      else {
        $image = $('<img class="h5p-dialogcards-image h5p-dialogcards-hide" src="' + H5P.getPath(card.imageMedia.image.path, self.id) + '"/>');
      }
      if (loadCallback) {
        $image.load(loadCallback);
      }
      if (card.imageAltText) {
        $image.attr('alt', card.imageAltText);
      }
    }
    else {
      if (this.cardsSideMode === 'backFirst') {
        $image = $('<div class="h5p-dialogcards-image h5p-dialogcards-hide"></div>');
      }
      else {
        $image = $('<div class="h5p-dialogcards-image"></div>');
      }
      if (loadCallback) {
        loadCallback();
      }
    }

    if (card.imageMedia.image2 !== undefined) {
      // In browse or self-correction modes, if there is a back image but no front image, use the back image in backFirst mode.
      // In match modes, create image2 on left side if backFirst OR create it on right side if frontFirst.
      if ((this.cardsSideMode === 'backFirst' && !card.imageMedia.image)
        || (self.matchIt && isLeft && this.cardsSideMode === 'backFirst' && !$2images)
        || (self.matchIt && !isLeft && this.cardsSideMode === 'frontFirst' && !$2images)
      ) {
        $image2 = $('<img class="h5p-dialogcards-image2" src="' + H5P.getPath(card.imageMedia.image2.path, self.id) + '"/>');
      }
      else {
        $image2 = $('<img class="h5p-dialogcards-image2 h5p-dialogcards-hide" src="' + H5P.getPath(card.imageMedia.image2.path, self.id) + '"/>');
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

    // OCTOBER 2021 New noDupeFrontPicToBack option.
    if (this.noDupeFrontPicToBack && (this.cardsSideMode === 'frontFirst' && !isLeft || this.cardsSideMode === 'backFirst' && isLeft)) {
      $image.addClass('h5p-dialogcards-hide');
    }

    self.$images.push($image);
    $image.appendTo($imageWrapper);

    // Restore initial card images
    if ($2images && isLeft) {
      card.image = i;
      card.image2 = i2;
    }

    return $imageWrapper;
  };

  /**
   * Create card audio
   *
   * @param {Object} card Card parameters
   * @returns {*|jQuery|HTMLElement} Card audio element
   */
  C.prototype.createCardAudio = function (card) {
    let self = this;
    let audio = null;
    let audioClass = 'h5p-dialogcards-audio-wrapper';
    if (this.noText) {
      audioClass += ' spacer';
    }
    let $audioWrapper = $('<div>', {
      'class': audioClass
    });
    if (card.audioMedia.audio !== undefined) {
      let audioDefaults = {
        files: card.audioMedia.audio,
        audioNotSupported: self.params.audioNotSupported
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
   *
   * @param {Object} card Card parameters
   * @returns {*|jQuery|HTMLElement} Card audio element
   */
  C.prototype.createCardAudio2 = function (card) {
    let self = this;
    let audio2 = null;
    let audioClass = 'h5p-dialogcards-audio-wrapper2 hide';
    if (this.noText) {
      audioClass += ' spacer';
    }
    let $audioWrapper2 = $('<div>', {
      'class': audioClass
    });
    if (card.audioMedia.audio2 !== undefined) {
      let audioDefaults = {
        files: card.audioMedia.audio2,
        audioNotSupported: self.params.audioNotSupported
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
    let $card = self.$current.find('.h5p-dialogcards-card-content');
    if (this.sideBySide) {
      let $cardFooter = $card.find('.h5p-dialogcards-card-footer');
      $cardFooter.html(this.rightSubTitle);
      const i = self.$current.index() / 2;
      // Clear subTitle text in case self.dialogs[i].cardSubtitle is undefined
      let cardSubTitle = self.dialogs[i].cardSubtitle;
      if (cardSubTitle === undefined) {
        cardSubTitle = '&nbsp;';
        this.$subTitle.addClass('h5p-dialogcards-hide');
      }
      else {
        this.$subTitle.removeClass('h5p-dialogcards-hide');
      }
      self.$displaySubTitleFooter.html('');
      if (this.params.enableCardSubTitle) {
        self.$displaySubTitleFooter.html(cardSubTitle);
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

    $nextCard = self.$current.nextAll('.h5p-dialogcards-cardwrap').eq(0);

    if (this.repetition) {
      while ($nextCard.hasClass('h5p-dialogcards-noMatch')) {
        $nextCard = $nextCard.nextAll('.h5p-dialogcards-cardwrap').eq(0);
      }
    }
    if ((this.playMode === 'normalMode' || this.playMode === 'browseSideBySide') && $nextCard.length === 0) {
      self.finishedScreen();
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
        self.$prev.removeClass('h5p-dialogcards-disabled');
      }
      else {
        self.$prev.addClass('h5p-dialogcards-disabled');
      }
    }

    if (this.enableGotIt) {
      // In case it was hidden when refreshing
      $card.find('.h5p-dialogcards-answer-button-off').removeClass('h5p-dialogcards-hide');
      if (this.hideTurnButton) {
        $card.find('.h5p-dialogcards-turn').removeClass('h5p-dialogcards-hide');
      }
      const selectionIndex = self.$current.index();
      //let theindex = self.nbCards - self.dialogs.length;

      self.$progress.text(this.params.cardsLeft
        .replace('@number', self.dialogs.length - selectionIndex - this.endOfStack));
      self.$round.text(this.params.round
        .replace('@round', this.currentRound));
    }
    else if (this.matchIt && !this.sideBySide) {
      self.$progressFooterLeft.text(this.params.matchesFound
        .replace('@correct', this.correct)
        .replace('@incorrect', this.incorrect));
      this.matchCorrect = null;
      if (!this.repetition) {
        self.$progress.text(self.params.progressText.replace('@card', (self.$current.index()) / 2 + 1)
          .replace('@total', self.dialogs.length));
      }
      else {
        //let theindex = self.nbCards - self.dialogs.length;
        self.$progress.text(this.params.cardsLeft
          .replace('@number', this.cardsLeft));
        self.$round.text(this.params.round
          .replace('@round', this.currentRound));
      }
    }
    else if (this.sideBySide) {
      self.$progress.text(self.params.progressText.replace('@card', (self.$current.index()) / 2 + 1)
        .replace('@total', self.dialogs.length));
        if ($nextCard.length === 0) {          
          self.$retry.removeClass('h5p-dialogcards-disabled');
        }
    }
    else {
      self.$progress.text(self.params.progressText.replace('@card', (self.$current.index()) + 1)
        .replace('@total', self.dialogs.length));
    }
  };

  /**
   * Show next card. If matchIt show next card on the right.
   */
  C.prototype.nextCard = function () {
    let self = this;

    // In those 2 modes, consider activity answered when first card is clicked.
    if (this.playMode === 'normalMode' || this.playMode === 'browseSideBySide') {
      self.triggerAnswered();
    }
    self.stopAudio(self.$current.index());
    if (this.matchIt) {
      let $leftCard = self.$currentLeft;
      self.stopAudio($leftCard.index());
    }

    let $nextCard = self.$current.nextAll('.h5p-dialogcards-cardwrap').eq(0);

    if (this.repetition) {
      while ($nextCard.length && $nextCard.hasClass('h5p-dialogcards-noMatch') ) {
        $nextCard = $nextCard.nextAll('.h5p-dialogcards-cardwrap').eq(0);
      }
    }

    if ($nextCard.length) {
      self.$current.removeClass('h5p-dialogcards-current h5p-dialogcards-match-right').addClass('h5p-dialogcards-previous');
      self.$current = $nextCard.addClass('h5p-dialogcards-current');
      if (this.matchIt) {
        self.$current.addClass('h5p-dialogcards-match-right');
      }
      self.setCardFocus(self.$current);
      // If matchIt, all cards are loaded upon init, this is needed.
      // Add next card.
      if (!this.matchIt) {
        let $loadCard = self.$current.next('.h5p-dialogcards-cardwrap');
        if (!$loadCard.length && self.$current.index() + 1 < self.dialogs.length) {
          let $cardWrapper = self.createCard(self.dialogs[self.$current.index() + 1], self.$current.index() + 1)
            .appendTo(self.$cardwrapperSet);
          self.addTipToCard($cardWrapper.find('.h5p-dialogcards-card-content'), 'front', self.$current.index() + 1);
        }
      }
      //needed?
      self.resize();
      if (!this.matchIt) {
        self.turnCardToFront();
      }
    }
    else { // Next card not loaded or end of cards.
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
      }, 300);
    }

  };

  C.prototype.nextCardLeft = function () {
    let self = this;
    let x = Math.floor((Math.random() * (self.dialogs.length)) );
    if (this.matchIt && this.sideBySide) {
      x = 0;
    }
    let $nextCardLeft = self.$currentLeft.nextAll('.h5p-dialogcards-cardwrap-left').eq(x);
    if ($nextCardLeft.length) {
      self.$currentLeft = $nextCardLeft.addClass('h5p-dialogcards-current-left');
      self.$currentLeft.removeClass('h5p-dialogcards-disabled');
      self.resize();
    }
    else {
      let $prevCardLeft = self.$currentLeft.prevAll('.h5p-dialogcards-cardwrap-left').eq(x);
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
      self.$currentLeft = $prevCardLeft.addClass('h5p-dialogcards-current-left');
      self.$currentLeft.removeClass('h5p-dialogcards-previous-left h5p-dialogcards-disabled');
    }
  };

  C.prototype.nextCardLeftRepetition = function () {
    let self = this;
    let x = Math.floor((Math.random() * (this.cardsLeft)) );
    // let $leftCard = self.$currentLeft;
    let $nextCardLeft = self.$currentLeft.nextAll('.h5p-dialogcards-cardwrap-left-repetition').eq(x);

    if ($nextCardLeft.length) {
      self.$currentLeft = $nextCardLeft.addClass('h5p-dialogcards-current-left');
      self.$currentLeft.removeClass('h5p-dialogcards-disabled');
      self.resize();
    }
    else {
      let $prevCardLeft = self.$currentLeft.prevAll('.h5p-dialogcards-cardwrap-left-repetition').eq(x);
      // let i = 0;
      while (!$prevCardLeft.length) {
        let y = Math.round(Math.random());
        if (y === 0) {
          $prevCardLeft = $('.h5p-dialogcards-cardwrap-left-repetition').first();
        }
        else {
          $prevCardLeft = $('.h5p-dialogcards-cardwrap-left-repetition').last();
        }
      }
      self.$currentLeft = $prevCardLeft.addClass('h5p-dialogcards-current-left');
      self.$currentLeft.removeClass('h5p-dialogcards-previous-left h5p-dialogcards-disabled');
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
    let cardsLeftInStack = self.dialogs.length - selectionIndex - this.endOfStack;
    this.incorrect++;
    if ($next.length) {
      let audioIndex = self.nbCards - self.dialogs.length;
      self.stopAudio(audioIndex);
      self.$current.removeClass('h5p-dialogcards-current h5p-dialogcards-turned').addClass('h5p-dialogcards-previous');
      self.$current = $next.addClass('h5p-dialogcards-current');
      self.setCardFocus(self.$current);
      self.turnCardToFront();

      self.$current.find('.h5p-dialogcards-answer-button').addClass('h5p-dialogcards-disabled');

      // Add next card if not loaded yet.
      let $loadCard = self.$current.next('.h5p-dialogcards-cardwrap');
      if (!$loadCard.length && self.$current.index() + 1 < self.dialogs.length) {
        let $cardWrapper = self.createCard(self.dialogs[self.$current.index() + 1], self.$current.index() + 1)
          .appendTo(self.$cardwrapperSet);
        self.addTipToCard($cardWrapper.find('.h5p-dialogcards-card-content'), 'front', self.$current.index() + 1);
        self.resize();
      }
      self.turnCardToFront();

      // Update navigation
      self.updateNavigation();
      self.resetButtons('answer buttons');

      // Next card not loaded or end of cards.
    }
    else if (cardsLeftInStack) {
      this.endOfStack = 1;
      self.updateNavigation();
      self.resetButtons('retry button');
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
        let $prevCardLeft = self.$currentLeft.prevAll('.h5p-dialogcards-cardwrap-left').eq(0);
        if (!$prevCardLeft.length) {
          $prevCardLeft = $('.h5p-dialogcards-cardwrap-left').first();
        }
        setTimeout(function () {
          self.$currentLeft = $prevCardLeft.addClass('h5p-dialogcards-current-left');
          self.$currentLeft.removeClass('h5p-dialogcards-previous-left h5p-dialogcards-disabled');
        }, 300);
      }
    }
    let $prevCard = self.$current.prevAll('.h5p-dialogcards-cardwrap').eq(0);
    // let $nomatch = $prevCard.hasClass('h5p-dialogcards-noMatch');
    while ($prevCard.length && $prevCard.hasClass('h5p-dialogcards-noMatch')) {
      $prevCard = $prevCard.prevAll('.h5p-dialogcards-cardwrap').eq(0);
    }
    // let $nextCard = self.$current.nextAll('.h5p-dialogcards-cardwrap').eq(0);
    if ($prevCard.length) {
      self.stopAudio(self.$current.index());
      self.$current.removeClass('h5p-dialogcards-current');
      self.$current = $prevCard.addClass('h5p-dialogcards-current').removeClass('h5p-dialogcards-previous');
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
   * User selected cards order option (normal/random).
   */
  C.prototype.randomizeOrder = function (cardsOrder) {
    let self = this;
    this.cardsOrderMode = cardsOrder;
    $( '.h5p-dialogcards-order', self.$inner ).remove();
    if (this.enableCardsNumber && cardsOrder === 'random' && self.nbCards > 5) {
      self.createNumberCards()
        .appendTo(self.$inner);
    }
    else {
        if (this.cardsSideChoice === 'user') {
          $( '.h5p-dialogcards-number', self.$inner ).remove();
          // Just in case user clicked twice on the No button!
          setTimeout(function () {
            self.createcardsSideChoice().appendTo(self.$inner);
          }, 300);
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
  //return;
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
   *
   * @param {jQuery} $card
   */
  C.prototype.turnCard = function ($card) {

    let self = this;
    let $cg;
    //let $c = $card.find('.h5p-dialogcards-card-content');
    let $c = self.$current.find('.h5p-dialogcards-card-content');
    let $ci = $card.find('.h5p-dialogcards-image');
    let $ci2 = $card.find('.h5p-dialogcards-image2');
    //let $ca = $card.find('.h5p-dialogcards-audio-wrapper');
    //let $ca2 = $card.find('.h5p-dialogcards-audio-wrapper2');
    let turned = $c.hasClass('h5p-dialogcards-turned');
    let $ch = $card.find('.h5p-dialogcards-cardholder').addClass('h5p-dialogcards-collapse');
    if (this.enableGotIt) {
      $cg = $card.find('.h5p-dialogcards-answer-button');
    }
    

    // Removes tip, since it destroys the animation:
    $c.find('.joubel-tip-container').remove();

    // Check if card has been turned before
    self.$cardSideAnnouncer.html(turned ? self.params.cardFrontLabel : self.params.cardBackLabel);

    if (turned) {
      $c.css('background-color', this.backgroundColor);
    }
    else {
      $c.css('background-color', this.backgroundColorBack);
    }

    // Update HTML class for card
    $c.toggleClass('h5p-dialogcards-turned', !turned);

    setTimeout(function () {

      $ch.removeClass('h5p-dialogcards-collapse');

      // Manage front & back texts.
      let $cardText = $card.find('.h5p-dialogcards-card-text');
      if (self.cardsSideMode === 'frontFirst') {
        if (self.dialogs[$card.index()]['answer']) {
          self.changeText($c, self.dialogs[$card.index()][turned ? 'text' : 'answer']);
          $cardText.removeClass('hide');
        }
      }
      else if ($ci2.attr('src')) { // backFirst & image2
        self.changeText($c, self.dialogs[$card.index()][turned ? 'text' : 'answer']);
        $cardText.removeClass('hide');
      }
      else {
        self.changeText($c, self.dialogs[$card.index()][turned ? 'text' : 'answer']);
      }

      let $off = self.$current.find('.h5p-dialogcards-answer-button-off');

      // Manage front & back images.
      if ($ci2.attr('src')) {
        if (self.cardsSideMode === 'frontFirst') {
          if (!self.hideFrontImage) {
            $ci.toggleClass('h5p-dialogcards-hide');
          }
          $ci2.toggleClass('h5p-dialogcards-hide');
        }
        else {
          // If exists image
          if ($ci.attr('src')) {
            if ($ci.attr('src') !== $ci2.attr('src')) {
              $ci.toggleClass('h5p-dialogcards-hide');
            }
            $ci2.toggleClass('h5p-dialogcards-hide');
          }
        }
      }
      else {
        if (self.cardsSideMode === 'frontFirst' && self.noDupeFrontPicToBack) {
          //$ci.toggleClass('h5p-dialogcards-hide');
          //$ci2.toggleClass('h5p-dialogcards-hide');
        }
        else {
          if (self.params.behaviour.noDupeFrontPicToBack) {
            //$ci.toggleClass('h5p-dialogcards-hide');
          }
          else {
            //$ci2.removeClass('h5p-dialogcards-hide');
          }

        }
      }

      let audioIndex = self.$current.index();
      /* why?
      if (this.enableGotIt) {
        audioIndex = (self.nbCards - self.dialogs.length);
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
        $cg.toggleClass('h5p-dialogcards-disabled');
        $off.toggleClass('h5p-dialogcards-disabled');
      }

      // Toggle state for gotIt buttons
      if (self.enableGotIt) {
        if (!turned && self.hideTurnButton) {
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
            .removeClass('h5p-dialogcards-quick-progression');
        }
      }

      // Add backside tip
      // Had to wait a little, if not Chrome will displace tip icon
      setTimeout(function () {
        self.addTipToCard($c, turned ? 'front' : 'back');
        if (!self.$current.next('.h5p-dialogcards-cardwrap').length && self.dialogs.length > 1) {
          if (self.params.behaviour.enableRetry && !this.enableGotIt) {
            self.resizeOverflowingText();
          }
        }
      }, 200);

      self.resizeOverflowingText();

      // Focus text
      $card.find('.h5p-dialogcards-card-text-area').focus();
    }, 200);
    let $nextCard = self.$current.next('.h5p-dialogcards-cardwrap');
    if (self.params.behaviour.enableRetry && $nextCard.length === 0 && !this.enableGotIt) {
      self.resetButtons('retry button');
    }
    if (this.endOfStack) {
      self.updateNavigation();
    }

  };

  /**
   * Change text of card, used when turning cards.
   *
   * @param $card
   * @param text
   */
  C.prototype.changeText = function ($card, text) {
    let $cardText = $card.find('.h5p-dialogcards-card-text-area');
    $cardText.html(text);

    $cardText.toggleClass('hide', (!text || !text.length));
  };

  /**
   * Stop audio of card with cardindex
   * @param {Number} cardIndex Index of card
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
   * @param {Number} cardIndex Index of card
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
   * Hide audio button
   *
   * @param $card
   */
  C.prototype.removeAudio = function ($card) {
    let self = this;
    self.stopAudio($card.closest('.h5p-dialogcards-cardwrap').index());
    $card.find('.h5p-audio-inner')
      .addClass('hide');
  };

  C.prototype.showAllAudio = function () {
    let self = this;
    self.$cardwrapperSet.find('.h5p-audio-inner')
      .removeClass('hide');
  };

  /**
   * Reset the task so that the user can re-start from first card.
   */
  C.prototype.retry = function () {
    let self = this;
    let $card = $(this);
    // To hide the summary text upon retrying
    if (this.noText) {
      $card.find('.h5p-dialogcards-card-text-wrapper').addClass('hide');
    }
    // In case a dark background was set for the cards.
    $card.find('.h5p-dialogcards-card-content').removeClass('h5p-dialogcards-summary-screen');
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
    if (this.taskFinished && (this.playMode !== 'normalMode' && this.playMode !== 'browseSideBySide')) {
      self.finishedScreen();
      self.trigger('resize');
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
      self.dialogs.splice(this.lastCardIndex, 1);
      if (!$.isEmptyObject(this.cardOrder)) {
        self.cardOrder.splice(this.lastCardIndex, 1);
      }
      // TODO JR not sure this is actually used!
      if (!self.params.behaviour.scaleTextNotCard) {
        self.cardSizeDetermined.splice(this.lastCardIndex + 2, 1);
      }
      // Remove the 'gotitdone' card from DOM
      $( '.h5p-dialogcards-gotitdone', self.$inner).remove();

      this.lastCardIndex = 0;
    }
    let $cards = self.$inner.find('.h5p-dialogcards-cardwrap');
    self.stopAudio(self.$current.index());
    self.$current.removeClass('h5p-dialogcards-current');
    self.$current = $cards.filter(':first').addClass('h5p-dialogcards-current');

    self.updateNavigation();
    // audio buttons
    let paused = 'h5p-audio-minimal-play-paused';
    let play =  'h5p-audio-minimal-play';

    $cards.each(function (index) {
      let $card = $(this).removeClass('h5p-dialogcards-previous h5p-dialogcards-turned');
      self.changeText($card, self.dialogs[$card.index()].text);
      let $cardContent = $card.find('.h5p-dialogcards-card-content');

      // Show all front images (ci) and hide all back images (ci2)
      let $ci = $card.find('.h5p-dialogcards-image');
      let $ci2 = $card.find('.h5p-dialogcards-image2');
      $ci.removeClass('h5p-dialogcards-hide');
      $ci2.addClass('h5p-dialogcards-hide');
      if (self.cardsSideMode === 'backFirst') {
        $ci2.removeClass('h5p-dialogcards-hide');
      }

      // Show all front audios (ca) and hide all back audios (ca2)
      let $ca = $card.find('.h5p-dialogcards-audio-wrapper');
      let $ca2 = $card.find('.h5p-dialogcards-audio-wrapper2');
      $ca.removeClass('hide');
      $ca2.addClass('hide');
      self.resetAudio(index);

      // Replace potential "paused" button with "ready to play" button
      let $caButton = $card.find('.h5p-audio-minimal-button');
      if ($caButton.hasClass(paused)) {
        $caButton.switchClass( paused, play);
      }

      // Case option cardsSideChoice and image2 but no image
      if (self.cardsSideChoice && !self.dialogs[$card.index()].image
          && self.dialogs[$card.index()].image2
          && self.cardsSideMode === 'backFirst') {
        $ci.addClass('h5p-dialogcards-hide');
        $ci2.removeClass('h5p-dialogcards-hide');
      }

      $cardContent.removeClass('h5p-dialogcards-turned');
      self.addTipToCard($cardContent, 'front', index);
      // In case it was hidden on the summary screen.
      $card.find('.h5p-dialogcards-image-wrapper').removeClass('h5p-dialogcards-hide');
    });
    // hide and show audio not used in papi Jo version BUT SHOULD DO A GENERAL RESET OF ALL AUDIO BUTTONS upon retry

    //self.showAllAudio();
    self.resizeOverflowingText();
    self.setCardFocus(self.$current);
    self.$current.find('.h5p-dialogcards-answer-button-off').removeClass('h5p-dialogcards-disabled');
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
    self.dialogs.splice(index, 1);
    if (!$.isEmptyObject(this.cardOrder)) {
      self.cardOrder.splice(index, 1);
    }

    // Remove the 'gotitdone' card from DOM
    $( '.h5p-dialogcards-gotitdone', self.$inner).remove();
    this.cardsLeft = this.incorrect;

    // In case a dark background was set for the cards.
    $card.find('.h5p-dialogcards-card-content').removeClass('h5p-dialogcards-summary-screen');

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
    //self.updateNavigation();
    // audio buttons
    let paused = 'h5p-audio-minimal-play-paused';
    let play =  'h5p-audio-minimal-play';
    let noDupeFrontPicToBack = this.noDupeFrontPicToBack;
    $cards.each(function (index) {
      let $card = $(this).removeClass('h5p-dialogcards-previous h5p-dialogcards-noMatch');
      // Show all front images (ci) and hide all back images (ci2)
      // except if let noDupeFrontPicToBack = true;
      if (!noDupeFrontPicToBack) {
        let $ci = $card.find('.h5p-dialogcards-image');
        $ci.removeClass('h5p-dialogcards-hide');
      }
      // Show all front audios (ca) and hide all back audios (ca2)
      let $ca = $card.find('.h5p-dialogcards-audio-wrapper');
      $ca.removeClass('hide');
      self.resetAudio(index);

      // Replace potential "paused" button with "ready to play" button
      let $caButton = $card.find('.h5p-audio-minimal-button');
      if ($caButton.hasClass(paused)) {
        $caButton.switchClass( paused, play);
      }
      // In case it was hidden on the summary screen.
      $card.find('.h5p-dialogcards-image-wrapper').removeClass('h5p-dialogcards-hide');
    });
    // hide and show audio not used in papi Jo version BUT SHOULD DO A GENERAL RESET OF ALL AUDIO BUTTONS upon retry
    // cardsLeft ****************************************************************************
    $cards = self.$inner.find('.h5p-dialogcards-cardwrap-left');
    let x = Math.floor((Math.random() * ($cards.length)) );
    $cards.each(function (index) {
      let $card = $(this).removeClass('h5p-dialogcards-noMatch');
      $card.addClass('h5p-dialogcards-cardwrap-left-repetition');
      if (index === x) {
        $card.addClass('h5p-dialogcards-current-left');
      }
    });

    self.resizeOverflowingText();
    self.setCardFocus(self.$current);
    self.$current.find('.h5p-dialogcards-answer-button-off').removeClass('h5p-dialogcards-disabled');
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
    self.updateImageSize();
    if (!self.params.behaviour.scaleTextNotCard) {
      self.determineCardSizes();
    }

    // Reset card-wrapper-set height
    self.$cardwrapperSet.css('height', 'auto');

    //Find max required height for all cards
    self.$cardwrapperSet.children().each( function () {
      let wrapperHeight = $(this).css('height', 'initial').outerHeight();
      $(this).css('height', 'inherit');
      maxHeight = wrapperHeight > maxHeight ? wrapperHeight : maxHeight;

      // Check height
      if (!$(this).next('.h5p-dialogcards-cardwrap').length) {
        let initialHeight = $(this).find('.h5p-dialogcards-cardholder').css('height', 'initial').outerHeight();
        maxHeight = initialHeight > maxHeight ? initialHeight : maxHeight;
        $(this).find('.h5p-dialogcards-cardholder').css('height', 'inherit');
      }

    });

    let relativeMaxHeight = maxHeight / parseFloat(self.$cardwrapperSet.css('font-size'));
    self.$cardwrapperSet.css('height', relativeMaxHeight + 'em');

    self.scaleToFitHeight();
    if (!this.$retry) {
      self.truncateRetryButton();
    }
    if (this.playMode === 'selfCorrectionMode') {
      self.truncateAnswerButtons();
    }

    self.resizeOverflowingText();
  };

  /**
   * Resizes each card to fit its text
   */
  C.prototype.determineCardSizes = function () {
    let self = this;

    if (self.cardSizeDetermined === undefined
      || (this.repetition && this.contentData.previousState)
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
        self.changeText($content, self.dialogs[i].answer);
      }

      // Grab size with answer
      let answerHeight = $text[0].getBoundingClientRect().height;

      // Use highest
      let useHeight = (textHeight > answerHeight ? textHeight : answerHeight);

      // Min. limit
      let minHeight = parseFloat($text.parent().parent().css('minHeight'));
      if (useHeight < minHeight) {
        useHeight =  minHeight;
      }

      // Convert to em
      let fontSize = parseFloat($content.css('fontSize'));
      useHeight /= fontSize;

      // Set height
      $text.parent().css('height', useHeight + 'em');

      // Change back to text
      if (!self.matchIt) {
        self.changeText($content, self.dialogs[i].text);
      }
    });
  };

  C.prototype.scaleToFitHeight = function () {
    let self = this;

    if (!self.$cardwrapperSet || !self.$cardwrapperSet.is(':visible') || !self.params.behaviour.scaleTextNotCard) {
      return;
    }
    // Resize font size to fit inside CP
    if (self.$inner.parents('.h5p-course-presentation').length) {
      let $parentContainer = self.$inner.parent();
      if (self.$inner.parents('.h5p-popup-container').length) {
        $parentContainer = self.$inner.parents('.h5p-popup-container');
      }
      let containerHeight = $parentContainer.get(0).getBoundingClientRect().height;
      let getContentHeight = function () {
        let contentHeight = 0;
        self.$inner.children().each(function () {
          contentHeight += $(this).get(0).getBoundingClientRect().height +
          parseFloat($(this).css('margin-top')) + parseFloat($(this).css('margin-bottom'));
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
          self.$inner.css('font-size', (newFontSize / parentFontSize) + 'em');
          contentHeight = getContentHeight();
        }
      }
      else { // Increase font size
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
          self.$inner.css('font-size', relativeFontSize + 'em');
          contentHeight = getContentHeight();
          if (containerHeight <= contentHeight) {
            increaseFontSize = false;
            relativeFontSize = (newFontSize - C.SCALEINTERVAL) / parentFontSize;
            self.$inner.css('font-size', relativeFontSize + 'em');
          }
        }
      }
    }
    else { // Resize mobile view
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
    if (!self.params.behaviour.scaleTextNotCard) {
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
   *
   * @param {jQuery} $textContainer Outer container, must have a set size.
   * @param {jQuery} $text Inner text container
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
    let currentTextContainerHeight = $textContainer.get(0).getBoundingClientRect().height;
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
        $text.css('font-size', (fontSize / parentFontSize + 0.4)  + 'em');
        currentTextHeight = $text.get(0).getBoundingClientRect().height;
        if (currentTextHeight <= currentTextContainerHeight) {
          decreaseFontSize = false;
        }
      }
    }
    else { // Increase font size
      let increaseFontSize = true;
      while (increaseFontSize) {
        fontSize += C.SCALEINTERVAL;
        // Cap at  16px
        if (fontSize > mainFontSize) {
          increaseFontSize = false;
          break;
        }

        // Set relative font size to scale with full screen.
        $text.css('font-size', fontSize / parentFontSize + 'em');
        currentTextHeight = $text.get(0).getBoundingClientRect().height;
        if (currentTextHeight >= currentTextContainerHeight) {
          increaseFontSize = false;
          fontSize = fontSize - C.SCALEINTERVAL;
          $text.css('font-size', fontSize / parentFontSize + 'em');
        }
      }
    }
  };

  /**
   * Set focus to a given card
   *
   * @param {jQuery} $card Card that should get focus
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
    self.$retry.html(this.params.nextRound.replace('@round', this.currentRound));

    // Measure button
    let maxWidthPercentages = 0.3;
    let retryWidth = self.$retry.get(0).getBoundingClientRect().width +
        parseFloat(self.$retry.css('margin-left')) + parseFloat(self.$retry.css('margin-right'));
    let retryWidthPercentage = retryWidth / self.$retry.parent().get(0).getBoundingClientRect().width;
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
    let $answerButtonCorrect = self.$inner.find('.h5p-dialogcards-answer-button.correct');
    let $answerButtonCorrectOff = self.$inner.find('.h5p-dialogcards-answer-button-off.h5p-joubelui-button.correct');
    $answerButtonCorrect.html(this.params.correctAnswer);
    $answerButtonCorrectOff.html(this.params.correctAnswer);

    let $answerButtonInCorrect = self.$inner.find('.h5p-dialogcards-answer-button.incorrect');
    let $answerButtonInCorrectOff = self.$inner.find('.h5p-dialogcards-answer-button-off.h5p-joubelui-button.incorrect');
    $answerButtonInCorrect.html(this.params.incorrectAnswer);
    $answerButtonInCorrectOff.html(this.params.incorrectAnswer);

    // Truncate button

    // TODO revise this truncation system
    /*
    let $footerWidth = $answerButtonCorrect.parent()[0].getBoundingClientRect().width;
    let $card = self.$current.find('.h5p-dialogcards-card-content');
    */
    // Supposed to be a smartphone
    let w = $(window).width();
    if (w < 400) {
      $answerButtonCorrect.html('');
      $answerButtonCorrectOff.html('');
      $answerButtonInCorrect.html('');
      $answerButtonInCorrectOff.html('');
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

    if (this.enableGotIt || this.repetition) {
      if (this.currentRound > 1) {
        penalty = this.params.behaviour.penalty;
        if (penalty !== undefined || penalty > 0) {
          let penalty = this.params.behaviour.penalty / 100;
          let nbRounds = this.currentRound;
          for (let i = 0; i < nbRounds - 1; i++) {
            actualScore = actualScore - (actualScore * penalty);
          }
        }
        else {
          penalty = 0;
        }
      }
    }
    else if (this.matchIt && !this.repetition) {
      actualScore = ((this.nbCardsSelected - this.incorrect) / this.nbCardsSelected) * this.maxScore;
      if (actualScore < 0) {
        actualScore = 0;
      }
    }
    // Rounded result.
    actualScore = Math.round(actualScore);

    this.actualScore = actualScore;
    if (this.playMode === 'normalMode' || this.playMode === 'browseSideBySide') {
      return;
    }

    // Remove all these elements.
    $('.h5p-dialogcards-cardwrap-set, .h5p-dialogcards-match-footer, .h5p-dialogcards-footer, .h5p-dialogcards-options', self.$inner).remove();

    // Display task finished feedback message.

    let $feedback = $('<div>', {
      'class': 'h5p-dialogcards-summary-screen h5p-dialogcards-final-summary-screen'
    }).appendTo(self.$inner);
    let rounds  = self.params.rounds;
    rounds.replace('@rounds', this.currentRound.toString());

    // Feedback text

    let totalCards = self.params.dialogs.length;
    //let totalCorrect = this.correct;
    //let totalInCorrect = this.incorrect;
    let summary = self.params.summary;
    let thisRound = this.currentRound;
    let overallScore = self.params.summaryOverallScore;
    let cardsSelected = self.params.summaryCardsSelected;
    let cardsCompleted = self.params.summaryCardsCompleted;
    let completedRounds = self.params.summaryCompletedRounds;
    let selectedMessage = '';
    if (selectedCards !== totalCards) {
      selectedMessage = '<td class="h5p-dialogcards-summary-table-row-category">'
          + cardsSelected
          + '<td>&nbsp;</td>'
          + '<td class="h5p-dialogcards-summary-table-row-score">'
          + selectedCards
          + '&nbsp;<span class="h5p-dialogcards-summary-table-row-score-divider">/</span>&nbsp;'
          + totalCards + '</td></tr>';
      totalCards = selectedCards;
    }

    let text1 = '<div class="h5p-dialogcards-summary-header">'
      + summary + '</div>'
      + '<div class="h5p-dialogcards-summary-subheader">' + overallScore + '</div>'
      + '<table class="h5p-dialogcards-summary-table">'
      + '<tr>' + selectedMessage;

    let allDone = '';
    let text2;
    if (this.enableGotIt || this.repetition) {
      if (this.actualScore === this.maxScore) {
        allDone = self.params.summaryAllDone.replace('@cards', totalCards);
      }
      text2 =
        '<td class="h5p-dialogcards-summary-table-row-category">' + cardsCompleted + '</td>'
        + '<td class="h5p-dialogcards-summary-table-row-symbol h5p-dialogcards-check">&nbsp;</td>'
        + '<td class="h5p-dialogcards-summary-table-row-score">'
        + totalCards
        + '&nbsp;<span class="h5p-dialogcards-summary-table-row-score-divider">/</span>&nbsp;'
        + totalCards + '</td></tr>'
        + '<tr><td class="h5p-dialogcards-summary-table-row-category">' + completedRounds + '</td>'
        + '<td class="h5p-dialogcards-summary-table-row-symbol"></td>'
        + '<td class="h5p-dialogcards-summary-table-row-score">' + thisRound + '</td></tr>';
    }
    else if (this.matchIt && !this.repetition) {
      if (this.actualScore === this.maxScore) {
        allDone = self.params.summaryMatchesAllDone;
      }
      text2 =
        '<td class="h5p-dialogcards-summary-table-row-category">' + self.params.summaryMatchesFound + '</td>'
        + '<td class="h5p-dialogcards-summary-table-row-symbol h5p-dialogcards-check">&nbsp;</td>'
        + '<td class="h5p-dialogcards-summary-table-row-score">'
        + this.correct
        + '<tr><td class="h5p-dialogcards-summary-table-row-category">'
        + self.params.summaryMatchesNotFound
        + '</td>'
        + '<td class="h5p-dialogcards-summary-table-row-symbol h5p-dialogcards-times">&nbsp;</td>'
        + '<td class="h5p-dialogcards-summary-table-row-score">' + this.incorrect + '</td></tr>';
    }
    let text3 = '</table>'
          + '<div class="h5p-dialogcards-summary-message">' + allDone + '</div>';
    let text = text1 + text2 + text3;

    $('<div>', {
      'class': 'h5p-dialogcards-cardwrap-set ',
      'html': text
    }).appendTo($feedback);

    let $feedbackFooter = $('<div>', {
      'class': 'h5p-dialogcards-cardwrap-set '
    }).appendTo($feedback);
    this.helpText = '';

    let explainScore = '';
    if (this.enableGotIt || this.repetition) {
      if (thisRound !== 1 && penalty) {
        explainScore = self.params.explainScoreGotIt
          .replace('@penalty', self.params.behaviour.penalty);
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
    const scoreBar = JoubelUI.createScoreBar(this.maxScore, label, this.helpText, scoreExplanationButtonLabel);
    scoreBar.setScore(actualScore);
    scoreBar.appendTo($feedbackFooter);

    $('<div>', {
      'class': 'h5p-dialogcards-cardwrap-set ',
      'html': scoreBar
    }).appendTo($feedback);

    // We only trigger XAPI at the end of the activity
    this.endTime = new Date().getTime();
    self.triggerAnswered();

    // Display reset button to enable user to do the task again IF Retry option enabled.
    if (self.params.behaviour.enableRetry) {
      self.$resetTaskButton = JoubelUI.createButton({
        'class': 'h5p-dialogcards-button-reset',
        'title': self.params.retry,
        'html': self.params.retry
      }).click(function () {
        self.resetTask();
      }).appendTo($feedbackFooter);
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
    //const selectionIndex = self.$current.index();
    let audioIndex = self.nbCards - self.dialogs.length;
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
    else if ($prevCard.length) { // No next card left - go to previous.
      this.lastCardIndex = index;
      this.endOfStack = 1;
      self.updateNavigation();
      this.endOfStack = 0;
      self.resetButtons('retry button');

      return;
    }
    else { // No cards left: task is finished.
      self.resetButtons('finished button');
      return;
    }

    // Now remove the current 'gotitdone' card from the cards and cardOrder arrays.
    self.dialogs.splice(index, 1);
    if (!$.isEmptyObject(this.cardOrder)) {
      self.cardOrder.splice(index, 1);
    }
    if (!self.params.behaviour.scaleTextNotCard) {
      self.cardSizeDetermined.splice(index + 2, 1);
    }
    // Remove the 'gotitdone' card from DOM
    $( '.h5p-dialogcards-gotitdone', self.$inner).remove();
    // Update navigation
    self.updateNavigation();

  };

  C.prototype.matchCards = function ($card) {
    let self = this;
    for (let i = 0; i < self.nbCards + 1; i++) {
      self.resetAudio(i);
    }

    let delayInMilliseconds = 2000;
    let index = $card.index() / 2;
    let $leftCard = self.$currentLeft;
    let indexLeft = ($leftCard.index() - 1) / 2;

    // De-activate all buttons during the Timeout.
    let $correctButton = $card.find('.h5p-dialogcards-match.correct');
    let $incorrectButton = $card.find('.h5p-dialogcards-match.incorrect');
    let $matchButton = $card.find('.h5p-dialogcards-button-match');
    $matchButton.toggleClass('h5p-dialogcards-disabled');
    self.$next.toggleClass('h5p-dialogcards-inactive');
    self.$prev.toggleClass('h5p-dialogcards-inactive');

    if (index === indexLeft) {
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
        self.$next.toggleClass('h5p-dialogcards-inactive');
        self.$prev.toggleClass('h5p-dialogcards-inactive');
        self.$current.removeClass('h5p-dialogcards-current h5p-dialogcards-match-right').addClass('h5p-dialogcards-previous');
        // Remove the 'gotitdone' card from DOM
        $( '.h5p-dialogcards-gotitdone', self.$inner).remove();
        // SEP 2021
        self.$current = $parentSet.find('.h5p-dialogcards-cardwrap').first();
        self.$current.addClass('h5p-dialogcards-current h5p-dialogcards-match-right');
        self.updateNavigation();
      }, delayInMilliseconds);

      // Now remove the current 'gotitdone' card from the cards and cardOrder arrays.
      self.dialogs.splice(index, 1);
      if (!$.isEmptyObject(this.cardOrder)) {
        self.cardOrder.splice(index, 1);
      }
      if (!self.params.behaviour.scaleTextNotCard) {
        self.cardSizeDetermined.splice(index + 2, 1);
      }
    }
    else {
      this.incorrect++;
      self.updateNavigation();
      $matchButton.addClass('h5p-dialogcards-disabled');
      $incorrectButton.toggleClass('h5p-dialogcards-disabled');
      setTimeout(function () {
        $incorrectButton.toggleClass('h5p-dialogcards-disabled');
        self.$next.toggleClass('h5p-dialogcards-inactive');
        self.$prev.toggleClass('h5p-dialogcards-inactive');
      }, delayInMilliseconds);
    }

    // No cards left in stack. End game.
    if (self.dialogs.length === 0) {
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
    let delayInMilliseconds = 2000; // Make it a parameters setting?
    let index = $card.index() / 2;
    let $leftCard = self.$currentLeft;
    let indexLeft = ($leftCard.index() - 1) / 2;

    // De-activate all buttons during the Timeout.
    let $correctButton = $card.find('.h5p-dialogcards-match.correct');
    let $incorrectButton = $card.find('.h5p-dialogcards-match.incorrect');
    let $matchButton = $card.find('.h5p-dialogcards-button-match');
    $matchButton.toggleClass('h5p-dialogcards-disabled');
    self.$next.toggleClass('h5p-dialogcards-inactive');
    self.$prev.toggleClass('h5p-dialogcards-inactive');
    this.cardsLeft--;
    if (index === indexLeft) { // We have a match.
      this.correct++;
    }
    else { // No match.
      this.incorrect++;
    }
    let $parentSet = self.$current.parent('.h5p-dialogcards-cardwrap-set');
    let $cards = $parentSet.find('.h5p-dialogcards-cardwrap');

    if (this.cardsLeft !== 0) {
      if (index === indexLeft) { // We have a match.
        $matchButton.addClass('h5p-dialogcards-disabled');
        self.$buttonMatch.addClass('h5p-dialogcards-disabled');
        $correctButton.toggleClass('h5p-dialogcards-disabled');
        self.$current.addClass('h5p-dialogcards-gotitdone');

        setTimeout(function () {
          self.nextCardLeftRepetition();
          self.resizeOverflowingText();
          let $cardLeft = self.$currentLeft.find('.h5p-dialogcards-card-content.h5p-dialogcards-matchLeft');
          $leftCard.addClass('h5p-dialogcards-gotitdone');
          $leftCard.removeClass('h5p-dialogcards-cardwrap-left-repetition h5p-dialogcards-current-left');
          if (this.cardsSideMode === 'frontFirst') {
            let $ci2 = $cardLeft.find('.h5p-dialogcards-image2');
            $ci2.addClass('h5p-dialogcards-hide');
          }
          $correctButton.toggleClass('h5p-dialogcards-disabled');
          self.$next.toggleClass('h5p-dialogcards-inactive');
          self.$prev.toggleClass('h5p-dialogcards-inactive');
          self.$current.removeClass('h5p-dialogcards-current h5p-dialogcards-match-right');

          // Remove the 'gotitdone' card from DOM
          $( '.h5p-dialogcards-gotitdone', self.$inner).remove();

          // SEP. 2021
          self.$current = $parentSet.find('.h5p-dialogcards-cardwrap').first();
          while (self.$current.hasClass('h5p-dialogcards-noMatch')) {
            self.$current = self.$current.nextAll('.h5p-dialogcards-cardwrap').eq(0);
          }
          self.$current.addClass('h5p-dialogcards-current h5p-dialogcards-match-right');
          let $nextCard = self.$current.next('.h5p-dialogcards-cardwrap');
          if ($nextCard.length) {
            self.nextCard();
          }
          self.updateNavigation();
        }, delayInMilliseconds);

        // Now remove the current 'gotitdone' card from the cards and cardOrder arrays.
        self.dialogs.splice(index, 1);
        if (!$.isEmptyObject(this.cardOrder)) {
          self.cardOrder.splice(index, 1);
        }
        if (!$.isEmptyObject(this.cardOrder)) {
          this.noMatchCards.splice(index, 1);
        }
        if (!self.params.behaviour.scaleTextNotCard) {
          self.cardSizeDetermined.splice(index + 2, 1);
        }
      }
      else { // We don't have a match
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
        $matchingRightCard.removeClass('h5p-dialogcards-previous h5p-dialogcards-current h5p-dialogcards-match-right');
        $matchButton.addClass('h5p-dialogcards-disabled');
        $incorrectButton.toggleClass('h5p-dialogcards-disabled');
        this.noMatchCards[indexLeft] = 1;
        setTimeout(function () {

          $leftCard.addClass('h5p-dialogcards-noMatch').removeClass('h5p-dialogcards-current-left');
          $leftCard.removeClass('h5p-dialogcards-cardwrap-left-repetition h5p-dialogcards-current-left');
          $incorrectButton.toggleClass('h5p-dialogcards-disabled');
          self.$next.toggleClass('h5p-dialogcards-inactive');
          self.$prev.toggleClass('h5p-dialogcards-inactive');
          $matchButton.removeClass('h5p-dialogcards-disabled');
          self.nextCardLeftRepetition(); // ???
          self.updateNavigation();   // line 1228
        }, delayInMilliseconds);
      }
    }

    // No cards left in stack. End game or end round.
    if (this.cardsLeft === 0) {
      self.getCurrentState();
      this.$buttonMatch.addClass('h5p-dialogcards-disabled');
      self.$prev.addClass('h5p-dialogcards-inactive');
      $correctButton.toggleClass('h5p-dialogcards-disabled');
      // WARNING! do not use 'this' inside a setTimeout function; use 'self' !
      if ($card.index() === -1) {
        delayInMilliseconds = 0;
      }
      setTimeout(function () {
        self.$current.addClass('h5p-dialogcards-gotitdone').removeClass('h5p-dialogcards-noMatch');
        self.$next.toggleClass('h5p-dialogcards-inactive');
        self.$prev.toggleClass('h5p-dialogcards-inactive');
        self.$prev.addClass('h5p-dialogcards-hide');
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
    const self = this;
    self.answered = false;
    this.actualScore = 0;
    this.cardsLeft = self.params.dialogs.length;
    this.currentRound = 1;
    this.correct = 0;
    this.incorrect = 0;
    this.$current = undefined;
    self.dialogs = self.params.dialogs;
    self.getCurrentState();

    // Added 11 AUGUST 2022 to fix the switch sides bug.
    if (self.reversed) {
      //this.switchSides(self.dialogs);
    }
    // JR for interactive book we need to remove the options upon Restart
    $( '.h5p-dialogcards-options', self.$inner).remove();
    let $optionsText = self.$inner.find('.h5p-dialogcards-options');
    $optionsText.html('');

    if (this.repetition) {
      this.noMatchCards = []; // needed here ?
    }
    // Empty audios and audios2 arrays.
    self.audios = [];
    self.audios2 = [];
    // Removes all these elements to start afresh.

    $('.h5p-dialogcards-cardwrap-set, .h5p-dialogcards-footer, .h5p-question-feedback-container,'
      + '.h5p-dialogcards-card-side-announcer, .h5p-dialogcards-button-reset, .h5p-dialogcards-order, .h5p-joubelui-score-bar,'
      + '.h5p-dialogcards-summary-screen, .h5p-dialogcards-summary-message, .h5p-dialogcards-feedback, .h5p-dialogcards-sub-title, .h5p-dialogcards-options', self.$inner).remove();

    // Reset various parameters.
    self.taskFinished = false;
    self.nbCards = self.params.dialogs.length;
    this.nbCardsInCurrentRound = self.nbCards;
    //this.cardsSideChoice = self.params.behaviour.cardsSideChoice;
    this.cardsOrderChoice = self.params.behaviour.cardsOrderChoice;
    this.cardsOrderMode = this.cardsOrderChoice;
    this.cardOrder = undefined;
    self.cardSizeDetermined = [];
    self.cardsLeftInStack = self.nbCards;
    // Categories filter determined by author, reset filter and re-start at zero (first card).
    if (self.params.enableCategories && this.filterList !== undefined && this.filterByCategories === 'authorFilter') {
      self.applyFilter(this.filterList, this.filterOperator, false);
      this.currentFilter = self.makeCurrentFilterName(this.filterList, this.filterOperator);
      this.progress = 0;
    }
    this.filterList = undefined;
    this.filterOperator = undefined;

    if (this.filterByCategories === 'userFilter') {
      self.nbCardsSelected = undefined;
      self.createFilterCards().appendTo(self.$inner);
    }
    else if (this.cardsOrderChoice === 'user') {
      self.createOrder().appendTo(self.$inner);
    }
    else if (this.enableCardsNumber && self.nbCards > 5) {
      self.createNumberCards()
        .appendTo(self.$inner);
    }
    else if (!this.matchIt && this.cardsSideChoice === 'user') {
        self.createcardsSideChoice().appendTo(self.$inner);
    }
    else {
      self.attachContinue();
    }
  };

  /**
   * Switches all the cards elements from FRONT/text to BACK/answer OR vice-versa.
   *
   * @param {Object} card Card parameters
   */

  C.prototype.switchSides = function (cards) {
    for (let i = 0; i < cards.length; i++) {
      let t = cards[i].text;
      let a = cards[i].answer;
      cards[i]['text'] = a;
      cards[i]['answer'] = t;
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
      if (!this.noDupeFrontPicToBack) {
        cards[i].imageMedia.image = i2;
        cards[i].imageMedia.image2 = i0;
      }
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
    self.stopAudio(self.$current.index());
    let $gotIt = this.enableGotIt;
    $card.find('.h5p-dialogcards-answer-button').addClass('h5p-dialogcards-disabled');
    if (type === 'answer buttons') {
      // Enable answer-buttons-off ; Unhide turn button & card text and Disable the Retry button.
      $card.find('.h5p-dialogcards-turn').removeClass('h5p-dialogcards-disabled');
      $card.find('.h5p-dialogcards-answer-button-off').removeClass('h5p-dialogcards-disabled');
      $card.find('.h5p-dialogcards-card-text-inner').removeClass('h5p-dialogcards-hide');
      this.$retry.addClass('h5p-dialogcards-disabled');
    }
    else if (type === 'retry button' || type === 'finished button') {
      // Disable answer buttons, turn button, Hide card text button and Enable the Retry button
      if ($gotIt || this.repetition) {
        if (this.noText) {
          let $el = $card.find('.h5p-dialogcards-card-text-wrapper');
          let aClass = 'noText';
          if (this.audioOnly) {
            aClass = 'audioOnly';
          }
          $el.removeClass('hide').addClass(aClass);
          let w = $el.parent().width();
          $el.width(w);
        }
        $card.find('.h5p-dialogcards-turn').addClass('h5p-dialogcards-disabled');
        $card.find('.h5p-dialogcards-image-wrapper').addClass('h5p-dialogcards-hide');
        $card.find('.joubel-tip-container').addClass('h5p-dialogcards-hide');
        $card.find('.h5p-dialogcards-audio-wrapper').addClass('hide');
        $card.find('.h5p-dialogcards-audio-wrapper2').addClass('h5p-dialogcards-hide');
        $card.find('.h5p-dialogcards-answer-button-off').addClass('h5p-dialogcards-hide');
        this.$progress.addClass('h5p-dialogcards-hide');
        if (this.repetition) {
          this.$progressFooterLeft.addClass('h5p-dialogcards-hide');
        }
        let totalCorrect = this.correct;
        let totalInCorrect = this.incorrect;
        let totalCards = this.correct + this.incorrect;
        let summary = self.params.summary;
        let thisRound = this.currentRound;
        let roundTxt = self.params.round.replace('@round', thisRound.toString());
        let cardsRight = self.params.summaryCardsRight;
        let cardsWrong = self.params.summaryCardsWrong;

        // Set this height to auto to make sure to fit the summary text inside it.
        // does not work with this.repetition plus save content state!
        if ($gotIt) {
          let $cardText = $card.find('.h5p-dialogcards-card-text');
          $cardText.addClass('h5p-dialogcards-auto-height');
        }

        let $cardContent = $card.find('.h5p-dialogcards-card-content');
        let $cardTextArea = $card.find('.h5p-dialogcards-card-text-area');
        $cardContent.addClass('h5p-dialogcards-summary-screen');
        let text = '<div class="h5p-dialogcards-summary-header">'
          + summary + '</div>'
          + '<div class="h5p-dialogcards-summary-subheader">' + roundTxt + '</div>'
          + '<table class="h5p-dialogcards-summary-table"><tr><td class="h5p-dialogcards-summary-table-row-category">'
          + cardsRight + '</td>'
          + '<td class="h5p-dialogcards-summary-table-row-symbol h5p-dialogcards-check">&nbsp;</td>'
          + '<td class="h5p-dialogcards-summary-table-row-score">'
          + totalCorrect
          + '&nbsp;<span class="h5p-dialogcards-summary-table-row-score-divider">/</span>&nbsp;'
          + totalCards
          + '</td></tr>'
          + '<tr><td class="h5p-dialogcards-summary-table-row-category">'
          + cardsWrong
          + '</td><td class="h5p-dialogcards-summary-table-row-symbol h5p-dialogcards-times">&nbsp;</td>'
          + '<td class="h5p-dialogcards-summary-table-row-score">'
          + totalInCorrect
          + '&nbsp;<span class="h5p-dialogcards-summary-table-row-score-divider">/</span>&nbsp;'
          + totalCards
          + '</td></tr></table>';

        $cardTextArea.html(text);
        $card.find('.h5p-dialogcards-card-text').removeClass('hide');

        if (type === 'retry button') {
          this.cardsLeft = 0;
          this.$retry.html(this.params.nextRound.replace('@round', this.currentRound + 1));
        }
        else {
          let finalSummary = this.params.showSummary;
          this.$retry.html(finalSummary);
          this.$retry.attr('title', finalSummary);
          this.taskFinished = true;
        }
      }
      else {
        this.$retry.html(self.params.retry);
        this.$retry.addClass('h5p-dialogcards-button-reset');
      }
      this.$retry.removeClass('h5p-dialogcards-disabled');
      if (this.matchIt) {
        this.$retry.addClass('h5p-dialogcards-unset');
      }
    }
    else if (type === 'restart') {
      if (this.matchIt) {
        $card.addClass('h5p-dialogcards-match-right');
      }
      $card.find('.h5p-dialogcards-answer-button-off').removeClass('h5p-dialogcards-disabled');
      $card.find('.h5p-dialogcards-turn').removeClass('h5p-dialogcards-disabled');
      $card.find('.h5p-dialogcards-card-text-inner').removeClass('h5p-dialogcards-hide');
      $card.find('.h5p-dialogcards-card-text').removeClass('h5p-dialogcards-auto-height');
      if (this.matchIt) {
        self.$prev.removeClass('h5p-dialogcards-hide');
      }
      let $cardContent = $card.find('.h5p-dialogcards-card-content');
      $cardContent.removeClass('h5p-dialogcards-summary-screen');
      this.$retry.addClass('h5p-dialogcards-disabled');
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
   *
   * @returns {Number} Max points. Used in Interactive Book content.
   */
  C.prototype.getMaxScore = function () {
    if (this.params.behaviour.playMode === 'normalMode' || this.playMode === 'browseSideBySide') {
      return 1;
    }
    if (this.nbCardsSelected) {
      return this.nbCardsSelected;
    }
    return 10;
  };

  /**
   * @returns {Number} Points. Used in Interactive Book content.
   */
  C.prototype.getScore = function () {
    if (!this.nbCardsSelected) {
      return 0;
    }
    if (this.params.behaviour.playMode === 'normalMode' || this.playMode === 'browseSideBySide') {
      return 1;
    }
    return this.actualScore;
  };

  // Used when a dialog cards activity is included in an Interactive Book content.
  C.prototype.getAnswerGiven = function () {
    return this.answered;
  };

  /**
   * Returns an object containing content of each cloze
   *
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

    if (this.playMode === 'selfCorrectionMode') {
      state.lastCorrect = !this.endOfStack;
    }
    if (this.filterByCategories) {
      state.filterByCategories = this.filterByCategories;
      state.filterList = this.filterList;
      state.filterOperator = this.filterOperator;
      state.currentFilter = this.currentFilter;
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
    state.taskFinished = this.taskFinished;
    return state;
  };

  // https://stackoverflow.com/questions/7486085/copy-array-by-value
  // reply by tfmontague!
  C.prototype.copy = function (aObject) {
    if (!aObject) {
      return aObject;
    }
    let v;
    let bObject = Array.isArray(aObject) ? [] : {};
    for (const k in aObject) {
      v = aObject[k];
      bObject[k] = (typeof v === "object") ? C.prototype.copy(v) : v;
    }
    return bObject;
  };

  C.prototype.applyFilter = function (filterList, filterOperator, dryRun = false) {
    let self = this;
    let filterListLength = filterList.split(',').length;
    let catDialogs = [];
    let isSelected = 0;
    let notSelected = 0;
    let numCardsInCats = 0;
    for (let i = 0; i < self.dialogs.length; i++) {
      if (self.dialogs[i].itemCategories !== undefined) {
        let itemCats = self.dialogs[i].itemCategories.split(',');
        isSelected = 0;
        notSelected = 0;
        for (let j = 0; j < itemCats.length; j++) {
          if (filterOperator === 'AND' || filterOperator === 'OR') {
            if (filterList.includes(itemCats[j])) {
              isSelected++;
            }
          }
          else { // filterOperator === 'NOT'
            if (filterList.includes(itemCats[j])) {
              notSelected++;
            }
          }
        }
        if (isSelected === filterListLength
          || (filterOperator === "OR" && isSelected !== 0)
          || (filterOperator === "NOT" && notSelected === 0)
        ) {
          if (dryRun) {
            numCardsInCats ++;
          }
          else {
            catDialogs[i] = self.dialogs[i];
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
      this.noFilterMessage = "ERROR! categories filter returned an empty result. No filter will be applied.";
    }
    else {
      this.dialogs = filtered;
      this.nbCards = self.dialogs.length;
      return filtered;
    }
  };

  C.prototype.makeCurrentFilterName = function (catList, catOperator) {
    let self = this;
    let filterName;
    if (catOperator === 'AND') {
      filterName = catList.replace(/,/g, " " + self.params.boolean_AND + " ");
    }
    else if (catOperator === 'OR' ) {
      filterName = catList.replace(/,/g, " " + self.params.boolean_OR + " ");
    }
    else if (catOperator === 'NOT') {
      filterName = self.params.boolean_NOT + ' ' + catList.replace(/,/g, " " + self.params.boolean_NOT + " ");
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
   * Generate xAPI object definition used in xAPI statements.
   * @return {Object}
   * @return {Object}
   */
  C.prototype.getxAPIDefinition = function () {
    const definition = {};

    let description = '';
    if (this.params.title !== '') {
      description = this.params.title;
    }
    else if (this.params.description !== '')  {
      description = this.params.description;
    }
    else {
      description = this.params.showSummary;
    }

    definition.description = {
      'en-US': description
    };
    definition.type = 'http://adlnet.gov/expapi/activities/cmi.interaction';
    definition.interactionType = 'long-fill-in';
    return definition;
  };

  /**
   * Add the question itself to the definition part of an xAPIEvent
   */
  C.prototype.addQuestionToXAPI = function (xAPIEvent) {
    const definition = xAPIEvent.getVerifiedStatementValue(['object', 'definition']);
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
   *
   * @param {H5P.XAPIEvent} xAPIEvent
   *  The xAPI event we will add a response to
   * change last param to this.isPassed() TODO!
   */
  C.prototype.addResponseToXAPI = function (xAPIEvent) {
    let success = (100 * this.actualScore / this.maxScore) >= this.params.behaviour.passPercentage;
    xAPIEvent.setScoredResult(this.actualScore, this.maxScore, this,
      true, success);
    // Note to self: put result.duration *before* result.response!
    let duration = 'PT' + Math.round((this.endTime - this.startTime) / 1000) + 'S';
    xAPIEvent.data.statement.result.duration = duration;
    xAPIEvent.data.statement.result.response = this.getxAPIResponse();
  };

  /**
   * Generate xAPI user response, used in xAPI statements.
   * @return {string} User answers separated by the "[,]" pattern
   */
  C.prototype.getxAPIResponse = function () {
    let summary = '';
    let selectedCards = this.nbCardsSelected;
    let totalCards = this.params.dialogs.length;
    let text1 = '';
    if (selectedCards !== totalCards) {
      text1 += this.params.summaryCardsSelected + ' ' + selectedCards
          + '/' + totalCards + '\n';
      totalCards = selectedCards;
    }
    let text2;
    if (this.enableGotIt || this.repetition) {
      text2 = this.params.summaryCardsCompleted + ' ' + totalCards + '/' + totalCards + '\n'
        + this.params.summaryCompletedRounds + ' ' + this.currentRound;
    }
    else if (this.matchIt && !this.repetition) {
      text2 = this.params.summaryMatchesFound + ' ' + this.correct + '\n'
        + this.params.summaryMatchesNotFound + ' ' + this.incorrect;
    }
    let text3 = this.params.summaryOverallScore + ' : ' + this.actualScore + '/' + this.maxScore;
    summary += text1 + text2 + '\n' + text3 + '\n' + this.helpText;
    return summary;
  };
  C.SCALEINTERVAL = 0.2;
  C.MAXSCALE = 16;
  C.MINSCALE = 4;

  return C;
})(H5P.jQuery, H5P.Audio, H5P.JoubelUI, H5P.Question);