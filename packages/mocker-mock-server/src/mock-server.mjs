import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import bodyParserXml from 'body-parser-xml'
import cors from 'cors'
import latency from 'express-delay'
import zlib from 'zlib'
import { Server } from '@kroonprins/mocker-shared-lib/server.service'
import { ProjectService } from '@kroonprins/mocker-shared-lib/project.service'
import { ProjectChangeWatcher } from './project-change-watcher'
import { TemplatingService } from '@kroonprins/mocker-shared-lib/templating.service'
import { MockServerSwaggerUiServer } from './mock-server-swagger-ui'
import { config } from '@kroonprins/mocker-shared-lib/config'

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
   * @param {boolean} [watchConfigurationChanges=config.getProperty('mock-server.watch-for-configuration-changes')] If the mock server should restart when a change to the rules has been detected
   * @param {boolean} [enableSwaggerUI=config.getProperty('mock-server-swagger-ui.enabled')] If swagger UI should be started serving the OpenAPI specification of the project rules
   * @memberof MockServer
   */
  constructor (port = config.getProperty('mock-server.port')
    , bindAddress = config.getProperty('mock-server.bind-address')
    , project = config.getProperty('project')
    , projectService = config.getInstance(ProjectService)
    , templatingService = config.getInstance(TemplatingService)
    , watchConfigurationChanges = config.getOptionalProperty('mock-server.watch-for-configuration-changes')
    , enableSwaggerUI = config.getOptionalProperty('mock-server-swagger-ui.enabled')
  ) {
    super(port, bindAddress, 'mock-server')
    this.project = project
    this.projectService = projectService
    this.templatingService = templatingService
    this.projectChangeWatcher = new ProjectChangeWatcher(this.project)
    this.watchConfigurationChanges = watchConfigurationChanges
    this.configurationWatchChangeDetectedBeingProcessed = false
    this.enableSwaggerUI = enableSwaggerUI
    if (this.enableSwaggerUI) {
      this.swaggerUiServer = new MockServerSwaggerUiServer()
    }
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
        if (!this.configurationWatchChangeDetectedBeingProcessed) {
          this.configurationWatchChangeDetectedBeingProcessed = true
          this.logger.info(`A change in configuration for project '${this.project}'. Restarting the mock server.`)
          // TODO move into _setup? in general this restart logic to be reviewed
          if (this.enableSwaggerUI) {
            await this.swaggerUiServer.stop()
            this.logger.info('Mock server Swagger UI stopped after change in configuration')
          }
          await this.projectChangeWatcher.stop()
          await this.projectService.reInitialize()
          await this.restart()
          // TODO move creation of the watcher (and creation of this.app in super class) to _setup so that restart look nicer?
          this.projectChangeWatcher = new ProjectChangeWatcher(this.project)
          this.logger.info('Mock server restarted after change in configuration')

          this.configurationWatchChangeDetectedBeingProcessed = false
        }
      })
    }

    if (this.enableSwaggerUI) {
      this.logger.info('Starting mock server Swagger UI server')
      this.swaggerUiServer.servers = [{
        url: this.location(),
        description: 'Mock server'
      }]
      await this.swaggerUiServer.start()
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
      const ruleConditionalResponse = projectRule.rule.conditionalResponse

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
        if (ruleResponse) {
          await this._writeResponse(req, res, ruleResponse, ruleResponse.templatingEngine)
        } else if (ruleConditionalResponse) {
          const ruleConditionalResponseValue = await this._findConditionalResponseValue(ruleConditionalResponse, req, res)
          // TODO if ! ruleConditionalResponseValue found => 404?
          await this._writeResponse(req, res, ruleConditionalResponseValue, ruleConditionalResponse.templatingEngine)
        }
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

  async _findConditionalResponseValue (ruleConditionalResponse, req, res) {
    const templateEnvironment = {
      req: req,
      res: res
    }
    // array find needs module like p-iteration to handle the async
    for (let ruleConditionalResponseValue of ruleConditionalResponse.response) {
      const condition = await this.templatingService.render(ruleConditionalResponse.templatingEngine, ruleConditionalResponseValue.condition, templateEnvironment)
      if (condition === 'true') {
        return ruleConditionalResponseValue
      }
    }
  }

  async _writeResponse (req, res, ruleResponse, templatingEngine) {
    const templateEnvironment = {
      req: req,
      res: res
    }

    // TODO nunjucks render is sync so no advantage in gathering the promises and do a Promise.all, but other templating engines might be different
    res.type(await this.templatingService.render(templatingEngine, ruleResponse.contentType, templateEnvironment))
    res.status(await this.templatingService.render(templatingEngine, ruleResponse.statusCode, templateEnvironment))
    const templatedHeaders = {}
    for (let header of ruleResponse.headers) {
      const name = await this.templatingService.render(templatingEngine, header.name, templateEnvironment)
      const value = await this.templatingService.render(templatingEngine, header.value, templateEnvironment)
      templatedHeaders[name] = value
      res.header(name, value)
    }
    for (let cookie of ruleResponse.cookies) {
      const templatedProperties = {}
      for (const [key, value] of Object.entries(cookie.properties)) {
        templatedProperties[await this.templatingService.render(templatingEngine, key, templateEnvironment)] =
          await this.templatingService.render(templatingEngine, value, templateEnvironment)
      }
      res.cookie(
        await this.templatingService.render(templatingEngine, cookie.name, templateEnvironment),
        await this.templatingService.render(templatingEngine, cookie.value, templateEnvironment),
        templatedProperties
      )
    }

    const body = await this.templatingService.render(templatingEngine, ruleResponse.body, templateEnvironment)

    this._writeBody(
      res,
      body,
      this._getEncoding(templatedHeaders)
    )
  }

  _writeBody (res, body, encoding) {
    if (encoding) {
      this.logger.debug('The response body will be encoded with %s', encoding)
      if (encoding === 'gzip') {
        zlib.gzip(body, function (_, zipped) {
          res.end(zipped)
        })
      } else if (encoding === 'deflate') {
        zlib.deflate(body, function (_, zipped) {
          res.end(zipped)
        })
      } else {
        this.logger.warn('The encoding %s is currently not supported. Sending the response without encoding!')
        res.removeHeader('content-encoding')
        res.send(body)
      }
    } else {
      this.logger.debug('The response body is not encoded')
      res.send(body)
    }
  }

  _getEncoding (headers) {
    return headers['content-encoding']
  }
}

export {
  MockServer
}