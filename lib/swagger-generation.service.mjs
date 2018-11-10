import { ProjectService } from './project-service'
import { Logger } from './logging'
import { config } from './config'

class SwaggerGenerationService {
  constructor (projectService = config.getInstance(ProjectService)) {
    this.projectService = projectService
    this.logger = config.getClassInstance(Logger, { id: 'swagger-generation.service' })
  }
  async generate (projectName) {
    const project = await this.projectService.retrieveProject(projectName)
    this.logger.debug('project {}', project.rules)

    return {
      openapi: '3.0.0',
      info: {
        description: `OpenAPI definitions for the rules of project ${project.name}`,
        title: project.name
      },
      servers: [ {
        url: 'http://localhost:3000', // TODO
        description: 'Mock server'
      }],
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

      path[openApiMethod] = method
      paths[openApiPath] = path
    }

    this.logger.debug('paths:', paths)
    return paths
  }

  _getParameters (pathParameters, ruleResponse) {
    const openApiPathParameters = pathParameters.map(pathParameter => {
      return {
        in: 'path',
        name: pathParameter,
        schema: {
          type: 'string'
        }
      }
    })

    let openApiQueryParameters = []
    if (ruleResponse.templatingEngine === 'nunjucks') {
      const responseAsString = JSON.stringify(ruleResponse)
      const regex = /{{req\.query\.(.*?)}}/g
      let queryParameters = []
      let match = regex.exec(responseAsString)
      while (match != null) {
        queryParameters.push(match[1])
        match = regex.exec(responseAsString)
      }

      openApiQueryParameters = queryParameters.map(queryParameter => {
        return {
          in: 'query',
          name: queryParameter,
          schema: {
            type: 'string'
          }
        }
      })
    }

    return openApiPathParameters.concat(openApiQueryParameters)
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

    if (ruleCookies) {
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
