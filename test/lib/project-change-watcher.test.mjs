import chai from 'chai'
import { ProjectChangeWatcher } from './../../lib/project-change-watcher'
import { ConfigService } from './../../lib/config.service'
import { RuleValidationModel } from './../../lib//rule-validation-model'
import { ProjectValidationModel } from './../../lib//project-validation-model'
import { AppClassValidationService } from '../../lib/app-class-validation.service'
import { TemplatingService } from './../../lib/templating-service'
import { NunjucksTemplatingHelpers } from './../../lib/templating-helpers.nunjucks'
import { NunjucksTemplatingService } from './../../lib/templating-service.nunjucks'
import { LatencyValidationModel } from './../../lib/latency-validation-model'
import { overwriteFile, unlinkAsync } from './../../lib/fs-util'
import { Logger, PinoLogger } from './../../lib/logging'
import { config } from './../../lib/config'
const expect = chai.expect

const wait = async (secs) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve()
    }, secs)
  })
}

// could split this up so that not all test run synchronously
const test = async () => {
  let projectChangeWatcher
  const newFile1 = 'test/rules/test_rule_12.yuml'
  const newFile2 = 'test/rules/test_rule_I_wont_be_detected_as_change.yuml'
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

    projectChangeWatcher = new ProjectChangeWatcher('test_multiple_glob', './test/projects/tests.yaml', new AppClassValidationService())

    let eventsReceived = 0
    const projectChanges = await projectChangeWatcher.start()
    projectChanges.on('changeDetected', () => {
      eventsReceived++
    })

    await wait(1000)
    await overwriteFile(newFile1, '')
    await overwriteFile(newFile2, '')
    await wait(3000)
    await unlinkAsync(newFile1)
    await unlinkAsync(newFile2)
    await wait(3000)

    expect(eventsReceived).to.equal(2)
  } finally {
    if (projectChangeWatcher) {
      projectChangeWatcher.stop()
    }
    try {
      await unlinkAsync(newFile1)
      await unlinkAsync(newFile2)
    } catch (e) { }

    config.reset()
  }
}

export {
  test
}
