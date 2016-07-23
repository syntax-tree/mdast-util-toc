/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module mdast:toc
 * @fileoverview Generate a Table of Contents (TOC) from a given Markdown file.
 */

/* Expose. */
module.exports = attacher;

/* Dependencies */
var remark = require('remark');
var slug = require('remark-slug');
var toExpression = require('./to-expression');
var search = require('./search');
var contents = require('./contents');

/**
 * Attacher.
 *
 * @param {Mdast} node - MDAST.
 * @param {Object} options - Configuration.
 * @return {Array} - TOC Markdown.
 */
function attacher(node, options) {
    var settings = options || {};
    var heading = settings.heading ? toExpression(settings.heading) : null;
    var depth = settings.maxDepth || 6;
    var tight = settings.tight;

    var processor = remark().use(slug);
    var tree = processor.run(node);
    var result = search(tree, heading, depth);

    if (result.index === null || !result.map.length) {
        return result;
    }

    return {
        map: [contents(result.map, tight)],
        index: result.index
    };
}
