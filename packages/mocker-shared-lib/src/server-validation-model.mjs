import { ValidationModel } from './app-class-validation.service.mjs'
import { Server } from './server-model.mjs'
import { ServerStatus } from './server.service.mjs'

class BaseServerValidationModel extends ValidationModel {
  constructor () {
    super()
    this[Server] = {
      $id: 'uri://mocker/server/ServerValidationModel',
      Server: {
        type: 'object',
        properties: {
          port: {
            type: 'integer',
            minimum: 1,
            maximum: 65535
          },
          bindAddress: {
            type: 'string'
          },
          status: {
            enum: Object.values(ServerStatus)
          }
        },
        required: [
          'port'
        ]
      },
      $ref: '#/Server'
    }
  }
}

export {
  BaseServerValidationModel
}
