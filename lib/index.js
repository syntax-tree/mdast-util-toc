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

    var result = search(node, heading, depth);

    if (result.index === null || !result.map.length) {
        return [];
    }

    return [contents(result.map, tight)];
}
