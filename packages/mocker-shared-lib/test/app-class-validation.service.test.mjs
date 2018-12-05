import chai from 'chai'
import { ClassValidationError } from '../src/class-validation.service'
import { AppClassValidationService } from '../src/app-class-validation.service'
import { ProjectFile, ProjectRule } from '../src/project-model'
import { ProjectValidationModel } from '../src//project-validation-model'
import { Request, Cookie, Response, Rule } from '../src/rule-model'
import { ConfigService } from '../src/config.service'
import { LatencyValidationModel } from '../src/latency-validation-model'
import { RuleValidationModel } from '../src/rule-validation-model'
import { Logger, PinoLogger } from '../src/logging'
import { config } from '../src/config'

const expect = chai.expect

// could split this up so that not all test run synchronously
const test = async () => {
  try {
    config
      .registerProperty('logging.level.startup', 'debug')
      .registerType(Logger, PinoLogger)
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
