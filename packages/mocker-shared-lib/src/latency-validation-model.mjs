import { ValidationModel } from './app-class-validation.service.mjs'
import { FixedLatency, RandomLatency } from './latency-model.mjs'

class LatencyValidationModel extends ValidationModel {
  constructor () {
    super()
    this[FixedLatency] = {
      $id: 'uri://mocker/latency/FixedLatencyValidationModel',
      FixedLatency: {
        type: 'object',
        properties: {
          value: {
            anyOf: [
              {
                type: 'number',
                minimum: 0
              }, {
                type: 'string'
              }
            ]
          }
        },
        required: [
          'value'
        ],
        additionalProperties: false
      },
      $ref: '#/FixedLatency'
    }

    this[RandomLatency] = {
      $id: 'uri://mocker/latency/RandomLatencyValidationModel',
      RandomLatency: {
        type: 'object',
        properties: {
          min: {
            anyOf: [
              {
                type: 'number',
                minimum: 0
              }, {
                type: 'string'
              }
            ]
          },
          max: {
            anyOf: [
              {
                type: 'number',
                minimum: 1
              }, {
                type: 'string'
              }
            ]
          }
        },
        required: [
          'max'
        ],
        additionalProperties: false
      },
      $ref: '#/RandomLatency'
    }
  }
}

export {
  LatencyValidationModel
}
