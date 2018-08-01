var test = require('tape');

var fs = require('fs');
var path = require('path');
var remark = require('remark');
var remarkAttr = require('remark-attr');
var toc = require('..');

var read = fs.readFileSync;
var exists = fs.existsSync;
var join = path.join;

var ROOT = join(__dirname, 'fixtures');

var fixtures = fs.readdirSync(ROOT);

test('mdast-util-toc()', function(t) {
    t.is(typeof toc, 'function', 'should be a function');

    t.throws(
        function() {
            toc();
        },
        "Cannot read property 'children' of undefined",
        'should fail without node'
    );

    t.end();
});

test('Fixtures', function(t) {
    fixtures
        .filter(function(filepath) {
            return filepath.indexOf('.') !== 0;
        })
        .forEach(function(fixture) {
            var filepath = join(ROOT, fixture);
            var output = JSON.parse(
                read(join(filepath, 'output.json'), 'utf8')
            );
            var input = remark()
                .use(remarkAttr)
                .parse(read(join(filepath, 'input.md'), 'utf-8'));
            var config = join(filepath, 'config.json');
            var result;

            config = exists(config) ? JSON.parse(read(config, 'utf-8')) : {};
            result = toc(input, config);

            t.deepEqual(result, output, 'should work on `' + fixture + '`');
        });

    t.end();
});
