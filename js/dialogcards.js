var H5P = H5P || {};
/**
 * Dialogcards module PapiJo
 *
 * @param {jQuery} $
 */
H5P.DialogcardsPapiJo = (function ($, Audio, JoubelUI) {

  /**
   * Initialize module.
   *
   * @param {Object} params Behavior settings
   * @param {Number} id Content identification
   * @returns {C} self
   */
  function C(params, id, contentData) {
    var self = this;
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
      explainScoreMatch: "Each incorrect match cost you a penalty of @penalty%.",
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
        scaleTextNotCard: false,
        playMode: 'normalMode',
        cardsOrderChoice: 'user',
        enableCardsNumber: false,
        cardsSideChoice: 'user',
        leftSideChoice: 'user',
        maxScore: 10,
        penalty: 0,
        backgroundColor: undefined,
        backgroundColorBack: undefined,
        hideFrontImage: false,
        filterByCategories: 'noFilter'
      }
    }, params);

    self._current = -1;
    self._turned = [];
    self.$images = [];
    self.$images2 = [];
    self.audios = [];
    self.audios2 = [];
    
    this.resetted = false;
    this.currentRound = 1;
    this.lastCardIndex = 0;
    this.endOfStack = 0;
    this.correct = 0;
    this.incorrect = 0;
    this.lastCard = null;
    this.cardsOrderChoice = self.params.behaviour.cardsOrderChoice;
    this.cardsOrderMode = this.cardsOrderChoice;
    this.enableCardsNumber = self.params.behaviour.enableCardsNumber;
    this.noText = self.params.behaviour.noTextOnCards; 
    
    // Remove potential cards with empty front or empty back, i.e. no text, no audio, no image!
    for (i = 0; i < self.params.dialogs.length; i++) { 
	    if (((self.params.dialogs[i]['text'] == undefined || this.noText) 
				&& self.params.dialogs[i]['image'] == undefined 
				&& self.params.dialogs[i]['audio'] == undefined)
				|| (self.params.dialogs[i]['answer'] == undefined 
				&& self.params.dialogs[i]['image2'] == undefined 
				&& self.params.dialogs[i]['audio2'] == undefined)) {
  	    self.params.dialogs.splice(i, 1);
    		i--;  
			}
		}
    this.hasAudio = false;
    for (i = 0; i < self.params.dialogs.length; i++) {
      if (self.params.dialogs[i]['audio'] !== undefined) {
        this.hasAudio = true;
        break;
      }
    }
    
    if (this.hasAudio && this.noText) {
    	this.audioOnly = false;	
			for (i = 0; i < self.params.dialogs.length; i++) { 
		    if (self.params.dialogs[i]['image'] == undefined 
					&& self.params.dialogs[i]['audio'] !== undefined
					&& self.params.dialogs[i]['image2'] === undefined 
					&& self.params.dialogs[i]['audio2'] !== undefined) {
					this.audioOnly = true; 	  	    
				} else {
					this.audioOnly = false;
					break;
				}
			}
		}
		
    // IF categories filters enabled!!!
    if (self.params.enableCategories && self.params.behaviour.catFilters) {
      this.catFilters = self.params.behaviour.catFilters;
      // Remove potential filters with empty filterList
      for (i = 0; i < this.catFilters.length; i++) {
        if (this.catFilters[i]["filterList"] == undefined) {
          this.catFilters.splice(i, 1);
          i--;  
        }
      }
      if (!$.isEmptyObject(this.catFilters)) {
        this.filterByCategories = self.params.behaviour.filterByCategories;
      }
    }

    this.userSelectedCategory ='';
    if (this.cardsOrderMode == 'normal') {
      this.enableCardsNumber = false;
    }
    this.matchCorrect = null;
    this.existsCardOrder = false;
    this.repetition = false;
    this.hideFrontImage = self.params.behaviour.hideFrontImage;
    
    this.playMode = self.params.behaviour.playMode;
    
    if (this.playMode == 'matchRepetition') {
      this.playMode = 'matchMode';
      this.repetition = true;      
    }
    
    if (this.playMode == 'matchMode') {
      this.leftSideChoice = self.params.behaviour.leftSideChoice;    
      this.leftSideMode = this.leftSideChoice;
    } else {
      this.cardsSideChoice = self.params.behaviour.cardsSideChoice;    
      this.cardsSideMode = this.cardsSideChoice;
    }
    
    if (this.playMode == 'matchMode') {      
      this.matchIt = true;      
      if (this.leftSideMode == 'frontLeft' || this.leftSideMode == 'user') {
        this.reverse = true;
      } else {
        this.reverse = false;
      }
    } else if (this.cardsSideMode == 'frontFirst' || this.cardsSideMode == 'user') {
        this.reverse = false;
      } else {
        this.reverse = true;
    }
      
    if (this.playMode == 'selfCorrectionMode') {
      this.enableGotIt = true;
      self.enableGotIt = true;
    }
    
    // Used in the retry() function to determine if the options screen must be displayed upon re-trying the activity.
    if (this.cardsOrderChoice == 'user' || this.cardsSideChoice == 'user' 
      || this.leftSideChoice == 'user' || this.enableCardsNumber 
      || this.filterByCategories == 'userFilter') {
      this.userChoice = true;
      }
          
    // Copy parameters for further use if save content state.    
    self.dialogs = self.copy(self.params.dialogs);
    this.noFilterMessage = '';    
    if (self.params.enableCategories && this.filterByCategories == 'authorFilter') {
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
    if (this.backgroundColorBack == undefined) {
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
        if (this.cardsSideMode == 'user') {
          this.cardsSideMode = 'frontFirst';
        }
      }
      if (this.contentData.previousState.leftSideChoice !== undefined) {
        this.leftSideChoice = this.contentData.previousState.leftSideChoice;
      }
      if (this.contentData.previousState.leftSideMode !== undefined) {
        this.leftSideMode = this.contentData.previousState.leftSideMode;
        if (this.leftSideMode == 'user') {
          this.leftSideMode = 'frontFirst';
        }
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
      if (this.contentData.previousState.reverse !== undefined) {
        this.reverse = this.contentData.previousState.reverse;
      }
      if (this.contentData.previousState.lastCorrect !== undefined) {
        this.lastCorrect = this.contentData.previousState.lastCorrect;
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
    var self = this;
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
    } else {
      this.existsCardOrder = false;
    }
    
    // Create filterCard, cardOrder and cardNumber buttons only on first instanciation for logged in user.
    if (this.filterByCategories == 'userFilter' && this.currentFilter === undefined) {
       self.createFilterCards().appendTo(self.$inner);       
    } else if (this.cardsOrderChoice == 'user' && this.cardOrder === undefined) {
        self.createOrder().appendTo(self.$inner);
    } else if (this.enableCardsNumber && this.nbCardsSelected === undefined && self.nbCards > 5) {
        self.createNumberCards().appendTo(self.$inner);
    } else if (this.matchIt && this.leftSideChoice == 'user' && this.leftSideMode == 'user') {
        self.createleftSideChoice().appendTo(self.$inner)
    } else if (!this.matchIt && this.cardsSideChoice == 'user' && this.cardsSideMode == 'user') {
        self.createcardsSideChoice().appendTo(self.$inner);       
    } else {
        self.attachContinue();
    };    
  };

  /**
   * Attach the rest of the h5p inside the given container.
   *
   * @param {jQuery} $container
   */
   C.prototype.attachContinue = function ($container) {
    var self = this;
    // Section to show the Display cards options if different from "normal".
    var text = '';
    var order = '';
    if (this.currentFilter !== undefined) {
      var filterNotice = self.params.currentFilterNotice;      
      text+= filterNotice + ' ' + this.currentFilter + '<br>';
    }
    if (this.cardsOrderChoice == 'user') {
      var orderNotice = self.params.currentOrderNotice; 
      if (this.matchIt) {
        orderNotice = self.params.currentRightOrderNotice;
      }
      if (this.cardsOrderMode === 'normal') {
        order = self.params.normalOrder;
      } else {
        order = self.params.randomOrder;
      }
      text+= orderNotice + ' ' + order + '<br>';
    }
    if (this.matchIt) {
      if (this.leftSideChoice == 'user') {
        var currentSide = self.params.cardFrontLabel;
        if (this.leftSideMode == 'backLeft') {
          currentSide = self.params.cardBackLabel;
        }
        text+= self.params.currentLeftSideNotice + currentSide;
      }
      if (text !== '') {
        var $optionsText = $('<div>', {
          'class': 'h5p-dialogcards-options',
          'html': text
        }).appendTo(self.$inner);
      }
    } else {
      if (this.cardsSideChoice == 'user') {
        var currentSide = self.params.cardFrontLabel;
        if (self.cardsSideMode == 'backFirst') {
          currentSide = self.params.cardBackLabel;
        }
        text+= self.params.currentSideNotice + currentSide;
      }
      if (text !== '') {
        var $optionsText = $('<div>', {
          'class': 'h5p-dialogcards-options',
          'html': text
        }).appendTo(self.$inner);
      }
      
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
    if (this.matchIt) {
      var $matchFooter = $('<div>', {
      'class': 'h5p-dialogcards-match-footer'
      });

      self.createFooterLeft()
        .appendTo($matchFooter);

      self.createFooter()
        .appendTo($matchFooter);

      $matchFooter.appendTo(self.$inner);
      
    } else {

      self.createFooter()
        .appendTo(self.$inner);
    }

    self.updateNavigation();

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
    if (this.repetition && this.cardsLeft == 0) {
        // set parameters as they were on nextRound screen before refreshing page
        this.cardsLeft = 1;
        this.incorrect--;
        self.matchCardsRepetition($(this).parents('.h5p-dialogcards-cardwrap'));
    }
    if (this.playMode == 'selfCorrectionMode' && this.cardsLeft == 0) {
        // set parameters as they were on nextRound screen before refreshing page
        if (this.lastCorrect) {
          this.correct--;
          self.gotItCorrect($(this).parents('.h5p-dialogcards-cardwrap'));
        } else {
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
    var self = this;
    var randomizeQuestion = self.params.randomizeCardsQuestion;
    if (this.matchIt) {
      randomizeQuestion = self.params.randomizeRightCardsQuestion
    }
    var $order = $('<div>', {
      'class': 'h5p-dialogcards-order h5p-dialogcards-options',
      'html': randomizeQuestion
    });

    var $optionButtons = $('<div>', {
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
    var self = this;    
    var currentSide = self.params.cardFrontLabel;
    if (self.cardsSideMode == 'backFirst') {
      currentSide = self.params.cardBackLabel;
    }
    var $side = $('<div>', {
      'class': 'h5p-dialogcards-side h5p-dialogcards-options',
      'html': self.params.currentSideNotice + currentSide
    });

    if (self.cardsSideMode == 'backFirst') {
      reverseSide = self.params.cardFrontLabel;
    } else {
      reverseSide = self.params.cardBackLabel;
    }
    var $optionButtons = $('<div>', {
      'class': 'h5p-dialogcards-optionsbuttons',
      'html': this.params.reverseSides.replace('@side', reverseSide)
    }).appendTo($side);
    
    self.$No = JoubelUI.createButton({
      'class': 'h5p-dialogcards-side-button-no',
      'title': self.params.no,
      'html': self.params.no
    }).click(function () {
      // Do nothing, just continue with current card side.
      if (self.cardsSideMode == 'user' || self.cardsSideMode == 'frontFirst') {
        self.cardsSideMode = 'frontFirst';
        self.reverse = false;
      } else { // self.cardsSideMode == 'backFirst'
        self.reverse = true; 
      }      
      self.attachContinue();
    }).appendTo($optionButtons);

    self.$Yes = JoubelUI.createButton({
      'class': 'h5p-dialogcards-side-button-yes',
      'title': self.params.yes,
      'html': self.params.yes
    }).click(function () {
      if (self.cardsSideMode == 'backFirst') {
        self.cardsSideMode = 'frontFirst';
        self.reverse = false;
      } else {
        self.cardsSideMode = 'backFirst';
        self.reverse = true;
      }
      self.attachContinue();
    }).appendTo($optionButtons);
    
    this.cardsSideChoice = self.cardsSideMode;
    return $side;
  };

    /**
   * Create cardsleftSideChoice option request
   * Select leftSideMode 'frontLeft' or 'backLeft'
   *
   * @returns {*|jQuery|HTMLElement} Side element
   */
  
  C.prototype.createleftSideChoice = function () {
    var self = this;
    if (self.leftSideMode == 'user') {
        self.leftSideMode = 'frontLeft';
        currentSide = self.params.cardFrontLabel;
    }
    if (self.leftSideMode == 'frontLeft') {
      currentSide = self.params.cardFrontLabel;
      reverseSide = self.params.cardBackLabel;
    } else {
      currentSide = self.params.cardBackLabel;
      reverseSide = self.params.cardFrontLabel;
    }   
    
    var $side = $('<div>', {
      'class': 'h5p-dialogcards-side h5p-dialogcards-options',
      'html': self.params.currentLeftSideNotice + currentSide
    });
    var $optionButtons = $('<div>', {
      'class': 'h5p-dialogcards-optionsbuttons',
      'html': this.params.reverseLeftSide.replace('@side', reverseSide)
    }).appendTo($side);

    self.$No = JoubelUI.createButton({
      'class': 'h5p-dialogcards-side-button-no',
      'title': self.params.no,
      'html': self.params.no
    }).click(function () {
      // Do nothing, just continue with current card side.
      if (self.leftSideMode == 'user' || self.leftSideMode == 'frontLeft') {
        self.leftSideMode = 'frontLeft';
        self.reverse = true;
      } else {
        self.reverse = false;
      }
      self.attachContinue();
    }).appendTo($optionButtons);

    self.$Yes = JoubelUI.createButton({
      'class': 'h5p-dialogcards-side-button-yes',
      'title': self.params.yes,
      'html': self.params.yes
    }).click(function () {
      if (self.leftSideMode == 'backLeft') {
        self.leftSideMode = 'frontLeft';
        self.reverse = true;
      } else {
        self.leftSideMode = 'backLeft';
        self.reverse = false;
      }
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
    var self = this;
    // todo ?
    //var numCards = self.params.dialogs.length;
    var numCards = self.dialogs.length;
    var $numberCards = $('<div>', {
      'class': 'h5p-dialogcards-number h5p-dialogcards-options',
      'html': self.params.numCardsQuestion
    });

    var $optionButtons = $('<div>', {
      'class': 'h5p-dialogcards-optionsbuttons'
    }).appendTo($numberCards);

    // Allow user to select a number of cards to play with, by displaying selectable buttons in increments of 5.
    var n = 0;
    if (numCards <= 50) {
      n = 5;
    } else {
      n = 10;
    }
    var limit = Math.min(numCards, 100);
    for (var i = n; i < limit; i += n) {
      self.$button = JoubelUI.createButton({
          'class': 'h5p-dialogcards-number-button',
          'title': i,
          'html': i,
          'id': 'dc-number-' + i
        }).click(function () {
            self.nbCards = this.title;
            this.nbCards = this.title;                                
            if (self.matchIt) {
              if (self.leftSideChoice == 'user' && !this.reverse) {
                $( '.h5p-dialogcards-number', self.$inner ).remove();
                self.createleftSideChoice().appendTo(self.$inner);
              } else {
                self.attachContinue();
              }
            } else {
              if (self.cardsSideChoice == 'user' && !this.reverse) {
                $( '.h5p-dialogcards-number', self.$inner ).remove();
                self.createcardsSideChoice().appendTo(self.$inner);
              } else {
                self.attachContinue();
              }
            }
          }).appendTo($optionButtons);
      };

      self.$button = JoubelUI.createButton({
        'class': 'h5p-dialogcards-number-button',
        'title': numCards,
        'html': self.params.allCards + " (" + numCards + ")"
        }).click(function () {
          self.nbCards = numCards;
          if (self.matchIt) {          
            if (self.leftSideChoice == 'user' && !this.reverse) {
              $( '.h5p-dialogcards-number', self.$inner ).remove();
              self.createleftSideChoice().appendTo(self.$inner);
            } else {
              self.attachContinue();
            };
          } else {
            if (self.cardsSideChoice == 'user' && !this.reverse) {
              $( '.h5p-dialogcards-number', self.$inner ).remove();
              self.createcardsSideChoice().appendTo(self.$inner);
            } else {
              self.attachContinue();
            };
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
    var self = this;
    // Init params    
    var $filterCards = $('<div>', {
      'class': 'h5p-dialogcards-categories h5p-dialogcards-options',
      'html': self.params.selectFilter
    });
    
    var $optionButtons = $('<div>', {
      'class': 'h5p-dialogcards-optionsbuttons'
    }).appendTo($filterCards);
    
    var $class = '';
    self.nofilter = false;
    catNames = [];
    for (var i = 0; i < this.catFilters.length + 1; i++) {
      if (i < this.catFilters.length) {
        var filterList = this.catFilters[i]["filterList"];
        var filterOperator = this.catFilters[i]["filterOperator"]
        var numCardsInCats = self.applyFilter(filterList, filterOperator, true);
        var catName = self.makeCurrentFilterName(filterList, filterOperator);
        // Prevent duplicate filters in list!
        if (catNames.includes(catName)) {
          continue;
        }
        catNames.push(catName);
      } else {
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
              } else {
                self.currentFilter = self.params.noFilter;
              }
              if (self.cardsOrderChoice == 'user' && self.cardOrder == undefined) {
                self.createOrder().appendTo(self.$inner);
              } else  if (self.enableCardsNumber && self.nbCardsSelected === undefined && self.nbCards > 5) {
                self.createNumberCards().appendTo(self.$inner);
              }  else if (self.matchIt && self.leftSideChoice == 'user' && self.leftSideMode == 'user') {
                self.createleftSideChoice().appendTo(self.$inner)
              } else if (!self.matchIt && self.cardsSideChoice == 'user' && self.cardsSideMode == 'user') {
                  self.createcardsSideChoice().appendTo(self.$inner);       
              } else {
                  self.attachContinue();
              }
          }).appendTo($optionButtons);
      }
    };
    return $filterCards;
  };

  /**
   * Create footer/navigation line
   *
   * @returns {*|jQuery|HTMLElement} Footer element
   */
  C.prototype.createFooter = function () {
    var self = this;
    var $footer = $('<nav>', {
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

    var classesRetry = 'h5p-dialogcards-footer-button h5p-dialogcards-retry h5p-dialogcards-disabled';
    var titleRetry = '';
    var htmlRetry = '';
    if (this.enableGotIt || this.repetition) {
      titleRetry = self.params.nextRound;
      htmlRetry = self.params.nextRound;
    } else {
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
        } else {
          self.retry();
        }
      }).appendTo($footer);

    if (!this.enableGotIt) {
      self.$progress = $('<div>', {
          'class': 'h5p-dialogcards-progress',
          'aria-live': 'assertive'
        }).appendTo($footer);
    } else {
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
    var self = this;
    var $footerLeft = $('<div>', {
      'class': 'h5p-dialogcards-match-footer-left'
    });
    self.$progressFooterLeft = $('<div>', {
          'class': 'h5p-dialogcards-cards-matched',
          'aria-live': 'assertive'
        }).appendTo($footerLeft);
    return $footerLeft;
  };

  /**
   * Called when all cards have been loaded.
   */
  C.prototype.updateImageSize = function () {
    var self = this;
    // Find highest card content
    var relativeHeightCap = 15;
    var height = 0;
    var i;
    var foundImage = false;
    for (i = 0; i < self.dialogs.length; i++) {
      var card = self.dialogs[i];
      var $card = self.$current.find('.h5p-dialogcards-card-content');
      if (card.image === undefined && card.image2 === undefined) {
        continue;
      }
      foundImage = true;
      if (card.image) {
        var imageHeight = card.image.height / card.image.width * $card.get(0).getBoundingClientRect().width;
        if (imageHeight > height) {
          height = imageHeight;
        }
      } else if (card.image2) {
        var imageHeight = card.image2.height / card.image2.width * $card.get(0).getBoundingClientRect().width;
        if (imageHeight > height) {
          height = imageHeight;
        }
      }
    }
    if (foundImage) {
      var relativeImageHeight = height / parseFloat(self.$inner.css('font-size'));
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
  C.prototype.addTipToCard = function($card, side, index) {
    var self = this;

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
    var tips = self.dialogs[index].tips;
    if (tips !== undefined && tips[side] !== undefined) {
      var tip = tips[side].trim();
      if (tip.length) {
        if (!this.noText) {
          $card.find('.h5p-dialogcards-card-text-wrapper .h5p-dialogcards-card-text-inner')
            .after(JoubelUI.createTip(tip, {
              tipLabel: self.params.tipButtonLabel
            }));
        } else {
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
    if (this.reverse) {
      for (var i = 0; i < cards.length; i++) {
        var t = cards[i].text;
        var a = cards[i].answer;
        cards[i]['text'] = a;
        cards[i]['answer'] = t;         
        var tf = cards[i].tips.front;
        var tb = cards[i].tips.back;
        cards[i].tips.front = tb;
        cards[i].tips.back = tf;
        var au = cards[i].audio;
        var au2 = cards[i].audio2;
        cards[i].audio = au2;
        cards[i].audio2 = au;
        var i0 = cards[i].image;
        var i2 = cards[i].image2;
        if (!cards[i].image2 && cards[i].image) {
          i2 = i0;
        }
        if (!cards[i].image && cards[i].image2 && !this.hideFrontImage) {
          i2 = i0;
          i0 = cards[i].image2;
        }
        cards[i].image = i2;
        cards[i].image2 = i0;
        var ialt = cards[i].imageAltText;
        var ialt2 = cards[i].imageAltText2;
        cards[i].imageAltText = ialt2;
        cards[i].imageAltText2 = ialt;
          
      }
    }
    
    var self = this;
    var loaded = 0;
    var existsCardOrder = true;
    if ($.isEmptyObject(this.cardOrder)) {
      existsCardOrder = false;
    }
    var initLoad = 2;

    // If keepstate then load all cards until last card previously reached by user.
    if (this.progress > 0) {
      initLoad += this.progress;
    }

    // If keepstate only randomize first instanciation.
    var okForRandomize = false;
    if (this.contentData.previousState === undefined || this.contentData.previousState.order === undefined) {
      okForRandomize = true;
    }

    if ( (this.cardsOrderMode == 'normal' || this.cardsOrderMode == 'random') && !existsCardOrder) {
      var cardOrdering = cards.map(function(cards, index) { return [cards, index] });
      // Shuffle the multidimensional array IF 'random' only.
      if (this.cardsOrderMode === 'random') {
        cardOrdering = H5P.shuffleArray(cardOrdering);
      }

      // Retrieve cards objects from the first index
      // TODO bug with categories
      var randomCards = [];
      for (var i = 0; i < self.nbCards; i++) {
        randomCards[i] = cardOrdering[i][0];
      }

      // Retrieve the new shuffled order from the second index
      var newOrder = [];
      for (var i = 0; i< self.nbCards; i++) {
          newOrder[i] = cardOrdering[i][1];
      }
      this.cardOrder = newOrder;
      // Initialise the noMatchCards array
      if (this.repetition) {
        this.noMatchCards = [];
          for (index = 0; index < this.cardOrder.length; ++index) {
            this.noMatchCards[index] = 0
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
        previousOrder = this.contentData.previousState.order;
        var cardOrdering = cards.map(function(cards, index) { return [cards, index] });
        var newCards = [];
        for (var i = 0; i< previousOrder.length; i++) {
          newCards[i] = cardOrdering[previousOrder[i]][0];
        }
        cards = newCards;
      }
    }
     
    // Save data to content state for resuming later on.
    // Push the new 'cards array' into self.dialogs.

    self.dialogs = cards;
    //self.getCurrentState();

    self.$cardwrapperSet = $('<div>', {
      'class': 'h5p-dialogcards-cardwrap-set'
    });

    var setCardSizeCallback = function () {
      loaded++;
      if (loaded === initLoad) {
        self.resize();
      }
    };  
    if (this.progress !== undefined && this.progress !== -1 && this.matchIt) {
      this.progress = this.progress / 2;
    }
    // Used to randomize first left card on starting game
    var x = Math.floor((Math.random() * (cards.length)) );
    
    // ********************************************** LOOP TO CREATE CARDS **********************************
    for (var i = 0; i < cards.length; i++) {
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
      var $cardWrapper = self.createCard(cards[i], i, setCardSizeCallback);
      if (((this.progress == undefined || this.progress == -1) && i === 0) || (this.progress !== undefined && i == this.progress)) {
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
        var $cardWrapperLeft = self.createCardLeft(cards[i], i, setCardSizeCallback);
        if (this.repetition && this.progressLeft) {
          var indexLeft = (this.progressLeft - 1) / 2;  
        }
        if (((this.progressLeft == undefined || this.progressLeft == -1) && i == x) 
          || (this.progressLeft !== undefined && i == indexLeft)) {
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
        
        if (this.leftSideMode == 'frontLeft') {
          self.addTipToCard($cardWrapper.find('.h5p-dialogcards-card-content'), 'back', i);
          self.addTipToCard($cardWrapperLeft.find('.h5p-dialogcards-card-content'), 'front', i);
        } else {
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
    var self = this;
    
    var $cardWrapper = $('<div>', {
      'class': 'h5p-dialogcards-cardwrap'
    });

    var $cardHolder = $('<div>', {
      'class': 'h5p-dialogcards-cardholder'
    }).appendTo($cardWrapper);

    // Progress for assistive technologies
    var progressText = self.params.progressText
      .replace('@card', (cardNumber + 1).toString())
      .replace('@total', (self.params.dialogs.length).toString());
    $('<div>', {
      'class': 'h5p-dialogcards-at-progress',
      'text': progressText
    }).appendTo($cardHolder);

    self.createCardContent(card, cardNumber, setCardSizeCallback)
      .appendTo($cardHolder);
    
    return $cardWrapper;

  };

  C.prototype.createCardLeft = function (rcard, cardNumber, setCardSizeCallback) {
    var self = this;
    var $cardWrapperLeft = $('<div>', {
      'class': 'h5p-dialogcards-cardwrap-left'
    });

    var $cardHolderLeft = $('<div>', {
      'class': 'h5p-dialogcards-cardholder'
    }).appendTo($cardWrapperLeft);

    self.createCardContentLeft(rcard, cardNumber, setCardSizeCallback)
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
    var self = this;
    
    var $cardContent = $('<div>', {
      'class': 'h5p-dialogcards-card-content'
    }); 
    
    $cardContent.css('background-color', this.backgroundColor);
    if (this.matchIt && this.leftSideMode == 'frontLeft') {
        $cardContent.css('background-color', this.backgroundColorBack);  
    }
    if (card.image !== undefined || card.image2 !== undefined) {       
      self.createCardImage(card, setCardSizeCallback, isLeft = false)
        .appendTo($cardContent);
    }
        
    var $cardTextWrapper = $('<div>', {
      'class': 'h5p-dialogcards-card-text-wrapper'
    }).appendTo($cardContent);
    
    var $cardTextInner = $('<div>', {
      'class': 'h5p-dialogcards-card-text-inner'
    }).appendTo($cardTextWrapper);
    
        var $cardTextInnerContent = $('<div>', {
      'class': 'h5p-dialogcards-card-text-inner-content'
    }).appendTo($cardTextInner);
    
    if (this.hasAudio && !this.noText) {
      self.createCardAudio(card)
        .appendTo($cardTextInnerContent);
    
      self.createCardAudio2(card)
      .appendTo($cardTextInnerContent);
    }

    var $cardText = $('<div>', {
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
      self.createCardFooter()
        .appendTo($cardTextWrapper);
    } else {
      $cardTextWrapper.addClass('hide');
      if (this.hasAudio) {
        self.createCardAudio(card)
          .appendTo($cardContent);
        self.createCardAudio2(card)
          .appendTo($cardContent);
      }
      self.createCardFooter()
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
    var self = this;
    // Reverse all card elements which have been reversed before.
    var t = card.text;
    var a = card.answer;      
    var i = card.image;
    var i2 = card.image2;
    var au = card.audio;
    var au2 = card.audio2;      
    if (!card.image2 && card.image) {
      i2 = i;
    };
    if (!card.image && card.image2 && !this.hideFrontImage) {
      i2 = i;
      i = card.image2;
    };         
    var ialt = card.imageAltText;
    var ialt2 = card.imageAltText2;
    card.text = a;
    card.answer = t;
    card.audio = au2;
    card.audio2 = au;
    card.imageAltText = ialt2;
    card.imageAltText2 = ialt; 

    // Need to revert tips for the left card if frontLeft
    if (this.leftSideMode == 'frontLeft') {
      var tf = card.tips.front;
      var tb = card.tips.back;        
      card.tips.front = tb;
      card.tips.back = tf;
    }

    var $cardContent = $('<div>', {
      'class': 'h5p-dialogcards-card-content'
    });

    $cardContent.addClass('h5p-dialogcards-matchLeft');
    if (this.leftSideMode == 'frontLeft') {
      $cardContent.css('background-color', this.backgroundColor);  
    } else {
      $cardContent.css('background-color', this.backgroundColorBack);
    }
    // Upon restore content state maybe necessary to hide previously incorrectly matched cards
    
    // Do not create image div is not necessary    
    if (card.image !== undefined || card.image2 !== undefined) {
      self.createCardImage(card, setCardSizeCallback, isLeft = true)
        .appendTo($cardContent);
    }
    
    var $cardTextWrapper = $('<div>', {
      'class': 'h5p-dialogcards-card-text-wrapper'
    }).appendTo($cardContent);

    var $cardTextInner = $('<div>', {
      'class': 'h5p-dialogcards-card-text-inner'
    }).appendTo($cardTextWrapper);

    var $cardTextInnerContent = $('<div>', {
      'class': 'h5p-dialogcards-card-text-inner-content'
    }).appendTo($cardTextInner);
                              
    if (this.matchIt) {
      if (card.audio !== undefined) {
      self.createCardAudio(card)
        .appendTo($cardTextInnerContent);
      }
      if (card.audio2 !== undefined) {
        self.createCardAudio2(card)
          .appendTo($cardTextInnerContent);
      }
    }

    var $cardText = $('<div>', {
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

    if (!this.noText) {
     if (self.params.behaviour.scaleTextNotCard == false) {
       var $cardFooterLeft = $('<div>', {
          'class': 'h5p-dialogcards-card-footer'
        }).appendTo($cardTextWrapper);
      }
    } else {
      $cardTextWrapper.addClass('hide');
      if (this.hasAudio) {
        self.createCardAudio(card)
          .appendTo($cardContent);
        self.createCardAudio2(card)
          .appendTo($cardContent);
      }
       var $cardFooterLeft = $('<div>', {
          'class': 'h5p-dialogcards-card-footer spacer'
        }).appendTo($cardContent);
    } 
    
    // Restore original card data!
    if (this.leftSideMode == 'backLeft') {      
      var t = card.text;
      var a = card.answer;
      var i = card.image;
      var i2 = card.image2;
      var au = card.audio;
      var au2 = card.audio2;
      if (!card.image2 && card.image) {
        i2 = i;
      };
      if (!card.image && card.image2 && !this.hideFrontImage) {
        i2 = i;
        i = card.image2;
      };
      var ialt = card.imageAltText;
      var ialt2 = card.imageAltText2;
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
    var self = this;
    if (!this.enableGotIt) {
      var footerClass = 'h5p-dialogcards-card-footer';
    } else {
      var footerClass = 'h5p-dialogcards-card-footer-enablegotit';
    }
    var $cardFooter = $('<div>', {
      'class': footerClass
    });

    let classesRepetition = 'h5p-dialogcards-button-hidden';
    let classesRepetitionOff = '';
    let attributeTabindex = '-1';

    if (this.enableGotIt || this.matchIt) {
      classesRepetition = 'h5p-dialogcards-quick-progression h5p-dialogcards-disabled';
      attributeTabindex = '0';
    } else {
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
        .attr('tabindex', -1)
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
      this.$buttonTurn = H5P.JoubelUI.createButton({
        'class': 'h5p-dialogcards-turn',
        'html': self.params.answer
      }).click(function () {
        self.turnCard($(this).parents('.h5p-dialogcards-cardwrap'));
      }).attr('tabindex', 1)
        .appendTo($cardFooter);        
    } else {
      this.$buttonMatch = H5P.JoubelUI.createButton({
        'class': 'h5p-dialogcards-button-match',
        'html': self.params.matchButtonLabel
      }).click(function () {
        if (self.repetition) {          
          self.matchCardsRepetition($(this).parents('.h5p-dialogcards-cardwrap'));
        } else {
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
    var self = this;
    var $image;
    var $2images = false;
    var $imageWrapper = $('<div>', {
      'class': 'h5p-dialogcards-image-wrapper'
    });    

    if (this.matchIt && card.image !== undefined && card.image2 !== undefined) {
      $2images = true;          
      if (isLeft) {
        var i = card.image;
        var i2 = card.image2; 
        card.image = i2;
        card.image2 = i;
      }          
    }   
    
    if (card.image !== undefined) {
      $image = $('<img class="h5p-dialogcards-image" src="' + H5P.getPath(card.image.path, self.id) + '"/>');
      if (loadCallback) {
        $image.load(loadCallback);
      }
      if (card.imageAltText) {
        $image.attr('alt', card.imageAltText);
      }
    } else {
      if (this.cardsSideMode == 'backFirst' || this.leftSideMode == 'backLeft') {
        $image = $('<div class="h5p-dialogcards-image h5p-dialogcards-hide"></div>');
      } else {
        $image = $('<div class="h5p-dialogcards-image"></div>');
      }
      if (loadCallback) {
        loadCallback();
      }
    }

    if (card.image2 !== undefined) {
      // In browse or self-correction modes, if there is a back image but no front image, use the back image in backFirst mode.
      // In match modes, create image2 on left side if backLeft OR create it on right side if frontLeft.
      if ((this.cardsSideMode == 'backFirst' && !card.image) 
        || (self.matchIt && isLeft && this.leftSideMode == 'backLeft' && !$2images)
        || (self.matchIt && !isLeft && this.leftSideMode == 'frontLeft' && !$2images)
        ) {
        $image2 = $('<img class="h5p-dialogcards-image2" src="' + H5P.getPath(card.image2.path, self.id) + '"/>');      
      } else {
        $image2 = $('<img class="h5p-dialogcards-image2 h5p-dialogcards-hide" src="' + H5P.getPath(card.image2.path, self.id) + '"/>');                             
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
    
    if (this.hideFrontImage) {
      if (this.leftSideMode == 'frontLeft' && isLeft || this.leftSideMode == 'backLeft' && !isLeft
        || this.cardsSideMode == 'frontFirst'
        ) {
        $image.addClass('h5p-dialogcards-hide');
      }
    }
    
    self.$images.push($image);
    $image.appendTo($imageWrapper);
    
    // Restore initial card images
    if ($2images && isLeft && !this.reverse) {        
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
    var self = this;
    var audio = null;
    var audioClass = 'h5p-dialogcards-audio-wrapper'; 
    if (this.noText) {
      audioClass += ' spacer' 
    }                              
    var $audioWrapper = $('<div>', {
      'class': audioClass
    });              
    if (card.audio !== undefined) {
      var audioDefaults = {
        files: card.audio,
        audioNotSupported: self.params.audioNotSupported
      };
      audio = new Audio(audioDefaults, self.id);
      audio.attach($audioWrapper);
      // Have to stop else audio will take up a socket pending forever in chrome.
      if (audio.audio && audio.audio.preload) {
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
    var self = this;
    var audio2 = null;
    var audioClass = 'h5p-dialogcards-audio-wrapper2 hide'; 
    if (this.noText) {
      audioClass += ' spacer' 
    };    
    var $audioWrapper2 = $('<div>', {
      'class': audioClass
    });
    if (card.audio2 !== undefined) {
      var audioDefaults = {
        files: card.audio2,
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

  // var $next = self.$current.nextAll('.h5p-dialogcards-cardwrap').eq(this.matchIt);
  /**
   * Update navigation text and show or hide buttons.
   */
    C.prototype.updateNavigation = function () {
    var self = this;
    var $card = self.$current.find('.h5p-dialogcards-card-content');
    
    if (this.matchIt) {      
      // Needed if $matchButton was just de-activated upon an incorrect match.
      $matchButton = $card.find('.h5p-dialogcards-button-match');
      if (this.cardsLeft !== 0) {
        $matchButton.removeClass('h5p-dialogcards-disabled');
      } else {
        $matchButton.addClass('h5p-dialogcards-disabled');
      }
      if (this.matchIt && this.leftSideMode == 'backLeft' && this.hideFrontImage) {
        $ci = $card.find('.h5p-dialogcards-image');
        $ci.addClass('h5p-dialogcards-hide');
      } 
    } else {
      $card.css('background-color', this.backgroundColor);
    }

    if (this.enableGotIt) {
      var $cg = self.$current.find('.h5p-dialogcards-answer-button');
    }
    var $nextCard = self.$current.nextAll('.h5p-dialogcards-cardwrap').eq(0);   
    
    if (this.repetition) { 
      while ($nextCard.hasClass('h5p-dialogcards-noMatch')) {
      var $nextCard = $nextCard.nextAll('.h5p-dialogcards-cardwrap').eq(0);
      }
    }
    if ($nextCard.length && !this.enableGotIt) {        
      self.$next.removeClass('h5p-dialogcards-disabled');
      if (this.cardsLeft == 0) {
        self.$next.addClass('h5p-dialogcards-disabled');
      }
      self.$retry.addClass('h5p-dialogcards-disabled');
    } else if (!this.enableGotIt) {      
      self.$next.addClass('h5p-dialogcards-disabled');      
    }
    var $prevCard = self.$current.prevAll('.h5p-dialogcards-cardwrap').eq(0);
    
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
      } else {
        self.$prev.addClass('h5p-dialogcards-disabled');
      }      
    }

    if (this.enableGotIt) {
      // In case it was hidden when refreshing
      $card.find('.h5p-dialogcards-answer-button-off').removeClass('h5p-dialogcards-hide');
      const selectionIndex = self.$current.index();
      var theindex = self.nbCards - self.dialogs.length;    
      self.$progress.text(this.params.cardsLeft
        .replace('@number', self.dialogs.length - selectionIndex - this.endOfStack));
      self.$round.text(this.params.round
        .replace('@round', this.currentRound));
    } else if (this.matchIt) {
      self.$progressFooterLeft.text(this.params.matchesFound
        .replace('@correct', this.correct)
        .replace('@incorrect', this.incorrect));
      this.matchCorrect = null;
      if (!this.repetition) {
        self.$progress.text(self.params.progressText.replace('@card', (self.$current.index()) / 2 + 1)
          .replace('@total', self.dialogs.length));
      } else {
        const selectionIndex = self.$current.index();
        var theindex = self.nbCards - self.dialogs.length;    
        self.$progress.text(this.params.cardsLeft
          .replace('@number', this.cardsLeft));
        self.$round.text(this.params.round
          .replace('@round', this.currentRound));
      }      
    } else {
      self.$progress.text(self.params.progressText.replace('@card', (self.$current.index()) + 1)
        .replace('@total', self.dialogs.length));
    };
    
  };

  /**
   * Show next card. If matchIt show next card on the right.
   */
  C.prototype.nextCard = function () {
    var self = this;
    
    self.stopAudio(self.$current.index());
    if (this.matchIt) {
      $leftCard = self.$currentLeft;
      self.stopAudio($leftCard.index());
    }
    var $nextCard = self.$current.nextAll('.h5p-dialogcards-cardwrap').eq(0);
    
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
        var $loadCard = self.$current.next('.h5p-dialogcards-cardwrap');
        if (!$loadCard.length && self.$current.index() + 1 < self.dialogs.length) {
          var $cardWrapper = self.createCard(self.dialogs[self.$current.index() + 1], self.$current.index() + 1)
            .appendTo(self.$cardwrapperSet);
          self.addTipToCard($cardWrapper.find('.h5p-dialogcards-card-content'), 'front', self.$current.index() + 1);
        }
      }
      self.resize();
      if (!this.matchIt) {
        self.turnCardToFront();
      }
    } else { // Next card not loaded or end of cards.
      // End of stack reached
      self.resetButtons('retry button');
    }
    
    self.updateNavigation();
    
  };
  
  
  C.prototype.nextCardLeft = function () {
    var self = this;              
    var x = Math.floor((Math.random() * (self.dialogs.length)) );
    $leftCard = self.$currentLeft;                                          
    var $nextCardLeft = self.$currentLeft.nextAll('.h5p-dialogcards-cardwrap-left').eq(x);

    if ($nextCardLeft.length) {
      self.$currentLeft = $nextCardLeft.addClass('h5p-dialogcards-current-left');
      self.$currentLeft.removeClass('h5p-dialogcards-disabled');
      self.resize();
    } else {
      var $prevCardLeft = self.$currentLeft.prevAll('.h5p-dialogcards-cardwrap-left').eq(x);
      while (!$prevCardLeft.length) {
        y = Math.round(Math.random());
        if (y === 0) {
          var $prevCardLeft = $('.h5p-dialogcards-cardwrap-left').first();
        } else {
          var $prevCardLeft = $('.h5p-dialogcards-cardwrap-left').last();
        }
      }
      self.$currentLeft = $prevCardLeft.addClass('h5p-dialogcards-current-left');
      self.$currentLeft.removeClass('h5p-dialogcards-previous-left h5p-dialogcards-disabled');
    }                                                                      
  };
       
  C.prototype.nextCardLeftRepetition = function () {
    var self = this;
    var x = Math.floor((Math.random() * (this.cardsLeft)) );
    $leftCard = self.$currentLeft;
    var $nextCardLeft = self.$currentLeft.nextAll('.h5p-dialogcards-cardwrap-left-repetition').eq(x);

    if ($nextCardLeft.length) {
      self.$currentLeft = $nextCardLeft.addClass('h5p-dialogcards-current-left');
      self.$currentLeft.removeClass('h5p-dialogcards-disabled');
      self.resize();
    } else {
      var $prevCardLeft = self.$currentLeft.prevAll('.h5p-dialogcards-cardwrap-left-repetition').eq(x);
      var i = 0;
      while (!$prevCardLeft.length) {
        y = Math.round(Math.random());
        if (y === 0) {
          var $prevCardLeft = $('.h5p-dialogcards-cardwrap-left-repetition').first();
        } else {
          var $prevCardLeft = $('.h5p-dialogcards-cardwrap-left-repetition').last(); 
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
    var self = this;
    var $next = self.$current.next('.h5p-dialogcards-cardwrap');
    var $cardContent = self.$current.find('.h5p-dialogcards-card-content').removeClass('h5p-dialogcards-turned');
    const selectionIndex = self.$current.index();    
    var cardsLeftInStack = self.dialogs.length - selectionIndex - this.endOfStack;
    this.incorrect++;
    if ($next.length) {
      var audioIndex = self.nbCards - self.dialogs.length;
      self.stopAudio(audioIndex);
      self.$current.removeClass('h5p-dialogcards-current h5p-dialogcards-turned').addClass('h5p-dialogcards-previous');
      self.$current = $next.addClass('h5p-dialogcards-current');
      self.setCardFocus(self.$current);
      self.turnCardToFront();

      self.$current.find('.h5p-dialogcards-answer-button').addClass('h5p-dialogcards-disabled');

      // Add next card if not loaded yet.
      var $loadCard = self.$current.next('.h5p-dialogcards-cardwrap');
      if (!$loadCard.length && self.$current.index() + 1 < self.dialogs.length) {
        var $cardWrapper = self.createCard(self.dialogs[self.$current.index() + 1], self.$current.index() + 1)
          .appendTo(self.$cardwrapperSet);
        self.addTipToCard($cardWrapper.find('.h5p-dialogcards-card-content'), 'front', self.$current.index() + 1);
        self.resize();
      }
      self.turnCardToFront();

      // Update navigation
      self.updateNavigation();
      self.resetButtons('answer buttons');

      // Next card not loaded or end of cards.
    } else if (cardsLeftInStack) {
      this.endOfStack = 1;
      self.updateNavigation();
      self.resetButtons('retry button');
    }
  };

  /**
   * Show previous card.
   */
  C.prototype.prevCard = function () {
    var self = this;
    if (this.matchIt) {
      $leftCard = self.$currentLeft;
      self.stopAudio($leftCard.index());
    }
    var $prevCard = self.$current.prevAll('.h5p-dialogcards-cardwrap').eq(0);
    var $nomatch = $prevCard.hasClass('h5p-dialogcards-noMatch');
    while ($prevCard.length && $prevCard.hasClass('h5p-dialogcards-noMatch')) {
      $prevCard = $prevCard.prevAll('.h5p-dialogcards-cardwrap').eq(0);
    }
    var $nextCard = self.$current.nextAll('.h5p-dialogcards-cardwrap').eq(0);
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
    self.updateNavigation();
  };

  /**
   * User selected cards order option (normal/random).
   */
  C.prototype.randomizeOrder = function (cardsOrder) {
    var self = this;
    this.cardsOrderMode = cardsOrder;
    $( '.h5p-dialogcards-order', self.$inner ).remove();
    if (this.enableCardsNumber && cardsOrder === 'random' && self.nbCards > 5) {
      self.createNumberCards()
        .appendTo(self.$inner);
    } else {
      if (self.matchIt) {
        if (this.leftSideChoice === 'user') {
          $( '.h5p-dialogcards-number', self.$inner ).remove();
          // Just in case user clicked twice on the No button!
          setTimeout(function () {
            self.createleftSideChoice().appendTo(self.$inner);
          }, 300);
        } else {
          self.attachContinue();
        }
      } else {
        if (this.cardsSideChoice === 'user') {
          $( '.h5p-dialogcards-number', self.$inner ).remove();
          // Just in case user clicked twice on the No button!
          setTimeout(function () {
            self.createcardsSideChoice().appendTo(self.$inner);
          }, 300);
        } else {
          self.attachContinue();
        }
      }
    }
  };

  /**
   * When navigating forward or backward, reset card to front view if has previously been turned
   * so that user can see the Question side, not the Answer side of the card.
   */

  C.prototype.turnCardToFront = function () {
    var self = this;
    var $c = self.$current.find('.h5p-dialogcards-card-content');
    var turned = $c.hasClass('h5p-dialogcards-turned');
    if (turned) {
      self.turnCard(self.$current);
      if (self.enableGotIt) {
        var $cg = self.$current.find('.h5p-dialogcards-answer-button');
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
    var self = this;
    
    var $c = $card.find('.h5p-dialogcards-card-content');
    var $c = self.$current.find('.h5p-dialogcards-card-content');
    var $ci = $card.find('.h5p-dialogcards-image');
    var $ci2 = $card.find('.h5p-dialogcards-image2');
    var $ca = $card.find('.h5p-dialogcards-audio-wrapper');
    var $ca2 = $card.find('.h5p-dialogcards-audio-wrapper2');
    var turned = $c.hasClass('h5p-dialogcards-turned');
    var $ch = $card.find('.h5p-dialogcards-cardholder').addClass('h5p-dialogcards-collapse');
    if (this.enableGotIt) {
      var $cg = $card.find('.h5p-dialogcards-answer-button');

    }
    
    // Removes tip, since it destroys the animation:
    $c.find('.joubel-tip-container').remove();

    // Check if card has been turned before
    self.$cardSideAnnouncer.html(turned ? self.params.cardFrontLabel : self.params.cardBackLabel);
    
    if (turned) {
      $c.css('background-color', this.backgroundColor);
    } else {
      $c.css('background-color', this.backgroundColorBack);
    }
    
    // Update HTML class for card
    $c.toggleClass('h5p-dialogcards-turned', !turned);
    
    setTimeout(function () {

      $ch.removeClass('h5p-dialogcards-collapse');

      // Manage front & back texts.
      var $cardText = $card.find('.h5p-dialogcards-card-text');
      if (self.cardsSideMode == 'frontFirst') {
        if (self.dialogs[$card.index()]['answer']) {
          self.changeText($c, self.dialogs[$card.index()][turned ? 'text' : 'answer']);
          $cardText.removeClass('hide');
        }
      } else if ($ci2.attr('src')) { // backFirst & image2
        self.changeText($c, self.dialogs[$card.index()][turned ? 'text' : 'answer']);
        $cardText.removeClass('hide');
      } else {
        self.changeText($c, self.dialogs[$card.index()][turned ? 'text' : 'answer']);
      }

      var $off = self.$current.find('.h5p-dialogcards-answer-button-off');

      // Manage front & back images.
      if ($ci2.attr('src')) {
        if (self.cardsSideMode == 'frontFirst') {
          if (!self.hideFrontImage) {
            $ci.toggleClass('h5p-dialogcards-hide');
          }
          $ci2.toggleClass('h5p-dialogcards-hide');
        } else {
          // If exists image
          if ($ci.attr('src')) {     
            $ci.toggleClass('h5p-dialogcards-hide');
            $ci2.toggleClass('h5p-dialogcards-hide');
          }
        }
      } else {               
        $ci.removeClass('h5p-dialogcards-hide');
        $ci2.toggleClass('h5p-dialogcards-hide');
      }
      
      var audioIndex = self.$current.index();
      /* why?
      if (this.enableGotIt) {
        audioIndex = (self.nbCards - self.dialogs.length);
      }
      */
      var audio = self.audios[audioIndex];
      if (audio || self.noText) {
        $ch.find('.h5p-dialogcards-audio-wrapper').toggleClass('hide');
        self.stopAudio(audioIndex);
      }
      
      var audio2 = self.audios2[audioIndex];
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
        
        const $answerButtons = $card.find('.h5p-dialogcards-answer-button');
        if (!turned) {
          $answerButtons
            .addClass('h5p-dialogcards-quick-progression')
            .attr('tabindex', 0);
          
        } else {
          $answerButtons
            .removeClass('h5p-dialogcards-quick-progression')
        
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
    var $nextCard = self.$current.next('.h5p-dialogcards-cardwrap');
    if ($nextCard.length === 0 && !this.enableGotIt) {
      self.resetButtons('retry button');
    }
    if (this.endOfStack) {
      self.updateNavigation();
    };

  };

  /**
   * Change text of card, used when turning cards.
   *
   * @param $card
   * @param text
   */
  C.prototype.changeText = function ($card, text) {
    var $cardText = $card.find('.h5p-dialogcards-card-text-area');
    $cardText.html(text);
    
    $cardText.toggleClass('hide', (!text || !text.length));
  };

  /**
   * Stop audio of card with cardindex
   * @param {Number} cardIndex Index of card
   */
  C.prototype.stopAudio = function (cardIndex) {
    var self = this;
    var audio = self.audios[cardIndex];
    if (audio && audio.stop) {
      audio.stop();  
    }
    var audio2 = self.audios2[cardIndex];
    if (audio2 && audio2.stop) {
      audio2.stop();
    }
  };
  
    /**
   * Reset audio of card with cardindex
   * @param {Number} cardIndex Index of card
   */
  C.prototype.resetAudio = function (cardIndex) {
    var self = this;
    var audio = self.audios[cardIndex];
    if (audio && audio.stop) {
      audio.stop();
      audio.seekTo(0);  
    }
    var audio2 = self.audios2[cardIndex];
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
    var self = this;
    self.stopAudio($card.closest('.h5p-dialogcards-cardwrap').index());
    $card.find('.h5p-audio-inner')
      .addClass('hide');
  };
  
  C.prototype.showAllAudio = function () {
    var self = this;
    self.$cardwrapperSet.find('.h5p-audio-inner')
      .removeClass('hide');
  };
  
  /**
   * Reset the task so that the user can re-start from first card.
   */
  C.prototype.retry = function () {
    var self = this;
    // To hide the summary text upon retrying
    if (this.noText) {
      $card.find('.h5p-dialogcards-card-text-wrapper').addClass('hide');
    }
    // In case a dark background was set for the cards.
    $card.find('.h5p-dialogcards-card-content').removeClass('h5p-dialogcards-summary-screen');
    self.stopAudio(self.$current.index());
    $( '.h5p-dialogcards-options', self.$inner).remove();
    var $optionsText = self.$inner.find('.h5p-dialogcards-options');
    $optionsText.html('');
    if (!this.enableGotIt && this.userChoice) {
      this.taskFinished = true;
      var $cards = self.$inner.find('.h5p-dialogcards-cardwrap');
      $cards.each(function (index) {
        self.resetAudio(index);
        if (this.repetition) {
          self.removeClass('h5p-dialogcards-noMatch')
        }
      });
      self.resetTask();
      
      // Needed to re-start on first card if user saved state at another card.
      this.progress = 0;
      return;
    }
    if (this.taskFinished) {
      self.finishedScreen();
    	self.trigger('resize');
    }
    this.currentRound++;
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
    var $cards = self.$inner.find('.h5p-dialogcards-cardwrap');
    self.stopAudio(self.$current.index());
    self.$current.removeClass('h5p-dialogcards-current');
    self.$current = $cards.filter(':first').addClass('h5p-dialogcards-current');

    self.updateNavigation();
    // audio buttons
    var paused = 'h5p-audio-minimal-play-paused';
    var play =  'h5p-audio-minimal-play';
    
    $cards.each(function (index) {
      var $card = $(this).removeClass('h5p-dialogcards-previous h5p-dialogcards-turned');
      turned = $card.hasClass('h5p-dialogcards-turned');
      self.changeText($card, self.dialogs[$card.index()].text);
      var $cardContent = $card.find('.h5p-dialogcards-card-content');
      
      // Show all front images (ci) and hide all back images (ci2)
      var $ci = $card.find('.h5p-dialogcards-image');
      var $ci2 = $card.find('.h5p-dialogcards-image2');
      $ci.removeClass('h5p-dialogcards-hide');
      $ci2.addClass('h5p-dialogcards-hide');
      
      // Show all front audios (ca) and hide all back audios (ca2)
      var $ca = $card.find('.h5p-dialogcards-audio-wrapper');
      var $ca2 = $card.find('.h5p-dialogcards-audio-wrapper2');
      $ca.removeClass('hide');      
      $ca2.addClass('hide');
      self.resetAudio(index);
      
      // Replace potential "paused" button with "ready to play" button
      var $caButton = $card.find('.h5p-audio-minimal-button');      
      if ($caButton.hasClass(paused)){
        $caButton.switchClass( paused, play);
      }
      
      // Case option cardsSideChoice and image2 but no image
      if (self.cardsSideChoice && !self.dialogs[$card.index()].image
          && self.dialogs[$card.index()].image2
          && self.cardsSideMode == 'backFirst') {
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
    var self = this;    
    // Now remove the current 'gotitdone' card from the cards and cardOrder arrays.
    var index = this.lastCardIndex;
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
    var $cards = self.$inner.find('.h5p-dialogcards-cardwrap');
    
    self.$current = $cards.filter(':first').addClass('h5p-dialogcards-current');
    self.$current.addClass('h5p-dialogcards-match-right');
    //self.updateNavigation();
    // audio buttons
    var paused = 'h5p-audio-minimal-play-paused';
    var play =  'h5p-audio-minimal-play';
    
    $cards.each(function (index) {
      var $card = $(this).removeClass('h5p-dialogcards-previous h5p-dialogcards-noMatch');
      // Show all front images (ci) and hide all back images (ci2)
      var $ci = $card.find('.h5p-dialogcards-image');
      $ci.removeClass('h5p-dialogcards-hide');
      // Show all front audios (ca) and hide all back audios (ca2)
      var $ca = $card.find('.h5p-dialogcards-audio-wrapper');
      $ca.removeClass('hide');      
      self.resetAudio(index);
      
      // Replace potential "paused" button with "ready to play" button
      var $caButton = $card.find('.h5p-audio-minimal-button');      
      if ($caButton.hasClass(paused)){
        $caButton.switchClass( paused, play);
      }
      // In case it was hidden on the summary screen.
      $card.find('.h5p-dialogcards-image-wrapper').removeClass('h5p-dialogcards-hide');
    });
    // hide and show audio not used in papi Jo version BUT SHOULD DO A GENERAL RESET OF ALL AUDIO BUTTONS upon retry
    // cardsLeft ****************************************************************************
    var $cards = self.$inner.find('.h5p-dialogcards-cardwrap-left');
    var x = Math.floor((Math.random() * ($cards.length)) );
    $cards.each(function (index) {
      var $card = $(this).removeClass('h5p-dialogcards-noMatch');
      $card.addClass('h5p-dialogcards-cardwrap-left-repetition');
      if (index == x) {
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
    var self = this;
    element = self.$footer;
    var $content = $('.h5p-dialogcards-card-content', this);
    var $text = $('.h5p-dialogcards-card-text-inner-content', $content);
    var maxHeight = 0;
    self.updateImageSize();
    if (!self.params.behaviour.scaleTextNotCard) {
      self.determineCardSizes();
    }

    // Reset card-wrapper-set height
    self.$cardwrapperSet.css('height', 'auto');

    //Find max required height for all cards
    self.$cardwrapperSet.children().each( function () {
      var wrapperHeight = $(this).css('height', 'initial').outerHeight();
      $(this).css('height', 'inherit');
      maxHeight = wrapperHeight > maxHeight ? wrapperHeight : maxHeight;

      // Check height
      if (!$(this).next('.h5p-dialogcards-cardwrap').length) {
        var initialHeight = $(this).find('.h5p-dialogcards-cardholder').css('height', 'initial').outerHeight();
        maxHeight = initialHeight > maxHeight ? initialHeight : maxHeight;
        $(this).find('.h5p-dialogcards-cardholder').css('height', 'inherit');
      }
    });
    var relativeMaxHeight = maxHeight / parseFloat(self.$cardwrapperSet.css('font-size'));
    self.$cardwrapperSet.css('height', relativeMaxHeight + 'em');
    
    self.scaleToFitHeight();
    if (!this.$retry) {
      self.truncateRetryButton();
    }
    if (this.playMode == 'selfCorrectionMode') {
      self.truncateAnswerButtons();
    }
    self.resizeOverflowingText();
  };

  /**
   * Resizes each card to fit its text
   */
  C.prototype.determineCardSizes = function () {
    var self = this;   
    
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

      var $content = $('.h5p-dialogcards-card-content', this);
      var $text = $('.h5p-dialogcards-card-text-inner-content', $content);

      // Grab size with text
      var textHeight = $text[0].getBoundingClientRect().height;

      // Change to answer
      if (!self.matchIt) {
        self.changeText($content, self.dialogs[i].answer);
      }

      // Grab size with answer
      var answerHeight = $text[0].getBoundingClientRect().height;

      // Use highest
      var useHeight = (textHeight > answerHeight ? textHeight : answerHeight);

      // Min. limit
      var minHeight = parseFloat($text.parent().parent().css('minHeight'));
      if (useHeight < minHeight) {
        useHeight =  minHeight;
      }

      // Convert to em
      var fontSize = parseFloat($content.css('fontSize'));
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
    var self = this;

    if (!self.$cardwrapperSet || !self.$cardwrapperSet.is(':visible') || !self.params.behaviour.scaleTextNotCard) {
      return;
    }
    // Resize font size to fit inside CP
    if (self.$inner.parents('.h5p-course-presentation').length) {
      var $parentContainer = self.$inner.parent();
      if (self.$inner.parents('.h5p-popup-container').length) {
        $parentContainer = self.$inner.parents('.h5p-popup-container');
      }
      var containerHeight = $parentContainer.get(0).getBoundingClientRect().height;
      var getContentHeight = function () {
        var contentHeight = 0;
        self.$inner.children().each(function () {
          contentHeight += $(this).get(0).getBoundingClientRect().height +
          parseFloat($(this).css('margin-top')) + parseFloat($(this).css('margin-bottom'));
        });
        return contentHeight;
      };
      var contentHeight = getContentHeight();
      var parentFontSize = parseFloat(self.$inner.parent().css('font-size'));
      var newFontSize = parseFloat(self.$inner.css('font-size'));

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
        var increaseFontSize = true;
        while (increaseFontSize) {
          newFontSize += C.SCALEINTERVAL;
          // Cap max font size
          if (newFontSize > C.MAXSCALE) {
            increaseFontSize = false;
            break;
          }
          // Set relative font size to scale with full screen.
          var relativeFontSize = newFontSize / parentFontSize;
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
    var self = this;
    if (!self.params.behaviour.scaleTextNotCard) {
      return; // No text scaling today
    };
    // Resize card text if needed
    var $textContainer = self.$current.find('.h5p-dialogcards-card-text');
    var $text = $textContainer.children();
    self.resizeTextToFitContainer($textContainer, $text);
    if (this.matchIt && self.$currentLeft) {
      var $currentLeft = self.$currentLeft;
      var $textContainer = $currentLeft.find('.h5p-dialogcards-card-text');
      var $text = $textContainer.children();
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
    var self = this;
    // Final feedback screen, text container has been emptied.
    if ($textContainer.get(0) == undefined) {
      return;
    };

    // Reset text size
    $text.css('font-size', '');
    // Measure container and text height
    var currentTextContainerHeight = $textContainer.get(0).getBoundingClientRect().height;
    var currentTextHeight = $text.get(0).getBoundingClientRect().height;
    var parentFontSize = parseFloat($textContainer.css('font-size'));
    var fontSize = parseFloat($text.css('font-size'));
    var mainFontSize = parseFloat(self.$inner.css('font-size'));

    // Decrease font size
    if (currentTextHeight > currentTextContainerHeight) {

      var decreaseFontSize = true;
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
      var increaseFontSize = true;
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
          fontSize = fontSize- C.SCALEINTERVAL;
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
    var self = this;
    if (!self.$retry) {
      return;
    }

    // Reset button to full size
    self.$retry.removeClass('truncated');
    self.$retry.html(this.params.nextRound.replace('@round', this.currentRound));

    // Measure button
    var maxWidthPercentages = 0.3;
    var retryWidth = self.$retry.get(0).getBoundingClientRect().width +
        parseFloat(self.$retry.css('margin-left')) + parseFloat(self.$retry.css('margin-right'));
    var retryWidthPercentage = retryWidth / self.$retry.parent().get(0).getBoundingClientRect().width;
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
    var self = this;
    // Reset html text
    var $answerButtonCorrect = self.$inner.find('.h5p-dialogcards-answer-button.correct');
    var $answerButtonCorrectOff = self.$inner.find('.h5p-dialogcards-answer-button-off.h5p-joubelui-button.correct');
    $answerButtonCorrect.html(this.params.correctAnswer);
    $answerButtonCorrectOff.html(this.params.correctAnswer);
    
    var $answerButtonInCorrect = self.$inner.find('.h5p-dialogcards-answer-button.incorrect');
    var $answerButtonInCorrectOff = self.$inner.find('.h5p-dialogcards-answer-button-off.h5p-joubelui-button.incorrect');
    $answerButtonInCorrect.html(this.params.incorrectAnswer);
    $answerButtonInCorrectOff.html(this.params.incorrectAnswer);
    
    // Truncate button
    
    // TODO revise this truncation system
    /*
    var $footerWidth = $answerButtonCorrect.parent()[0].getBoundingClientRect().width;
    var $card = self.$current.find('.h5p-dialogcards-card-content');
    */
    // Supposed to be a smartphone
    var w = $(window).width();
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
    var self = this;
    self.taskFinished = true;
    self.answered = true;
    self.progress = -1;
    self.progressLeft = -1;
    if (this.enableGotIt || this.matchIt) {
      maxScore = self.params.behaviour.maxScore;
      if (maxScore) {
        var actualScore = maxScore;
        if (this.enableGotIt || this.repetition) {
          if (this.currentRound > 1) {
            var penalty = self.params.behaviour.penalty;
            if (penalty !== undefined || penalty > 0) {
              var penalty = self.params.behaviour.penalty / 100;
              var nbRounds = this.currentRound;
              for (let i = 0; i < nbRounds - 1; i++) {
                actualScore = actualScore - (actualScore * penalty);
              }
            } else {
              penalty = 0;
            }
          }
        } else if (this.matchIt && !this.repetition) {
           if (this.incorrect) {
            var penalty = self.params.behaviour.penalty;
            if (penalty !== undefined || penalty > 0) {
              var penalty = self.params.behaviour.penalty / 100;
              var nbIncorrect = this.incorrect;
              actualScore = actualScore - (nbIncorrect * penalty);
            } else {
              penalty = 0;
            }
          }
        }
        // Rounded result.
        var actualScore = Math.round( actualScore * 10 ) / 10;
        self.triggerXAPIScored(actualScore, maxScore, 'completed');
        self.triggerXAPI('answered');
      }
    }

    // Remove all these elements.
    $('.h5p-dialogcards-cardwrap-set, .h5p-dialogcards-match-footer, .h5p-dialogcards-footer, .h5p-dialogcards-options', self.$inner).remove();

    // Display task finished feedback message.

    var $feedback = $('<div>', {
      'class': 'h5p-dialogcards-summary-screen h5p-dialogcards-final-summary-screen'
    }).appendTo(self.$inner);
    var rounds  = self.params.rounds
      .replace('@rounds', this.currentRound.toString());

    // Feedback text
    var selectedCards = this.nbCardsSelected;
    var totalCards = self.params.dialogs.length;
    var totalCorrect = this.correct;
    var totalInCorrect = this.incorrect;
    var summary = self.params.summary;
    var thisRound = this.currentRound;
    var roundTxt = self.params.round.replace('@round', thisRound.toString());
    var cardsRight = self.params.summaryCardsRight;
    var cardsWrong = self.params.summaryCardsWrong;
    var overallScore = self.params.summaryOverallScore;
    var cardsSelected = self.params.summaryCardsSelected;
    var cardsCompleted = self.params.summaryCardsCompleted;
    var completedRounds = self.params.summaryCompletedRounds;
    var selectedMessage = '';
    if (selectedCards !== totalCards) {
      selectedMessage = '<td class="h5p-dialogcards-summary-table-row-category">'
          + cardsSelected
          + '<td>&nbsp;</td>'
          + '<td class="h5p-dialogcards-summary-table-row-score">'
          + selectedCards
          + '&nbsp;<span class="h5p-dialogcards-summary-table-row-score-divider">/</span>&nbsp;'
          + totalCards +'</td></tr>';
      totalCards = selectedCards;
    }

    var text1 = '<div class="h5p-dialogcards-summary-header">'
      + summary + '</div>'
      +'<div class="h5p-dialogcards-summary-subheader">' + overallScore + '</div>'
      + '<table class="h5p-dialogcards-summary-table">'
      + '<tr>' + selectedMessage;

    if (this.enableGotIt || this.repetition) {
      var allDone = self.params.summaryAllDone
        .replace('@cards', totalCards);
      var text2 =
        '<td class="h5p-dialogcards-summary-table-row-category">' + cardsCompleted + '</td>'
        + '<td class="h5p-dialogcards-summary-table-row-symbol h5p-dialogcards-check">&nbsp;</td>'
        + '<td class="h5p-dialogcards-summary-table-row-score">'
        + totalCards
        + '&nbsp;<span class="h5p-dialogcards-summary-table-row-score-divider">/</span>&nbsp;'
        + totalCards + '</td></tr>'
        + '<tr><td class="h5p-dialogcards-summary-table-row-category">' + completedRounds + '</td>'
        + '<td class="h5p-dialogcards-summary-table-row-symbol"></td>'
        + '<td class="h5p-dialogcards-summary-table-row-score">' + thisRound + '</td></tr>';
    } else if (this.matchIt && !this.repetition) {
      var allDone = self.params.summaryMatchesAllDone;
      var text2 =
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
    var text3 = '</table>'
          + '<div class="h5p-dialogcards-summary-message">'+ allDone + '</div>';
    var text = text1 + text2 + text3;

    $('<div>', {
      'class': 'h5p-dialogcards-cardwrap-set ',
      'html': text
    }).appendTo($feedback);

    var $feedbackFooter = $('<div>', {
      'class': 'h5p-dialogcards-cardwrap-set '
    }).appendTo($feedback);

    if (maxScore) {
      var explainScore = '';
      if (this.enableGotIt || this.repetition) {
        if (thisRound !== 1 && penalty) {
          explainScore = self.params.explainScoreGotIt
            .replace('@penalty', self.params.behaviour.penalty);
        }
      } else if (this.matchIt) {
        if (this.incorrect && penalty) {
          explainScore = self.params.explainScoreMatch
            .replace('@penalty', self.params.behaviour.penalty);
        }
      }
      var scoreExplanationButtonLabel = self.params.scoreExplanationButtonLabel;
      var label = scoreExplanationButtonLabel;
      var helpText = explainScore;
      scoreBar = JoubelUI.createScoreBar(maxScore, label, helpText, scoreExplanationButtonLabel);
      scoreBar.setScore(actualScore);
      scoreBar.appendTo($feedbackFooter);

    $('<div>', {
      'class': 'h5p-dialogcards-cardwrap-set ',
      'html': scoreBar
    }).appendTo($feedback);
    }
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
    var self = this;
    
    self.triggerXAPI('interacted');
    var index = $card.index();
    this.endOfStack = 0;
    this.correct++;
    const selectionIndex = self.$current.index();
    var audioIndex = self.nbCards - self.dialogs.length;
    self.stopAudio(audioIndex);
    
    // Mark current card with a 'gotitdone' class.
    self.$current.addClass('h5p-dialogcards-gotitdone');
    var cardsLeftInStack = self.dialogs.length - index - this.endOfStack;
    
    // Move to next card if exists.
    var $nextCard = self.$current.next('.h5p-dialogcards-cardwrap');
    var $prevCard = self.$current.prev('.h5p-dialogcards-cardwrap');
    
    
    if ($nextCard.length) {
      self.nextCard();
      self.resetButtons('answer buttons');

    } else if ($prevCard.length) { // No next card left - go to previous.
      this.lastCardIndex = index;
      this.endOfStack = 1;
      self.updateNavigation();
      this.endOfStack = 0;
      self.resetButtons('retry button');
      
      return;
    } else { // No cards left: task is finished.
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
    var self = this;
    self.triggerXAPI('interacted');
    for (var i = 0; i < self.nbCards + 1; i++) {
      self.resetAudio(i);
    };
    
    var delayInMilliseconds = 2000;
    var index = $card.index() / 2;
    var $leftCard = self.$currentLeft;
    var indexLeft = ($leftCard.index() - 1) / 2;
    
    // De-activate all buttons during the Timeout.
    $correctButton = $card.find('.h5p-dialogcards-match.correct');
    $incorrectButton = $card.find('.h5p-dialogcards-match.incorrect');
    $matchButton = $card.find('.h5p-dialogcards-button-match');
    $matchButton.toggleClass('h5p-dialogcards-disabled');
    self.$next.toggleClass('h5p-dialogcards-inactive');
    self.$prev.toggleClass('h5p-dialogcards-inactive');

    if (index == indexLeft) {
      this.correct++;
      $matchButton.addClass('h5p-dialogcards-disabled');
      $correctButton.toggleClass('h5p-dialogcards-disabled');
      self.$current.addClass('h5p-dialogcards-gotitdone');
      $leftCard.addClass('h5p-dialogcards-gotitdone');
      setTimeout(function() {
        self.nextCardLeft();
        self.resizeOverflowingText();
        var $cardLeft = self.$currentLeft.find('.h5p-dialogcards-card-content.h5p-dialogcards-matchLeft');
        $correctButton.toggleClass('h5p-dialogcards-disabled');
        self.$next.toggleClass('h5p-dialogcards-inactive');
        self.$prev.toggleClass('h5p-dialogcards-inactive');
        self.$current.removeClass('h5p-dialogcards-current h5p-dialogcards-match-right').addClass('h5p-dialogcards-previous');
        // Remove the 'gotitdone' card from DOM
        $( '.h5p-dialogcards-gotitdone', self.$inner).remove();
        self.$current = $('.h5p-dialogcards-cardwrap').first();
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
      // Remove all 'previous' class from all cards since we are moving the current cursor to first card.
      var $cards = self.$inner.find('.h5p-dialogcards-cardwrap');
      $cards.each(function (index) {
        var $card = $(this).removeClass('h5p-dialogcards-previous');
      });
    } else {
      this.incorrect++;
      self.updateNavigation();
      $matchButton.addClass('h5p-dialogcards-disabled');
      $incorrectButton.toggleClass('h5p-dialogcards-disabled');
      setTimeout(function() {
        $incorrectButton.toggleClass('h5p-dialogcards-disabled');
        self.$next.toggleClass('h5p-dialogcards-inactive');
        self.$prev.toggleClass('h5p-dialogcards-inactive');
      }, delayInMilliseconds);
    }

    // No cards left in stack. End game.
    if (self.dialogs.length == 0) {
      setTimeout(function() {
        self.finishedScreen();
        }, delayInMilliseconds);
      }
  };

C.prototype.matchCardsRepetition = function ($card) {
    var self = this;
    self.triggerXAPI('interacted');
    for (var i = 0; i < self.nbCards + 1; i++) {
      self.resetAudio(i);
    };
    var delayInMilliseconds = 2000; // Make it a parameters setting?
    var index = $card.index() / 2;
    var $leftCard = self.$currentLeft;    
    var indexLeft = ($leftCard.index() - 1) / 2;
    
    // De-activate all buttons during the Timeout.
    $correctButton = $card.find('.h5p-dialogcards-match.correct');
    $incorrectButton = $card.find('.h5p-dialogcards-match.incorrect');
    $matchButton = $card.find('.h5p-dialogcards-button-match');
    $matchButton.toggleClass('h5p-dialogcards-disabled');
    self.$next.toggleClass('h5p-dialogcards-inactive');
    self.$prev.toggleClass('h5p-dialogcards-inactive');
    this.cardsLeft--;
    if (index == indexLeft) { // We have a match.
        this.correct++;
    } else { // No match.
        this.incorrect++;
    }
    
    if (this.cardsLeft !== 0) {
      if (index == indexLeft) { // We have a match.
        $matchButton.addClass('h5p-dialogcards-disabled');
        self.$buttonMatch.addClass('h5p-dialogcards-disabled');
        $correctButton.toggleClass('h5p-dialogcards-disabled');
        self.$current.addClass('h5p-dialogcards-gotitdone');        
        setTimeout(function() { 
          self.nextCardLeftRepetition();
          self.resizeOverflowingText();
          var $cardLeft = self.$currentLeft.find('.h5p-dialogcards-card-content.h5p-dialogcards-matchLeft');
          $leftCard.addClass('h5p-dialogcards-gotitdone');
          $leftCard.removeClass('h5p-dialogcards-cardwrap-left-repetition h5p-dialogcards-current-left');
          if (this.leftSideMode == 'frontLeft') {
            var $ci2 = $cardLeft.find('.h5p-dialogcards-image2').addClass('h5p-dialogcards-hide');
          }
          $correctButton.toggleClass('h5p-dialogcards-disabled');
          self.$next.toggleClass('h5p-dialogcards-inactive');
          self.$prev.toggleClass('h5p-dialogcards-inactive');
          self.$current.removeClass('h5p-dialogcards-current h5p-dialogcards-match-right');          
          // Remove the 'gotitdone' card from DOM
          $( '.h5p-dialogcards-gotitdone', self.$inner).remove();
          self.$current = $('.h5p-dialogcards-cardwrap').first();          
          while (self.$current.hasClass('h5p-dialogcards-noMatch')) {
            self.$current = self.$current.nextAll('.h5p-dialogcards-cardwrap').eq(0);
          }
          self.$current.addClass('h5p-dialogcards-current h5p-dialogcards-match-right');
          var $nextCard = self.$current.next('.h5p-dialogcards-cardwrap');
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
        
        // Remove all 'previous' class from all cards since we are moving the current cursor to first card.
        var $cards = self.$inner.find('.h5p-dialogcards-cardwrap');
        $cards.each(function (index) {
          var $card = $(this).removeClass('h5p-dialogcards-previous');
        });
      } else { // We don't have a match
        // Find the matching right card from stack of cards
        var $cards = self.$inner.find('.h5p-dialogcards-cardwrap');
        $cards.each(function (index) {
          if (index == indexLeft) {
            $matchingRightCard = $(this);
            return false; // break
          }
        });
        $matchingRightCard.addClass('h5p-dialogcards-noMatch');
        $matchingRightCard.removeClass('h5p-dialogcards-previous h5p-dialogcards-current h5p-dialogcards-match-right');
        $matchButton.addClass('h5p-dialogcards-disabled'); 
        $incorrectButton.toggleClass('h5p-dialogcards-disabled');
        var nbCorrectMatches = self.nbCards - self.dialogs.length; 
        this.noMatchCards[indexLeft] = 1;
        setTimeout(function() {
          
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
      var $cards = self.$inner.find('.h5p-dialogcards-cardwrap');
        var $leftCards = self.$inner.find('.h5p-dialogcards-cardwrap-left');
        $cards.each(function (index) {
          var $card = $(this);
        });
        $leftCards.each(function (index) {
          var $card = $(this);
        });
        
      self.getCurrentState();
      this.$buttonMatch.addClass('h5p-dialogcards-disabled'); 
      self.$prev.addClass('h5p-dialogcards-inactive');
      $correctButton.toggleClass('h5p-dialogcards-disabled');
      // WARNING! do not use 'this' inside a setTimeout function; use 'self' !      
      if ($card.index() == -1) {
        delayInMilliseconds = 0;
      }
      setTimeout(function() {      
        self.$current.addClass('h5p-dialogcards-gotitdone').removeClass('h5p-dialogcards-noMatch');
        self.$next.toggleClass('h5p-dialogcards-inactive');
        self.$prev.toggleClass('h5p-dialogcards-inactive');
        self.$prev.addClass('h5p-dialogcards-hide');
        $leftCard.remove();      
        if (self.incorrect === 0) {                
          self.resetButtons('finished button');
        } else { 
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
   * Used in contracts.
   */

  C.prototype.resetTask = function () {
    self = this;
    self.answered = false;
    this.cardsLeft = self.params.dialogs.length;
    this.currentRound = 1;
    this.correct = 0;
    this.incorrect = 0;
    this.$current = undefined;
    //self.dialogs = self.copy(self.params.dialogs);
    self.dialogs = self.params.dialogs;
    self.getCurrentState();
    
    if (this.repetition) {
      //this.cardsLeft = self.params.dialogs.length;
      this.noMatchCards = []; // needed here ?     
    }  
    // Empty audios and audios2 arrays.
    self.audios = [];
    self.audios2 = [];
    // Removes all these elements to start afresh.
    $('.h5p-dialogcards-cardwrap-set, .h5p-dialogcards-footer, .h5p-question-feedback-container,'
      +'.h5p-dialogcards-card-side-announcer, .h5p-dialogcards-button-reset, .h5p-dialogcards-order, .h5p-joubelui-score-bar,'
      +'.h5p-dialogcards-summary-screen, .h5p-dialogcards-summary-message, .h5p-dialogcards-feedback .h5p-dialogcards-options', self.$inner).remove();

    // Reset various parameters.
    self.taskFinished = false;
    self.dialogs = self.params.dialogs;
    self.nbCards = self.params.dialogs.length;
    this.nbCardsInCurrentRound = self.nbCards;
    this.cardsSideChoice = self.params.behaviour.cardsSideChoice;
    this.cardsOrderChoice = self.params.behaviour.cardsOrderChoice;
    this.cardsOrderMode = this.cardsOrderChoice; 
    this.cardOrder = undefined;
    self.cardSizeDetermined = [];
    self.cardsLeftInStack = self.nbCards;
    // Categories filter determined by author, reset filter and re-start at zero (first card).
    if (self.params.enableCategories && this.filterList !== undefined && this.filterByCategories == 'authorFilter') {
      self.applyFilter(this.filterList, this.filterOperator, false);
      this.currentFilter = self.makeCurrentFilterName(this.filterList, this.filterOperator);
      this.progress = 0;
    }
    this.filterList = undefined;
    this.filterOperator = undefined;
    
    if (this.filterByCategories == 'userFilter') {
      self.nbCardsSelected = undefined;
      self.createFilterCards().appendTo(self.$inner);       
    } else if (this.cardsOrderChoice == 'user') {
      self.createOrder().appendTo(self.$inner);
    } else if (this.enableCardsNumber && self.nbCards > 5) {
      self.createNumberCards()
        .appendTo(self.$inner);
    } else {
      if (!this.matchIt && this.cardsSideChoice == 'user') {      
          self.createcardsSideChoice().appendTo(self.$inner);                  
      } else if (this.matchIt && this.leftSideChoice == 'user') {
          self.createleftSideChoice().appendTo(self.$inner)
      } else {
        self.attachContinue();
      }
    };
  };

   /**
   * Used with repetition modes: gotIt & Match with repetition if task not completed.
   */

  C.prototype.resetButtons = function (type) {
    var self = this;
    $card = self.$current;
    $card.removeClass('h5p-dialogcards-match-right');
    self.stopAudio(self.$current.index());
    $gotIt = this.enableGotIt;
    $card.find('.h5p-dialogcards-answer-button').addClass('h5p-dialogcards-disabled');
    if (type == 'answer buttons') {
      // Enable answer-buttons-off ; Unhide turn button & card text and Disable the Retry button.
      $card.find('.h5p-dialogcards-turn').removeClass('h5p-dialogcards-disabled');
      $card.find('.h5p-dialogcards-answer-button-off').removeClass('h5p-dialogcards-disabled');
      $card.find('.h5p-dialogcards-card-text-inner').removeClass('h5p-dialogcards-hide');
      this.$retry.addClass('h5p-dialogcards-disabled');
    } else if (type == 'retry button' || type == 'finished button') {
      // Disable answer buttons, turn button, Hide card text button and Enable the Retry button
      if ($gotIt || this.repetition) {
        if (this.noText) {
          $el = $card.find('.h5p-dialogcards-card-text-wrapper');
          // TODO
          aClass = 'noText';
          if (this.audioOnly) {
						aClass = 'audioOnly';
					}
					$el.removeClass('hide').addClass(aClass);
					
          var w = $el.parent().width();
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
        var totalCorrect = this.correct;
        var totalInCorrect = this.incorrect;
        var totalCards = this.correct + this.incorrect;
        var summary = self.params.summary;
        var thisRound = this.currentRound;
        var roundTxt = self.params.round.replace('@round', thisRound.toString());
        var cardsRight = self.params.summaryCardsRight;
        var cardsWrong = self.params.summaryCardsWrong;

        // Set this height to auto to make sure to fit the summary text inside it.
        // does not work with this.repetition plus save content state!
        if ($gotIt) {
          var $cardText = $card.find('.h5p-dialogcards-card-text');
          $cardText.addClass('h5p-dialogcards-auto-height');
        }
        
        var $cardContent = $card.find('.h5p-dialogcards-card-content');
        var $cardTextArea = $card.find('.h5p-dialogcards-card-text-area');
        $cardContent.addClass('h5p-dialogcards-summary-screen');
        var $ch = $card.find('.h5p-dialogcards-audio-wrapper').addClass('hide');
        var text = '<div class="h5p-dialogcards-summary-header">'
          + summary + '</div>'
          +'<div class="h5p-dialogcards-summary-subheader">' + roundTxt + '</div>'
          + '<table class="h5p-dialogcards-summary-table"><tr><td class="h5p-dialogcards-summary-table-row-category">'
          + cardsRight +'</td>'
          + '<td class="h5p-dialogcards-summary-table-row-symbol h5p-dialogcards-check">&nbsp;</td>'
          +'<td class="h5p-dialogcards-summary-table-row-score">'
          + totalCorrect
          +'&nbsp;<span class="h5p-dialogcards-summary-table-row-score-divider">/</span>&nbsp;'
          + totalCards
          +'</td></tr>'
          +'<tr><td class="h5p-dialogcards-summary-table-row-category">'
          + cardsWrong
          +'</td><td class="h5p-dialogcards-summary-table-row-symbol h5p-dialogcards-times">&nbsp;</td>'
          +'<td class="h5p-dialogcards-summary-table-row-score">'
          + totalInCorrect
          +'&nbsp;<span class="h5p-dialogcards-summary-table-row-score-divider">/</span>&nbsp;'
          + totalCards
          +'</td></tr></table>';

        $cardTextArea.html(text);
        $card.find('.h5p-dialogcards-card-text').removeClass('hide');
        
				          
        if (type == 'retry button') {
          this.cardsLeft = 0;        
          var retryRound = this.currentRound + 1;
          this.$retry.html(this.params.nextRound.replace('@round', this.currentRound + 1));
        } else {
          var finalSummary = this.params.showSummary;
          this.$retry.html(finalSummary);
          this.$retry.attr('title', finalSummary);
          this.taskFinished = true;
        }             
      } else {
          this.$retry.html(self.params.retry);
          this.$retry.addClass('h5p-dialogcards-button-reset');
      }
      this.$retry.removeClass('h5p-dialogcards-disabled');
      if (this.matchIt) {
        this.$retry.addClass('h5p-dialogcards-unset')
      }
    } else if (type == 'restart') {
        if (this.matchIt) {
          $card.addClass('h5p-dialogcards-match-right')
        }
        $card.find('.h5p-dialogcards-answer-button-off').removeClass('h5p-dialogcards-disabled');
        $card.find('.h5p-dialogcards-turn').removeClass('h5p-dialogcards-disabled');
        $card.find('.h5p-dialogcards-card-text-inner').removeClass('h5p-dialogcards-hide');
        $card.find('.h5p-dialogcards-card-text').removeClass('h5p-dialogcards-auto-height');
        if (this.matchIt) {
          self.$prev.removeClass('h5p-dialogcards-hide');
        }
        var $cardContent = $card.find('.h5p-dialogcards-card-content');
        $cardContent.removeClass('h5p-dialogcards-summary-screen');
        this.$retry.addClass('h5p-dialogcards-disabled');  
    }
  };

    /**
   * Does nothing but necessary for the Course Presentation content.
   * Used in contracts.
   * @public
   */

  C.prototype.showSolutions = function () {
    return;
  };

    /**
   * Get maximum score.
   *
   * @returns {Number} Max points
   */
  C.prototype.getMaxScore = function () {
    if (this.enableGotIt) {
      return this.params.behaviour.maxScore;
    } else {
        return 0;
    }
  };

  /**
   * @returns {Number} Points.
   */
  C.prototype.getScore = function () {
      if (this.enableGotIt && this.taskFinished) {
        return this.params.behaviour.maxScore;
      } else {
        return 0;
      }
  };

  // Used when a dialog cards activity is included in a Course Presentation content.
  C.prototype.getAnswerGiven = function () {
    if (this.enableGotIt) {
      return this.answered;
    }
  };

    /**
   * Returns an object containing content of each cloze
   *
   * @returns {object} object containing content for each cloze
   */
  C.prototype.getCurrentState = function () {   
    var state = {};
    if (this.$current !== undefined) {
      state.progress = this.$current.index();
    }
    if (this.repetition) {
      if (this.$currentLeft !== undefined) {
        state.progressLeft = this.$currentLeft.index();
      }
      if (state.progressLeft == -1) {
        state.progressLeft = state.progress + 1; 
      }
    } 
    if (this.playMode == 'selfCorrectionMode') {
      state.lastCorrect = !this.endOfStack;
    }    
    if (this.filterByCategories) {
      state.filterByCategories = this.filterByCategories;
      state.filterList = this.filterList;
      state.filterOperator = this.filterOperator;
      state.currentFilter = this.currentFilter;
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
    state.leftSideChoice = this.leftSideChoice;
    state.leftSideMode = this.leftSideMode;
    state.reverse = this.reverse;
    state.taskFinished = this.taskFinished;
    return state;
  };
  
  // https://stackoverflow.com/questions/7486085/copy-array-by-value
  // reply by tfmontague!
  C.prototype.copy = function(aObject) {
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
  
  C.prototype.applyFilter = function(filterList, filterOperator, dryRun = false) {
    var self = this;
    var filterListLength = filterList.split(',').length;
    var catDialogs = [];
    var isSelected = 0;
    var notSelected = 0;
    var numCardsInCats = 0;
    for (var i = 0; i < self.dialogs.length; i++) {
      if (self.dialogs[i].itemCategories !== undefined) {
        itemCats = self.dialogs[i].itemCategories.split(',');
        isSelected = 0;
        notSelected = 0; 
        for (var j = 0; j < itemCats.length; j++) {      
          if (filterOperator == 'AND' || filterOperator == 'OR') {
            if (filterList.includes(itemCats[j])) {
              isSelected++;                    
            }        
          } else { // filterOperator == 'NOT'
             if (filterList.includes(itemCats[j])) {
              notSelected++;                    
            } 
          }
        }
        if (isSelected == filterListLength 
          || (filterOperator == "OR" && isSelected !== 0)
          || (filterOperator == "NOT" && notSelected == 0)
          ) 
        {
          if (dryRun) {
            numCardsInCats ++;
          } else {
            catDialogs[i] = self.dialogs[i];
          }
        }
      } 
    }
    if (dryRun) {
      return numCardsInCats;
    }
    var filtered = catDialogs.filter(function (el) {
      return el != null;
    });
    if (!filtered.length) {
      this.noFilterMessage = "ERROR! categories filter returned an empty result. No filter will be applied."
    } else {
      this.dialogs = filtered;
      this.nbCards = self.dialogs.length;
      return filtered;
    }      
  };
  
  C.prototype.makeCurrentFilterName = function(catList, catOperator) {
    var self = this;
    if (catOperator == 'AND') {
      filterName = catList.replace(/,/g, " " + self.params.boolean_AND + " ");
    } else if (catOperator == 'OR' ) {
      filterName = catList.replace(/,/g, " " + self.params.boolean_OR + " ");
    } else if (catOperator == 'NOT') {
      filterName = self.params.boolean_NOT + ' ' + catList.replace(/,/g, " " + self.params.boolean_NOT + " ");
    } 
      return filterName;  
  };
  
  C.SCALEINTERVAL = 0.2;
  C.MAXSCALE = 16;
  C.MINSCALE = 4;

  return C;
})(H5P.jQuery, H5P.Audio, H5P.JoubelUI, H5P.Question);