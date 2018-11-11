import chai from 'chai'
import chaiExclude from 'chai-exclude'
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
import { EchoServerService } from '../../lib/echo-server.service'
import { Logger, PinoLogger } from './../../lib/logging'
import { config } from './../../lib/config'

const expect = chai.expect
chai.use(chaiExclude)

// could split this up so that not all test run synchronously
const test = async () => {
  try {
    const projectFileLocation = './test/projects/echo_test.yaml'

    config
      .registerProperty('logging.level.startup', 'debug')
      .registerType(Logger, PinoLogger)
      .registerProperty('project.location', projectFileLocation)
      .registerProperty('mock-server.watch-for-configuration-changes', false)
      .registerProperty('mock-server-swagger-ui.enabled', false)
      .registerInstance(EchoServerService, new EchoServerService())
      .registerInstance('NunjucksTemplatingHelpers', new NunjucksTemplatingHelpers())
      .registerInstance('NunjucksTemplatingHelpers', new NunjucksTemplatingHelpers())
      .registerInstance('NunjucksTemplatingService', new NunjucksTemplatingService())
      .registerInstance(TemplatingService, new TemplatingService())
      .registerInstance(LatencyValidationModel, new LatencyValidationModel())
      .registerInstance(RuleValidationModel, new RuleValidationModel(new ConfigService()))
      .registerInstance(ProjectValidationModel, new ProjectValidationModel())

    const appClassValidationService = new AppClassValidationService()
    config
      .registerInstance(ClassValidationService, appClassValidationService)

    const templatingService = config.getInstance(TemplatingService)
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

    const mockServer = new MockServer(availablePort, 'localhost', 'test_echo', projectService, templatingService)
    try {
      await mockServer.start()

      const responseSimpleGet = await axios.get(`http://localhost:${availablePort}/echo`, {
        headers: {
          'X-test': 'value1',
          'X-other': 'value2',
          'user-agent': 'axios',
          'accept': 'application/json'
        }
      })
      expect(responseSimpleGet.status).to.be.equal(200)
      expect(responseSimpleGet.data.method).to.be.equal('GET')
      expect(responseSimpleGet.data.path).to.be.equal('/echo')
      expect(responseSimpleGet.data.fullPath).to.be.equal('/echo')
      expect(responseSimpleGet.data.body).to.be.deep.equal({})
      expect(responseSimpleGet.data.params).to.be.deep.equal({})
      expect(responseSimpleGet.data.headers).excluding('connection').to.be.deep.equal({
        accept: 'application/json',
        'x-test': 'value1',
        'x-other': 'value2',
        'user-agent': 'axios',
        host: `localhost:${availablePort}`
      })
      expect(responseSimpleGet.data.cookies).to.be.deep.equal({})

      const responseGetWithParametersAndCookies = await axios.get(`http://localhost:${availablePort}/echo?a=b&a=c&z=x`, {
        headers: {
          'X-test': 'value1',
          'X-other': 'value2',
          'user-agent': 'axios',
          'accept': 'application/json',
          'Cookie': 'cookie1=value1; cookie2=value2'
        }
      })
      expect(responseGetWithParametersAndCookies.status).to.be.equal(200)
      expect(responseGetWithParametersAndCookies.data.method).to.be.equal('GET')
      expect(responseGetWithParametersAndCookies.data.path).to.be.equal('/echo')
      expect(responseGetWithParametersAndCookies.data.fullPath).to.be.equal('/echo?a=b&a=c&z=x')
      expect(responseGetWithParametersAndCookies.data.body).to.be.deep.equal({})
      expect(responseGetWithParametersAndCookies.data.params).to.be.deep.equal({ a: 'b,c', z: 'x' })
      expect(responseGetWithParametersAndCookies.data.headers).excluding('connection').to.be.deep.equal({
        accept: 'application/json',
        'x-test': 'value1',
        'x-other': 'value2',
        'user-agent': 'axios',
        host: `localhost:${availablePort}`
      })
      expect(responseGetWithParametersAndCookies.data.cookies).to.be.deep.equal({ cookie1: 'value1', cookie2: 'value2' })

      const responsePost = await axios.post(`http://localhost:${availablePort}/echo`, {
        'a': 'b',
        'c': {
          'd': 'e',
          'f': [ 'h', 'i', 'j' ]
        }
      }, {
        headers: {
          'X-test': 'value1',
          'X-other': 'value2',
          'user-agent': 'axios',
          'accept': 'application/json',
          'Cookie': 'cookie1=value1; cookie2=value2',
          'content-type': 'application/json'
        }
      })
      expect(responsePost.status).to.be.equal(200)
      expect(responsePost.data.method).to.be.equal('POST')
      expect(responsePost.data.path).to.be.equal('/echo')
      expect(responsePost.data.fullPath).to.be.equal('/echo')
      expect(responsePost.data.body).to.be.deep.equal({
        'a': 'b',
        'c': {
          'd': 'e',
          'f': [ 'h', 'i', 'j' ]
        }
      })
      expect(responsePost.data.params).to.be.deep.equal({})
      expect(responsePost.data.headers).excluding(['connection', 'content-length']).to.be.deep.equal({
        accept: 'application/json',
        'x-test': 'value1',
        'x-other': 'value2',
        'user-agent': 'axios',
        host: `localhost:${availablePort}`,
        'content-type': 'application/json'
      })
      expect(responsePost.data.cookies).to.be.deep.equal({ cookie1: 'value1', cookie2: 'value2' })

      const responsePostWithTextBody = await axios.post(`http://localhost:${availablePort}/echo`, 'text', {
        headers: {
          'X-test': 'value1',
          'X-other': 'value2',
          'user-agent': 'axios',
          'accept': 'application/json',
          'Cookie': 'cookie1=value1; cookie2=value2',
          'content-type': 'text/plain'
        }
      })
      expect(responsePostWithTextBody.status).to.be.equal(200)
      expect(responsePostWithTextBody.data.method).to.be.equal('POST')
      expect(responsePostWithTextBody.data.path).to.be.equal('/echo')
      expect(responsePostWithTextBody.data.fullPath).to.be.equal('/echo')
      expect(responsePostWithTextBody.data.body).to.be.equal('text')
      expect(responsePostWithTextBody.data.params).to.be.deep.equal({})
      expect(responsePostWithTextBody.data.headers).excluding(['connection', 'content-length']).to.be.deep.equal({
        accept: 'application/json',
        'x-test': 'value1',
        'x-other': 'value2',
        'user-agent': 'axios',
        host: `localhost:${availablePort}`,
        'content-type': 'text/plain'
      })
      expect(responsePostWithTextBody.data.cookies).to.be.deep.equal({ cookie1: 'value1', cookie2: 'value2' })

      const responsePostWithXmlBody = await axios.post(`http://localhost:${availablePort}/echo`, '<a><b>cc</b><c>dd</c></a>', {
        headers: {
          'X-test': 'value1',
          'X-other': 'value2',
          'user-agent': 'axios',
          'accept': 'application/json',
          'Cookie': 'cookie1=value1; cookie2=value2',
          'content-type': 'application/xml'
        }
      })
      expect(responsePostWithXmlBody.status).to.be.equal(200)
      expect(responsePostWithXmlBody.data.method).to.be.equal('POST')
      expect(responsePostWithXmlBody.data.path).to.be.equal('/echo')
      expect(responsePostWithXmlBody.data.fullPath).to.be.equal('/echo')
      expect(responsePostWithXmlBody.data.body).to.be.deep.equal({
        a: {
          b: ['cc'], // the consequences of bodyParser.xml
          c: ['dd']
        }
      })
      expect(responsePostWithXmlBody.data.params).to.be.deep.equal({})
      expect(responsePostWithXmlBody.data.headers).excluding(['connection', 'content-length']).to.be.deep.equal({
        accept: 'application/json',
        'x-test': 'value1',
        'x-other': 'value2',
        'user-agent': 'axios',
        host: `localhost:${availablePort}`,
        'content-type': 'application/xml'
      })
      expect(responsePostWithXmlBody.data.cookies).to.be.deep.equal({ cookie1: 'value1', cookie2: 'value2' })
    } finally {
      await mockServer.stop()
    }
  } finally {
    config.reset()
  }
}

export {
  test
}
