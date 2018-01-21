import { ValidationModel } from './app-class-validation.service'
import { QueryOpts } from './learning-mode.db.model'

class LearningModeDbValidationModel extends ValidationModel {
  constructor () {
    super()
    this[QueryOpts] = {
      '$id': 'uri://mocker/learning-mode.db/QueryOptsValidationModel',
      'QueryOpts': {
        'type': 'object',
        'properties': {
          'sortQuery': {
            'type': 'object',
            'patternProperties': {
              '': {
                'enum': [ -1, 1 ]
              }
            }
          },
          'skip': {
            'type': 'integer',
            'minimum': 0
          },
          'limit': {
            'type': 'integer',
            'minimum': 1
          }
        },
        'required': [],
        'additionalProperties': false
      },
      '$ref': '#/QueryOpts'
    }
  }
}

export {
  LearningModeDbValidationModel
}
