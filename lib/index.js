/**
 * @typedef {import('mdast').Root} Root
 * @typedef {import('mdast').Content} Content
 * @typedef {import('mdast').List} List
 * @typedef {import('./search.js').SearchOptions} SearchOptions
 * @typedef {import('./contents.js').ContentsOptions} ContentsOptions
 */

/**
 * @typedef {Root | Content} Node
 * @typedef {SearchOptions & ContentsOptions & ExtraOptions} Options
 *
 * @typedef ExtraOptions
 *   Extra configuration fields.
 * @property {string | null | undefined} [heading]
 *   Heading to look for, wrapped in `new RegExp('^(' + value + ')$', 'i')`.
 *
 * @typedef Result
 *   Results.
 * @property {number | null} index
 *   Index of the node right after the table of contents heading, `-1` if no
 *   heading was found, `null` if no `heading` was given.
 * @property {number | null} endIndex
 *   Index of the first node after `heading` that is not part of its section,
 *   `-1` if no heading was found, `null` if no `heading` was given, same as
 *   `index` if there are no nodes between `heading` and the first heading in
 *   the table of contents.
 * @property {List | null} map
 *   List representing the generated table of contents, `null` if no table of
 *   contents could be created, either because no heading was found or because
 *   no following headings were found.
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
 * @param {Node} tree
 *   Tree to search and generate from.
 * @param {Options | null | undefined} [options]
 *   Configuration.
 * @returns {Result}
 *   Results.
 */
export function toc(tree, options) {
  const settings = options || {}
  const heading = settings.heading ? toExpression(settings.heading) : undefined
  const result = search(tree, heading, settings)

  return {
    index: heading ? result.index : null,
    endIndex: heading ? result.endIndex : null,
    map: result.map.length > 0 ? contents(result.map, settings) : null
  }
}
