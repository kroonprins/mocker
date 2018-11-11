import { ProjectService } from './project-service'
import { Logger } from './logging'
import { config } from './config'

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

      const pathInfo = this._parsePathParameters(ruleRequest.path)
      const openApiPath = pathInfo.openApiPath
      const openApiMethod = ruleRequest.method.toLowerCase()

      const path = paths[openApiPath] || {}
      const method = {
        summary: projectRule.rule.name,
        description: `Rule '${projectRule.rule.name}' located at ${projectRule.location}`,
        parameters: this._getParameters(pathInfo.parameters, ruleResponse),
        responses: this._getResponses(ruleResponse)
      }

      const requestBody = this._getOpenApiRequestBody(ruleResponse)
      if (requestBody) {
        method['requestBody'] = requestBody
      }

      path[openApiMethod] = method
      paths[openApiPath] = path
    }

    this.logger.debug('paths:', paths)
    return paths
  }

  _getParameters (pathParameters, ruleResponse) {
    const openApiPathParameters = this._getOpenApiPathParameters(pathParameters)
    const openApiQueryParameters = this._getOpenApiQueryParameters(ruleResponse)
    const openApiCookieParameters = this._getOpenApiCookieParameters(ruleResponse)
    const openApiHeaderParameters = this._getOpenApiHeaderParameters(ruleResponse)

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

  _getOpenApiQueryParameters (ruleResponse) {
    return this._getOpenApiParameterForType('query', 'query', ruleResponse)
  }

  _getOpenApiCookieParameters (ruleResponse) {
    return this._getOpenApiParameterForType('cookie', 'cookies', ruleResponse)
  }

  _getOpenApiHeaderParameters (ruleResponse) {
    return this._getOpenApiParameterForType('header', 'headers', ruleResponse)
  }

  _getOpenApiRequestBody (ruleResponse) {
    let requestBody
    if (ruleResponse.templatingEngine === 'nunjucks') {
      const matches = this._getMatchesInRuleResponse('body', ruleResponse)
      if (matches.length) {
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
    }
    return requestBody
  }

  _getOpenApiParameterForType (openApiType, expressType, ruleResponse) {
    let openApiParametersForType = []
    if (ruleResponse.templatingEngine === 'nunjucks') {
      openApiParametersForType = this._getMatchesInRuleResponse(expressType, ruleResponse).map(parameter => {
        return {
          in: openApiType,
          name: parameter,
          schema: {
            type: 'string'
          }
        }
      })
    }
    return openApiParametersForType
  }

  _getMatchesInRuleResponse (type, ruleResponse) {
    const responseAsString = JSON.stringify(ruleResponse)

    // TODO combine regexes
    const regexDotSyntax = new RegExp(`{{req\\.${type}\\.(.*?)}}`, 'g')
    let foundMatches = []
    let matchDotSyntax = regexDotSyntax.exec(responseAsString)
    while (matchDotSyntax != null) {
      foundMatches.push(matchDotSyntax[1])
      matchDotSyntax = regexDotSyntax.exec(responseAsString)
    }

    const regexSquareBracketSyntaxWithSingleQuote = new RegExp(`{{req\\.${type}\\['(.*?)'\\]}}`, 'g')
    let matchSquareBracketSyntaxWithSingleQuote = regexSquareBracketSyntaxWithSingleQuote.exec(responseAsString)
    while (matchSquareBracketSyntaxWithSingleQuote != null) {
      foundMatches.push(matchSquareBracketSyntaxWithSingleQuote[1])
      matchSquareBracketSyntaxWithSingleQuote = regexSquareBracketSyntaxWithSingleQuote.exec(responseAsString)
    }

    const regexSquareBracketSyntaxWithDoubleQuote = new RegExp(`{{req\\.${type}\\[\\\\"(.*?)\\\\"\\]}}`, 'g')
    let matchSquareBracketSyntaxWithDoubleQuote = regexSquareBracketSyntaxWithDoubleQuote.exec(responseAsString)
    while (matchSquareBracketSyntaxWithDoubleQuote != null) {
      foundMatches.push(matchSquareBracketSyntaxWithDoubleQuote[1])
      matchSquareBracketSyntaxWithDoubleQuote = regexSquareBracketSyntaxWithDoubleQuote.exec(responseAsString)
    }

    return Array.from(new Set(foundMatches)).sort()
  }

  _getResponses (ruleResponse) {
    const response = {
    }

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
