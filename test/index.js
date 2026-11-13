/**
 * @import {BlockContent, List, Root} from 'mdast'
 * @import {Options, Result} from 'mdast-util-toc'
 */

/**
 * @typedef TestConfig
 * @property {boolean | undefined} [useCustomHProperty]
 *   Whether to add `hProperties.id` to headings.
 *
 * @typedef {Options & TestConfig} Config
 */

import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import test from 'node:test'
import {fromMarkdown} from 'mdast-util-from-markdown'
import {gfmFromMarkdown} from 'mdast-util-gfm'
import {toc} from 'mdast-util-toc'
import {gfm} from 'micromark-extension-gfm'
import {visit} from 'unist-util-visit'

test('toc', async function (t) {
  await t.test('should expose the public api', async function () {
    assert.deepEqual(Object.keys(await import('mdast-util-toc')).sort(), [
      'toc'
    ])
  })

  await t.test('should fail without node', async function () {
    assert.throws(function () {
      // @ts-expect-error: check that a runtime error is thrown.
      toc()
    }, TypeError)
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

  await t.test('should support `tagfilter`', async function () {
    assert.deepEqual(
      slugs(toc(parse('# a<script>b</script>'), {tagfilter: true})),
      ['#ascriptbscript']
    )
  })

  await t.test('should support `tagfilter` (case)', async function () {
    assert.deepEqual(slugs(toc(parse('# a<SCRIPT>'), {tagfilter: true})), [
      '#ascript'
    ])
  })

  await t.test('should support `tagfilter` (attributes)', async function () {
    assert.deepEqual(slugs(toc(parse('# a<script b>'), {tagfilter: true})), [
      '#ascript-b'
    ])
  })

  await t.test('should support `tagfilter` (other tags)', async function () {
    assert.deepEqual(slugs(toc(parse('# a<scripts>'), {tagfilter: true})), [
      '#a'
    ])
  })

  await t.test('should number footnotes by first reference', async function () {
    assert.deepEqual(
      slugs(toc(parse('# a[^y]\n\n# b[^x]\n\n[^x]: c\n\n[^y]: d'))),
      ['#a1', '#b2']
    )
  })

  await t.test('should reuse footnote numbers', async function () {
    assert.deepEqual(slugs(toc(parse('# a[^x]\n\n# b[^x]\n\n[^x]: c'))), [
      '#a1',
      '#b1'
    ])
  })

  await t.test(
    'should number footnotes in definitions last',
    async function () {
      assert.deepEqual(
        slugs(
          toc(parse('[^x]: a\n\n    # b[^y]\n\n# c[^x]\n\n[^y]: d'), {
            parents: 'footnoteDefinition'
          })
        ),
        ['#b2']
      )
    }
  )

  await t.test(
    'should not number footnotes in unused definitions',
    async function () {
      assert.deepEqual(
        slugs(
          toc(parse('[^x]: a\n\n    # b[^y]\n\n[^y]: c'), {
            parents: 'footnoteDefinition'
          })
        ),
        ['#b']
      )
    }
  )

  await t.test(
    'should match `heading` without footnote numbers',
    async function () {
      const result = toc(parse('# a[^x]\n\n# b\n\n[^x]: c'), {heading: 'a'})
      assert.equal(result.index, 1)
    }
  )
})

test('fixtures', async function (t) {
  const root = new URL('fixtures/', import.meta.url)
  const files = await fs.readdir(root)
  let index = -1

  while (++index < files.length) {
    const name = files[index]

    if (name.indexOf('.') === 0) continue

    await t.test('should support `' + name + '`', async function () {
      const input = await fs.readFile(new URL(name + '/input.md', root), 'utf8')
      /** @type {Config} */
      let config = {}

      try {
        config = JSON.parse(
          String(await fs.readFile(new URL(name + '/config.json', root)))
        )
      } catch {}

      const {useCustomHProperty, ...options} = config

      const tree = parse(input)

      if (useCustomHProperty) {
        visit(tree, 'heading', function (heading) {
          heading.data = {hProperties: {id: 'b'}}
        })
      }

      // Drop `undefined`s.
      /** @type {Root} */
      // eslint-disable-next-line unicorn/prefer-structured-clone -- `structuredClone` keeps `undefined`s.
      const actual = JSON.parse(JSON.stringify(toc(tree, options)))

      /** @type {Root} */
      const expected = JSON.parse(
        String(await fs.readFile(new URL(name + '/output.json', root)))
      )

      assert.deepEqual(actual, expected)
    })
  }
})

/**
 * Parse markdown.
 *
 * @param {string} value
 *   Markdown.
 * @returns {Root}
 *   Tree.
 */
function parse(value) {
  return fromMarkdown(value, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()]
  })
}

/**
 * Get the URLs in a table of contents.
 *
 * @param {Result} result
 *   Result.
 * @returns {Array<string>}
 *   URLs.
 */
function slugs(result) {
  /** @type {Array<string>} */
  const urls = []

  if (result.map) {
    visit(result.map, 'link', function (node) {
      urls.push(node.url)
    })
  }

  return urls
}
