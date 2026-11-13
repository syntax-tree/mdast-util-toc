/**
 * @import {FootnoteDefinition, Heading, Nodes, PhrasingContent} from 'mdast'
 * @import {Test} from 'unist-util-is'
 */

/**
 * @typedef {Heading['depth']} Rank
 */

/**
 * @typedef SearchEntry
 *   Entry.
 * @property {string} id
 *   ID of entry.
 * @property {Array<PhrasingContent>} children
 *   Contents of entry.
 * @property {Rank} depth
 *   Rank of entry.
 */

/**
 * @typedef SearchOptions
 *   Search configuration.
 * @property {Rank | null | undefined} [maxDepth=6]
 *   Maximum heading depth to include in the table of contents (default: `6`).
 *
 *   This is inclusive: when set to `3`, level three headings are included
 *   (those with three hashes, `###`).
 * @property {Rank | null | undefined} [minDepth=1]
 *   Minimum heading depth to include in the table of contents (default: `1`).
 *
 *   This is inclusive: when set to `3`, level three headings are included
 *   (those with three hashes, `###`).
 * @property {string | null | undefined} [skip]
 *   Headings to skip, wrapped in `new RegExp('^(' + value + ')$', 'i')`
 *   (default: `undefined`).
 *
 *   Any heading matching this expression will not be present in the table of
 *   contents.
 * @property {Test} [parents]
 *   Allow headings to be children of certain node types (default: the `tree`
 *   given to `toc`, to only allow top-level headings).
 *
 *   Internally, uses `unist-util-is` to check, so `parents` can be any
 *   `is`-compatible test.
 * @property {boolean | null | undefined} [tagfilter=false]
 *   Whether to handle HTML tags according to GFM tagfilter (default: `false`).
 */

/**
 * @typedef SearchResult
 *   Results.
 * @property {number} index
 *   Where the contents section starts, if looking for a heading.
 * @property {number} endIndex
 *   Where the contents section ends, if looking for a heading.
 * @property {Array<SearchEntry>} map
 *   List of entries.
 */

import Slugger from 'github-slugger'
import {toString} from 'mdast-util-to-string'
import {convert} from 'unist-util-is'
import {SKIP, visit} from 'unist-util-visit'
import {toExpression} from './to-expression.js'

// Tags that GFMs tagfilter shows as text.
// See: <https://github.com/micromark/micromark-extension-gfm-tagfilter/blob/3f624c44/lib/index.js#L7>
// See: <https://github.com/syntax-tree/hast-util-raw/blob/85b189dd/lib/index.js#L43>
const gfmTagfilterExpression =
  /^<\/?(?:iframe|noembed|noframes|plaintext|script|style|title|textarea|xmp)(?=[\t\n\f\r />])/i

const slugs = new Slugger()

/**
 * Get footnote identifiers in the order they are numbered.
 *
 * @param {Nodes} tree
 *   Tree.
 * @returns {Array<string>}
 *   Uppercase identifiers.
 */
function footnoteOrder(tree) {
  /** @type {Map<string, FootnoteDefinition>} */
  const definitions = new Map()
  /** @type {Array<string>} */
  const order = []
  let index = -1

  add(tree)

  while (++index < order.length) {
    const definition = definitions.get(order[index])
    if (definition) add(definition)
  }

  return order

  /**
   * Add references in `node`, and find definitions.
   *
   * @param {Nodes} node
   *   Node.
   * @returns {undefined}
   *   Nothing.
   */
  function add(node) {
    visit(node, function (child) {
      if (child.type === 'footnoteDefinition' && child !== node) {
        const id = child.identifier.toUpperCase()
        if (!definitions.has(id)) definitions.set(id, child)
        return SKIP
      }

      if (child.type === 'footnoteReference') {
        const id = child.identifier.toUpperCase()
        if (!order.includes(id)) order.push(id)
      }
    })
  }
}

/**
 * Search a node for a toc.
 *
 * @param {Nodes} root
 *   Tree.
 * @param {RegExp | undefined} expression
 *   Expression to find the opening heading.
 * @param {SearchOptions} settings
 *   Configuration.
 * @returns {SearchResult}
 *   Result.
 */
export function search(root, expression, settings) {
  const max = 'children' in root ? root.children.length : 0
  const skip = settings.skip ? toExpression(settings.skip) : undefined
  const parents = convert(
    settings.parents ||
      function (d) {
        return d === root
      }
  )
  const order = footnoteOrder(root)
  /** @type {Array<SearchEntry>} */
  const map = []
  /** @type {number | undefined} */
  let index
  /** @type {number | undefined} */
  let endIndex
  /** @type {Heading | undefined} */
  let opening

  slugs.reset()

  // Visit all headings in `root`.  We `slug` all headings (to account for
  // duplicates), but only create a TOC from top-level headings (by default).
  visit(root, 'heading', function (node, position, parent) {
    const value = toString(node, {includeImageAlt: false})
    const slug = toSlug(node, order, settings.tagfilter)

    if (!parents(parent)) {
      return
    }

    // Our opening heading.
    if (
      position !== undefined &&
      expression &&
      !index &&
      expression.test(value)
    ) {
      index = position + 1
      opening = node
      return
    }

    // Our closing heading.
    if (
      position !== undefined &&
      opening &&
      !endIndex &&
      node.depth <= opening.depth
    ) {
      endIndex = position
    }

    // A heading after the closing (if we were looking for one).
    if (
      (endIndex || !expression) &&
      (!settings.minDepth || node.depth >= settings.minDepth) &&
      (!settings.maxDepth || node.depth <= settings.maxDepth) &&
      (!skip || !skip.test(value))
    ) {
      map.push({depth: node.depth, children: node.children, id: slug})
    }
  })

  return {
    index: index === undefined ? -1 : index,
    endIndex: index === undefined ? -1 : endIndex || max,
    map
  }
}

/**
 * Get the slug of a heading, like GitHub does.
 *
 * @param {Heading} node
 *   Heading.
 * @param {Array<string>} order
 *   Footnote order.
 * @param {boolean | null | undefined} [tagfilter]
 *   Whether to keep tags that GFM’s tagfilter shows as text (default: `false`).
 * @returns {string}
 *   Slug.
 */
function toSlug(node, order, tagfilter) {
  /** @type {string | undefined} */
  // @ts-expect-error `hProperties` from <https://github.com/syntax-tree/mdast-util-to-hast>
  const id = node.data && node.data.hProperties && node.data.hProperties.id

  return slugs.slug(id || serialize(node))

  /**
   * Get the text of a node.
   *
   * @param {Heading | PhrasingContent} child
   *   Node.
   * @returns {string}
   *   Text.
   */
  function serialize(child) {
    if (child.type === 'footnoteReference') {
      const number = order.indexOf(child.identifier.toUpperCase()) + 1
      return number ? String(number) : ''
    }

    if (child.type === 'html') {
      return tagfilter && gfmTagfilterExpression.test(child.value)
        ? child.value
        : ''
    }

    if ('value' in child) {
      return child.value
    }

    let result = ''

    if ('children' in child) {
      let index = -1

      while (++index < child.children.length) {
        result += serialize(child.children[index])
      }
    }

    return result
  }
}
