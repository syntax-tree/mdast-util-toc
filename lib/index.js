/**
 * @typedef {import('mdast').Root|import('mdast').Content} Node
 * @typedef {import('mdast').List} List
 * @typedef {import('./search.js').SearchOptions} SearchOptions
 * @typedef {import('./contents.js').ContentsOptions} ContentsOptions
 * @typedef {SearchOptions & ContentsOptions & ExtraOptions} Options
 *
 * @typedef ExtraOptions
 * @property {string} [heading] Heading to look for, wrapped in `new RegExp('^(' + value + ')$', 'i')`.
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
 * Get a TOC representation of `node`.
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
