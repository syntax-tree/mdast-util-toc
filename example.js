// remark-usage-ignore-next
import {inspect} from 'util'

// Dependencies:
import {u} from 'unist-builder'
import {toc} from './index.js'

// Now running:
const tree = u('root', [
  u('heading', {depth: 1}, [u('text', 'Alpha')]),
  u('heading', {depth: 2}, [u('text', 'Bravo')]),
  u('heading', {depth: 3}, [u('text', 'Charlie')]),
  u('heading', {depth: 2}, [u('text', 'Delta')])
])

const table = toc(tree)

// Yields:
console.log('javascript', inspect(table, {depth: 3}))
