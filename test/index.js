import fs from 'fs'
import path from 'path'
import test from 'tape'
import unified from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkFootnotes from 'remark-footnotes'
import {u} from 'unist-builder'
import {toc} from '../index.js'

const join = path.join

test('mdast-util-toc', (t) => {
  t.is(typeof toc, 'function', 'should be a function')

  t.throws(
    () => {
      toc()
    },
    "Cannot read property 'children' of undefined",
    'should fail without node'
  )

  t.end()
})

test('Fixtures', (t) => {
  const root = join('test', 'fixtures')
  const files = fs.readdirSync(root)
  let index = -1

  while (++index < files.length) {
    const name = files[index]

    if (name.indexOf('.') === 0) continue

    const input = fs.readFileSync(join(root, name, 'input.md'))
    let config = {}

    try {
      config = JSON.parse(fs.readFileSync(join(root, name, 'config.json')))
    } catch {}

    const processor = unified().use(remarkParse).use(remarkGfm)

    if (config.useRemarkFootnotes) {
      processor.use(remarkFootnotes, {inlineNotes: true})
    }

    if (config.useRemarkAttr) {
      // To do: add remark attr back when it’s updated for the new parser.
      // `processor.use(remarkAttr)`
      continue
    }

    const actual = toc(processor.parse(input), config)
    const expected = JSON.parse(
      fs.readFileSync(join(root, name, 'output.json'))
    )

    t.deepEqual(actual, expected, name)
  }

  t.end()
})

test('processing nodes', (t) => {
  const rootNode = u('root', [
    u('heading', {depth: 1}, [u('text', 'Alpha')]),
    u('heading', {depth: 2}, [u('text', 'Bravo')])
  ])

  const parentNode = u('parent', rootNode.children)

  const blockquoteNode = u('root', [
    u('heading', {depth: 1}, [u('text', 'Charlie')]),
    u('heading', {depth: 2}, [u('text', 'Delta')]),
    u('blockquote', rootNode.children)
  ])

  const expectedRootMap = u('list', {ordered: false, spread: true}, [
    u('listItem', {spread: true}, [
      u('paragraph', [
        u('link', {title: null, url: '#alpha'}, [u('text', 'Alpha')])
      ]),
      u('list', {ordered: false, spread: false}, [
        u('listItem', {spread: false}, [
          u('paragraph', [
            u('link', {title: null, url: '#bravo'}, [u('text', 'Bravo')])
          ])
        ])
      ])
    ])
  ])

  t.deepEqual(
    toc(rootNode),
    {
      index: null,
      endIndex: null,
      map: expectedRootMap
    },
    'can process root nodes'
  )

  t.deepEqual(
    toc(parentNode),
    {
      index: null,
      endIndex: null,
      map: expectedRootMap
    },
    'can process non-root nodes'
  )

  t.deepEqual(
    toc(blockquoteNode, {parents: 'blockquote'}),
    {
      index: null,
      endIndex: null,
      map: expectedRootMap
    },
    'can process custom parent nodes'
  )

  t.end()
})
