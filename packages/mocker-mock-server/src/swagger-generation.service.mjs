import nunjucks from 'nunjucks'
import { ProjectService } from '@kroonprins/mocker-shared-lib/project.service'
import { Logger } from '@kroonprins/mocker-shared-lib/logging'
import { config } from '@kroonprins/mocker-shared-lib/config'

const parser = nunjucks.parser
const nodes = nunjucks.nodes

class SwaggerGenerationService {
  constructor (projectService = config.getInstance(ProjectService)) {
    this.projectService = projectService
    this.logger = config.getClassInstance(Logger, { id: 'swagger-generation.service' })
  }
  async generate (projectName, servers) {
    const project = await this.projectService.retrieveProject(projectName)
    this.logger.debug('project {}', project.rules)

    return {
      openapi: '3.0.0',
      info: {
        description: `OpenAPI definitions for the rules of project ${project.name}`,
        title: project.name
      },
      servers: servers,
      paths: this._getPaths(project.rules)
    }
  }

  _getPaths (rules) {
    const paths = {}

    for (let projectRule of rules) {
      this.logger.debug(projectRule, 'Process rule')
      const ruleRequest = projectRule.rule.request
      const ruleResponse = projectRule.rule.response
      const ruleConditionalResponse = projectRule.rule.conditionalResponse

      const pathInfo = this._parsePathParameters(ruleRequest.path)
      const openApiPath = pathInfo.openApiPath
      const openApiMethod = ruleRequest.method.toLowerCase()

      const referencesToRequestInRuleResponse = ruleResponse
        ? this._getReferencesToRequestInRuleResponse(ruleResponse)
        : this._getReferencesToRequestInRuleResponse(ruleConditionalResponse)

      const path = paths[openApiPath] || {}
      const method = {
        summary: projectRule.rule.name,
        description: `Rule '${projectRule.rule.name}' located at ${projectRule.location}`,
        parameters: this._getParameters(pathInfo.parameters, referencesToRequestInRuleResponse),
        responses: ruleResponse ? this._getResponses(ruleResponse) : this._getResponsesForConditionalResponse(ruleConditionalResponse)
      }

      const requestBody = this._getOpenApiRequestBody(referencesToRequestInRuleResponse)
      if (requestBody) {
        method['requestBody'] = requestBody
      }

      path[openApiMethod] = method
      paths[openApiPath] = path
    }

    this.logger.debug('paths:', paths)
    return paths
  }

  _getReferencesToRequestInRuleResponse (ruleResponse) {
    let result = {
      query: new Set(),
      cookies: new Set(),
      headers: new Set(),
      body: new Set()
    }

    if (ruleResponse.templatingEngine === 'nunjucks') {
      const responseAsString = JSON.stringify(ruleResponse).replace(/\\"/g, '"') // replace \" by " because the parses gives unexpected results otherwise

      const parsedNodes = parser.parse(responseAsString)

      const lookupVals = parsedNodes.findAll(nodes.LookupVal)

      lookupVals.forEach(lookupVal => {
        if (lookupVal.target.target && lookupVal.target.target.value === 'req') {
          const type = lookupVal.target.val.value
          if (type in result) {
            result[type].add(lookupVal.val.value)
          }
        }
      })

      // note: right side of a compare seems to be treated differently and is not found with nodes.LookupVal... not sure how to handle it => TODO
    }

    return result
  }

  _getParameters (pathParameters, referencesToRequestInRuleResponse) {
    const openApiPathParameters = this._getOpenApiPathParameters(pathParameters)
    const openApiQueryParameters = this._getOpenApiQueryParameters(referencesToRequestInRuleResponse)
    const openApiCookieParameters = this._getOpenApiCookieParameters(referencesToRequestInRuleResponse)
    const openApiHeaderParameters = this._getOpenApiHeaderParameters(referencesToRequestInRuleResponse)

    return openApiPathParameters
      .concat(openApiQueryParameters)
      .concat(openApiCookieParameters)
      .concat(openApiHeaderParameters)
  }

  _getOpenApiPathParameters (pathParameters) {
    return pathParameters.map(pathParameter => {
      return {
        in: 'path',
        name: pathParameter,
        schema: {
          type: 'string'
        }
      }
    })
  }

  _getOpenApiQueryParameters (referencesToRequestInRuleResponse) {
    return this._getOpenApiParameterForType('query', 'query', referencesToRequestInRuleResponse)
  }

  _getOpenApiCookieParameters (referencesToRequestInRuleResponse) {
    return this._getOpenApiParameterForType('cookie', 'cookies', referencesToRequestInRuleResponse)
  }

  _getOpenApiHeaderParameters (referencesToRequestInRuleResponse) {
    return this._getOpenApiParameterForType('header', 'headers', referencesToRequestInRuleResponse)
  }

  _getOpenApiRequestBody (referencesToRequestInRuleResponse) {
    let requestBody
    const matches = referencesToRequestInRuleResponse['body']
    if (matches.size > 0) {
      requestBody = {
        required: true,
        content: {}
      }

      const contentTypes = [ 'text/plain', 'application/json', 'application/javascript', 'application/xml', 'text/xml', 'text/html', 'application/x-www-form-urlencoded' ]

      contentTypes.forEach(contentType => {
        requestBody.content[contentType] = {
          schema: {
            type: 'string'
          }
        }
      })
    }
    return requestBody
  }

  _getOpenApiParameterForType (openApiType, expressType, referencesToRequestInRuleResponse) {
    return Array.from(referencesToRequestInRuleResponse[expressType]).sort().map(parameter => {
      return {
        in: openApiType,
        name: parameter,
        schema: {
          type: 'string'
        }
      }
    })
  }

  _getResponses (ruleResponse) {
    const response = {}

    const content = {}
    content[ruleResponse.contentType] = {
      schema: {
        type: 'string',
        example: ruleResponse.body
      }
    }

    response[ruleResponse.statusCode] = { // TODO what if statusCode is templated...
      description: `A response using the following templating engine: ${ruleResponse.templatingEngine}`,
      headers: this._getHeaders(ruleResponse.headers, ruleResponse.cookies),
      content: content
    }

    return response
  }

  _getResponsesForConditionalResponse (ruleConditionalResponse) {
    const response = {}

    for (let ruleConditionalResponseValue of ruleConditionalResponse.response) {
      const content = {}
      content[ruleConditionalResponseValue.contentType] = {
        schema: {
          type: 'string',
          example: ruleConditionalResponseValue.body
        }
      }

      response[`${ruleConditionalResponseValue.statusCode}, when condition '${ruleConditionalResponseValue.condition}' is true`] = {
        description: `A response using the following templating engine: ${ruleConditionalResponse.templatingEngine}`,
        headers: this._getHeaders(ruleConditionalResponseValue.headers, ruleConditionalResponseValue.cookies),
        content: content
      }
    }

    return response
  }

  _getHeaders (ruleHeaders, ruleCookies) {
    const headers = {}

    for (let ruleHeader of ruleHeaders) {
      headers[ruleHeader.name] = {
        description: `value = ${ruleHeader.value}`
      }
    }

    if (ruleCookies.length) {
      headers['Set-Cookie'] = {
        description: ruleCookies.map(v => `${v.name}=${v.value} (properties=${JSON.stringify(v.properties)})`).join(', ')
      }
    }

    return headers
  }

  _parsePathParameters (path) {
    const res = {
      parameters: [],
      openApiPath: path
    }

    let colonFound = false
    let currentParam = []
    for (let i = 0; i < path.length; i++) {
      let char = path.charAt(i)
      if (char === ':') {
        colonFound = true
        continue
      }
      if (colonFound) {
        if (char === '/') {
          res.parameters.push(currentParam.join(''))
          currentParam = []
          colonFound = false
        } else {
          currentParam.push(char)
        }
      }
    }
    if (colonFound) {
      res.parameters.push(currentParam.join(''))
    }

    for (let parameter of res.parameters) {
      let regex = new RegExp(`:(${parameter})`, 'g')
      res.openApiPath = res.openApiPath.replace(regex, '{$1}')
    }

    return res
  }
}

export {
  SwaggerGenerationService
}
