/**
 * @typedef {import('mdast').Root|import('mdast').Content} Node
 * @typedef {import('mdast').Heading} Heading
 * @typedef {import('mdast').PhrasingContent} PhrasingContent
 * @typedef {import('unist-util-visit').Visitor<Heading>} HeadingVisitor
 * @typedef {import('unist-util-is').Type} IsType
 * @typedef {import('unist-util-is').Props} IsProps
 * @typedef {import('unist-util-is').TestFunctionAnything} IsTestFunctionAnything
 *
 * @typedef SearchOptions
 * @property {string} [skip] Headings to skip, wrapped in `new RegExp('^(' + value + ')$', 'i')`. Any heading matching this expression will not be present in the table of contents.
 * @property {IsType|IsProps|IsTestFunctionAnything|Array.<IsType|IsProps|IsTestFunctionAnything>} [parents]
 * @property {Heading['depth']} [maxDepth=6] Maximum heading depth to include in the table of contents. This is inclusive: when set to `3`, level three headings are included (those with three hashes, `###`).
 *
 * @typedef SearchEntry
 * @property {Heading['depth']} depth
 * @property {Array.<PhrasingContent>} children
 * @property {string} id
 *
 * @typedef SearchResult
 * @property {number} index
 * @property {number} endIndex
 * @property {Array.<SearchEntry>} map
 */

import Slugger from 'github-slugger'
import {toString} from 'mdast-util-to-string'
import {visit} from 'unist-util-visit'
import {convert} from 'unist-util-is'
import {toExpression} from './to-expression.js'

const slugs = new Slugger()

/**
 * Search a node for a toc.
 *
 * @param {Node} root
 * @param {RegExp|null} expression
 * @param {SearchOptions} settings
 * @returns {SearchResult}
 */
export function search(root, expression, settings) {
  const skip = settings.skip && toExpression(settings.skip)
  const parents = convert(settings.parents || ((d) => d === root))
  /** @type {Array.<SearchEntry>} */
  const map = []
  /** @type {number|undefined} */
  let index
  /** @type {number} */
  let endIndex
  /** @type {Heading} */
  let opening

  slugs.reset()

  // Visit all headings in `root`.  We `slug` all headings (to account for
  // duplicates), but only create a TOC from top-level headings (by default).
  visit(root, 'heading', onheading)

  return {
    index: index || -1,
    // <sindresorhus/eslint-plugin-unicorn#980>
    // @ts-expect-error Looks like a parent.
    endIndex: index ? endIndex || root.children.length : -1, // eslint-disable-line unicorn/explicit-length-check
    map
  }

  /** @type {HeadingVisitor} */
  function onheading(node, position, parent) {
    const value = toString(node, {includeImageAlt: false})
    /** @type {string} */
    // @ts-expect-error `hProperties` from <https://github.com/syntax-tree/mdast-util-to-hast>
    const id = node.data && node.data.hProperties && node.data.hProperties.id
    const slug = slugs.slug(id || value)

    if (!parents(parent)) {
      return
    }

    // Our opening heading.
    if (position !== null && expression && !index && expression.test(value)) {
      index = position + 1
      opening = node
      return
    }

    // Our closing heading.
    if (
      position !== null &&
      opening &&
      !endIndex &&
      node.depth <= opening.depth
    ) {
      endIndex = position
    }

    // A heading after the closing (if we were looking for one).
    if (
      (endIndex || !expression) &&
      (!settings.maxDepth || node.depth <= settings.maxDepth) &&
      (!skip || !skip.test(value))
    ) {
      map.push({depth: node.depth, children: node.children, id: slug})
    }
  }
}
