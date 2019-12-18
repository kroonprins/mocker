import { AdministrationServer as BaseAdministrationServer } from '@kroonprins/mocker-shared-lib/administration-server.mjs'
import { config } from '@kroonprins/mocker-shared-lib/config.mjs'
import { MetricsService } from './metrics.service.mjs'

/**
 * Server exposing service endpoints to execute administrative tasks for a mock server.
 */
class AdministrationServer extends BaseAdministrationServer {
  /**
   * Creates an instance of AdministrationServer.
   *
   * @param {string} [port=config.getProperty('administration-server.port')] The port on which the server should run.
   * @param {string} [bindAddress=config.getProperty('administration-server.bind-address')] The address to which the server should bind.
   * @memberof AdministrationServer
   */
  constructor (port = config.getProperty('administration-server.port'), bindAddress = config.getProperty('administration-server.bind-address'), metricsService = config.getInstance(MetricsService)) {
    super(port, bindAddress, 'mocker-administration-server')
    this.metricsService = metricsService
  }

  async _setup () {
    super._setup()

    this.router.get('/metrics', async (req, res) => {
      const metrics = this.metricsService.getMetrics()
      res.status(200)
      res.send(metrics)
    })
  }
}

export {
  AdministrationServer
}
