import fs from 'fs'
import path from 'path'
import memoize from 'mem'
import { createModulePath } from '@kroonprins/mocker-shared-lib/dynamic-module-import-helper.mjs'
import { Logger } from '@kroonprins/mocker-shared-lib/logging.mjs'
import { config } from '@kroonprins/mocker-shared-lib/config.mjs'
import cjs from './mjs_workaround/cjs.js'
import { EchoServerService } from './echo-server.service.mjs'

const readFile = memoize(fs.readFileSync) // sync because templating helpers in nunjucks are sync

class NunjucksTemplatingHelpers {
  constructor(userDefinedHelperLocations = config.getOptionalProperty('templating.helpers.nunjucks')
      , extraHelpers = {}
      , nunjucksTemplatingService = config.getInstance('NunjucksTemplatingService')
      , echoServerService = config.getOptionalInstance(EchoServerService)
  ) {
    this.logger = config.getClassInstance(Logger, { id: 'templating-helpers.nunjucks' })
    this.userDefinedHelperLocations = userDefinedHelperLocations
    this.extraHelpers = extraHelpers
    this.nunjucksTemplatingService = nunjucksTemplatingService
    this.echoServerService = echoServerService

    this.DEFAULT_HELPERS = {
      filters: {
        // E.g.
        // prependText: (str, text) => {
        //   return text + str
        // },
        // appendText: (str, text) => {
        //   return str + text
        // }
        //
        // In template: {{var | prependText("x")}}
      },
      functions: {
        // E.g.
        // writeA: () => {
        //   return 'A'
        // },
        // writeText: (text) => {
        //   return text
        // }
        //
        // In template: {{writeText("x")}}
        echo: (req) => {
          return this.echoServerService.createResponseFromExpressRequest(req)
        },
        file: function (path, encoding = 'utf8') { // using function instead of => because nunjucks will bind the templating context to "this.ctx"
          try {
            return nunjucksTemplatingService._renderSync(readFile(path, { encoding: encoding }), this.ctx)
          } catch (e) {
            console.error(e)
            return ""
          }
        }
      }
    }
  }

  async init() {
    this.logger.debug('Loading default nunjucks templating helpers', this.DEFAULT_HELPERS)
    Object.assign(this, this.DEFAULT_HELPERS)

    if (this.userDefinedHelperLocations) {
      this.logger.info('Loading user defined nunjucks templating helpers')
      await this._loadUserDefinedHelperLocations()
    }

    if (this.extraHelpers) {
      this.logger.info('Loading extra nunjucks templating helpers')
      this._addExtraHelpers()
    }

    return this
  }

  _loadUserDefinedHelperLocations() {
    const locations = this.userDefinedHelperLocations.split(',')
    if (locations.length === 0) {
      return
    }

    const dynamicImportPromises = []

    for (let location of locations) {
      // if location is relative it is considered relative to the place of execution
      if (!fs.existsSync(location)) { // TODO can use !(await fs.exists(location)) ?
        this.logger.warn('The given location for nunjucks template helpers could not be found: %s', location)
        continue
      }

      const resolvedLocation = path.resolve(location)
      this.logger.debug('Resolved location: %s', resolvedLocation)

      dynamicImportPromises.push(
        import(createModulePath(resolvedLocation, cjs.__dirname)).then(module => {
          Object.assign(this.filters, module.HELPERS.filters)
          Object.assign(this.functions, module.HELPERS.functions)
        }))
    }

    return Promise.all(dynamicImportPromises)
  }

  _addExtraHelpers() {
      Object.assign(this.filters, this.extraHelpers.filters)
      Object.assign(this.functions, this.extraHelpers.functions)
  }
}

export {
  NunjucksTemplatingHelpers
}
