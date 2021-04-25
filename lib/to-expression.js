// Transform a string into an applicable expression.
export function toExpression(value) {
  return new RegExp('^(' + value + ')$', 'i')
}
