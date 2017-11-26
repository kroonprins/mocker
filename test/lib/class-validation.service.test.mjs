import chai from 'chai'
import { ClassValidationError, JsonSchemaBasedClassValidationService } from './../../lib/class-validation.service'
import { Logger, PinoLogger } from './../../lib/logging'
import { config } from './../../lib/config'

const expect = chai.expect

class TestClass {
  constructor (a, b) {
    this.a = a
    this.b = b
  }
}

// could split this up so that not all test run synchronously
const test = async () => {
  try {
    config
      .registerProperty('logging.level.startup', 'debug')
      .registerType(Logger, PinoLogger)

    let classValidationService = new JsonSchemaBasedClassValidationService()
      .registerSchema(TestClass, {
        '$id': 'uri://blabla',
        'type': 'object',
        'properties': {
          'a': {
            'type': 'integer'
          },
          'b': {
            'type': 'string',
            'maxLength': 2
          }
        },
        'required': [
          'a'
        ],
        'additionalProperties': false
      })

    let exceptionThrownBecauseRequiredPropertyNotSet = false
    try {
      await classValidationService.validate(TestClass, new TestClass())
    } catch (e) {
      expect(e).to.be.an.instanceof(ClassValidationError)
      exceptionThrownBecauseRequiredPropertyNotSet = true
    }
    expect(exceptionThrownBecauseRequiredPropertyNotSet).to.be.equal(true)

    let exceptionThrownBecauseSchemaNotRegistered = false
    try {
      await classValidationService.validate(Logger, {})
    } catch (e) {
      expect(e.message).to.be.equal('No schema has been registered for type \'Logger\'')
      exceptionThrownBecauseSchemaNotRegistered = true
    }
    expect(exceptionThrownBecauseSchemaNotRegistered).to.be.equal(true)

    const valid = await classValidationService.validate(TestClass, new TestClass(1))
    expect(valid).to.be.equal(true)

    classValidationService
      .registerSchema(TestClass, {
        'type': 'object',
        'properties': {
          'a': {
            'type': 'string'
          },
          'b': {
            'type': 'integer'
          }
        },
        'required': [
          'a'
        ],
        'additionalProperties': false
      })

    const validAfterNewSchema = await classValidationService.validate(TestClass, new TestClass('1'))
    expect(validAfterNewSchema).to.be.equal(true)
  } finally {
    config.reset()
  }
}

export {
  test
}
