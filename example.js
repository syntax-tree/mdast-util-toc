// Dependencies:
var u = require('unist-builder')
var toc = require('.')

// Given a mdast tree:
var tree = u('root', [
  u('heading', {depth: 1}, [u('text', 'Alpha')]),
  u('heading', {depth: 2}, [u('text', 'Bravo')]),
  u('heading', {depth: 3}, [u('text', 'Charlie')]),
  u('heading', {depth: 2}, [u('text', 'Delta')])
])

var table = toc(tree)

// Yields:
console.log('javascript', require('util').inspect(table, {depth: 3}))
