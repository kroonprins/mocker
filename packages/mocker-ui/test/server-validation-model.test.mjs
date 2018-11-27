import chai from 'chai'
import Ajv from 'ajv'
import ajvAsync from 'ajv-async'
import { MockServer, LearningModeServer } from '../src/server-model'
import { Server } from '@kroonprins/mocker-shared-lib/server-model'
import { ServerValidationModel } from '../src/server-validation-model'
import { ServerStatus, LearningModeServerTypes } from '@kroonprins/mocker-shared-lib/server.service'

const expect = chai.expect

// could split this up so that not all test run synchronously
const test = async () => {
  const serverValidationModel = new ServerValidationModel()

  const jsonSchemaValidator = ajvAsync(new Ajv())
  jsonSchemaValidator
    .addSchema(serverValidationModel[Server], 'Server')
    .addSchema(serverValidationModel[MockServer], 'MockServer')
    .addSchema(serverValidationModel[LearningModeServer], 'LearningModeServer')

  expect(await jsonSchemaValidator.validate('MockServer', new MockServer())).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('MockServer', new MockServer(8000))).to.be.equal(true)
  expect(await jsonSchemaValidator.validate('MockServer', new MockServer(0))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('MockServer', new MockServer(80000))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('MockServer', new MockServer(8000, 'localhost'))).to.be.equal(true)
  expect(await jsonSchemaValidator.validate('MockServer', new MockServer(8000, 1))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('MockServer', new MockServer(8000, 'http://www.google.com'))).to.be.equal(true)
  expect(await jsonSchemaValidator.validate('MockServer', new MockServer(8000, 'localhost', ServerStatus.CONSTRUCTED))).to.be.equal(true)
  expect(await jsonSchemaValidator.validate('MockServer', new MockServer(8000, 'localhost', 'nope'))).to.be.equal(false)

  expect(await jsonSchemaValidator.validate('LearningModeServer', new LearningModeServer())).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('LearningModeServer', new LearningModeServer(
    LearningModeServerTypes.REVERSE_PROXY,
    8000,
    'localhost'
  ))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('LearningModeServer', new LearningModeServer(
    LearningModeServerTypes.FORWARD_PROXY,
    8000,
    'localhost'
  ))).to.be.equal(true)
  expect(await jsonSchemaValidator.validate('LearningModeServer', new LearningModeServer(
    LearningModeServerTypes.REVERSE_PROXY,
    8000,
    'localhost',
    'http://www.google.com'))).to.be.equal(true)
}

export {
  test
}
