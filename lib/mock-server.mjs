import express from 'express'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import 'express-async-errors'

import { ProjectService } from './project-service'
import { TemplatingService } from './templating-service'
import { logger } from './logging'

const _processRules = async (app, project) => {
  const rules = await ProjectService.listProjectRules(project)
  console.dir(rules, {depth: 10})
  for (let projectRule of rules) {
    logger.debug(projectRule, 'Process rule')
    const ruleRequest = projectRule.rule.request
    const ruleResponse = projectRule.rule.response

    app[ruleRequest.method.toLowerCase()](ruleRequest.path, async function (req, res) {
      logger.debug('Processing request for path %s', req.path)
      const templateEnvironment = {
        req: req,
        res: res
      }
      // "object -> json string + templating -> object" is done to avoid having to template each attribute of the object seperately...
      const templateRenderedResponse = JSON.parse(await TemplatingService.render(ruleResponse.templatingEngine, JSON.stringify(ruleResponse), templateEnvironment))

      res.type(templateRenderedResponse.contentType)
      res.status(templateRenderedResponse.statusCode)
      for (let header of templateRenderedResponse.headers) {
        res.header(header.name, header.value)
      }
      for (let cookie of templateRenderedResponse.cookies) {
        res.cookie(cookie.name, cookie.value, cookie.properties)
      }
      res.send(templateRenderedResponse.body)
    })
  }
}

class MockServer {
  constructor (port, project) {
    this.port = port
    this.project = project
    this.server = null
  }

  start () {
    logger.debug("Starting mock server for port %d and project '%s'", this.port, this.project)
    const app = express()
    app.use(cookieParser())
    app.use(bodyParser.json())
    app.use(bodyParser.raw())
    app.use(bodyParser.text())
    app.use(bodyParser.urlencoded({ extended: true }))
    app.disable('x-powered-by')

    _processRules(app, this.project).then(() => {
      // add health check
      app.get('/mockserver-health', async function (req, res) {
        logger.debug('Health requested')
        res.send('OK')
      })
    })

    // todo move into the then above so that server start is not reported until everything is ready to go?
    this.server = app.listen(this.port, () => {
      logger.info('Mock server started on port %d', this.port)
    })
  }
  stop () {
    logger.debug('Request to stop the mock server')
    if (this.server != null) {
      logger.info('Stopping the mock server')
      this.server.close()
    }
  }
}

export {
  MockServer
}
