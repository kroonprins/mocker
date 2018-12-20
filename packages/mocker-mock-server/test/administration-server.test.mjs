import chai from 'chai'
import portastic from 'portastic'
import axios from 'axios'
import path from 'path'
import { initialize as setDefaultConfig } from '@kroonprins/mocker-shared-lib/config-default'
import { initialize as setDefaultConfigMockServer } from '../src/config-default'
import { AdministrationServer } from '../src/administration-server'
import { MockServer } from '../src/mock-server'
import { wait } from '@kroonprins/mocker-shared-lib/util'
import { config } from '@kroonprins/mocker-shared-lib/config'

const expect = chai.expect

const test = async () => {
  try {
    const projectFileLocation = './test/resources/projects/tests.yaml'

    config
      .registerProperty('logging.level.startup', 'info')
      .registerProperty('project.location', projectFileLocation)

    setDefaultConfig()
    setDefaultConfigMockServer()

    const minimumPort = Math.floor((Math.random() * 50000) + 8000)
    const availablePorts = (await portastic.find({
      min: minimumPort,
      max: minimumPort + 20,
      retrieve: 3
    }))
    const mockServerPort1 = availablePorts[0]
    const mockServerPort2 = availablePorts[1]
    const administrationServerPort = availablePorts[2]

    const mockServer1 = new MockServer(mockServerPort1, 'localhost', 'test_glob')
    const mockServer2 = new MockServer(mockServerPort2, 'localhost', 'test_multiple_glob')
    const administrationServer = new AdministrationServer(administrationServerPort, 'localhost')
    try {
      await administrationServer.start()
      await mockServer1.start()

      const metricsAfterStartUp = await axios.get(`http://localhost:${administrationServerPort}/administration/metrics`)
      expect(metricsAfterStartUp.status).to.be.equal(200)
      expect(metricsAfterStartUp.data.starts['test_glob'].length).to.equal(1)
      expect(metricsAfterStartUp.data.starts['test_glob'][0].port).to.equal(mockServerPort1)

      await mockServer1.restart()

      const metricsAfterRestart = await axios.get(`http://localhost:${administrationServerPort}/administration/metrics`)
      expect(metricsAfterRestart.status).to.be.equal(200)
      expect(metricsAfterRestart.data.starts['test_glob'].length).to.equal(2)
      expect(metricsAfterRestart.data.starts['test_glob'][1].port).to.equal(mockServerPort1)
      expect(metricsAfterRestart.data.starts['test_glob'][1].timestamp).to.be.above(metricsAfterRestart.data.starts['test_glob'][0].timestamp)

      await axios.get(`http://localhost:${mockServerPort1}/hello1/2?q=test`)
      await wait(500)

      const metricsAfterRequest1 = await axios.get(`http://localhost:${administrationServerPort}/administration/metrics`)
      expect(metricsAfterRequest1.status).to.be.equal(200)
      expect(metricsAfterRequest1.data.starts['test_glob'].length).to.equal(2)
      expect(metricsAfterRequest1.data.totalRequests['test_glob']).to.equal(1)
      expect(metricsAfterRequest1.data.requestsPerRule['test_glob'][path.normalize('../rules/test_rule_1.yaml')]).to.equal(1)

      await axios.get(`http://localhost:${mockServerPort1}/hello1/2?q=test`)
      await wait(500)

      const metricsAfterRequest2toSameRule = await axios.get(`http://localhost:${administrationServerPort}/administration/metrics`)
      expect(metricsAfterRequest2toSameRule.status).to.be.equal(200)
      expect(metricsAfterRequest2toSameRule.data.starts['test_glob'].length).to.equal(2)
      expect(metricsAfterRequest2toSameRule.data.totalRequests['test_glob']).to.equal(2)
      expect(metricsAfterRequest2toSameRule.data.requestsPerRule['test_glob'][path.normalize('../rules/test_rule_1.yaml')]).to.equal(2)

      await axios.put(`http://localhost:${mockServerPort1}/hello2`, {
        input: 'testRule2'
      })
      await wait(500)

      const metricsAfterRequestToAnotherRule = await axios.get(`http://localhost:${administrationServerPort}/administration/metrics`)
      expect(metricsAfterRequestToAnotherRule.status).to.be.equal(200)
      expect(metricsAfterRequestToAnotherRule.data.starts['test_glob'].length).to.equal(2)
      expect(metricsAfterRequestToAnotherRule.data.totalRequests['test_glob']).to.equal(3)
      expect(metricsAfterRequestToAnotherRule.data.requestsPerRule['test_glob'][path.normalize('../rules/test_rule_1.yaml')]).to.equal(2)
      expect(metricsAfterRequestToAnotherRule.data.requestsPerRule['test_glob'][path.normalize('../rules/test_rule_2.yaml')]).to.equal(1)

      await mockServer2.start()

      const metricsAfterStartMockServerForOtherProject = await axios.get(`http://localhost:${administrationServerPort}/administration/metrics`)
      expect(metricsAfterStartMockServerForOtherProject.status).to.be.equal(200)
      expect(metricsAfterStartMockServerForOtherProject.data.starts['test_glob'].length).to.equal(2)
      expect(metricsAfterStartMockServerForOtherProject.data.starts['test_multiple_glob'].length).to.equal(1)
      expect(metricsAfterStartMockServerForOtherProject.data.totalRequests['test_glob']).to.equal(3)
      expect(metricsAfterStartMockServerForOtherProject.data.requestsPerRule['test_glob'][path.normalize('../rules/test_rule_1.yaml')]).to.equal(2)
      expect(metricsAfterStartMockServerForOtherProject.data.requestsPerRule['test_glob'][path.normalize('../rules/test_rule_2.yaml')]).to.equal(1)

      await axios.get(`http://localhost:${mockServerPort1}/hello1/2?q=test`)
      await axios.get(`http://localhost:${mockServerPort2}/hello1/2?q=test`)
      await wait(500)

      const metricsAfterAfterRequestToMockServerForOtherProject = await axios.get(`http://localhost:${administrationServerPort}/administration/metrics`)
      expect(metricsAfterAfterRequestToMockServerForOtherProject.status).to.be.equal(200)
      expect(metricsAfterAfterRequestToMockServerForOtherProject.data.starts['test_glob'].length).to.equal(2)
      expect(metricsAfterAfterRequestToMockServerForOtherProject.data.starts['test_multiple_glob'].length).to.equal(1)
      expect(metricsAfterAfterRequestToMockServerForOtherProject.data.totalRequests['test_glob']).to.equal(4)
      expect(metricsAfterAfterRequestToMockServerForOtherProject.data.totalRequests['test_multiple_glob']).to.equal(1)
      expect(metricsAfterAfterRequestToMockServerForOtherProject.data.requestsPerRule['test_glob'][path.normalize('../rules/test_rule_1.yaml')]).to.equal(3)
      expect(metricsAfterAfterRequestToMockServerForOtherProject.data.requestsPerRule['test_glob'][path.normalize('../rules/test_rule_2.yaml')]).to.equal(1)
      expect(metricsAfterAfterRequestToMockServerForOtherProject.data.requestsPerRule['test_multiple_glob'][path.normalize('../rules/test_rule_1.yaml')]).to.equal(1)
    } finally {
      await mockServer1.stop()
      await mockServer2.stop()
      await administrationServer.stop()
    }
  } finally {
    config.reset()
  }
}

export {
  test
}
