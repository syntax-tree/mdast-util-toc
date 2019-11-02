import {Parent} from 'unist'

import unified = require('unified')
import u = require('unist-builder')
import is = require('unist-util-is')
import toc = require('mdast-util-toc')

interface Link extends Parent {
  type: 'link'
}

interface Paragraph extends Parent {
  type: 'paragraph'
}

interface List extends Parent {
  type: 'list'
}

interface ListItem extends Parent {
  type: 'listItem'
}

const tree = u('root', [
  u('heading', {depth: 1}, [u('text', 'Alpha')]),
  u('heading', {depth: 2}, [u('text', 'Bravo')]),
  u('heading', {depth: 3}, [u('text', 'Charlie')]),
  u('heading', {depth: 2}, [u('text', 'Delta')])
])

const {map} = toc(tree)

if (is<List>(map, 'list')) {
  const [firstListItem] = map.children

  if (is<ListItem>(firstListItem, 'listItem')) {
    const [firstParagraph] = firstListItem.children

    if (is<Paragraph>(firstParagraph, 'paragraph')) {
      const [firstLink] = firstParagraph.children

      is<Link>(firstLink, 'link')
    }
  }
}

toc(tree, {
  heading: 'Table Of Contents'
})

toc(tree, {
  maxDepth: 2
})

toc(tree, {
  skip: 'skip heading'
})

toc(tree, {
  tight: true
})

toc(tree, {
  prefix: '/prefix'
})

toc(tree, {
  parents: ['root', 'blockquote']
})

/*=== usable in unified transform ===*/
unified().use(() => tree => {
  const table = toc(tree)

  if (is<List>(table.map, 'list')) {
    // do something
  }

  return tree
})
