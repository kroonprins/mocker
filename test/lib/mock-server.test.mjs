import chai from 'chai'
import chaiString from 'chai-string'
import portastic from 'portastic'
import axios from 'axios'
import { MockServer } from './../../lib/mock-server'
import { ProjectService } from './../../lib/project-service'
import { InMemoryProjectStore } from './../../lib/project-store'
import { RuleService } from './../../lib/rule-service'
import { TemplatingService } from './../../lib/templating-service'
import { NunjucksTemplatingService } from './../../lib/templating-service.nunjucks'
import { Logger, PinoLogger } from './../../lib/logging'
import { config } from './../../lib/config'

const expect = chai.expect
chai.use(chaiString)

// could split this up so that not all test run synchronously
const test = async () => {
  try {
    config.registerProperty('logging.level.startup', 'debug')
    config.registerType(Logger, PinoLogger)
    config.registerInstance('NunjucksTemplatingService', new NunjucksTemplatingService())
    const templatingService = new TemplatingService()
    const projectService = new ProjectService(
      new InMemoryProjectStore(
        './test/projects/tests.yaml',
        new RuleService()
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

      const responseRule2 = await axios.put(`http://localhost:${availablePort}/hello2`, {
        input: 'testRule2'
      })
      expect(responseRule2.status).to.be.equal(200)
      expect(responseRule2.data.respo).to.be.equal('Test rule 2: testRule2')
      expect(responseRule2.headers['content-type']).to.startsWith('application/json')

      const responseRule3 = await axios.get(`http://localhost:${availablePort}/hello3/d`)
      expect(responseRule3.status).to.be.equal(200)
      expect(responseRule3.data.respo).to.be.equal('Test rule 3: {{req.query.q}} / {{req.params.id}}')
      expect(responseRule3.headers['x-yup']).to.be.equal('{{req.query.q}}')

      let exceptionThrownBecauseNoMethodMatch = false
      try {
        await axios.post(`http://localhost:${availablePort}/hello3/d`)
      } catch (e) {
        expect(e.response.status).to.be.equal(404)
        exceptionThrownBecauseNoMethodMatch = true
      }
      expect(exceptionThrownBecauseNoMethodMatch).to.be.equal(true)
    } finally {
      mockServer.stop()
    }
  } finally {
    config.reset()
  }
}

export {
  test
}
