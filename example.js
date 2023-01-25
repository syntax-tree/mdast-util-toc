// remark-usage-ignore-next
import {inspect} from 'node:util'

// Dependencies:
/**
 * @typedef {import('mdast').Root} Root
 */

import {toc} from './index.js'

// Now running:
/** @type {Root} */
const tree = {
  type: 'root',
  children: [
    {type: 'heading', depth: 1, children: [{type: 'text', value: 'Alpha'}]},
    {type: 'heading', depth: 2, children: [{type: 'text', value: 'Bravo'}]},
    {type: 'heading', depth: 3, children: [{type: 'text', value: 'Charlie'}]},
    {type: 'heading', depth: 2, children: [{type: 'text', value: 'Delta'}]}
  ]
}

const table = toc(tree)

// Yields:
console.log('javascript', inspect(table, {depth: 3}))
