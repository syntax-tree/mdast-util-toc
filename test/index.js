var fs = require('fs')
var path = require('path')
var test = require('tape')
var unified = require('unified')
var remarkParse = require('remark-parse')
var remarkAttr = require('remark-attr')
var u = require('unist-builder')
var toc = require('..')

var join = path.join

test('mdast-util-toc()', function(t) {
  t.is(typeof toc, 'function', 'should be a function')

  t.throws(
    function() {
      toc()
    },
    "Cannot read property 'children' of undefined",
    'should fail without node'
  )

  t.end()
})

test('Fixtures', function(t) {
  var root = join(__dirname, 'fixtures')

  fs.readdirSync(root)
    .filter(function(filepath) {
      return filepath.indexOf('.') !== 0
    })
    .forEach(function(name) {
      var input = fs.readFileSync(join(root, name, 'input.md'))
      var output = fs.readFileSync(join(root, name, 'output.json'))
      var config = {}
      var expected = JSON.parse(output)
      var actual
      var processor = unified()

      try {
        config = JSON.parse(fs.readFileSync(join(root, name, 'config.json')))
      } catch (_) {}

      processor.use(remarkParse, config.remarkParseOptions)

      if (config.useRemarkAttr) {
        processor.use(remarkAttr)
      }

      actual = toc(processor.parse(input), config)

      t.deepEqual(actual, expected, name)
    })

  t.end()
})

test('processing nodes', function(t) {
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
    u('listItem', {loose: true, spread: true}, [
      u('paragraph', [
        u('link', {title: null, url: '#alpha'}, [u('text', 'Alpha')])
      ]),
      u('list', {ordered: false, spread: false}, [
        u('listItem', {loose: false, spread: false}, [
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
