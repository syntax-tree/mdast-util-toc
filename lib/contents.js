import extend from 'extend'

// Transform a list of heading objects to a markdown list.
export function contents(map, tight, prefix, ordered) {
  const table = {type: 'list', ordered, spread: false, children: []}
  let minDepth = Number.POSITIVE_INFINITY
  let index = -1

  // Find minimum depth.
  while (++index < map.length) {
    if (map[index].depth < minDepth) {
      minDepth = map[index].depth
    }
  }

  // Normalize depth.
  index = -1

  while (++index < map.length) {
    map[index].depth -= minDepth - 1
  }

  // Add TOC to list.
  index = -1

  while (++index < map.length) {
    insert(map[index], table, tight, prefix, ordered)
  }

  return table
}

// Insert an entry into `parent`.
// eslint-disable-next-line max-params
function insert(entry, parent, tight, prefix, ordered) {
  const siblings = parent.children
  const tail = siblings[siblings.length - 1]
  let index = -1

  if (entry.depth === 1) {
    siblings.push({
      type: 'listItem',
      spread: false,
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'link',
              title: null,
              url: '#' + (prefix || '') + entry.id,
              children: all(entry.children)
            }
          ]
        }
      ]
    })
  } else if (tail && tail.type === 'listItem') {
    insert(entry, siblings[siblings.length - 1], tight, prefix, ordered)
  } else if (tail && tail.type === 'list') {
    entry.depth--
    insert(entry, tail, tight, prefix, ordered)
  } else if (parent.type === 'list') {
    const item = {type: 'listItem', spread: false, children: []}
    siblings.push(item)
    insert(entry, item, tight, prefix, ordered)
  } else {
    const item = {
      type: 'list',
      ordered,
      spread: false,
      children: []
    }
    siblings.push(item)
    entry.depth--
    insert(entry, item, tight, prefix, ordered)
  }

  if (parent.type === 'list' && !tight) {
    parent.spread = false

    while (++index < siblings.length) {
      if (siblings[index].children.length > 1) {
        parent.spread = true
        break
      }
    }
  } else {
    parent.spread = !tight
  }
}

function all(children) {
  let result = []
  let index = -1

  if (children) {
    while (++index < children.length) {
      result = result.concat(one(children[index]))
    }
  }

  return result
}

function one(node) {
  if (
    node.type === 'link' ||
    node.type === 'linkReference' ||
    node.type === 'footnote' ||
    node.type === 'footnoteReference'
  ) {
    return all(node.children)
  }

  let copy = extend({}, node)

  delete copy.children
  delete copy.position

  copy = extend(true, {}, copy)

  if (node.children) {
    copy.children = all(node.children)
  }

  return copy
}
