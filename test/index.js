var fs = require('fs')
var path = require('path')
var test = require('tape')
var unified = require('unified')
var remarkParse = require('remark-parse')
var remarkGfm = require('remark-gfm')
var remarkFootnotes = require('remark-footnotes')
var u = require('unist-builder')
var toc = require('..')

var join = path.join

test('mdast-util-toc', function (t) {
  t.is(typeof toc, 'function', 'should be a function')

  t.throws(
    function () {
      toc()
    },
    "Cannot read property 'children' of undefined",
    'should fail without node'
  )

  t.end()
})

test('Fixtures', function (t) {
  var root = join(__dirname, 'fixtures')
  var files = fs.readdirSync(root)
  var index = -1
  var name
  var input
  var expected
  var actual
  var config
  var processor

  while (++index < files.length) {
    name = files[index]

    if (name.indexOf('.') === 0) continue

    input = fs.readFileSync(join(root, name, 'input.md'))
    expected = JSON.parse(fs.readFileSync(join(root, name, 'output.json')))
    processor = unified().use(remarkParse).use(remarkGfm)

    try {
      config = JSON.parse(fs.readFileSync(join(root, name, 'config.json')))
    } catch (_) {
      config = {}
    }

    if (config.useRemarkFootnotes) {
      processor.use(remarkFootnotes, {inlineNotes: true})
    }

    if (config.useRemarkAttr) {
      // To do: add remark attr back when it’s updated for the new parser.
      // `processor.use(remarkAttr)`
      continue
    }

    actual = toc(processor.parse(input), config)

    t.deepEqual(actual, expected, name)
  }

  t.end()
})

test('processing nodes', function (t) {
  var rootNode = u('root', [
    u('heading', {depth: 1}, [u('text', 'Alpha')]),
    u('heading', {depth: 2}, [u('text', 'Bravo')])
  ])

  var parentNode = u('parent', rootNode.children)

  var blockquoteNode = u('root', [
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
