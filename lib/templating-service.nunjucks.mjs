import nunjucks from 'nunjucks'
import memoize from 'mem'

import { logger } from './logging'

// TODO const compile = util.promisify(nunjucks.compile)

const __retrieveTemplate = (str) => {
  logger.debug('Making template for %s', str)
  return nunjucks.compile(str)
}

const _retrieveTemplate = memoize(__retrieveTemplate)

const NunjucksTemplatingService = {
  render: async (str, context) => {
    logger.debug(context, 'Render template for %s', str)
    const template = _retrieveTemplate(str)
    return template.render(context)
  }
}

export {
  NunjucksTemplatingService
}
