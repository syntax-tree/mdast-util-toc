/**
 * @typedef {import('mdast').Root|import('mdast').Content} Node
 * @typedef {import('mdast').List} List
 * @typedef {import('./search.js').SearchOptions} SearchOptions
 * @typedef {import('./contents.js').ContentsOptions} ContentsOptions
 * @typedef {SearchOptions & ContentsOptions & ExtraOptions} Options
 *
 * @typedef ExtraOptions
 * @property {string} [heading]
 *   Heading to look for, wrapped in `new RegExp('^(' + value + ')$', 'i')`.
 *
 * @typedef Result
 * @property {number|null} index
 * @property {number|null} endIndex
 * @property {List|null} map
 */

import {search} from './search.js'
import {contents} from './contents.js'
import {toExpression} from './to-expression.js'

/**
 * Generate a table of contents from `tree`.
 *
 * Looks for the first heading matching `options.heading` (case insensitive) and
 * returns a table of contents (a list) for all following headings.
 * If no `heading` is specified, creates a table of contents for all headings in
 * `tree`.
 * `tree` is not changed.
 *
 * Links in the list to headings are based on GitHub’s style.
 * Only top-level headings (those not in blockquotes or lists), are used.
 * This default behavior can be changed by passing `options.parents`.
 *
 * @param {Node} node
 * @param {Options} [options]
 * @returns {Result}
 */
export function toc(node, options) {
  const settings = options || {}
  const heading = settings.heading ? toExpression(settings.heading) : null
  const result = search(node, heading, settings)

  return {
    index: heading ? result.index : null,
    endIndex: heading ? result.endIndex : null,
    map: result.map.length > 0 ? contents(result.map, settings) : null
  }
}
