/**
 * Transform a string into an applicable expression.
 *
 * @param {string} value
 *   Value.
 * @returns {RegExp}
 *   Expression.
 */
export function toExpression(value) {
  return new RegExp('^(' + value + ')$', 'i')
}
