import chai from 'chai'
import { RuleService } from '../src/rule.service'
import { Logger, PinoLogger } from '../src/logging'
import { config } from '../src/config'

const expect = chai.expect

// could split this up so that not all test run synchronously
const test = async () => {
  try {
    config
      .registerProperty('logging.level.startup', 'info')
      .registerType(Logger, PinoLogger)

    let ruleService = new RuleService()

    let exceptionThrownBecauseFileDoesNotExist = false
    try {
      await ruleService.readRule('nope')
    } catch (e) {
      expect(e.message).to.be.equal('ENOENT: no such file or directory, open \'nope\'')
      exceptionThrownBecauseFileDoesNotExist = true
    }
    expect(exceptionThrownBecauseFileDoesNotExist).to.be.equal(true)

    let exceptionThrownBecauseFileContentIncorrect = false
    try {
      await ruleService.readRule('./test/resources/rules/test_incorrect_yaml.yoml')
    } catch (e) {
      expect(e.message).to.be.equal('The rule ./test/resources/rules/test_incorrect_yaml.yoml seems to have an incorrect format')
      exceptionThrownBecauseFileContentIncorrect = true
    }
    expect(exceptionThrownBecauseFileContentIncorrect).to.be.equal(true)

    const rule = await ruleService.readRule('./test/resources/rules/test_rule_2.yaml')
    expect(rule.name).to.be.equal('testRule2')
    expect(rule.request.path).to.be.equal('/hello2')
    expect(rule.request.method).to.be.equal('PUT')
    expect(rule.response.templatingEngine).to.be.equal('nunjucks')
  } finally {
    config.reset()
  }
}

export {
  test
}
