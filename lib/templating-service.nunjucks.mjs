import nunjucks from 'nunjucks'
import memoize from 'mem'
import { Logger } from './logging'
import { config } from './config'

class NunjucksTemplatingService {
  constructor (helpers = config.getInstance('NunjucksTemplatingHelpers')) {
    this.logger = config.getClassInstance(Logger, { id: 'templating-service.nunjucks' })
    this.nunjucksEnvironment = this._enrichEnvironmentWithHelperFilters(new nunjucks.Environment(), helpers['filters'])
    this._retrieveTemplate = memoize(NunjucksTemplatingService.__retrieveTemplate)
    this.hasHelperFunctions = 'functions' in helpers && Object.keys(helpers['functions']).length > 0
    this.helperFunctions = helpers['functions']
  }
  static __retrieveTemplate (str) {
    this.logger.debug('Making template for %s', str)
    return nunjucks.compile(str, this.nunjucksEnvironment)
  }
  async render (str, context) {
    this.logger.debug(context, 'Render template for %s', str)
    const template = this._retrieveTemplate(str)
    const contextWithHelperFunctions = this._enrichContextWithHelperFunctions(context)
    return template.render(contextWithHelperFunctions)
  }
  _enrichContextWithHelperFunctions (context) {
    if (!this.hasHelperFunctions) {
      return context
    }
    return Object.assign(context, this.helperFunctions)
  }
  _enrichEnvironmentWithHelperFilters (environment, filters) {
    if (filters) {
      for (let filter of Object.keys(filters)) {
        environment.addFilter(filter, filters[filter])
      }
    }
    return environment
  }
}

export {
  NunjucksTemplatingService
}
