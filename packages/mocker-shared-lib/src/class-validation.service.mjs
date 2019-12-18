import Ajv from 'ajv'
import ajvAsync from 'ajv-async'
import uuidv4 from 'uuid/v4.js'
import { Logger } from './logging.mjs'
import { config } from './config.mjs'
import { TechnicalValidationError } from './error-types.mjs'

/**
 * Error thrown when class instance validation fails. It will contain more information for the reason of the validation failure in the exception data.
 *
 * @extends {TechnicalValidationError}
 */
class ClassValidationError extends TechnicalValidationError { }

/**
 * Base class for class instance validation services.
 */
class ClassValidationService {
  validate (type, object) {
    throw Error('The method should be implemented by a sub class')
  }
}

/**
 * Class instance validator where validation happens based on a JSON schema.
 *
 * @extends {ClassValidationService}
 */
class JsonSchemaBasedClassValidationService extends ClassValidationService {
  constructor () {
    super()
    this.registeredSchemas = {}
    this.jsonSchemaValidator = ajvAsync(new Ajv())
    this.logger = config.getClassInstance(Logger, { id: 'json-schema.class-validation.service' })
  }

  /**
   * Register a json validaton schema for a type.
   *
   * @param {class} type class that the given schema describe
   * @param {object} schema object that is a valid json validation schema
   * @returns this so that the call can be chained
   * @memberof JsonSchemaBasedClassValidationService
   */
  registerSchema (type, schema) {
    // ajv 'addSchema' needs a string id for the schema => keep a mapping between a unique id and type in registeredSchema
    let schemaId
    if (type in this.registeredSchemas) {
      schemaId = this.registeredSchemas[type]
      // ajv 'addSchema' throws exception when overwriting an already added schema => remove it first
      this.jsonSchemaValidator.removeSchema(schemaId)
    } else {
      if ('$id' in schema) {
        // if schema contains a $id property this is used as unique identifier
        schemaId = schema.$id
      } else {
        // otherwise a unique id is generated
        this.logger.warn(schema, 'This schema does not define a $id')
        const uuid = uuidv4()
        schemaId = `${type.name}_${uuid}`
      }
    }
    this.registeredSchemas[type] = schemaId
    this.jsonSchemaValidator.addSchema(schema, schemaId)
    return this
  }

  /**
   * Validate an instance of a given type. Throws an {@link ClassValidationError} if not valid.
   *
   * @param {class} type class that the given object is expected to be an instance of
   * @param {object} object object to validate
   * @returns true if valid, otherwise a {@link ClassValidationError} is thrown
   * @throws {ClassValidationError} if the object is not valid
   * @throws {Error} when no schema is registered for the given type
   * @memberof JsonSchemaBasedClassValidationService
   */
  async validate (type, object) {
    this.logger.debug(object, 'Validating type %s', type)
    const schemaId = this.registeredSchemas[type]
    if (!schemaId) {
      this.logger.debug(this.registeredSchemas, 'Registered schemas')
      throw new Error(`No schema has been registered for type '${type.name}'`)
    }
    const valid = await this.jsonSchemaValidator.validate(schemaId, object)
    if (!valid) {
      this.logger.warn('Validation failed of type %s for object %o, with errors %o', type, object, this.jsonSchemaValidator.errors)
      throw new ClassValidationError('Validation failed', 'validation error', {
        errors: this.jsonSchemaValidator.errors
      })
    }
    return true
  }
}

export {
  ClassValidationError,
  ClassValidationService,
  JsonSchemaBasedClassValidationService
}
