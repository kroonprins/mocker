import chai from 'chai'
import { ProjectService } from './../../lib/project-service'
import { InMemoryProjectStore } from './../../lib/project-store'
import { RuleService } from './../../lib/rule-service'
import { AppClassValidationService } from '../../lib/app-class-validation.service'
import { SwaggerGenerationService } from '../../lib/swagger-generation.service'
import { ProjectValidationModel } from './../../lib/project-validation-model'
import { ConfigService } from './../../lib/config.service'
import { LatencyValidationModel } from './../../lib/latency-validation-model'
import { RuleValidationModel } from './../../lib/rule-validation-model'
import { TemplatingService } from './../../lib/templating-service'
import { NunjucksTemplatingHelpers } from './../../lib/templating-helpers.nunjucks'
import { NunjucksTemplatingService } from './../../lib/templating-service.nunjucks'
import { Logger, PinoLogger } from './../../lib/logging'
import { config } from './../../lib/config'
const expect = chai.expect

// could split this up so that not all test run synchronously
const test = async () => {
  try {
    config
      .registerProperty('logging.level.startup', 'debug')
      .registerType(Logger, PinoLogger)
      .registerInstance('NunjucksTemplatingHelpers', new NunjucksTemplatingHelpers())
      .registerInstance('NunjucksTemplatingService', new NunjucksTemplatingService())
      .registerInstance(TemplatingService, new TemplatingService())
      .registerInstance(LatencyValidationModel, new LatencyValidationModel())
      .registerInstance(RuleValidationModel, new RuleValidationModel(new ConfigService()))
      .registerInstance(ProjectValidationModel, new ProjectValidationModel())

    const projectService = new ProjectService(
      new InMemoryProjectStore(
        './test/projects/swagger_test.yaml',
        './test/rules',
        new RuleService(),
        new AppClassValidationService()
      ))

    const servers = [{
      url: 'http://bind:8989', description: 'desc'
    }]

    const swaggerGenerationService = new SwaggerGenerationService(projectService)

    const openApiDefinition = await swaggerGenerationService.generate('test_swagger', servers)

    expect(openApiDefinition.openapi).to.equal('3.0.0')
    expect(openApiDefinition.servers).to.deep.equal(servers)
    expect(openApiDefinition.info).to.deep.equal({
      description: 'OpenAPI definitions for the rules of project test_swagger',
      title: 'test_swagger'
    })

    expect(openApiDefinition.paths['/get']['get']).to.deep.equal({
      summary: 'swagger get without templating',
      description:
        'Rule \'swagger get without templating\' located at ../rules/swagger get.yaml',
      parameters: [],
      responses:
      {
        '200':
        {
          description: 'A response using the following templating engine: none',
          headers: {},
          content:
            { 'plain/text': { schema: { type: 'string', example: 'hello swagger for get' } } }
        }
      }
    })

    expect(openApiDefinition.paths['/post']['post']).to.deep.equal({
      summary: 'swagger post without templating',
      description:
        'Rule \'swagger post without templating\' located at ../rules/swagger post.yaml',
      parameters: [],
      responses:
      {
        '200':
        {
          description: 'A response using the following templating engine: none',
          headers: {},
          content:
            { 'plain/text': { schema: { type: 'string', example: 'hello swagger for post' } } }
        }
      }
    })

    expect(openApiDefinition.paths['/get/{pathParam}']['get']).to.deep.equal({
      summary: 'swagger get with one path parameter',
      description:
        'Rule \'swagger get with one path parameter\' located at ../rules/swagger one_path_parameter.yaml',
      parameters: [{
        in: 'path',
        name: 'pathParam',
        schema: {
          type: 'string'
        }
      }],
      responses:
      {
        '200':
        {
          description: 'A response using the following templating engine: none',
          headers: {},
          content:
            { 'plain/text': { schema: { type: 'string', example: 'hello swagger for one path parameter' } } }
        }
      }
    })

    expect(openApiDefinition.paths['/get/{pathParam1}/yo/{pathParam2}/yu/{3}/{4}']['get']).to.deep.equal({
      summary: 'swagger get with multiple path parameters',
      description:
        'Rule \'swagger get with multiple path parameters\' located at ../rules/swagger multiple_path_parameters.yaml',
      parameters: [{
        in: 'path',
        name: 'pathParam1',
        schema: {
          type: 'string'
        }
      }, {
        in: 'path',
        name: 'pathParam2',
        schema: {
          type: 'string'
        }
      }, {
        in: 'path',
        name: '3',
        schema: {
          type: 'string'
        }
      }, {
        in: 'path',
        name: '4',
        schema: {
          type: 'string'
        }
      }],
      responses:
      {
        '200':
        {
          description: 'A response using the following templating engine: none',
          headers: {},
          content:
            { 'plain/text': { schema: { type: 'string', example: 'hello swagger for multiple path parameters' } } }
        }
      }
    })

    expect(openApiDefinition.paths['/get501']['get']).to.deep.equal({
      summary: 'swagger get with 501 status code',
      description:
        'Rule \'swagger get with 501 status code\' located at ../rules/swagger statusCode.yaml',
      parameters: [],
      responses:
      {
        '501':
        {
          description: 'A response using the following templating engine: none',
          headers: {},
          content:
            { 'plain/text': { schema: { type: 'string', example: 'hello swagger for http/501' } } }
        }
      }
    })

    expect(openApiDefinition.paths['/getTemplatedStatusCode']['get']).to.deep.equal({
      summary: 'swagger get with templated status code',
      description:
        'Rule \'swagger get with templated status code\' located at ../rules/swagger templated_statusCode.yaml',
      parameters: [],
      responses:
      {
        '{% if req.params.id > 5 %}400{% else %}200{% endif %}':
        {
          description: 'A response using the following templating engine: nunjucks',
          headers: {},
          content:
            { 'plain/text': { schema: { type: 'string', example: 'hello swagger for templated status code' } } }
        }
      }
    })

    expect(openApiDefinition.paths['/get_response_headers']['get']).to.deep.equal({
      summary: 'swagger get with response headers',
      description:
        'Rule \'swagger get with response headers\' located at ../rules/swagger response_headers.yaml',
      parameters: [{
        in: 'query',
        name: 'q2',
        schema: {
          type: 'string'
        }
      }, {
        in: 'query',
        name: 'q4',
        schema: {
          type: 'string'
        }
      }],
      responses:
      {
        '200':
        {
          description: 'A response using the following templating engine: nunjucks',
          headers: {
            'x-header-1': {
              description: 'value = value1'
            },
            'x-header-2': {
              description: 'value = {{req.query.q2}}'
            },
            'x-header-3': {
              description: 'value = value3'
            },
            'x-header-4': {
              description: 'value = {{req.query.q4}}'
            }
          },
          content:
            { 'plain/text': { schema: { type: 'string', example: 'hello swagger with response headers' } } }
        }
      }
    })

    expect(openApiDefinition.paths['/get_response_cookies']['get']).to.deep.equal({
      summary: 'swagger get with response cookies',
      description:
        'Rule \'swagger get with response cookies\' located at ../rules/swagger response_cookies.yaml',
      parameters: [{
        in: 'query',
        name: 'q2',
        schema: {
          type: 'string'
        }
      }, {
        in: 'query',
        name: 'q4',
        schema: {
          type: 'string'
        }
      }],
      responses:
      {
        '200':
        {
          description: 'A response using the following templating engine: nunjucks',
          headers: {
            'Set-Cookie': {
              description: 'cookie1=value1 (properties={"secure":true,"httpOnly":false}), cookie2={{req.query.q2}} (properties={}), cookie3=value3 (properties={}), cookie4={{req.query.q4}} (properties={"secure":false,"httpOnly":false})'
            }
          },
          content:
            { 'plain/text': { schema: { type: 'string', example: 'hello swagger with response cookies' } } }
        }
      }
    })

    expect(openApiDefinition.paths['/get_with_input_query_parameters']['get']).to.deep.equal({
      summary: 'swagger get with input query parameters',
      description:
        'Rule \'swagger get with input query parameters\' located at ../rules/swagger input_query_parameters.yaml',
      parameters: [{
        in: 'query',
        name: 'q1',
        schema: {
          type: 'string'
        }
      }, {
        in: 'query',
        name: 'q2',
        schema: {
          type: 'string'
        }
      }, {
        in: 'query',
        name: 'q3',
        schema: {
          type: 'string'
        }
      }, {
        in: 'query',
        name: 'q4',
        schema: {
          type: 'string'
        }
      }, {
        in: 'query',
        name: 'q6',
        schema: {
          type: 'string'
        }
      }, {
        in: 'query',
        name: 'q7',
        schema: {
          type: 'string'
        }
      }],
      responses:
      {
        '200':
        {
          description: 'A response using the following templating engine: nunjucks',
          headers: {
            'x-header': {
              description: 'value = {{req.query[\'q2\']}}'
            },
            'Set-Cookie': {
              description: 'cookie={{req.query["q3"]}} (properties={})'
            }
          },
          content:
            { '{% if req.query.q1 + req.query.q7 > aFunc(req.query.q5) - req.query.q8 %}application/json{% else %}{{req.query.q6 | filter}}{% endif %}':
              { schema: { type: 'string', example: 'hello swagger for input query parameters {{aFunc(req.query.q4)}}' } } }
        }
      }
    })

    expect(openApiDefinition.paths['/get_with_input_cookie_parameters']['get']).to.deep.equal({
      summary: 'swagger get with input cookie parameters',
      description:
        'Rule \'swagger get with input cookie parameters\' located at ../rules/swagger input_cookie_parameters.yaml',
      parameters: [{
        in: 'cookie',
        name: 'c1',
        schema: {
          type: 'string'
        }
      }, {
        in: 'cookie',
        name: 'c2',
        schema: {
          type: 'string'
        }
      }, {
        in: 'cookie',
        name: 'c3',
        schema: {
          type: 'string'
        }
      }, {
        in: 'cookie',
        name: 'c4',
        schema: {
          type: 'string'
        }
      }],
      responses:
      {
        '200':
        {
          description: 'A response using the following templating engine: nunjucks',
          headers: {
            'x-header': {
              description: 'value = {{req.cookies[\'c2\']}}'
            },
            'Set-Cookie': {
              description: 'cookie={{req.cookies["c3"]}} (properties={})'
            }
          },
          content:
            { '{{req.cookies.c1}}': { schema: { type: 'string', example: 'hello swagger for input cookie parameters {{req.cookies.c4}}' } } }
        }
      }
    })

    expect(openApiDefinition.paths['/get_with_input_header_parameters']['get']).to.deep.equal({
      summary: 'swagger get with input header parameters',
      description:
        'Rule \'swagger get with input header parameters\' located at ../rules/swagger input_header_parameters.yaml',
      parameters: [{
        in: 'header',
        name: 'h1',
        schema: {
          type: 'string'
        }
      }, {
        in: 'header',
        name: 'h2',
        schema: {
          type: 'string'
        }
      }, {
        in: 'header',
        name: 'h3',
        schema: {
          type: 'string'
        }
      }, {
        in: 'header',
        name: 'h4',
        schema: {
          type: 'string'
        }
      }],
      responses:
      {
        '200':
        {
          description: 'A response using the following templating engine: nunjucks',
          headers: {
            'x-header': {
              description: 'value = {{req.headers[\'h2\']}}'
            },
            'Set-Cookie': {
              description: 'cookie={{req.headers["h3"]}} (properties={})'
            }
          },
          content:
          { '{{req.headers.h1}}': { schema: { type: 'string', example: 'hello swagger for input header parameters {{req.headers.h4}}' } } }
        }
      }
    })

    expect(openApiDefinition.paths['/post_with_input_body']['post']).to.deep.equal({
      summary: 'swagger post with input body',
      description:
        'Rule \'swagger post with input body\' located at ../rules/swagger input_body.yaml',
      parameters: [],
      requestBody: {
        required: true,
        content: { 'text/plain': { schema: { type: 'string' } },
          'application/json': { schema: { type: 'string' } },
          'application/javascript': { schema: { type: 'string' } },
          'application/xml': { schema: { type: 'string' } },
          'text/xml': { schema: { type: 'string' } },
          'text/html': { schema: { type: 'string' } },
          'application/x-www-form-urlencoded': { schema: { type: 'string' } }
        }
      },
      responses:
      {
        '200':
        {
          description: 'A response using the following templating engine: nunjucks',
          headers: {},
          content:
          { 'application/json': { schema: { type: 'string', example: 'hello swagger for input body {{req.body.x}}' } } }
        }
      }
    })

    expect(openApiDefinition.paths['/post_with_input_but_no_nunjucks']['post']).to.deep.equal({
      summary: 'swagger post with input but no nunjucks',
      description:
        'Rule \'swagger post with input but no nunjucks\' located at ../rules/swagger input_no_nunjucks.yaml',
      parameters: [],
      responses:
      {
        '{{req.query.q1}}':
        {
          description: 'A response using the following templating engine: none',
          headers: {
            'x-header-1': {
              description: 'value = {{req.headers[\'h2\']}}'
            },
            'x-header-2': {
              description: 'value = {{req.cookies[\'c2\']}}'
            },
            'Set-Cookie': {
              description: 'cookie1={{req.headers["h3"]}} (properties={}), cookie2={{req.cookies["c3"]}} (properties={})'
            }
          },
          content:
          { 'application/json': { schema: { type: 'string', example: 'hello swagger for input body {{req.body.x}}' } } }
        }
      }
    })

    expect(openApiDefinition.paths['/post_conditional_response']['post']).to.deep.equal({
      summary: 'swagger post with conditional response',
      description:
        'Rule \'swagger post with conditional response\' located at ../rules/swagger conditional_response.yaml',
      parameters: [{
        in: 'query',
        name: 'q1',
        schema: {
          type: 'string'
        }
      }, {
        in: 'header',
        name: 'h1',
        schema: {
          type: 'string'
        }
      }, {
        in: 'header',
        name: 'h2',
        schema: {
          type: 'string'
        }
      }, {
        in: 'header',
        name: 'h3',
        schema: {
          type: 'string'
        }
      }],
      requestBody: {
        required: true,
        content: { 'text/plain': { schema: { type: 'string' } },
          'application/json': { schema: { type: 'string' } },
          'application/javascript': { schema: { type: 'string' } },
          'application/xml': { schema: { type: 'string' } },
          'text/xml': { schema: { type: 'string' } },
          'text/html': { schema: { type: 'string' } },
          'application/x-www-form-urlencoded': { schema: { type: 'string' } }
        }
      },
      responses:
      {
        '200, when condition \'{{req.query.q1 > 5}}\' is true':
        {
          description: 'A response using the following templating engine: nunjucks',
          headers: {},
          content:
          { 'application/json': { schema: { type: 'string', example: 'body1' } } }
        },
        '400, when condition \'{{req.headers.h1 <= 5 and req.body.x > 1}}\' is true':
        {
          description: 'A response using the following templating engine: nunjucks',
          headers: {
            'x-header': {
              description: 'value = {{req.headers[\'h2\']}}'
            },
            'Set-Cookie': {
              description: 'cookie={{req.headers["h3"]}} (properties={})'
            }
          },
          content:
          { 'plain/text': { schema: { type: 'string', example: 'body2' } } }
        },
        '500, when condition \'true\' is true':
        {
          description: 'A response using the following templating engine: nunjucks',
          headers: {},
          content:
          { 'application/json': { schema: { type: 'string', example: 'body3' } } }
        }
      }
    })

    let exceptionThrownBecauseProjectDoesNotExist = false
    try {
      await swaggerGenerationService.generate('non_existing_project_name', servers)
    } catch (e) {
      exceptionThrownBecauseProjectDoesNotExist = true
      expect(e.message).to.equal('The project with name non_existing_project_name does not exist')
    }
    expect(exceptionThrownBecauseProjectDoesNotExist).to.equal(true)
  } finally {
    config.reset()
  }
}

export {
  test
}
