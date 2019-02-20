// Dependencies:
var util = require('util')
var u = require('unist-builder')
var toc = require('.')

// Given a mdast tree:
var tree = u('root', [
  u('heading', {depth: 1}, [u('text', 'Alpha')]),
  u('heading', {depth: 2}, [u('text', 'Bravo')]),
  u('heading', {depth: 3}, [u('text', 'Charlie')]),
  u('heading', {depth: 2}, [u('text', 'Delta')])
])

// Yields:
console.log('javascript', util.inspect(toc(tree), {depth: 3}))
