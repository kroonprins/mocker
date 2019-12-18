import chai from 'chai'
import Ajv from 'ajv'
import ajvAsync from 'ajv-async'
import { QueryOpts } from '../src/learning-mode.db.model.mjs'
import { LearningModeDbValidationModel } from '../src/learning-mode.db.validation-model.mjs'

const expect = chai.expect

const test = async () => {
  const learningModeDbValidationModel = new LearningModeDbValidationModel()

  const jsonSchemaValidator = ajvAsync(new Ajv())
  jsonSchemaValidator
    .addSchema(learningModeDbValidationModel[QueryOpts], 'QueryOpts')

  expect(await jsonSchemaValidator.validate('QueryOpts', new QueryOpts())).to.be.equal(true)

  expect(await jsonSchemaValidator.validate('QueryOpts', new QueryOpts({ col1: 1, col2: -1 }))).to.be.equal(true)
  expect(await jsonSchemaValidator.validate('QueryOpts', new QueryOpts({ col1: 1, col2: 0 }))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('QueryOpts', new QueryOpts(undefined, 1))).to.be.equal(true)
  expect(await jsonSchemaValidator.validate('QueryOpts', new QueryOpts(undefined, 0))).to.be.equal(true)
  expect(await jsonSchemaValidator.validate('QueryOpts', new QueryOpts(undefined, -1))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('QueryOpts', new QueryOpts(undefined, 1, 1))).to.be.equal(true)
  expect(await jsonSchemaValidator.validate('QueryOpts', new QueryOpts(undefined, 1, 0))).to.be.equal(false)
}

export {
  test
}
