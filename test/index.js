/**
 * @typedef {import('mdast').BlockContent} BlockContent
 * @typedef {import('mdast').List} List
 * @typedef {import('mdast').Root} Root
 * @typedef {import('../index.js').Options} Options
 */

/**
 * @typedef TestConfig
 * @property {boolean | undefined} [useCustomHProperty]
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

test('toc', async function (t) {
  await t.test('should expose the public api', async function () {
    assert.deepEqual(Object.keys(await import('../index.js')).sort(), ['toc'])
  })

  await t.test('should fail without node', async function () {
    assert.throws(function () {
      // @ts-expect-error: check that a runtime error is thrown.
      toc()
    })
  })

  await t.test('should work on a non-parent', async function () {
    const result = toc({type: 'inlineCode', value: 'a'})
    assert.deepEqual(result, {
      index: undefined,
      endIndex: undefined,
      map: undefined
    })
  })

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

  await t.test('should process root nodes', async function () {
    assert.deepEqual(toc({type: 'root', children: fragment}), {
      index: undefined,
      endIndex: undefined,
      map: expectedRootMap
    })
  })

  await t.test('should process non-root nodes', async function () {
    assert.deepEqual(toc({type: 'blockquote', children: fragment}), {
      index: undefined,
      endIndex: undefined,
      map: expectedRootMap
    })
  })

  await t.test('should process custom parent nodes', async function () {
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
        index: undefined,
        endIndex: undefined,
        map: expectedRootMap
      }
    )
  })
})

test('fixtures', async function (t) {
  const root = new URL('fixtures/', import.meta.url)
  const files = await fs.readdir(root)
  let index = -1

  while (++index < files.length) {
    const name = files[index]

    if (name.indexOf('.') === 0) continue

    await t.test('should support `' + name + '`', async function () {
      const input = await fs.readFile(new URL(name + '/input.md', root))
      /** @type {Config} */
      let config = {}

      try {
        config = JSON.parse(
          String(await fs.readFile(new URL(name + '/config.json', root)))
        )
      } catch {}

      const {useCustomHProperty, ...options} = config

      // To do: remove cast when `from-markdown` is released.
      const tree = /** @type {Root} */ (
        fromMarkdown(input, {
          mdastExtensions: [gfmFromMarkdown()],
          extensions: [gfm()]
        })
      )

      if (useCustomHProperty) {
        visit(tree, 'heading', function (heading) {
          heading.data = {hProperties: {id: 'b'}}
        })
      }

      // Drop `undefined`s.
      /** @type {Root} */
      const actual = JSON.parse(JSON.stringify(toc(tree, options)))

      /** @type {Root} */
      const expected = JSON.parse(
        String(await fs.readFile(new URL(name + '/output.json', root)))
      )

      assert.deepEqual(actual, expected)
    })
  }
})
