import { ValidationModel } from './app-class-validation.service'
import { Request, Header, Cookie, Response, ConditionalResponse, ConditionalResponseValue, Rule } from './rule-model'
import { ConfigService } from './config.service'
import { LatencyValidationModel } from './latency-validation-model'
import { FixedLatency, RandomLatency } from './latency-model'
import { config } from './config'

class RuleValidationModel extends ValidationModel {
  constructor (configService = config.getInstance(ConfigService), latencyValidationModel = config.getInstance(LatencyValidationModel)) {
    super()
    this[Request] = {
      '$id': 'uri://mocker/rule/RequestValidationModel',
      'Request': {
        'type': 'object',
        'properties': {
          'method': {
            'type': 'string',
            'enum': configService.getSync('http-methods')
          },
          'path': {
            'type': 'string',
            'pattern': '/.*' // TODO good check for path
          }
        },
        'required': [
          'method', 'path'
        ]
        // 'additionalProperties': false
      },
      '$ref': '#/Request'
    }

    this[Header] = {
      '$id': 'uri://mocker/rule/HeaderValidationModel',
      'Header': {
        'type': 'object',
        'properties': {
          'name': {
            'type': 'string'
          },
          'value': {
            'type': ['string', 'integer', 'null']
          }
        },
        'required': [
          'name'
        ]
        // 'additionalProperties': false
      },
      '$ref': '#/Header'
    }

    this[Cookie] = {
      '$id': 'uri://mocker/rule/CookieValidationModel',
      'Cookie': {
        'type': 'object',
        'properties': {
          'name': {
            'type': 'string'
          },
          'value': {
            'type': ['string', 'number', 'null']
          },
          'properties': {
            'type': 'object',
            'properties': {
              'domain': {
                'type': 'string'
              },
              'encode': {
                'type': 'string'
              },
              'expires': {
                // 'type': 'string',
                // 'format': 'date'
                'type': ['string', 'object'] // TODO could be date object as well as string?
              },
              'httpOnly': {
                'type': [ 'boolean', 'string' ] // string possible because can be template expression (TODO create format?)
              },
              'maxAge': {
                'type': [ 'integer', 'string' ],
                'minimum': 0
              },
              'path': {
                'type': 'string'
              },
              'secure': {
                'type': [ 'boolean', 'string' ]
              },
              'signed': {
                'type': [ 'boolean', 'string' ]
              },
              'sameSite': {
                'type': ['boolean', 'string']
              }
            },
            'additionalProperties': false
          }
        },
        'required': [
          'name'
        ]
        // 'additionalProperties': false
      },
      '$ref': '#/Cookie'
    }

    this[Response] = {
      '$id': 'uri://mocker/rule/ResponseValidationModel',
      'Response': {
        'type': 'object',
        'properties': {
          'templatingEngine': {
            'type': 'string',
            'enum': configService.getSync('templating-types')
          },
          'fixedLatency': {
            'anyOf': [{
              '$ref': `${latencyValidationModel[FixedLatency].$id}#/FixedLatency`
            }, { 'type': 'null' }]
          },
          'randomLatency': {
            'anyOf': [{
              '$ref': `${latencyValidationModel[RandomLatency].$id}#/RandomLatency`
            }, { 'type': 'null' }]
          },
          'contentType': {
            'type': [ 'string', 'null' ] // TODO get list of values from function?
          },
          'statusCode': {
            'type': [ 'integer', 'string' ] // TODO get list of all allowed?
          },
          'headers': {
            'type': 'array',
            'items': {
              '$ref': `${this[Header].$id}#/Header`
            }
          },
          'cookies': {
            'type': 'array',
            'items': {
              '$ref': `${this[Cookie].$id}#/Cookie`
            }
          },
          'body': {
            'type': ['string', 'null']
          }
        },
        'required': [
          'templatingEngine', 'statusCode'
        ]
        // 'additionalProperties': false
      },
      '$ref': '#/Response'
    }

    // TODO manage overlap with non-conditional response
    this[ConditionalResponseValue] = {
      '$id': 'uri://mocker/rule/ConditionalResponseValueValidationModel',
      'ConditionalResponseValue': {
        'type': 'object',
        'properties': {
          'condition': {
            'type': ['boolean', 'string']
          },
          'fixedLatency': {
            'anyOf': [{
              '$ref': `${latencyValidationModel[FixedLatency].$id}#/FixedLatency`
            }, { 'type': 'null' }]
          },
          'randomLatency': {
            'anyOf': [{
              '$ref': `${latencyValidationModel[RandomLatency].$id}#/RandomLatency`
            }, { 'type': 'null' }]
          },
          'contentType': {
            'type': 'string' // TODO get list of values from function?
          },
          'statusCode': {
            'type': [ 'integer', 'string' ] // TODO get list of all allowed?
          },
          'headers': {
            'type': 'array',
            'items': {
              '$ref': `${this[Header].$id}#/Header`
            }
          },
          'cookies': {
            'type': 'array',
            'items': {
              '$ref': `${this[Cookie].$id}#/Cookie`
            }
          },
          'body': {
            'type': ['string', 'null']
          }
        },
        'required': [
          'condition', 'contentType', 'statusCode' // TODO is content-type mandatory response header in http spec?
          // TODO only one of fixedLatency/randomLatency
        ]
        // 'additionalProperties': false
      },
      '$ref': '#/ConditionalResponseValue'
    }

    this[ConditionalResponse] = {
      '$id': 'uri://mocker/rule/ConditionalResponseValidationModel',
      'ConditionalResponse': {
        'type': 'object',
        'properties': {
          'templatingEngine': {
            'type': 'string',
            'enum': configService.getSync('templating-types')
          },
          'response': {
            'type': 'array',
            'minItems': 1,
            'items': {
              '$ref': `${this[ConditionalResponseValue].$id}#/ConditionalResponseValue`
            }
          }
        },
        'required': [
          'templatingEngine', 'response'
        ]
        // 'additionalProperties': false
      },
      '$ref': '#/ConditionalResponse'
    }

    this[Rule] = {
      '$id': 'uri://mocker/rule/RuleValidationModel',
      'Rule': {
        'type': 'object',
        'properties': {
          'name': {
            'type': 'string',
            'minLength': 1,
            'maxLength': 100
          },
          'request': {
            '$ref': `${this[Request].$id}#/Request`
          },
          'response': {
            '$ref': `${this[Response].$id}#/Response`
          },
          'conditionalResponse': {
            '$ref': `${this[ConditionalResponse].$id}#/ConditionalResponse`
          }
        },
        'required': [
          'name', 'request'
        ],
        'oneOf': [
          {
            'required': [
              'response'
            ]
          },
          {
            'required': [
              'conditionalResponse'
            ]
          }
        ]
        // 'additionalProperties': false
      },
      '$ref': '#/Rule'
    }
  }
}

export {
  RuleValidationModel
}
