import swaggerUi from 'swagger-ui-express'
import { Server } from '@kroonprins/mocker-shared-lib/server.service'
import { SwaggerGenerationService } from './swagger-generation.service'
import { config } from '@kroonprins/mocker-shared-lib/config'

/**
 * Server for serving swagger ui for the mock server of a project
 */
class MockServerSwaggerUiServer extends Server {
  /**
   * Creates an instance of UiServer.
   * @param {string} [port=config.getProperty('mock-server-swagger-ui.port')] The port on which the server should run.
   * @param {string} [bindAddress=config.getProperty('mock-server-swagger-ui.bind-address')] The address to which the server should bind.
   * @param {string} [project=config.getProperty('project')] Project for which the rules should be served as swagger.
   * @param {SwaggerGenerationService} Swagger generation service.
   * @memberof SwaggerUiServer
   */
  constructor (port = config.getProperty('mock-server-swagger-ui.port'),
    bindAddress = config.getProperty('mock-server-swagger-ui.bind-address'),
    project = config.getProperty('project'),
    swaggerGenerationService = config.getInstance(SwaggerGenerationService)) {
    super(port, bindAddress, 'mock-server-swagger-ui')
    this.project = project
    this.swaggerGenerationService = swaggerGenerationService
    this.servers = null
  }

  async _setup () {
    const swaggerDocument = await this.swaggerGenerationService.generate(this.project, this.servers)
    this.app.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
  }
}

export {
  MockServerSwaggerUiServer
}
