import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import bodyParserXml from 'body-parser-xml'
import cors from 'cors'
import latency from 'express-delay'
import { Server } from './server.service'
import { ProjectService } from './project-service'
import { ProjectChangeWatcher } from './project-change-watcher'
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
  constructor (port = config.getProperty('mock-server.port'), bindAddress = config.getProperty('mock-server.bind-address'), project = config.getProperty('project'), projectService = config.getInstance(ProjectService), templatingService = config.getInstance(TemplatingService), watchConfigurationChanges = config.getProperty('mock-server.watch-for-configuration-changes')) {
    super(port, bindAddress, 'mock-server')
    this.project = project
    this.projectService = projectService
    this.templatingService = templatingService
    this.projectChangeWatcher = new ProjectChangeWatcher(this.project)
    this.watchConfigurationChanges = watchConfigurationChanges
  }

  async _setup () {
    bodyParserXml(bodyParser)
    this.app.use(cookieParser())
    this.app.use(bodyParser.json())
    this.app.use(bodyParser.xml())
    this.app.use(bodyParser.raw())
    this.app.use(bodyParser.text())
    this.app.use(bodyParser.urlencoded({ extended: true }))
    this.app.use(cors())
    this.app.disable('x-powered-by')

    await this._processRules(this.app, this.project)

    this.app.get('/mockserver-health', async (req, res) => {
      this.logger.debug('Health requested')
      res.send('OK')
    })

    if (this.watchConfigurationChanges) {
      this.logger.info('The mock server will watch for changes to the rules on the filesystem. This can be disabled by setting environment variable MOCKER_MOCK_SERVER_WATCH_FOR_FILE_CHANGES')
      const projectChanges = await this.projectChangeWatcher.start()
      projectChanges.on('changeDetected', async () => {
        this.logger.info(`A change in configuration for project '${this.project}'. Restarting the mock server.`)
        await this.projectService.initialize()
        await this.projectChangeWatcher.stop()
        this.projectChangeWatcher = new ProjectChangeWatcher(this.project)
        await this.restart()
        this.logger.info('Mock server restarted after change in configuration')
      })
    }
  }

  // Transform the list of rules for the project into endpoints on the mock server.
  async _processRules (app, project) {
    // TODO handle unknown project
    const rules = await this.projectService.listProjectRules(project)
    for (let projectRule of rules) {
      this.logger.debug(projectRule, 'Process rule')
      const ruleRequest = projectRule.rule.request
      const ruleResponse = projectRule.rule.response

      const requestCallbacks = []

      // Simulate latency
      if (this._shouldSimulateFixedLatency(projectRule)) {
        this.logger.debug('Configuring fixed latency on request')
        requestCallbacks.push(this._configureFixedLatency(projectRule))
      } else if (this._shouldSimulateRandomLatency(projectRule)) {
        this.logger.debug('Configuring random latency on request')
        requestCallbacks.push(this._configureRandomLatency(projectRule))
      } else {
        this.logger.debug('No latency configured for request')
      }

      // Generate response from project rule
      requestCallbacks.push(async (req, res) => {
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

      app[ruleRequest.method.toLowerCase()](ruleRequest.path, requestCallbacks)
    }
  }

  _shouldSimulateFixedLatency (projectRule) {
    return projectRule.rule.fixedLatency && projectRule.rule.fixedLatency.value
  }

  _shouldSimulateRandomLatency (projectRule) {
    return projectRule.rule.randomLatency && projectRule.rule.randomLatency.max
  }

  _configureFixedLatency (projectRule) {
    this.logger.debug('Setting fixed latency: %d', projectRule.rule.fixedLatency.value)
    return latency(projectRule.rule.fixedLatency.value)
  }

  _configureRandomLatency (projectRule) {
    this.logger.debug('Setting random latency between %d and %d', projectRule.rule.randomLatency.min, projectRule.rule.randomLatency.max)
    return latency(projectRule.rule.randomLatency.min || 0, projectRule.rule.randomLatency.max)
  }
}

export {
  MockServer
}
