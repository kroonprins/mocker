import express from 'express'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import 'express-async-errors'
import { Server } from './server.service'
import { ProjectService } from './project-service'
import { TemplatingService } from './templating-service'
import { Logger } from './logging'
import { config } from './config'

class MockServer extends Server {
  constructor (port = config.getProperty('mock-server.port'), bindAddress = config.getProperty('mock-server.bind-address'), project = config.getProperty('project'), projectService = config.getInstance(ProjectService), templatingService = config.getInstance(TemplatingService)) {
    super()
    this.port = port
    this.bindAddress = bindAddress
    this.project = project
    this.server = null
    this.logger = config.getClassInstance(Logger, { id: 'mock-server' })
    this.projectService = projectService
    this.templatingService = templatingService
  }

  start () {
    this.logger.debug("Starting mock server for port %d binding on %s and project '%s'", this.port, this.bindAddress, this.project)
    const app = express()
    app.use(cookieParser())
    app.use(bodyParser.json())
    app.use(bodyParser.raw())
    app.use(bodyParser.text())
    app.use(bodyParser.urlencoded({ extended: true }))
    app.disable('x-powered-by')

    this._processRules(app, this.project).then(() => {
      // add health check
      app.get('/mockserver-health', async (req, res) => {
        this.logger.debug('Health requested')
        res.send('OK')
      })
    })

    return new Promise((resolve, reject) => {
      this.server = app.listen(this.port, this.bindAddress, () => {
        this.logger.info('Mock server started on port %d binding on %s', this.port, this.bindAddress)
        resolve()
      })
    })
  }
  stop () {
    this.logger.debug('Request to stop the mock server')
    if (this.server != null) {
      this.logger.info('Stopping the mock server')
      return new Promise((resolve, reject) => {
        this.server.close(() => {
          this.logger.info('Stopped the mock server')
          resolve()
        })
      })
    }
  }
  async _processRules (app, project) {
    const rules = await this.projectService.listProjectRules(project)
    for (let projectRule of rules) {
      this.logger.debug(projectRule, 'Process rule')
      const ruleRequest = projectRule.rule.request
      const ruleResponse = projectRule.rule.response

      app[ruleRequest.method.toLowerCase()](ruleRequest.path, async (req, res) => {
        this.logger.debug('Processing request for path %s', req.path)
        const templateEnvironment = {
          req: req,
          res: res
        }
        // "object -> json string + templating -> object" is done to avoid having to template each attribute of the object separately...
        const templateRenderedResponse = JSON.parse(await this.templatingService.render(ruleResponse.templatingEngine, JSON.stringify(ruleResponse), templateEnvironment))

        res.type(templateRenderedResponse._contentType)
        res.status(templateRenderedResponse._statusCode)
        for (let header of templateRenderedResponse._headers) {
          res.header(header._name, header._value)
        }
        for (let cookie of templateRenderedResponse._cookies) {
          res.cookie(cookie._name, cookie._value, cookie._properties)
        }
        res.send(templateRenderedResponse._body)
      })
    }
  }
}

export {
  MockServer
}
