/**
 * Build the localized label for a category filter.
 * @param {string} categoryList Comma-separated category names.
 * @param {string} operator Category matching rule.
 * @param {string} andLabel Localized AND label.
 * @param {string} orLabel Localized OR label.
 * @param {string} notLabel Localized NOT label.
 * @returns {string|undefined} Localized filter label.
 */
export function makeCurrentFilterName(
  categoryList,
  operator,
  andLabel,
  orLabel,
  notLabel,
) {
  let filterName;
  if (operator === 'AND') {
    filterName = categoryList.replace(/,/g, ` ${andLabel} `);
  }
  else if (operator === 'OR') {
    filterName = categoryList.replace(/,/g, ` ${orLabel} `);
  }
  else if (operator === 'NOT') {
    filterName = `${notLabel} ${categoryList.replace(/,/g, ` ${notLabel} `)}`;
  }
  return filterName;
}

/**
 * Determine the existing category-filter result for a working deck.
 * @param {object} options Filtering inputs and dependencies.
 * @param {object[]} options.currentDialogs Current working deck.
 * @param {object[]} options.authoredDialogs Original authored deck.
 * @param {string} options.filterList Comma-separated category names.
 * @param {string} options.filterOperator Category matching rule.
 * @param {boolean} options.dryRun Whether to count without creating a replacement deck.
 * @param {function(object[]): object[]} options.clone Structured-clone implementation.
 * @returns {object} Filtering result for the Dialogcards compatibility wrapper.
 */
export function applyFilter({
  currentDialogs,
  authoredDialogs,
  filterList,
  filterOperator,
  dryRun,
  clone,
}) {
  const filterListLength = filterList.split(',').length;
  const catDialogs = [];
  let isSelected = 0;
  let notSelected = 0;
  let numCardsInCats = 0;
  for (let i = 0; i < currentDialogs.length; i++) {
    if (currentDialogs[i].itemCategories !== undefined) {
      const itemCats = currentDialogs[i].itemCategories.split(',');
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
          catDialogs[i] = authoredDialogs[i];
        }
      }
    }
  }
  if (dryRun) {
    return {
      matchCount: numCardsInCats,
    };
  }
  const filtered = catDialogs.filter(function (el) {
    return el != null;
  });
  if (!filtered.length) {
    return {
      emptyResult: true,
    };
  }
  const replacementDialogs = clone(filtered);
  return {
    emptyResult: false,
    replacementDialogs,
    replacementNbCards: replacementDialogs.length,
  };
}
