import chai from 'chai'
import { ConfigService } from './../../lib/config.service'
import { LatencyValidationModel } from './../../lib/latency-validation-model'
import { RuleValidationModel } from './../../lib//rule-validation-model'
import { ProjectValidationModel } from './../../lib//project-validation-model'
import { TemplatingService } from './../../lib/templating-service'
import { NunjucksTemplatingHelpers } from './../../lib/templating-helpers.nunjucks'
import { NunjucksTemplatingService } from './../../lib/templating-service.nunjucks'
import { ClassValidationError } from './../../lib/class-validation.service'
import { AppClassValidationService } from './../../lib/app-class-validation.service'
import { ProjectFile, ProjectRule } from '../../lib/project-model'
import { Request, Cookie, Response, Rule } from '../../lib/rule-model'
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

    let appClassValidationService = new AppClassValidationService()

    const valid = await appClassValidationService.validate(ProjectFile, new ProjectFile('x', ['y']))
    expect(valid).to.be.equal(true)

    let exceptionThrown = false
    try {
      await appClassValidationService.validate(Cookie, new Cookie('cook', 'value', {
        x: 'x'
      }))
    } catch (e) {
      expect(e).to.be.an.instanceof(ClassValidationError)
      exceptionThrown = true
    }
    expect(exceptionThrown).to.be.equal(true)

    const validNestedObject = await appClassValidationService.validate(
      ProjectRule,
      new ProjectRule(
        'x',
        new Rule(
          'x',
          new Request('/test', 'GET'),
          new Response('nunjucks', 'x')
        )
      )
    )
    expect(validNestedObject).to.be.equal(true)

    let exceptionThrownForNestedObject = false
    try {
      await appClassValidationService.validate(
        ProjectRule,
        new ProjectRule(
          null,
          new Rule(
            'x',
            new Request('/test', 'GET'),
            new Response('nunjucks', 'x')
          )
        )
      )
    } catch (e) {
      expect(e).to.be.an.instanceof(ClassValidationError)
      exceptionThrownForNestedObject = true
    }
    expect(exceptionThrownForNestedObject).to.be.equal(true)
  } finally {
    config.reset()
  }
}

export {
  test
}
