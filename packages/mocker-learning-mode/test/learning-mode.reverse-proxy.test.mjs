import chai from 'chai'
import chaiExclude from 'chai-exclude'
import chaiString from 'chai-string'
import portastic from 'portastic'
import axios from 'axios'
import { TestServer } from './resources/test-server'
import { LearningModeReverseProxyServer } from '../src/learning-mode.reverse-proxy'
import { LearningModeService } from '../src/learning-mode.service'
import { LearningModeDbService } from '../src/learning-mode.db.service'
import { LearningModeDbValidationModel } from '../src/learning-mode.db.validation-model'
import { AppClassValidationService } from '@kroonprins/mocker-shared-lib/app-class-validation.service'
import { unlinkAsync } from '@kroonprins/mocker-shared-lib/fs-util'
import { Logger, PinoLogger } from '@kroonprins/mocker-shared-lib/logging'
import { config } from '@kroonprins/mocker-shared-lib/config'

const expect = chai.expect
chai.use(chaiString)
chai.use(chaiExclude)

// could split this up so that not all test run synchronously
const test = async () => {
  const dbFile = './test/tmp/test2.db'

  try {
    config
      .registerProperty('logging.level.startup', 'debug')
      .registerType(Logger, PinoLogger)
      .registerInstance(LearningModeDbValidationModel, new LearningModeDbValidationModel())

    let learningModeDbService = new LearningModeDbService(
      dbFile,
      new AppClassValidationService()
    )
    let learningModeService = new LearningModeService(learningModeDbService)

    const availablePorts = (await portastic.find({
      min: 30000,
      max: 40000,
      retrieve: 2
    }))
    const testServerPort = availablePorts[0]
    const reverseProxyPort = availablePorts[1]

    const testServer = new TestServer(testServerPort)
    const proxyServer = new LearningModeReverseProxyServer(reverseProxyPort, 'localhost', `http://localhost:${testServerPort}`, 'reverseProxyTestProject', learningModeService)

    try {
      Promise.all([
        await testServer.start(),
        await proxyServer.start()
      ])

      const checkEmptyDb = await learningModeService.findRecordedRequests('reverseProxyTestProject')
      expect(checkEmptyDb.length).to.be.equal(0)

      const testServerResponse = await axios.get(`http://localhost:${testServerPort}/test1`)

      const proxiedRequestToBeEqualToTestServerResponse = await axios.get(`http://localhost:${reverseProxyPort}/test1`)
      expect(proxiedRequestToBeEqualToTestServerResponse.status).to.be.equal(200)
      expect(proxiedRequestToBeEqualToTestServerResponse.data).to.be.equal('test1')
      expect(proxiedRequestToBeEqualToTestServerResponse.headers['set-cookie'].length).to.be.equal(1)
      expect(proxiedRequestToBeEqualToTestServerResponse.headers['set-cookie'][0]).to.be.equal('koek=njamnjam; Path=/; HttpOnly; Secure')
      expect(proxiedRequestToBeEqualToTestServerResponse.headers['x-test']).to.be.equal('a')

      expect(proxiedRequestToBeEqualToTestServerResponse.status).to.be.equal(testServerResponse.status)
      expect(proxiedRequestToBeEqualToTestServerResponse.data).to.be.equal(testServerResponse.data)

      expect(proxiedRequestToBeEqualToTestServerResponse.headers).excluding(['date', 'access-control-allow-origin']).to.deep.equal(testServerResponse.headers)

      const checkRequestRecorded = await learningModeService.findRecordedRequests('reverseProxyTestProject')
      expect(checkRequestRecorded.length).to.be.equal(1)
      const recorded = checkRequestRecorded[0]
      expect(recorded.id).is.a('string')
      expect(recorded.project).to.be.equal('reverseProxyTestProject')
      expect(recorded.timestamp).to.be.a('date')
      expect(recorded.request.method).to.be.equal('GET')
      expect(recorded.request.path).to.be.equal('/test1')
      expect(recorded.request.fullPath).to.be.equal('/test1')
      expect(recorded.request.body).to.be.equal('')
      expect(recorded.request.headers.length).to.be.greaterThan(0)
      expect(recorded.response.contentType).to.startsWith('text/html')
      expect(recorded.response.statusCode).to.be.equal(200)
      expect(recorded.response.body).to.be.equal('test1')
      expect(recorded.response.cookies.length).to.be.equal(1)
      expect(recorded.response.cookies[0].name).to.be.equal('koek')
      expect(recorded.response.cookies[0].value).to.be.equal('njamnjam')
      expect(recorded.response.cookies[0].properties.httpOnly).to.be.equal(true)
      expect(recorded.response.cookies[0].properties.secure).to.be.equal(true)
      expect(recorded.response.cookies[0].properties.path).to.be.equal('/')

      const secondRequest = await axios.get(`http://localhost:${reverseProxyPort}/test1?q1=param1&q2=param2`, {
        headers: {
          'X-test': 'header1',
          'X-tost': 'header2',
          Cookie: 'cookie1=c1; cookie2=c2;'
        }
      })
      expect(secondRequest.status).to.be.equal(200)
      const checkSecondRequestRecorded = await learningModeService.findRecordedRequests('reverseProxyTestProject')
      expect(checkSecondRequestRecorded.length).to.be.equal(2)
      const secondRecordedRequest = checkSecondRequestRecorded.filter((req) => {
        return req.id !== recorded.id
      })[0]
      expect(secondRecordedRequest.project).to.be.equal('reverseProxyTestProject')
      expect(secondRecordedRequest.request.method).to.be.equal('GET')
      expect(secondRecordedRequest.request.path).to.be.equal('/test1')
      expect(secondRecordedRequest.request.fullPath).to.be.equal('/test1?q1=param1&q2=param2')
      expect(secondRecordedRequest.request.params[0].name).to.be.equal('q1')
      expect(secondRecordedRequest.request.params[0].value).to.be.equal('param1')
      expect(secondRecordedRequest.request.params[1].name).to.be.equal('q2')
      expect(secondRecordedRequest.request.params[1].value).to.be.equal('param2')
      const cookieHeader = secondRecordedRequest.request.headers.filter((header) => {
        return header.name === 'cookie'
      })
      expect(cookieHeader.length).to.be.equal(0)
      const xTestHeader = secondRecordedRequest.request.headers.filter((header) => {
        return header.name === 'x-test'
      })[0]
      expect(xTestHeader.value).to.be.equal('header1')
      const xTostHeader = secondRecordedRequest.request.headers.filter((header) => {
        return header.name === 'x-tost'
      })[0]
      expect(xTostHeader.value).to.be.equal('header2')
      expect(secondRecordedRequest.request.cookies[0].name).to.be.equal('cookie1')
      expect(secondRecordedRequest.request.cookies[0].value).to.be.equal('c1')
      expect(secondRecordedRequest.request.cookies[1].name).to.be.equal('cookie2')
      expect(secondRecordedRequest.request.cookies[1].value).to.be.equal('c2')

      const thirdRequest = await axios.post(`http://localhost:${reverseProxyPort}/test2`, {
        a: 'b'
      }, {
        headers: {
          'X-test': 'header1'
        }
      })
      expect(thirdRequest.status).to.be.equal(200)
      const checkThirdRequestRecorded = await learningModeService.findRecordedRequests('reverseProxyTestProject')
      expect(checkThirdRequestRecorded.length).to.be.equal(3)
      const thirdRecordedRequest = checkThirdRequestRecorded.filter((req) => {
        return req.id !== checkSecondRequestRecorded[0].id && req.id !== checkSecondRequestRecorded[1].id
      })[0]
      expect(thirdRecordedRequest.project).to.be.equal('reverseProxyTestProject')
      expect(thirdRecordedRequest.request.method).to.be.equal('POST')
      expect(thirdRecordedRequest.request.path).to.be.equal('/test2')
      expect(thirdRecordedRequest.request.fullPath).to.be.equal('/test2')
      expect(thirdRecordedRequest.request.params.length).to.be.equal(0)
      expect(thirdRecordedRequest.request.cookies.length).to.be.equal(0)
      expect(thirdRecordedRequest.request.body).to.be.equal('{"a":"b"}')
      expect(thirdRecordedRequest.response.body).to.be.equal('test2')
    } finally {
      Promise.all([
        await proxyServer.stop(),
        await testServer.stop()
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
