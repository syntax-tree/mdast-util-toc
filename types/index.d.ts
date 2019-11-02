// TypeScript Version: 3.0

import {Node, Parent} from 'unist'
import {Test} from 'unist-util-is'

declare namespace mdastUtilToc {
  interface Link extends Parent {
    type: 'link'
    title: null
    url: string
    children: Node[]
  }

  interface Paragraph extends Parent {
    type: 'paragraph'
    children: Link[]
  }

  interface ListItem extends Parent {
    type: 'listItem'
    loose: boolean
    spread: boolean
    children: Node[]
  }

  interface List extends Parent {
    type: 'list'
    ordered: boolean
    spread: boolean
    children: ListItem[]
  }

  interface TOCOptions {
    heading?: string
    maxDepth?: number
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

declare function mdastUtilToc(
  node: Node,
  options?: mdastUtilToc.TOCOptions
): mdastUtilToc.TOCResult

export = mdastUtilToc
