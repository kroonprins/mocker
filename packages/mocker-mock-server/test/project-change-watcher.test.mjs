import chai from 'chai'
import { initialize as setDefaultConfig } from '@kroonprins/mocker-shared-lib/config-default'
import { ProjectChangeWatcher } from '../src/project-change-watcher'
import { overwriteFile, unlinkAsync } from '@kroonprins/mocker-shared-lib/fs-util'
import { wait } from '@kroonprins/mocker-shared-lib/util'
import { config } from '@kroonprins/mocker-shared-lib/config'
const expect = chai.expect

// could split this up so that not all test run synchronously
const test = async () => {
  let projectChangeWatcher
  const newFile1 = 'test/resources/rules/test_rule_12.yuml'
  const newFile2 = 'test/resources/rules/test_rule_I_wont_be_detected_as_change.yuml'
  try {
    config
      .registerProperty('logging.level.startup', 'info')
      .registerProperty('project.location', './test/resources/projects/tests.yaml')

    setDefaultConfig()

    projectChangeWatcher = new ProjectChangeWatcher('test_multiple_glob')

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
