import chai from 'chai'
import chaiString from 'chai-string'
import portastic from 'portastic'
import axios from 'axios'
import { ConfigService } from './../../lib/config.service'
import { LatencyValidationModel } from './../../lib/latency-validation-model'
import { RuleValidationModel } from './../../lib/rule-validation-model'
import { ProjectValidationModel } from './../../lib/project-validation-model'
import { MockServer } from './../../lib/mock-server'
import { ProjectService } from './../../lib/project-service'
import { InMemoryProjectStore } from './../../lib/project-store'
import { RuleService } from './../../lib/rule-service'
import { TemplatingService } from './../../lib/templating-service'
import { NunjucksTemplatingHelpers } from './../../lib/templating-helpers.nunjucks'
import { NunjucksTemplatingService } from './../../lib/templating-service.nunjucks'
import { AppClassValidationService } from '../../lib/app-class-validation.service.mjs'
import { ClassValidationService } from '../../lib/class-validation.service'
import { Logger, PinoLogger } from './../../lib/logging'
import { config } from './../../lib/config'

const expect = chai.expect
chai.use(chaiString)

// could split this up so that not all test run synchronously
const test = async () => {
  try {
    const projectFileLocation = './test/projects/tests.yaml'

    config
      .registerProperty('logging.level.startup', 'debug')
      .registerType(Logger, PinoLogger)
      .registerProperty('project.location', projectFileLocation)
      .registerProperty('mock-server.watch-for-configuration-changes', false)
      .registerProperty('mock-server-swagger-ui.enabled', false)
      .registerInstance('NunjucksTemplatingHelpers', new NunjucksTemplatingHelpers())
      .registerInstance('NunjucksTemplatingService', new NunjucksTemplatingService())
      .registerInstance(TemplatingService, new TemplatingService())
      .registerInstance(LatencyValidationModel, new LatencyValidationModel())
      .registerInstance(RuleValidationModel, new RuleValidationModel(new ConfigService()))
      .registerInstance(ProjectValidationModel, new ProjectValidationModel())

    const appClassValidationService = new AppClassValidationService()
    config
      .registerInstance(ClassValidationService, appClassValidationService)

    const templatingService = new TemplatingService()
    const projectService = new ProjectService(
      new InMemoryProjectStore(
        projectFileLocation,
        './test/rules',
        new RuleService(),
        appClassValidationService
      ))

    const availablePort = (await portastic.find({
      min: 40000,
      max: 50000,
      retrieve: 1
    }))[0]

    const mockServer = new MockServer(availablePort, 'localhost', 'test_glob', projectService, templatingService)
    try {
      mockServer.start()

      // Test the health check
      const MAX_TRIES = 10
      let numberOfTries = 0
      while (true) {
        try {
          const response = await axios.get(`http://localhost:${availablePort}/mockserver-health`)
          if (response.data === 'OK') {
            break
          }
        } catch (e) { }
        if (numberOfTries++ > MAX_TRIES) {
          throw new Error('The mock server does not seem to have started.')
        }
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      const responseRule1 = await axios.get(`http://localhost:${availablePort}/hello1/2?q=test`)
      expect(responseRule1.status).to.be.equal(200)
      expect(responseRule1.data.respo).to.be.equal('Test rule 1: test / 2')
      expect(responseRule1.headers['content-type']).to.startsWith('application/json')
      expect(responseRule1.headers['x-powered-by']).to.be.equal('mocker')
      expect(responseRule1.headers['x-positivo']).to.be.equal('jawohl')
      expect(responseRule1.headers['x-zeker']).to.be.equal('klahr')
      expect(responseRule1.headers['x-yup']).to.be.equal('test')
      expect(responseRule1.headers['set-cookie'][0]).to.be.equal('koekske=jummie; Path=/; Secure')
      expect(responseRule1.headers['set-cookie'][1]).to.be.equal('only=http; Path=/; HttpOnly')

      let exceptionThrownBecauseIdGreaterThanFive = false
      try {
        await axios.get(`http://localhost:${availablePort}/hello1/6?q=test2`)
      } catch (e) {
        expect(e.response.status).to.be.equal(400)
        expect(e.response.data.respo).to.be.equal('Test rule 1: test2 / 6')
        expect(e.response.headers['x-yup']).to.be.equal('test2')
        exceptionThrownBecauseIdGreaterThanFive = true
      }
      expect(exceptionThrownBecauseIdGreaterThanFive).to.be.equal(true)

      const startTimeRule2 = (new Date()).getTime()
      const responseRule2 = await axios.put(`http://localhost:${availablePort}/hello2`, {
        input: 'testRule2'
      })
      const durationRule2 = (new Date()).getTime() - startTimeRule2
      expect(responseRule2.status).to.be.equal(200)
      expect(responseRule2.data.respo).to.be.equal('Test rule 2: testRule2')
      expect(responseRule2.headers['content-type']).to.startsWith('application/json')
      expect(durationRule2).to.be.above(2000)
      expect(durationRule2).to.be.below(3000)

      const startTimeRule3 = (new Date()).getTime()
      const responseRule3 = await axios.get(`http://localhost:${availablePort}/hello3/d`)
      const durationRule3 = (new Date()).getTime() - startTimeRule3
      expect(responseRule3.status).to.be.equal(200)
      expect(responseRule3.data.respo).to.be.equal('Test rule 3: {{req.query.q}} / {{req.params.id}}')
      expect(responseRule3.headers['x-yup']).to.be.equal('{{req.query.q}}')
      expect(durationRule3).to.be.above(1000)
      expect(durationRule3).to.be.below(3200)

      let exceptionThrownBecauseNoMethodMatch = false
      try {
        await axios.post(`http://localhost:${availablePort}/hello3/d`)
      } catch (e) {
        expect(e.response.status).to.be.equal(404)
        exceptionThrownBecauseNoMethodMatch = true
      }
      expect(exceptionThrownBecauseNoMethodMatch).to.be.equal(true)
    } finally {
      await mockServer.stop()
    }

    const mockServerForEncodingTest = new MockServer(availablePort, 'localhost', 'test_encoding', projectService, templatingService)
    try {
      await mockServerForEncodingTest.start()

      const responseGzip = await axios.get(`http://localhost:${availablePort}/gzip`)
      expect(responseGzip.status).to.be.equal(200)
      expect(responseGzip.data.respo).to.be.equal('gzip content')
      expect(responseGzip.headers['content-type']).to.startsWith('application/json')
      expect(responseGzip.headers['x-yup']).to.be.equal('bla')
      // expect(responseGzip.headers['content-encoding']).to.be.equal('gzip') // axios seems to remove the header

      const responseDeflate = await axios.get(`http://localhost:${availablePort}/deflate`)
      expect(responseDeflate.status).to.be.equal(200)
      expect(responseDeflate.data.respo).to.be.equal('deflate content')
      expect(responseDeflate.headers['content-type']).to.startsWith('application/json')
      expect(responseDeflate.headers['x-yup']).to.be.equal('bla')
      // expect(responseDeflate.headers['content-encoding']).to.be.equal('deflate') // axios seems to remove the header

      const responseUnsupported = await axios.get(`http://localhost:${availablePort}/unsupported`)
      expect(responseUnsupported.status).to.be.equal(200)
      expect(responseUnsupported.data.respo).to.be.equal('unsupported content')
      expect(responseUnsupported.headers['content-type']).to.startsWith('application/json')
      expect(responseUnsupported.headers['x-yup']).to.be.equal('bla')
      expect(responseUnsupported.headers['content-encoding']).to.be.equal(undefined)
    } finally {
      await mockServerForEncodingTest.stop()
    }
  } finally {
    config.reset()
  }
}

export {
  test
}
