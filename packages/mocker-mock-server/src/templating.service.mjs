import { Logger } from '@kroonprins/mocker-shared-lib/logging'
import { config } from '@kroonprins/mocker-shared-lib/config'

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
    this.logger.debug('Render template for templating engine %s', templatingEngine, context)
    if (!templatingEngine || !(templatingEngine in this.TEMPLATING_ENGINES)) {
      throw new Error(`Unknown templating engine ${templatingEngine}`)
    }
    return this.TEMPLATING_ENGINES[templatingEngine].service.render(str, context)
  }
  listEngines () {
    return Object.keys(this.TEMPLATING_ENGINES)
  }
}

export {
  TemplatingService
}
