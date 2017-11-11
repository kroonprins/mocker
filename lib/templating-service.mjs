import { Logger } from './logging'
import { config } from './config'

class TemplatingService {
  constructor () {
    this.logger = config.getClassInstance(Logger, { id: 'templating-service' })
    this.TEMPLATING_ENGINES = {
      none: {
        service: {
          render: async (str, context) => {
            return str
          }
        }
      },
      nunjucks: {
        service: config.getInstance('NunjucksTemplatingService')
      }
    }
  }
  async render (templatingEngine, str, context) {
    this.logger.debug(context, 'Render template for templating engine %s', templatingEngine)
    if (!templatingEngine || !(templatingEngine in this.TEMPLATING_ENGINES)) {
      throw new Error(`Unknown templating engine ${templatingEngine}`)
    }
    return this.TEMPLATING_ENGINES[templatingEngine].service.render(str, context)
  }
  async listEngines () {
    return Object.keys(this.TEMPLATING_ENGINES)
  }
}

export {
  TemplatingService
}
