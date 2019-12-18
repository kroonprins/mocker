import { BaseServerValidationModel } from '@kroonprins/mocker-shared-lib/server-validation-model.mjs'
import { Server } from '@kroonprins/mocker-shared-lib/server-model.mjs'
import { LearningModeServerTypes } from '@kroonprins/mocker-shared-lib/server.service.mjs'
import { MockServer, LearningModeServer } from './server-model.mjs'

class ServerValidationModel extends BaseServerValidationModel {
  constructor () {
    super()

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
