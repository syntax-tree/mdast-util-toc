// Dependencies:
var remark = require('remark');
var toc = require('./index.js');

// Parse:
var node = remark().parse([
    '# Alpha',
    '',
    '## Bravo',
    '',
    '### Charlie',
    '',
    '## Delta',
    ''
].join('\n'));

// TOC:
var result = toc(node);

// Yields:
console.log('js', require('util').inspect(result, {depth: 3}));
