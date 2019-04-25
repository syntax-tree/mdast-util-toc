var test = require('tape')

var fs = require('fs')
var path = require('path')
var remark = require('remark')
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

      try {
        config = JSON.parse(fs.readFileSync(join(root, name, 'config.json')))
      } catch (error) {}

      actual = toc(
        remark()
          .use(remarkAttr)
          .parse(input),
        config
      )

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

test('processing html node', function(t) {
  var htmlNode = u('root', [
    u('heading', {depth: 1}, [
      u('text', {value: 'Hello '}),
      u('html', {value: '<code>World</code>'})
    ])
  ])

  var htmlNestedNode = u('root', [
    u('heading', {depth: 1}, [
      u('text', {value: 'Hello '}),
      u('paragraph', [u('html', {value: '<div>World</div>'})])
    ])
  ])

  const expectedHtmlMap = {
    type: 'list',
    ordered: false,
    spread: false,
    children: [
      {
        type: 'listItem',
        loose: false,
        spread: false,
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'link',
                title: null,
                url: '#hello-world',
                children: [{type: 'text', value: 'Hello World'}]
              }
            ]
          }
        ]
      }
    ]
  }

  t.deepEqual(
    toc(htmlNode),
    {
      index: null,
      endIndex: null,
      map: expectedHtmlMap
    },
    'can process html nodes'
  )

  t.deepEqual(
    toc(htmlNestedNode),
    {
      index: null,
      endIndex: null,
      map: expectedHtmlMap
    },
    'can process nested html nodes'
  )

  t.end()
})
