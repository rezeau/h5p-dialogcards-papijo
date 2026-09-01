(function runPhase2D3CFocus(window, document, H5P, $) {
  'use strict';
  /* eslint-disable no-await-in-loop, no-magic-numbers */

  const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
  const raf = () => new Promise((resolve) => requestAnimationFrame(resolve));

  const makeCard = (text, answer) => ({
    text: `<p>${text}</p>`,
    answer: `<p>${answer}</p>`,
    tips: { front: '', back: '' },
    imageMedia: {},
    audioMedia: {},
  });

  const translations = {
    answer: 'Turn', next: 'Next', prev: 'Previous', retry: 'Retry',
    correctAnswer: 'Correct', incorrectAnswer: 'Incorrect', round: 'Round @round', rounds: '@rounds rounds',
    cardsLeft: 'Cards left: @number', nextRound: 'Next round', showSummary: 'Summary', summary: 'Summary',
    summaryCardsRight: 'Right', summaryCardsWrong: 'Wrong', summaryOverallScore: 'Score',
    summaryCardsCompleted: 'Completed', summaryCardsSelected: 'Selected', summaryCompletedRounds: 'Rounds',
    summaryAllDone: 'Done', progressText: 'Card @card of @total', cardFrontLabel: 'Front', cardBackLabel: 'Back',
    tipButtonLabel: 'Tip', audioNotSupported: 'No audio', randomizeCardsQuestion: 'Random?',
    currentOrderNotice: 'Order',
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

  const library = {
    library: 'H5P.DialogcardsPapiJo 1.17',
    params: {
      ...translations,
      title: '<p>Phase 2D3C focused stability</p>',
      description: '<p>Visible nested card with unequal text lengths.</p>',
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
  };

  const number = (value) => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const geometry = (instance, shell) => {
    const root = instance.$inner[0];
    const cardSet = root.querySelector('.h5p-dialogcards-cardwrap-set');
    const holder = root.querySelector('.h5p-dialogcards-current .h5p-dialogcards-cardholder');
    const holderStyle = getComputedStyle(holder);
    const rootRect = root.getBoundingClientRect();
    const descendants = [...root.querySelectorAll('*')]
      .filter((element) => getComputedStyle(element).display !== 'none');
    const requiredBottom = descendants.reduce(
      (maximum, element) => Math.max(maximum, element.getBoundingClientRect().bottom),
      rootRect.bottom,
    );
    return {
      cardSetHeight: cardSet.getBoundingClientRect().height,
      cardSetInlineHeight: cardSet.style.height,
      holderContentHeight: holder.clientHeight - number(holderStyle.paddingTop) - number(holderStyle.paddingBottom),
      holderBorderBoxHeight: holder.getBoundingClientRect().height,
      holderComputedHeight: holderStyle.height,
      holderBorderTop: number(holderStyle.borderTopWidth),
      holderBorderBottom: number(holderStyle.borderBottomWidth),
      holderBoxSizing: holderStyle.boxSizing,
      rootHeight: rootRect.height,
      rootScrollHeight: root.scrollHeight,
      columnHeight: shell.column.getBoundingClientRect().height,
      bookHeight: shell.book.getBoundingClientRect().height,
      requiredBeyondRoot: requiredBottom - rootRect.bottom,
      clipped: root.scrollHeight > root.clientHeight + 1 || requiredBottom > rootRect.bottom + 1,
    };
  };

  const run = async () => {
    const originalResize = H5P.DialogcardsPapiJo.prototype.resize;
    const resizeTelemetry = { entries: 0, calculations: 0, reentryExits: 0, maxDepth: 0, errors: [] };
    let depth = 0;
    H5P.DialogcardsPapiJo.prototype.resize = function tracedResize() {
      const reentrant = Boolean(this.isResizing);
      resizeTelemetry.entries++;
      if (reentrant) {
        resizeTelemetry.reentryExits++;
      }
      else if (!this.taskFinished) {
        resizeTelemetry.calculations++;
      }
      depth++;
      resizeTelemetry.maxDepth = Math.max(resizeTelemetry.maxDepth, depth);
      try {
        return originalResize.apply(this, arguments);
      }
      catch (error) {
        resizeTelemetry.errors.push(error.message);
        throw error;
      }
      finally {
        depth--;
      }
    };

    const page = document.querySelector('.probe-page');
    const book = document.querySelector('.probe-book');
    const columnLibrary = {
      library: 'H5P.ColumnPapiJo 1.17',
      params: { useSeparators: true, content: [{ content: library, useSeparator: 'auto' }] },
    };
    const columnInstance = H5P.newRunnable(columnLibrary, 301, $(page), false, { standalone: false });
    const instance = columnInstance.getInstances()[0];
    const column = page.classList.contains('h5p-column') ? page : page.querySelector('.h5p-column');
    const shell = { page, book, column };
    await raf();
    await raf();

    const resizeObserverSamples = [];
    const resizeObserver = new ResizeObserver(() => resizeObserverSamples.push(geometry(instance, shell)));
    resizeObserver.observe(instance.$inner[0]);

    const baseline = geometry(instance, shell);
    const fivePasses = [];
    for (let pass = 1; pass <= 5; pass++) {
      instance.resize();
      fivePasses.push({ pass, ...geometry(instance, shell) });
      await raf();
    }

    const twentyPasses = [];
    for (let pass = 1; pass <= 20; pass++) {
      instance.resize();
      twentyPasses.push({ pass, ...geometry(instance, shell) });
      await raf();
    }

    const beforeQuiescence = geometry(instance, shell);
    const observerCountBeforeQuiescence = resizeObserverSamples.length;
    await wait(500);
    const afterQuiescence = geometry(instance, shell);
    resizeObserver.disconnect();

    const heights = (passes, key) => passes.map((sample) => sample[key]);
    const stable = (passes, key) => new Set(heights(passes, key)).size === 1;
    const fiveStable = ['cardSetHeight', 'holderBorderBoxHeight', 'rootHeight', 'rootScrollHeight']
      .every((key) => stable(fivePasses, key));
    const twentyStable = ['cardSetHeight', 'holderBorderBoxHeight', 'rootHeight', 'rootScrollHeight']
      .every((key) => stable(twentyPasses, key));
    const noClipping = [...fivePasses, ...twentyPasses].every((sample) => !sample.clipped);
    const noAutonomousChange = JSON.stringify(beforeQuiescence) === JSON.stringify(afterQuiescence) &&
      observerCountBeforeQuiescence === resizeObserverSamples.length;
    const passed = fiveStable && twentyStable && noClipping && noAutonomousChange &&
      resizeTelemetry.reentryExits === 0 && resizeTelemetry.errors.length === 0;

    const result = {
      phase: '2D3C-focused-stability',
      environment: {
        userAgent: navigator.userAgent,
        viewport: { width: innerWidth, height: innerHeight, devicePixelRatio },
      },
      cssExperiment: '.h5p-dialogcards .h5p-dialogcards-cardholder { box-sizing: border-box; }',
      baseline,
      fivePasses,
      twentyPasses,
      resizeTelemetry,
      quiescence: {
        observerCountBefore: observerCountBeforeQuiescence,
        observerCountAfter: resizeObserverSamples.length,
        before: beforeQuiescence,
        after: afterQuiescence,
      },
      verdict: { fiveStable, twentyStable, noClipping, noAutonomousChange, passed },
    };
    window.__phase2d3cFocus = result;
    document.querySelector('#results').textContent = JSON.stringify(result, null, 2);
    await fetch('/results', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(result, null, 2),
    });
    document.querySelector('#status').textContent = passed ?
      'Phase 2D3C focused stability gate PASSED' : 'Phase 2D3C focused stability gate FAILED';
    document.documentElement.dataset.phase2d3cFocus = passed ? 'passed' : 'failed';
  };

  run().catch((error) => {
    document.querySelector('#status').textContent = `Phase 2D3C focused stability probe failed: ${error.message}`;
    document.querySelector('#results').textContent = error.stack;
    document.documentElement.dataset.phase2d3cFocus = 'error';
    console.error(error);
  });
}(window, document, window.H5P, window.jQuery));
