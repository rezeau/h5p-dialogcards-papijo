(function runPhase2D3CTargeted(window, document, H5P, $) {
  'use strict';
  /* eslint-disable no-await-in-loop, no-magic-numbers */

  const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
  const raf = () => new Promise((resolve) => requestAnimationFrame(resolve));
  let contentId = 400;

  const makeCard = (text, answer) => ({
    text: `<p>${text}</p>`, answer: `<p>${answer}</p>`, tips: { front: '', back: '' }, imageMedia: {}, audioMedia: {},
  });

  const translations = {
    answer: 'Turn', next: 'Next', prev: 'Previous', retry: 'Retry', correctAnswer: 'Correct',
    incorrectAnswer: 'Incorrect', round: 'Round @round', rounds: '@rounds rounds', cardsLeft: 'Cards left: @number',
    nextRound: 'Next round', showSummary: 'Summary', summary: 'Summary', summaryCardsRight: 'Right',
    summaryCardsWrong: 'Wrong', summaryOverallScore: 'Score', summaryCardsCompleted: 'Completed',
    summaryCardsSelected: 'Selected', summaryCompletedRounds: 'Rounds', summaryAllDone: 'Done',
    progressText: 'Card @card of @total', cardFrontLabel: 'Front', cardBackLabel: 'Back', tipButtonLabel: 'Tip',
    audioNotSupported: 'No audio', randomizeCardsQuestion: 'Random?', currentOrderNotice: 'Order',
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

  const papiLibrary = () => ({
    library: 'H5P.DialogcardsPapiJo 1.17',
    params: {
      ...translations,
      title: '<p>Phase 2D3C targeted</p>',
      description: '<p>Unequal text for nested and navigation regressions.</p>',
      dialogs: [
        makeCard('Short front', 'A substantially taller back with enough words to wrap over several lines.'),
        makeCard('Second front with somewhat more text.', 'Short back'),
        makeCard('Third front', 'Another deliberately long answer used for stable sizing.'),
      ],
      behaviour: {
        enableRetry: true, scaleTextNotCard: false, cardsOrderChoice: 'normal', cardsSideChoice: 'frontFirst',
        penalty: 0, playMode: 'browseSideBySide', enableCardsNumber: false, filterByCategories: 'none',
        noTextOnCards: false, noDupeFrontPicToBack: false, passPercentage: 100, hideTurnButton: false,
        allowedPlayModes: { normalMode: true, browseSideBySide: true },
      },
    },
  });

  const officialLibrary = () => ({
    library: 'H5P.Dialogcards 1.9',
    params: {
      mode: 'normal', dialogs: [makeCard('Official front', 'Official back with enough text to wrap.')],
      behaviour: {
        enableRetry: true, disableBackwardsNavigation: false, scaleTextNotCard: false,
        randomCards: false, maxProficiency: 5, quickProgression: false,
      },
      answer: 'Turn', next: 'Next', prev: 'Previous', retry: 'Retry', correctAnswer: 'Correct',
      incorrectAnswer: 'Incorrect', round: 'Round @round', cardsLeft: 'Cards left: @number',
      nextRound: 'Next round', startOver: 'Start over', showSummary: 'Summary', summary: 'Summary',
      summaryCardsRight: 'Right', summaryCardsWrong: 'Wrong', summaryCardsNotShown: 'Not shown',
      summaryOverallScore: 'Score', summaryCardsCompleted: 'Completed', summaryCompletedRounds: 'Rounds',
      summaryAllDone: 'Done', progressText: 'Card @card of @total', cardFrontLabel: 'Front',
      cardBackLabel: 'Back', tipButtonLabel: 'Tip', audioNotSupported: 'No audio',
      confirmStartingOver: { header: 'Start over?', body: 'Start over?', cancelLabel: 'Cancel', confirmLabel: 'Start' },
      title: '<p>Official CSS contamination control</p>', description: '',
    },
  });

  const createCase = (title, width) => {
    const section = document.createElement('section');
    section.className = 'probe-case';
    section.style.width = `${width}px`;
    section.style.maxWidth = 'calc(100vw - 4rem)';
    section.innerHTML = `<h2>${title}</h2><div class="probe-book"><div class="probe-page"></div></div>`;
    document.querySelector('#fixtures').append(section);
    return { root: section, book: section.querySelector('.probe-book'), page: section.querySelector('.probe-page') };
  };

  const createNested = (title, hidden = false, width = 700) => {
    const shell = createCase(title, width);
    if (hidden) {
      shell.page.classList.add('probe-hidden');
    }
    const columnLibrary = {
      library: 'H5P.ColumnPapiJo 1.17',
      params: { useSeparators: true, content: [{ content: papiLibrary(), useSeparator: 'auto' }] },
    };
    shell.columnInstance = H5P.newRunnable(columnLibrary, ++contentId, $(shell.page), false, { standalone: false });
    shell.instance = shell.columnInstance.getInstances()[0];
    shell.column = shell.page.classList.contains('h5p-column') ? shell.page : shell.page.querySelector('.h5p-column');
    shell.bookInstance = new H5P.EventDispatcher();
    shell.columnInstance.on('resize', () => {
      shell.bookInstance.bubblingUpwards = true;
      shell.bookInstance.trigger('resize');
      shell.bookInstance.bubblingUpwards = false;
    });
    shell.bookInstance.on('resize', () => {
      if (!shell.bookInstance.bubblingUpwards) {
        shell.columnInstance.trigger('resize');
      }
    });
    return shell;
  };

  const createOfficial = () => {
    const shell = createCase('Official Dialogcards with shared PapiJo CSS', 520);
    shell.instance = H5P.newRunnable(officialLibrary(), ++contentId, $(shell.page), false, { standalone: true });
    return shell;
  };

  const number = (value) => Number.parseFloat(value) || 0;

  const snapshot = (shell, label) => {
    const root = shell.instance.$inner[0];
    const set = root.querySelector('.h5p-dialogcards-cardwrap-set');
    const holders = [...root.querySelectorAll('.h5p-dialogcards-cardholder')];
    const currentHolders = holders.filter((holder) => getComputedStyle(holder).visibility !== 'hidden');
    const rootRect = root.getBoundingClientRect();
    const descendants = [...root.querySelectorAll('*')]
      .filter((element) => getComputedStyle(element).display !== 'none');
    const requiredBottom = descendants.reduce(
      (maximum, element) => Math.max(maximum, element.getBoundingClientRect().bottom),
      rootRect.bottom,
    );
    const holderGeometry = currentHolders.map((holder) => {
      const style = getComputedStyle(holder);
      const rect = holder.getBoundingClientRect();
      const content = holder.querySelector('.h5p-dialogcards-card-content');
      const footer = holder.querySelector('.h5p-dialogcards-card-footer');
      return {
        width: rect.width, height: rect.height, contentHeight: holder.clientHeight - number(style.paddingTop) -
          number(style.paddingBottom), boxSizing: style.boxSizing, borderTop: number(style.borderTopWidth),
        borderBottom: number(style.borderBottomWidth), borderRadius: style.borderRadius,
        contentTop: content?.getBoundingClientRect().top, contentBottom: content?.getBoundingClientRect().bottom,
        footerTop: footer?.getBoundingClientRect().top, footerBottom: footer?.getBoundingClientRect().bottom,
        containsContent: !content || (content.getBoundingClientRect().top >= rect.top - 1 &&
          content.getBoundingClientRect().bottom <= rect.bottom + 1),
        containsFooter: !footer || (footer.getBoundingClientRect().top >= rect.top - 1 &&
          footer.getBoundingClientRect().bottom <= rect.bottom + 1),
      };
    });
    return {
      label, visible: Boolean(root.getClientRects().length), cardSetHeight: set.getBoundingClientRect().height,
      cardSetInlineHeight: set.style.height, rootHeight: rootRect.height, rootScrollHeight: root.scrollHeight,
      columnHeight: shell.column?.getBoundingClientRect().height, bookHeight: shell.book.getBoundingClientRect().height,
      requiredBeyondRoot: requiredBottom - rootRect.bottom,
      clipped: Boolean(root.getClientRects().length) &&
        (root.scrollHeight > root.clientHeight + 1 || requiredBottom > rootRect.bottom + 1),
      holders: holderGeometry,
    };
  };

  const run = async () => {
    const originalResize = H5P.DialogcardsPapiJo.prototype.resize;
    const telemetry = { entries: 0, calculations: 0, reentryExits: 0, maxDepth: 0, errors: [] };
    let depth = 0;
    H5P.DialogcardsPapiJo.prototype.resize = function tracedResize() {
      const reentrant = Boolean(this.isResizing);
      telemetry.entries++;
      if (reentrant) {
        telemetry.reentryExits++;
      }
      else if (!this.taskFinished) {
        telemetry.calculations++;
      }
      depth++;
      telemetry.maxDepth = Math.max(telemetry.maxDepth, depth);
      try {
        return originalResize.apply(this, arguments);
      }
      catch (error) {
        telemetry.errors.push(error.message);
        throw error;
      }
      finally {
        depth--;
      }
    };

    const nested = createNested('Nested PapiJo in Column/book shell');
    const hidden = createNested('Hidden attach then visible', true, 480);
    const official = createOfficial();
    await raf();
    await raf();

    const samples = {
      nested: [snapshot(nested, 'nested-baseline')],
      hidden: [], navigation: [], width: [], leaveReturn: [], official: [],
    };

    samples.hidden.push(snapshot(hidden, 'hidden-after-attach'));
    hidden.page.classList.remove('probe-hidden');
    samples.hidden.push(snapshot(hidden, 'hidden-reveal-before-parent-resize'));
    hidden.bookInstance.trigger('resize');
    await raf();
    samples.hidden.push(snapshot(hidden, 'hidden-reveal-after-parent-resize'));
    hidden.bookInstance.trigger('resize');
    samples.hidden.push(snapshot(hidden, 'hidden-reveal-repeat-resize'));

    nested.instance.nextCard();
    samples.navigation.push(snapshot(nested, 'side-by-side-next-0ms'));
    await wait(320);
    samples.navigation.push(snapshot(nested, 'side-by-side-next-320ms'));
    nested.instance.prevCard();
    samples.navigation.push(snapshot(nested, 'side-by-side-previous-0ms'));
    await wait(320);
    samples.navigation.push(snapshot(nested, 'side-by-side-previous-320ms'));

    for (const width of [390, 760, 390]) {
      nested.root.style.width = `${width}px`;
      nested.bookInstance.trigger('resize');
      await raf();
      samples.width.push(snapshot(nested, `width-${width}`));
      nested.bookInstance.trigger('resize');
      samples.width.push(snapshot(nested, `width-${width}-repeat`));
    }

    nested.page.classList.add('probe-hidden');
    samples.leaveReturn.push(snapshot(nested, 'leave-hidden'));
    nested.page.classList.remove('probe-hidden');
    samples.leaveReturn.push(snapshot(nested, 'return-before-parent-resize'));
    nested.bookInstance.trigger('resize');
    await raf();
    samples.leaveReturn.push(snapshot(nested, 'return-after-parent-resize'));
    nested.bookInstance.trigger('resize');
    samples.leaveReturn.push(snapshot(nested, 'return-repeat-resize'));

    for (let pass = 1; pass <= 5; pass++) {
      official.instance.resize();
      samples.official.push({ pass, ...snapshot(official, `official-pass-${pass}`) });
    }

    const beforeQuiescence = snapshot(nested, 'before-quiescence');
    await wait(500);
    const afterQuiescence = snapshot(nested, 'after-quiescence');
    const visiblePapiSamples = [
      ...samples.nested, ...samples.hidden.slice(2), ...samples.navigation,
      ...samples.width, ...samples.leaveReturn.slice(2),
    ];
    const noClipping = visiblePapiSamples.every((sample) => !sample.clipped);
    const stablePairs = [
      [samples.hidden[2], samples.hidden[3]],
      [samples.width[0], samples.width[1]], [samples.width[2], samples.width[3]], [samples.width[4], samples.width[5]],
      [samples.leaveReturn[2], samples.leaveReturn[3]],
    ].every(([first, second]) => first.cardSetHeight === second.cardSetHeight &&
      first.rootHeight === second.rootHeight);
    const widthReturned = samples.width[0].cardSetHeight === samples.width[4].cardSetHeight &&
      samples.width[0].rootHeight === samples.width[4].rootHeight;
    const officialStable = new Set(samples.official.map((sample) => sample.cardSetHeight)).size === 1;
    const officialHolder = samples.official[0].holders[0];
    const visualContainment = visiblePapiSamples.every((sample) => sample.holders.every(
      (holder) => holder.containsContent && holder.containsFooter,
    ));
    const noAutonomousChange = beforeQuiescence.cardSetHeight === afterQuiescence.cardSetHeight &&
      beforeQuiescence.rootHeight === afterQuiescence.rootHeight;
    const passed = noClipping && stablePairs && widthReturned && visualContainment && noAutonomousChange &&
      telemetry.reentryExits === 0 && telemetry.errors.length === 0;

    const result = {
      phase: '2D3C-targeted-regressions', samples, telemetry,
      officialCssContamination: {
        holderBoxSizing: officialHolder.boxSizing, borderTop: officialHolder.borderTop,
        borderBottom: officialHolder.borderBottom, officialStable,
      },
      verdict: { noClipping, stablePairs, widthReturned, visualContainment, noAutonomousChange, passed },
    };
    window.__phase2d3cTargeted = result;
    document.querySelector('#results').textContent = JSON.stringify(result, null, 2);
    await fetch('/results', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(result, null, 2),
    });
    document.querySelector('#status').textContent = passed ?
      'Phase 2D3C targeted regressions PASSED' : 'Phase 2D3C targeted regressions FAILED';
    document.documentElement.dataset.phase2d3cTargeted = passed ? 'passed' : 'failed';
  };

  run().catch((error) => {
    document.querySelector('#status').textContent = `Phase 2D3C targeted probe failed: ${error.message}`;
    document.querySelector('#results').textContent = error.stack;
    document.documentElement.dataset.phase2d3cTargeted = 'error';
    console.error(error);
  });
}(window, document, window.H5P, window.jQuery));
