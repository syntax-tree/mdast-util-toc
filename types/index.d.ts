// TypeScript Version: 3.0

import {Node} from 'unist'
import {Parent, Heading, Link, Paragraph, List, ListItem} from 'mdast'
import {Test} from 'unist-util-is'

declare namespace mdastUtilToc {

  interface TOCOptions {
    heading?: string
    maxDepth?: Heading['depth']
    skip?: string
    tight?: boolean
    prefix?: string
    parents?: Test<Node> | Array<Test<Node>>
  }

  interface TOCResult {
    index?: number
    endIndex?: number
    map?: List
  }
}

/**
 * Generate a Table of Contents from a tree.
 *
 * @param node searched for headings
 * @param options configuration and settings
 */
declare function mdastUtilToc(
  node: Node,
  options?: mdastUtilToc.TOCOptions
): mdastUtilToc.TOCResult

export = mdastUtilToc
