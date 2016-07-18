/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module mdast:toc
 * @fileoverview Generate a Table of Contents (TOC) from a given Markdown file.
 */

/* Expose. */
module.exports = search;

/* Dependencies */
var toString = require('mdast-util-to-string');
var isClosingHeading = require('./is-closing-heading');
var isOpeningHeading = require('./is-opening-heading');

/* Constants. */
var HEADING = 'heading';

/**
 * Search a node for a location.
 *
 * @param {Node} root - Parent to search in.
 * @param {RegExp} expression - Heading-content to search
 *   for.
 * @param {number} maxDepth - Maximum-depth to include.
 * @return {Object} - Results.
 */
function search(root, expression, maxDepth) {
    var index = -1;
    var length = root.children.length;
    var depth = null;
    var lookingForToc = true && expression !== null;
    var map = [];
    var child;
    var headingIndex;
    var closingIndex;
    var value;

    if (!lookingForToc) {
        headingIndex = -1;
    }

    while (++index < length) {
        child = root.children[index];

        if (child.type !== HEADING) {
            continue;
        }

        value = toString(child);

        if (lookingForToc) {
            if (isClosingHeading(child, depth)) {
                closingIndex = index;
                lookingForToc = false;
            }

            if (isOpeningHeading(child, depth, expression)) {
                headingIndex = index + 1;
                depth = child.depth;
            }
        }

        if (!lookingForToc && value && child.depth <= maxDepth) {
            map.push({
                depth: child.depth,
                value: value,
                id: child.data.htmlAttributes.id
            });
        }
    }

    if (headingIndex) {
        if (!closingIndex) {
            closingIndex = length + 1;
        }

        /*
         * Remove current TOC.
         */

        root.children.splice(headingIndex, closingIndex - headingIndex);
    }

    return {
        index: headingIndex || null,
        map: map
    };
}
