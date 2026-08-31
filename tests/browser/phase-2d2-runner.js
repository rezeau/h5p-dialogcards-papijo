(function runPhase2D2(window, document, H5P, $) {
  'use strict';

  const trace = [];
  const samples = [];
  const startedAt = performance.now();
  let sequence = 0;

  const now = () => Math.round((performance.now() - startedAt) * 100) / 100;
  const machine = (instance) => instance?.libraryInfo?.machineName ||
    (instance instanceof H5P.ColumnPapiJo ? 'H5P.ColumnPapiJo' : 'unknown');
  const record = (kind, details = {}) => trace.push({ sequence: ++sequence, atMs: now(), kind, ...details });
  const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
  const raf = () => new Promise((resolve) => requestAnimationFrame(resolve));

  const rect = (element) => {
    if (!element) return null;
    const bounds = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      top: bounds.top,
      bottom: bounds.bottom,
      width: bounds.width,
      height: bounds.height,
      clientHeight: element.clientHeight,
      offsetHeight: element.offsetHeight,
      scrollHeight: element.scrollHeight,
      styleHeight: element.style.height,
      display: style.display,
      visibility: style.visibility,
      overflowX: style.overflowX,
      overflowY: style.overflowY,
      scrollClipped: element.scrollHeight > element.clientHeight + 1,
    };
  };

  const sample = (label, instance, shell = {}) => {
    const root = instance?.$inner?.[0] || shell.root?.querySelector('.h5p-dialogcards');
    const cardSet = root?.querySelector('.h5p-dialogcards-cardwrap-set');
    const descendants = root ? [...root.querySelectorAll('*')].filter((element) => getComputedStyle(element).display !== 'none') : [];
    const rootRect = root?.getBoundingClientRect();
    const maxBottom = descendants.reduce((maximum, element) => Math.max(maximum, element.getBoundingClientRect().bottom), rootRect?.bottom || 0);
    const result = {
      label,
      atMs: now(),
      machine: machine(instance),
      issetHeight: instance?.issetHeight,
      taskFinished: instance?.taskFinished,
      mode: instance?.playModeUser,
      rightIndex: instance?.$current?.index?.(),
      leftIndex: instance?.$currentLeft?.index?.(),
      root: rect(root),
      cardSet: rect(cardSet),
      currentRight: rect(root?.querySelector('.h5p-dialogcards-current')),
      currentLeft: rect(root?.querySelector('.h5p-dialogcards-current-left')),
      rightHolder: rect(root?.querySelector('.h5p-dialogcards-current .h5p-dialogcards-cardholder')),
      leftHolder: rect(root?.querySelector('.h5p-dialogcards-current-left .h5p-dialogcards-cardholder')),
      column: rect(shell.column),
      bookPage: rect(shell.page),
      book: rect(shell.book),
      requiredDescendantBottom: maxBottom,
      requiredBeyondRoot: rootRect ? maxBottom - rootRect.bottom : null,
    };
    samples.push(result);
    record('sample', { label, machine: result.machine, issetHeight: result.issetHeight });
    return result;
  };

  const observe = (label, element) => {
    if (!element) return [];
    const observations = [];
    const resizeObserver = new ResizeObserver((entries) => entries.forEach((entry) => {
      const item = { atMs: now(), observer: 'resize', label, width: entry.contentRect.width, height: entry.contentRect.height };
      observations.push(item);
      record('observer', item);
    }));
    const mutationObserver = new MutationObserver((entries) => entries.forEach((entry) => {
      const item = { atMs: now(), observer: 'mutation', label, attribute: entry.attributeName };
      observations.push(item);
      record('observer', item);
    }));
    resizeObserver.observe(element);
    mutationObserver.observe(element, { attributes: true, attributeFilter: ['class', 'style'] });
    return [resizeObserver, mutationObserver];
  };

  const instrument = (Constructor, label, hasGuard) => {
    const prototype = Constructor.prototype;
    const originalAttach = prototype.attach;
    const originalResize = prototype.resize;
    const originalTrigger = prototype.trigger || H5P.EventDispatcher.prototype.trigger;

    prototype.attach = function instrumentedAttach() {
      record('attach-entry', { machine: label, contentId: this.contentId, connected: arguments[0]?.[0]?.isConnected });
      const result = originalAttach.apply(this, arguments);
      record('attach-return', { machine: label, contentId: this.contentId, issetHeight: this.issetHeight });
      return result;
    };
    prototype.resize = function instrumentedResize() {
      const before = {
        issetHeight: this.issetHeight,
        taskFinished: this.taskFinished,
        cardSetHeight: this.$cardwrapperSet?.[0]?.style.height,
      };
      const guardSkipped = Boolean(hasGuard && (before.issetHeight || before.taskFinished));
      record('resize-entry', {
        machine: label,
        contentId: this.contentId,
        mode: this.playModeUser,
        rightIndex: this.$current?.index?.(),
        leftIndex: this.$currentLeft?.index?.(),
        taskFinished: before.taskFinished,
        issetHeightBefore: before.issetHeight,
        guardSkipped,
      });
      const result = originalResize.apply(this, arguments);
      record('resize-return', {
        machine: label,
        contentId: this.contentId,
        calculationExecuted: !guardSkipped,
        issetHeightAfter: this.issetHeight,
        cardSetHeightBefore: before.cardSetHeight,
        cardSetHeightAfter: this.$cardwrapperSet?.[0]?.style.height,
      });
      return result;
    };
    prototype.trigger = function instrumentedTrigger(event) {
      const type = typeof event === 'string' ? event : event?.type;
      if (type === 'resize') {
        record('resize-emitted', {
          machine: label,
          contentId: this.contentId,
          bubbles: typeof event === 'object' && Boolean(event.getBubbles?.()),
          visible: Boolean(this.$inner?.[0]?.getClientRects().length),
          width: this.$inner?.[0]?.getBoundingClientRect().width,
          height: this.$inner?.[0]?.getBoundingClientRect().height,
        });
      }
      return originalTrigger.apply(this, arguments);
    };
  };

  const coreTrigger = H5P.EventDispatcher.prototype.trigger;
  H5P.EventDispatcher.prototype.trigger = function tracedContainerTrigger(event) {
    const type = typeof event === 'string' ? event : event?.type;
    const source = machine(this);
    if (type === 'resize' && source !== 'H5P.DialogcardsPapiJo' && source !== 'H5P.Dialogcards') {
      record('container-resize', {
        machine: source,
        contentId: this.contentId,
        bubblingUpwards: Boolean(this.bubblingUpwards),
        bubbles: typeof event === 'object' && Boolean(event.getBubbles?.()),
      });
    }
    return coreTrigger.apply(this, arguments);
  };

  instrument(H5P.DialogcardsPapiJo, 'H5P.DialogcardsPapiJo', true);
  instrument(H5P.Dialogcards, 'H5P.Dialogcards', false);
  window.__phase2d2InstrumentInstance = (instance) => {
    if (machine(instance) !== 'H5P.Dialogcards') return;
    const originalAttach = instance.attach;
    const originalResize = instance.resize;
    instance.attach = function instrumentedOfficialAttach() {
      record('attach-entry', { machine: 'H5P.Dialogcards', contentId: this.contentId, connected: arguments[0]?.[0]?.isConnected });
      const result = originalAttach.apply(this, arguments);
      record('attach-return', { machine: 'H5P.Dialogcards', contentId: this.contentId });
      return result;
    };
    instance.resize = function instrumentedOfficialResize() {
      const before = this.$cardWrapperSet?.[0]?.style.height;
      record('resize-entry', {
        machine: 'H5P.Dialogcards', contentId: this.contentId, rightIndex: this.currentCardId,
        taskFinished: false, issetHeightBefore: undefined, guardSkipped: false,
      });
      const result = originalResize.apply(this, arguments);
      record('resize-return', {
        machine: 'H5P.Dialogcards', contentId: this.contentId, calculationExecuted: true,
        issetHeightAfter: undefined, cardSetHeightBefore: before,
        cardSetHeightAfter: this.$cardWrapperSet?.[0]?.style.height,
      });
      return result;
    };
  };

  const makeCard = (text, answer, imagePath) => ({
    text: `<p>${text}</p>`,
    answer: `<p>${answer}</p>`,
    tips: { front: '', back: '' },
    imageMedia: imagePath ? { image: { path: imagePath, width: 640, height: 360 } } : {},
    audioMedia: {},
  });

  const translations = {
    answer: 'Turn', next: 'Next', prev: 'Previous', retry: 'Retry',
    correctAnswer: 'Correct', incorrectAnswer: 'Incorrect', round: 'Round @round', rounds: '@rounds rounds',
    cardsLeft: 'Cards left: @number', nextRound: 'Next round', showSummary: 'Summary', summary: 'Summary',
    summaryCardsRight: 'Right', summaryCardsWrong: 'Wrong', summaryOverallScore: 'Score',
    summaryCardsCompleted: 'Completed', summaryCardsSelected: 'Selected', summaryCompletedRounds: 'Rounds',
    summaryAllDone: 'Done', progressText: 'Card @card of @total', cardFrontLabel: 'Front', cardBackLabel: 'Back',
    tipButtonLabel: 'Tip', audioNotSupported: 'No audio', randomizeCardsQuestion: 'Random?', currentOrderNotice: 'Order',
    normalOrder: 'Normal', randomOrder: 'Random', yes: 'Yes', no: 'No', numCardsQuestion: 'Count', allCards: 'All',
    scoreExplanationButtonLabel: 'Score details', reverseSides: 'Reverse', currentSideNotice: 'Side',
    matchButtonLabel: 'Match', correctMatch: 'Correct', incorrectMatch: 'Incorrect', matchesFound: 'Matches',
    summaryMatchesFound: 'Found', summaryMatchesNotFound: 'Missing', summaryMatchesAllDone: 'Done',
    explainScoreGotIt: 'Score', explainScoreMatch: 'Score', randomizeRightCardsQuestion: 'Random?',
    currentRightOrderNotice: 'Right order', reverseLeftSide: 'Reverse left', currentLeftSideNotice: 'Left side',
    currentFilterNotice: 'Filter', selectFilter: 'Filter', noFilter: 'None', boolean_AND: 'AND', boolean_OR: 'OR',
    boolean_NOT: 'NOT', check: 'Check', normalMode: 'Free browsing', browseSideBySide: 'Side by side',
    matchMode: 'Match', matchRepetition: 'Repetition', selfCorrectionMode: 'Self correction', resetTask: 'Reset',
    selectPlayMode: 'Select mode', currentPlayModeNotice: 'Mode', noTextErrorNotice: 'Invalid content',
  };

  const papiLibrary = ({ mode = 'browseSideBySide', images = false } = {}) => ({
    library: 'H5P.DialogcardsPapiJo 1.17',
    params: {
      ...translations,
      title: '<p>Phase 2D2 PapiJo</p>',
      description: '<p>Nested resize characterization content with deliberately unequal text lengths.</p>',
      dialogs: [
        makeCard('Short front', 'A substantially taller back with enough words to wrap over several lines when the containing width becomes narrow.', images ? '/slow-image.svg?card=1' : null),
        makeCard('Second front with somewhat more text than the first card.', 'Short back', images ? '/slow-image.svg?card=2' : null),
        makeCard('Third front', 'Third back has another deliberately long paragraph that changes the required text area height after navigation.'),
      ],
      behaviour: {
        enableRetry: true, scaleTextNotCard: false, cardsOrderChoice: 'normal', cardsSideChoice: 'frontFirst',
        penalty: 0, playMode: mode, enableCardsNumber: false, filterByCategories: 'none', noTextOnCards: false,
        noDupeFrontPicToBack: false, passPercentage: 100, hideTurnButton: false,
        allowedPlayModes: { normalMode: true, browseSideBySide: true },
      },
    },
  });

  const officialLibrary = () => ({
    library: 'H5P.Dialogcards 1.9',
    params: {
      mode: 'normal',
      dialogs: [makeCard('Short front', 'A substantially taller official back with enough words to wrap over several lines.'), makeCard('Second front', 'Short back')],
      behaviour: { enableRetry: true, disableBackwardsNavigation: false, scaleTextNotCard: false, randomCards: false, maxProficiency: 5, quickProgression: false },
      answer: 'Turn', next: 'Next', prev: 'Previous', retry: 'Retry', correctAnswer: 'Correct', incorrectAnswer: 'Incorrect',
      round: 'Round @round', cardsLeft: 'Cards left: @number', nextRound: 'Next round', startOver: 'Start over',
      showSummary: 'Summary', summary: 'Summary', summaryCardsRight: 'Right', summaryCardsWrong: 'Wrong',
      summaryCardsNotShown: 'Not shown', summaryOverallScore: 'Score', summaryCardsCompleted: 'Completed',
      summaryCompletedRounds: 'Rounds', summaryAllDone: 'Done', progressText: 'Card @card of @total',
      cardFrontLabel: 'Front', cardBackLabel: 'Back', tipButtonLabel: 'Tip', audioNotSupported: 'No audio',
      confirmStartingOver: { header: 'Start over?', body: 'Start over?', cancelLabel: 'Cancel', confirmLabel: 'Start' },
      title: '<p>Official control</p>', description: '',
    },
  });

  const createCase = (title, width = 700) => {
    const section = document.createElement('section');
    section.className = 'probe-case';
    section.style.width = `${width}px`;
    section.style.maxWidth = 'calc(100vw - 4rem)';
    section.innerHTML = `<h2>${title}</h2><div class="probe-book"><div class="probe-page"></div></div>`;
    document.querySelector('#fixtures').append(section);
    return { root: section, book: section.querySelector('.probe-book'), page: section.querySelector('.probe-page') };
  };

  const createNested = (title, library, { hidden = false, width = 700 } = {}) => {
    const shell = createCase(title, width);
    if (hidden) shell.page.classList.add('probe-hidden');
    const columnLibrary = { library: 'H5P.ColumnPapiJo 1.17', params: { useSeparators: true, content: [{ content: library, useSeparator: 'auto' }] } };
    const column = H5P.newRunnable(columnLibrary, sequence + 100, $(shell.page), false, { standalone: false });
    column.libraryInfo ||= { machineName: 'H5P.ColumnPapiJo' };
    shell.column = shell.page.classList.contains('h5p-column') ? shell.page : shell.page.querySelector('.h5p-column');
    const child = column.getInstances()[0];
    const bookInstance = new H5P.EventDispatcher();
    bookInstance.libraryInfo = { machineName: 'H5P.InteractiveBookPapiJo' };
    bookInstance.contentId = sequence + 90;
    column.on('resize', () => {
      bookInstance.bubblingUpwards = true;
      bookInstance.trigger('resize');
      bookInstance.bubblingUpwards = false;
    });
    bookInstance.on('resize', () => {
      if (!bookInstance.bubblingUpwards) column.trigger('resize');
    });
    shell.bookInstance = bookInstance;
    shell.columnInstance = column;
    shell.instance = child;
    return shell;
  };

  const createStandalone = (title, library, width = 700) => {
    const shell = createCase(title, width);
    const instance = H5P.newRunnable(library, sequence + 200, $(shell.page), false, { standalone: true });
    shell.instance = instance;
    return shell;
  };

  const run = async () => {
    document.querySelector('#status').textContent = 'Running Phase 2D2 browser scenarios…';

    const standalone = createStandalone('PapiJo standalone', papiLibrary());
    const nested = createNested('PapiJo in Column in book shell', papiLibrary());
    const hidden = createNested('PapiJo hidden attach then reveal', papiLibrary(), { hidden: true, width: 480 });
    const image = createNested('PapiJo delayed images', papiLibrary({ images: true }), { width: 520 });
    const normal = createStandalone('PapiJo unequal-height turn', papiLibrary({ mode: 'normalMode' }), 460);
    const official = createNested('Official Dialogcards control in Column', officialLibrary(), { width: 520 });

    [standalone, nested, hidden, image, normal, official].forEach((shell) => {
      observe(`${machine(shell.instance)}:root`, shell.instance.$inner?.[0]);
      observe(`${machine(shell.instance)}:cardset`, shell.instance.$inner?.[0]?.querySelector('.h5p-dialogcards-cardwrap-set'));
      observe(`${machine(shell.instance)}:column`, shell.column);
      observe(`${machine(shell.instance)}:book`, shell.book);
    });

    sample('standalone-after-attach', standalone.instance, standalone);
    sample('nested-after-attach', nested.instance, nested);
    sample('hidden-after-attach', hidden.instance, hidden);
    sample('official-after-attach', official.instance, official);
    await raf();
    sample('after-raf1', nested.instance, nested);
    await raf();
    sample('after-raf2', nested.instance, nested);

    record('action', { label: 'repeated incoming resize visible' });
    nested.bookInstance.trigger('resize');
    nested.bookInstance.trigger('resize');
    official.bookInstance.trigger('resize');
    official.bookInstance.trigger('resize');
    sample('repeated-resize-papi', nested.instance, nested);
    sample('repeated-resize-official', official.instance, official);

    record('action', { label: 'hidden reveal then parent resize' });
    hidden.page.classList.remove('probe-hidden');
    sample('reveal-0ms', hidden.instance, hidden);
    await raf(); sample('reveal-raf1', hidden.instance, hidden);
    await raf(); sample('reveal-raf2', hidden.instance, hidden);
    hidden.bookInstance.trigger('resize');
    sample('reveal-after-incoming-resize', hidden.instance, hidden);

    record('action', { label: 'container width change' });
    nested.root.style.width = '390px';
    nested.bookInstance.trigger('resize');
    await raf();
    sample('width-390', nested.instance, nested);
    nested.root.style.width = '760px';
    nested.bookInstance.trigger('resize');
    await raf();
    sample('width-760', nested.instance, nested);
    official.root.style.width = '390px';
    official.bookInstance.trigger('resize');
    await wait(450);
    sample('official-width-390', official.instance, official);

    const nestedButtons = [...nested.instance.$inner[0].querySelectorAll('button')];
    const next = nestedButtons.find((button) => button.textContent.trim() === translations.next);
    if (next) {
      record('action', { label: 'side-by-side next' });
      nested.instance.nextCard();
      sample('next-0ms', nested.instance, nested);
      await wait(300); sample('next-300ms', nested.instance, nested);
      await wait(100); sample('next-400ms', nested.instance, nested);
    }
    const previous = nestedButtons.find((button) => button.textContent.trim() === translations.prev);
    if (previous) {
      record('action', { label: 'side-by-side previous' });
      nested.instance.prevCard();
      sample('previous-0ms', nested.instance, nested);
      await wait(300); sample('previous-300ms', nested.instance, nested);
    }

    const turn = normal.instance.$inner.find('.h5p-dialogcards-current .h5p-dialogcards-turn').get(0);
    if (turn) {
      record('action', { label: 'unequal-height turn' });
      turn.click();
      sample('turn-0ms', normal.instance, normal);
      await wait(200); sample('turn-200ms', normal.instance, normal);
      await wait(200); sample('turn-400ms', normal.instance, normal);
    }

    sample('images-before-load', image.instance, image);
    await wait(500);
    sample('images-after-load', image.instance, image);

    record('action', { label: 'counterfactual clear issetHeight once' });
    const counterBefore = sample('counterfactual-before', hidden.instance, hidden);
    hidden.instance.issetHeight = false;
    hidden.bookInstance.trigger('resize');
    const counterAfter = sample('counterfactual-after', hidden.instance, hidden);

    record('action', { label: 'feedback-loop watch' });
    for (let index = 0; index < 20; index++) {
      nested.bookInstance.trigger('resize');
      official.bookInstance.trigger('resize');
    }
    await wait(500);
    sample('loop-watch-papi', nested.instance, nested);
    sample('loop-watch-official', official.instance, official);

    const summarize = (libraryName) => ({
      emitted: trace.filter((item) => item.kind === 'resize-emitted' && item.machine === libraryName).length,
      entries: trace.filter((item) => item.kind === 'resize-entry' && item.machine === libraryName).length,
      calculations: trace.filter((item) => item.kind === 'resize-return' && item.machine === libraryName && item.calculationExecuted).length,
      guardSkips: trace.filter((item) => item.kind === 'resize-entry' && item.machine === libraryName && item.guardSkipped).length,
    });
    const result = {
      environment: {
        userAgent: navigator.userAgent,
        viewport: { width: innerWidth, height: innerHeight, devicePixelRatio },
        papiJo: '1.17.2 production bundle',
        columnPapiJo: '1.17.3 production script',
        official: '1.9.40 production bundle',
        coreContract: 'test-only H5P Core 1.28-compatible EventDispatcher/newRunnable subset',
      },
      counts: {
        papiJo: summarize('H5P.DialogcardsPapiJo'),
        official: summarize('H5P.Dialogcards'),
      },
      counterfactual: {
        before: counterBefore,
        after: counterAfter,
        cardSetDelta: (counterAfter.cardSet?.height || 0) - (counterBefore.cardSet?.height || 0),
        rootDelta: (counterAfter.root?.height || 0) - (counterBefore.root?.height || 0),
        clippingBefore: counterBefore.root?.scrollClipped || counterBefore.requiredBeyondRoot > 1,
        clippingAfter: counterAfter.root?.scrollClipped || counterAfter.requiredBeyondRoot > 1,
      },
      samples,
      trace,
    };
    window.__phase2d2 = result;
    document.querySelector('#results').textContent = JSON.stringify(result, null, 2);
    await fetch('/results', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(result, null, 2),
    });
    document.querySelector('#status').textContent = 'Phase 2D2 probe complete';
    document.documentElement.dataset.phase2d2Complete = 'true';
  };

  run().catch((error) => {
    document.querySelector('#status').textContent = `Phase 2D2 probe failed: ${error.message}`;
    document.querySelector('#results').textContent = error.stack;
    document.documentElement.dataset.phase2d2Complete = 'error';
    console.error(error);
  });
}(window, document, window.H5P, window.jQuery));
