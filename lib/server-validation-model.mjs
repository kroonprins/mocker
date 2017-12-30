import { ServerStatus, LearningModeServerTypes } from './server.service'

const ServerValidationModel = {
  '$id': 'uri://mocker/server/ServerValidationModel',
  'Server': {
    'type': 'object',
    'properties': {
      'port': {
        'type': 'integer',
        'minimum': 1,
        'maximum': 65535
      },
      'bindAddress': {
        'type': 'string'
      },
      'status': {
        'enum': Object.values(ServerStatus)
      }
    },
    'required': [
      'port'
    ]
  },
  '$ref': '#/Server'
}

const MockServerValidationModel = {
  '$id': 'uri://mocker/server/MockServerValidationModel',
  'MockServer': {
    'type': 'object',
    'allOf': [
      {
        '$ref': `${ServerValidationModel.$id}#/Server`
      }
    ]
  },
  '$ref': '#/MockServer'
}

const LearningModeServerValidationModel = {
  '$id': 'uri://mocker/server/LearningModeServerValidationModel',
  'LearningModeServer': {
    'type': 'object',
    'allOf': [
      {
        '$ref': `${ServerValidationModel.$id}#/Server`
      },
      {
        'properties': {
          'type': {
            'type': 'string',
            'enum': Object.values(LearningModeServerTypes)
          },
          'targetHost': {
            'type': 'string'
          }
        },
        'required': [
          'type', 'targetHost'
        ]
      }
    ]
  },
  '$ref': '#/LearningModeServer'
}

export {
  ServerValidationModel,
  MockServerValidationModel,
  LearningModeServerValidationModel
}
