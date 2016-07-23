// Dependencies:
var remark = require('remark');
var toc = require('./index.js');

// Transform:
var input = remark().parse([
    '# Alpha',
    '',
    '## Bravo',
    '',
    '### Charlie',
    '',
    '## Delta',
    ''
].join('\n'));

// Yields:
console.log('markdown', toc(input));
