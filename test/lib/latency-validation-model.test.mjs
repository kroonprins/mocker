import chai from 'chai'
import Ajv from 'ajv'
import ajvAsync from 'ajv-async'
import { FixedLatency, RandomLatency } from '../../lib/latency-model'
import { LatencyValidationModel } from '../../lib/latency-validation-model'
import { Logger, PinoLogger } from './../../lib/logging'
import { config } from './../../lib/config'

const expect = chai.expect

// could split this up so that not all test run synchronously
const test = async () => {
  config
    .registerProperty('logging.level.startup', 'debug')
    .registerType(Logger, PinoLogger)

  const latencyValidationModel = new LatencyValidationModel()

  const jsonSchemaValidator = ajvAsync(new Ajv())
  jsonSchemaValidator
    .addSchema(latencyValidationModel[FixedLatency], 'FixedLatency')
    .addSchema(latencyValidationModel[RandomLatency], 'RandomLatency')

  expect(await jsonSchemaValidator.validate('FixedLatency', new FixedLatency())).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('FixedLatency', new FixedLatency(0))).to.be.equal(true)
  expect(await jsonSchemaValidator.validate('FixedLatency', new FixedLatency(100))).to.be.equal(true)
  expect(await jsonSchemaValidator.validate('FixedLatency', new FixedLatency(-1))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('FixedLatency', new FixedLatency(2.5))).to.be.equal(true)

  expect(await jsonSchemaValidator.validate('RandomLatency', new RandomLatency())).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('RandomLatency', new RandomLatency(1))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('RandomLatency', new RandomLatency(1, 2))).to.be.equal(true)
  expect(await jsonSchemaValidator.validate('RandomLatency', new RandomLatency(undefined, 2))).to.be.equal(true)
  expect(await jsonSchemaValidator.validate('RandomLatency', new RandomLatency(1, -2))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('RandomLatency', new RandomLatency(-1, 2))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('RandomLatency', new RandomLatency(0, 0))).to.be.equal(false)
}

export {
  test
}
