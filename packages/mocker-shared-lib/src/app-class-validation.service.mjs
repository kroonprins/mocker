import { JsonSchemaBasedClassValidationService } from './class-validation.service'
import { Logger } from './logging'
import { config } from './config'

/**
 * All validation models should inherit from this one so that their schemas will automatically be registered.
 */
class ValidationModel {}

/**
 * {@link JsonSchemaBasedClassValidationService} initialized with all models used in the app.
 *
 * @extends {JsonSchemaBasedClassValidationService}
 */
class AppClassValidationService extends JsonSchemaBasedClassValidationService {
  constructor () {
    super()
    this.logger = config.getClassInstance(Logger, { id: 'app.class-validation.service' })
    config.getInstancesForType(ValidationModel).forEach(validationModel => {
      this._registerSchemas(validationModel)
    })
  }

  _registerSchemas (validationModel) {
    for (const [type, schema] of Object.entries(validationModel)) {
      this.registerSchema(type, schema)
    }
  }
}

export {
  ValidationModel,
  AppClassValidationService
}
