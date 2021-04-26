import Slugger from 'github-slugger'
import toString from 'mdast-util-to-string'
import {visit} from 'unist-util-visit'
import {convert} from 'unist-util-is'
import {toExpression} from './to-expression.js'

const slugs = new Slugger()

// Search a node for a location.
export function search(root, expression, settings) {
  const skip = settings.skip && toExpression(settings.skip)
  const parents = convert(settings.parents || root)
  const map = []
  let index
  let endIndex
  let opening

  slugs.reset()

  // Visit all headings in `root`.  We `slug` all headings (to account for
  // duplicates), but only create a TOC from top-level headings.
  visit(root, 'heading', onheading)

  return {
    index: index || -1,
    // <sindresorhus/eslint-plugin-unicorn#980>
    // eslint-disable-next-line unicorn/explicit-length-check
    endIndex: index ? endIndex || root.children.length : -1,
    map
  }

  function onheading(node, position, parent) {
    const value = toString(node)
    // Remove this when `remark-attr` is up to date w/ micromark.
    /* c8 ignore next */
    const id = node.data && node.data.hProperties && node.data.hProperties.id
    const slug = slugs.slug(id || value)

    if (!parents(parent)) {
      return
    }

    // Our opening heading.
    if (expression && !index && expression.test(value)) {
      index = position + 1
      opening = node
      return
    }

    // Our closing heading.
    if (opening && !endIndex && node.depth <= opening.depth) {
      endIndex = position
    }

    // A non-empty heading after the closing (if we were looking for one).
    if (
      value &&
      (endIndex || !expression) &&
      (!settings.maxDepth || node.depth <= settings.maxDepth) &&
      (!skip || !skip.test(value))
    ) {
      map.push({depth: node.depth, children: node.children, id: slug})
    }
  }
}
