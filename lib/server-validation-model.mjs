import { ValidationModel } from './app-class-validation.service'
import { Server, MockServer, LearningModeServer } from './server-model'
import { ServerStatus, LearningModeServerTypes } from './server.service'

class ServerValidationModel extends ValidationModel {
  constructor () {
    super()
    this[Server] = {
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

    this[MockServer] = {
      '$id': 'uri://mocker/server/MockServerValidationModel',
      'MockServer': {
        'type': 'object',
        'allOf': [
          {
            '$ref': `${this[Server].$id}#/Server`
          }
        ]
      },
      '$ref': '#/MockServer'
    }

    this[LearningModeServer] = {
      '$id': 'uri://mocker/server/LearningModeServerValidationModel',
      'LearningModeServer': {
        'type': 'object',
        'allOf': [
          {
            '$ref': `${this[Server].$id}#/Server`
          },
          {
            'properties': {
              'type': {
                'type': 'string',
                'enum': Object.values(LearningModeServerTypes)
              },
              'targetHost': {
                'type': 'string' // TODO can be more restricted? (proxy library itself doesn't validate it)
              }
            },
            'required': [
              'type'
            ],
            'anyOf': [ // targetHost is required for reverse proxy
              {
                'properties': {
                  'type': { 'enum': [LearningModeServerTypes.REVERSE_PROXY] }
                },
                'required': [ 'targetHost' ]
              },
              {
                'properties': {
                  'type': { 'enum': [LearningModeServerTypes.FORWARD_PROXY] }
                }
              }
            ]
          }
        ]
      },
      '$ref': '#/LearningModeServer'
    }
  }
}

export {
  ServerValidationModel
}
