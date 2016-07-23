var test = require('tape');

var fs = require('fs');
var path = require('path');
var remark = require('remark');
var toc = require('..');

var read = fs.readFileSync;
var exists = fs.existsSync;
var join = path.join;

var ROOT = join(__dirname, 'fixtures');

var fixtures = fs.readdirSync(ROOT);

var compiler = new remark.Compiler();

test('mdast-util-toc()', function (t) {
    t.is(typeof toc, 'function', 'should be a function');

    t.throws(function () {
        toc();
    }, 'Cannot read property \'children\' of undefined', 'should fail without node');

    t.end();
});

test('Fixtures', function (t) {
    fixtures.filter(function (filepath) {
        return filepath.indexOf('.') !== 0;
    }).forEach(function (fixture) {
        var filepath = join(ROOT, fixture);
        var output = read(join(filepath, 'output.md'), 'utf-8');
        var input = remark().parse(read(join(filepath, 'input.md'), 'utf-8'));
        var config = join(filepath, 'config.json');
        var result;

        config = exists(config) ? JSON.parse(read(config, 'utf-8')) : {};
        result = compiler.compile({
            type: 'root',
            children: toc(input, config).map
        });

        t.is(result, output, 'should work on `' + fixture + '`');
    });

    t.end();
});
