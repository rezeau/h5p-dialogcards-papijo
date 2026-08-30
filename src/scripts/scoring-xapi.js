/**
 * Build the existing xAPI activity definition.
 * @param {object} options Definition source values.
 * @param {unknown} options.title Preferred description value.
 * @param {unknown} options.description Description fallback value.
 * @param {unknown} options.showSummary Final fallback value.
 * @returns {object} Fresh xAPI activity definition.
 */
export function buildXAPIDefinition({
  title,
  description,
  showSummary,
}) {
  let selectedValue = '';
  if (title !== '') {
    selectedValue = title;
  }
  else if (description !== '') {
    selectedValue = description;
  }
  else {
    selectedValue = showSummary;
  }

  return {
    description: {
      'en-US': selectedValue,
    },
    type: 'http://adlnet.gov/expapi/activities/cmi.interaction',
    interactionType: 'long-fill-in',
  };
}
