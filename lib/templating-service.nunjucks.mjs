import nunjucks from 'nunjucks'
import memoize from 'mem'
import { Logger } from './logging'
import { config } from './config'

class NunjucksTemplatingService {
  constructor () {
    this.logger = config.getClassInstance(Logger, { id: 'templating-service.nunjucks' })
    this._retrieveTemplate = memoize(NunjucksTemplatingService.__retrieveTemplate)
  }
  static __retrieveTemplate (str) {
    this.logger.debug('Making template for %s', str)
    return nunjucks.compile(str)
  }
  async render (str, context) {
    this.logger.debug(context, 'Render template for %s', str)
    const template = this._retrieveTemplate(str)
    return template.render(context)
  }
}

export {
  NunjucksTemplatingService
}
