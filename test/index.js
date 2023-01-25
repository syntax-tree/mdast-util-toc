/**
 * @typedef {import('mdast').Root} Root
 * @typedef {import('mdast').Blockquote} Blockquote
 * @typedef {import('mdast').BlockContent} BlockContent
 * @typedef {import('mdast').List} List
 * @typedef {import('../index.js').Options} Options
 *
 * @typedef TestConfig
 * @property {boolean} [useCustomHProperty]
 *
 * @typedef {Options & TestConfig} Config
 */

import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import test from 'node:test'
import {fromMarkdown} from 'mdast-util-from-markdown'
import {gfmFromMarkdown} from 'mdast-util-gfm'
import {gfm} from 'micromark-extension-gfm'
import {visit} from 'unist-util-visit'
import {toc} from '../index.js'
import * as mod from '../index.js'

test('toc', () => {
  assert.deepEqual(
    Object.keys(mod).sort(),
    ['toc'],
    'should expose the public api'
  )

  assert.throws(
    () => {
      // @ts-expect-error runtime.
      toc()
    },
    /Cannot read propert/,
    'should fail without node'
  )
})

test('Fixtures', async () => {
  const root = new URL('fixtures/', import.meta.url)
  const files = await fs.readdir(root)
  let index = -1

  while (++index < files.length) {
    const name = files[index]

    if (name.indexOf('.') === 0) continue

    const input = await fs.readFile(new URL(name + '/input.md', root))
    /** @type {Config} */
    let config = {}

    try {
      config = JSON.parse(
        String(await fs.readFile(new URL(name + '/config.json', root)))
      )
    } catch {}

    const {useCustomHProperty, ...options} = config

    const tree = fromMarkdown(input, {
      mdastExtensions: [gfmFromMarkdown()],
      extensions: [gfm()]
    })

    if (useCustomHProperty) {
      visit(tree, 'heading', (heading) => {
        heading.data = {hProperties: {id: 'b'}}
      })
    }

    const actual = toc(tree, options)

    /** @type {Root} */
    const expected = JSON.parse(
      String(await fs.readFile(new URL(name + '/output.json', root)))
    )

    assert.deepEqual(actual, expected, name)
  }
})

test('processing nodes', () => {
  /** @type {Array<BlockContent>} */
  const fragment = [
    {type: 'heading', depth: 1, children: [{type: 'text', value: 'Alpha'}]},
    {type: 'heading', depth: 2, children: [{type: 'text', value: 'Bravo'}]}
  ]

  /** @type {List} */
  const expectedRootMap = {
    type: 'list',
    ordered: false,
    spread: true,
    children: [
      {
        type: 'listItem',
        spread: true,
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'link',
                title: null,
                url: '#alpha',
                children: [{type: 'text', value: 'Alpha'}]
              }
            ]
          },
          {
            type: 'list',
            ordered: false,
            spread: false,
            children: [
              {
                type: 'listItem',
                spread: false,
                children: [
                  {
                    type: 'paragraph',
                    children: [
                      {
                        type: 'link',
                        title: null,
                        url: '#bravo',
                        children: [{type: 'text', value: 'Bravo'}]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }

  assert.deepEqual(
    toc({type: 'root', children: fragment}),
    {
      index: null,
      endIndex: null,
      map: expectedRootMap
    },
    'can process root nodes'
  )

  assert.deepEqual(
    toc({type: 'blockquote', children: fragment}),
    {
      index: null,
      endIndex: null,
      map: expectedRootMap
    },
    'can process non-root nodes'
  )

  assert.deepEqual(
    toc(
      {
        type: 'root',
        children: [
          {
            type: 'heading',
            depth: 1,
            children: [{type: 'text', value: 'Charlie'}]
          },
          {
            type: 'heading',
            depth: 2,
            children: [{type: 'text', value: 'Delta'}]
          },
          {type: 'blockquote', children: fragment}
        ]
      },
      {parents: 'blockquote'}
    ),
    {
      index: null,
      endIndex: null,
      map: expectedRootMap
    },
    'can process custom parent nodes'
  )
})
