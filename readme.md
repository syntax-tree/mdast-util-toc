# mdast-util-toc

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

[mdast][] utility to generate a table of contents.

## Contents

*   [What is this?](#what-is-this)
*   [When should I use this?](#when-should-i-use-this)
*   [Install](#install)
*   [Use](#use)
*   [API](#api)
    *   [`toc(node[, options])`](#tocnode-options)
*   [Types](#types)
*   [Compatibility](#compatibility)
*   [Security](#security)
*   [Related](#related)
*   [Contribute](#contribute)
*   [License](#license)

## What is this?

This package is a utility that generates a table of contents from a document.

## When should I use this?

This utility is useful to generate a section so users can more easily navigate
through a document.

This package is wrapped in [`remark-toc`][remark-toc] for ease of use with
[remark][], where it also injects the table of contents into the document.

## Install

This package is [ESM only][esm].
In Node.js (version 12.20+, 14.14+, or 16.0+), install with [npm][]:

```sh
npm install mdast-util-toc
```

In Deno with [`esm.sh`][esmsh]:

```js
import {toc} from 'https://esm.sh/mdast-util-toc@6'
```

In browsers with [`esm.sh`][esmsh]:

```html
<script type="module">
  import {toc} from 'https://esm.sh/mdast-util-toc@6?bundle'
</script>
```

## Use

Dependencies:

```javascript
/**
 * @typedef {import('mdast').Root} Root
 */

import {u} from 'unist-builder'
import {toc} from 'mdast-util-toc'
```

Now running:

```javascript
const tree = /** @type {Root} */ (
  u('root', [
    u('heading', {depth: 1}, [u('text', 'Alpha')]),
    u('heading', {depth: 2}, [u('text', 'Bravo')]),
    u('heading', {depth: 3}, [u('text', 'Charlie')]),
    u('heading', {depth: 2}, [u('text', 'Delta')])
  ])
)

const table = toc(tree)
```

Yields:

```javascript
{
  index: null,
  endIndex: null,
  map: {
    type: 'list',
    ordered: false,
    spread: true,
    children: [ { type: 'listItem', spread: true, children: [Array] } ]
  }
}
```

## API

This package exports the identifier `toc`.
There is no default export.

### `toc(node[, options])`

Generate a table of contents from [`node`][node].

Looks for the first heading matching `options.heading` (case insensitive) and
returns a table of contents (a list) for all following headings.
If no `heading` is specified, creates a table of contents for all headings in
`tree`.
`tree` is not changed.

Links in the list to headings are based on GitHub’s style.
Only top-level headings (those not in blockquotes or lists), are used.
This default behavior can be changed by passing [`options.parents`][parents].

##### `options`

Configuration (optional).

###### `options.heading`

[Heading][] to look for (`string`), wrapped in `new RegExp('^(' + value + ')$',
'i')`.

###### `options.maxDepth`

Maximum heading depth to include in the table of contents (`number`, default:
`6`),
This is inclusive: when set to `3`, level three headings are included (those
with three hashes, `###`).

###### `options.skip`

Headings to skip (`string`, optional), wrapped in
`new RegExp('^(' + value + ')$', 'i')`.
Any heading matching this expression will not be present in the table of
contents.

###### `options.tight`

Whether to compile list items tightly (`boolean?`, default: `false`).

###### `options.ordered`

Whether to compile list items as an ordered list (`boolean?`, default: `false`).

###### `options.prefix`

Add a prefix to links to headings in the table of contents (`string?`, default:
`null`).
Useful for example when later going from [mdast][] to [hast][] and sanitizing
with [`hast-util-sanitize`][sanitize].

###### `options.parents`

Allow headings to be children of certain node types (default: the to `toc` given
`node`, to only allow top-level headings).
Internally, uses [`unist-util-is`][is], so `parents` can be any
`is`-compatible test.

For example, the following code would allow headings under either `root` or
`blockquote` to be used:

```js
toc(tree, {parents: ['root', 'blockquote']})
```

##### Returns

An object representing the table of contents:

*   `index` (`number?`)
    — index of the node right after the  table of contents [heading][].
    `-1` if no heading was found, `null` if no `heading` was given
*   `endIndex` (`number?`)
    — index of the first node after `heading` that is not part of its section.
    `-1` if no heading was found, `null` if no `heading` was given, same as
    `index` if there are no nodes between `heading` and the first heading in the
    table of contents
*   `map` (`Node?`)
    — list representing the generated table of contents.
    `null` if no table of contents could be created, either because no heading
    was found or because no following headings were found

## Types

This package is fully typed with [TypeScript][].
It exports the types `Options` and `Result`.

## Compatibility

Projects maintained by the unified collective are compatible with all maintained
versions of Node.js.
As of now, that is Node.js 12.20+, 14.14+, and 16.0+.
Our projects sometimes work with older versions, but this is not guaranteed.

## Security

Use of `mdast-util-toc` does not involve [hast][], user content, or change the
tree, so there are no openings for [cross-site scripting (XSS)][xss] attacks.

Injecting `map` into the syntax tree may open you up to XSS attacks as existing
nodes are copied into the table of contents.
The following example shows how an existing script is copied into the table of
contents.

For the following Markdown:

```markdown
# Alpha

## Bravo<script>alert(1)</script>

## Charlie
```

Yields in `map`:

```markdown
-   [Alpha](#alpha)

    -   [Bravo<script>alert(1)</script>](#bravoscriptalert1script)
    -   [Charlie](#charlie)
```

Always use [`hast-util-santize`][sanitize] when transforming to [hast][].

## Related

*   [`github-slugger`](https://github.com/Flet/github-slugger)
    — generate a slug just like GitHub does
*   [`unist-util-visit`](https://github.com/syntax-tree/unist-util-visit)
    — visit nodes
*   [`unist-util-visit-parents`](https://github.com/syntax-tree/unist-util-visit-parents)
    — like `visit`, but with a stack of parents

## Contribute

See [`contributing.md`][contributing] in [`syntax-tree/.github`][health] for
ways to get started.
See [`support.md`][support] for ways to get help.

This project has a [code of conduct][coc].
By interacting with this repository, organization, or community you agree to
abide by its terms.

## License

[MIT][license] © [Jonathan Haines][author]

<!-- Definitions -->

[build-badge]: https://github.com/syntax-tree/mdast-util-toc/workflows/main/badge.svg

[build]: https://github.com/syntax-tree/mdast-util-toc/actions

[coverage-badge]: https://img.shields.io/codecov/c/github/syntax-tree/mdast-util-toc.svg

[coverage]: https://codecov.io/github/syntax-tree/mdast-util-toc

[downloads-badge]: https://img.shields.io/npm/dm/mdast-util-toc.svg

[downloads]: https://www.npmjs.com/package/mdast-util-toc

[size-badge]: https://img.shields.io/bundlephobia/minzip/mdast-util-toc.svg

[size]: https://bundlephobia.com/result?p=mdast-util-toc

[sponsors-badge]: https://opencollective.com/unified/sponsors/badge.svg

[backers-badge]: https://opencollective.com/unified/backers/badge.svg

[collective]: https://opencollective.com/unified

[chat-badge]: https://img.shields.io/badge/chat-discussions-success.svg

[chat]: https://github.com/syntax-tree/unist/discussions

[npm]: https://docs.npmjs.com/cli/install

[esm]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c

[esmsh]: https://esm.sh

[typescript]: https://www.typescriptlang.org

[license]: license

[author]: https://barrythepenguin.github.io

[health]: https://github.com/syntax-tree/.github

[contributing]: https://github.com/syntax-tree/.github/blob/main/contributing.md

[support]: https://github.com/syntax-tree/.github/blob/main/support.md

[coc]: https://github.com/syntax-tree/.github/blob/main/code-of-conduct.md

[mdast]: https://github.com/syntax-tree/mdast

[hast]: https://github.com/syntax-tree/hast

[sanitize]: https://github.com/syntax-tree/hast-util-sanitize

[is]: https://github.com/syntax-tree/unist-util-is

[heading]: https://github.com/syntax-tree/mdast#heading

[node]: https://github.com/syntax-tree/mdast#node

[parents]: #optionsparents

[xss]: https://en.wikipedia.org/wiki/Cross-site_scripting

[remark]: https://github.com/remarkjs/remark

[remark-toc]: https://github.com/remarkjs/remark-toc
