import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import { Server } from './server.service'
import { ProjectService } from './project-service'
import { TemplatingService } from './templating-service'
import { config } from './config'

/**
 * Mock server responding to requests based on the set of rules of a project.
 *
 * @extends {Server}
 */
class MockServer extends Server {
  /**
   * Creates an instance of MockServer.
   *
   * @param {number} [port=config.getProperty('mock-server.port')] The port on which the server should run.
   * @param {string} [bindAddress=config.getProperty('mock-server.bind-address')] The address to which the server should bind.
   * @param {string} [project=config.getProperty('project')] The project that defines the rules the mock server should implement.
   * @param {ProjectService} [projectService=config.getInstance(ProjectService)] An instance of ProjectService.
   * @param {TemplatingService} [templatingService=config.getInstance(TemplatingService)] An instance of TemplatingService.
   * @memberof MockServer
   */
  constructor (port = config.getProperty('mock-server.port'), bindAddress = config.getProperty('mock-server.bind-address'), project = config.getProperty('project'), projectService = config.getInstance(ProjectService), templatingService = config.getInstance(TemplatingService)) {
    super(port, bindAddress, 'mock-server')
    this.project = project
    this.projectService = projectService
    this.templatingService = templatingService
  }

  async _setup () {
    this.app.use(cookieParser())
    this.app.use(bodyParser.json())
    this.app.use(bodyParser.raw())
    this.app.use(bodyParser.text())
    this.app.use(bodyParser.urlencoded({ extended: true }))
    this.app.disable('x-powered-by')

    return this._processRules(this.app, this.project).then(() => {
      // add health check
      this.app.get('/mockserver-health', async (req, res) => {
        this.logger.debug('Health requested')
        res.send('OK')
      })
    })
  }

  // Transform the list of rules for the project into endpoints on the mock server.
  async _processRules (app, project) {
    // TODO handle unknown project
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
