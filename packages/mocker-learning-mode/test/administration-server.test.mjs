import chai from 'chai'
import portastic from 'portastic'
import axios from 'axios'
import { TestServer } from './resources/test-server'
import { LearningModeReverseProxyServer } from '../src/learning-mode.reverse-proxy'
import { LearningModeService } from '../src/learning-mode.service'
import { LearningModeDbService } from '../src/learning-mode.db.service'
import { LearningModeDbValidationModel } from '../src/learning-mode.db.validation-model'
import { AppClassValidationService } from '@kroonprins/mocker-shared-lib/app-class-validation.service'
import { unlinkAsync } from '@kroonprins/mocker-shared-lib/fs-util'
import { AdministrationServer } from '../src/administration-server'
import { LearningModeServerEventEmitter } from '../src/learning-mode.server.events'
import { MetricsService } from '../src/metrics.service'
import { wait } from '@kroonprins/mocker-shared-lib/util'
import { Logger, PinoLogger } from '@kroonprins/mocker-shared-lib/logging'
import { config } from '@kroonprins/mocker-shared-lib/config'

const expect = chai.expect

const test = async () => {
  const dbFile = './test/tmp/test3.db'

  try {
    config
      .registerProperty('logging.level.startup', 'info')
      .registerType(Logger, PinoLogger)
      .registerInstance(LearningModeDbValidationModel, new LearningModeDbValidationModel())

    let learningModeDbService = new LearningModeDbService(
      dbFile,
      new AppClassValidationService()
    )
    let learningModeService = new LearningModeService(learningModeDbService)

    const eventEmitter = new LearningModeServerEventEmitter()
    const metricsService = new MetricsService(eventEmitter)

    const minimumPort = Math.floor((Math.random() * 50000) + 8000)
    const availablePorts = (await portastic.find({
      min: minimumPort,
      max: minimumPort + 20,
      retrieve: 3
    }))
    const testServerPort = availablePorts[0]
    const reverseProxyPort = availablePorts[1]
    const administrationServerPort = availablePorts[2]

    const testServer = new TestServer(testServerPort)
    const proxyServer = new LearningModeReverseProxyServer(reverseProxyPort,
      'localhost', `http://localhost:${testServerPort}`,
      'adminstrationServerTestProject',
      learningModeService,
      eventEmitter)
    const administrationServer = new AdministrationServer(administrationServerPort, 'localhost', metricsService)

    try {
      Promise.all([
        await testServer.start(),
        await proxyServer.start(),
        await administrationServer.start()
      ])

      const metricsAfterStartUp = await axios.get(`http://localhost:${administrationServerPort}/administration/metrics`)

      expect(metricsAfterStartUp.status).to.be.equal(200)
      expect(metricsAfterStartUp.data.starts['adminstrationServerTestProject'].length).to.equal(1)
      expect(metricsAfterStartUp.data.starts['adminstrationServerTestProject'][0].port).to.equal(reverseProxyPort)

      await proxyServer.restart()

      const metricsAfterRestart = await axios.get(`http://localhost:${administrationServerPort}/administration/metrics`)
      expect(metricsAfterRestart.status).to.be.equal(200)
      expect(metricsAfterRestart.data.starts['adminstrationServerTestProject'].length).to.equal(2)
      expect(metricsAfterRestart.data.starts['adminstrationServerTestProject'][1].port).to.equal(reverseProxyPort)
      expect(metricsAfterRestart.data.starts['adminstrationServerTestProject'][1].timestamp).to.be.above(metricsAfterRestart.data.starts['adminstrationServerTestProject'][0].timestamp)

      await axios.get(`http://localhost:${reverseProxyPort}/test1`)
      await wait(500)

      const metricsAfterRequest1 = await axios.get(`http://localhost:${administrationServerPort}/administration/metrics`)
      expect(metricsAfterRequest1.status).to.be.equal(200)
      expect(metricsAfterRequest1.data.starts['adminstrationServerTestProject'].length).to.equal(2)
      expect(metricsAfterRequest1.data.totalRequests['adminstrationServerTestProject']).to.equal(1)

      await axios.get(`http://localhost:${reverseProxyPort}/test1`)
      await wait(500)

      const metricsAfterRequest2 = await axios.get(`http://localhost:${administrationServerPort}/administration/metrics`)
      expect(metricsAfterRequest2.status).to.be.equal(200)
      expect(metricsAfterRequest2.data.starts['adminstrationServerTestProject'].length).to.equal(2)
      expect(metricsAfterRequest2.data.totalRequests['adminstrationServerTestProject']).to.equal(2)
    } finally {
      Promise.all([
        await proxyServer.stop(),
        await testServer.stop(),
        administrationServer.stop()
      ])
    }
  } finally {
    config.reset()
    await unlinkAsync(dbFile)
  }
}

export {
  test
}
