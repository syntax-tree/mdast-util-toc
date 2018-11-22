var test = require('tape')

var fs = require('fs')
var path = require('path')
var remark = require('remark')
var remarkAttr = require('remark-attr')
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
