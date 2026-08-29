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
