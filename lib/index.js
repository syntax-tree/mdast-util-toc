import {search} from './search.js'
import {contents} from './contents.js'
import {toExpression} from './to-expression.js'

// Get a TOC representation of `node`.
export function toc(node, options) {
  const settings = options || {}
  const heading = settings.heading ? toExpression(settings.heading) : null
  const result = search(node, heading, settings)

  result.map =
    result.map.length > 0
      ? contents(
          result.map,
          settings.tight,
          settings.prefix,
          settings.ordered || false
        )
      : null

  // No given heading.
  if (!heading) {
    result.endIndex = null
    result.index = null
  }

  return result
}
