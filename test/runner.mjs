// Temporary workaround because it does not seem possible to use test frameworks like mocha/ava/... with modules

import { globAsync } from './../lib/fs-util'

const _findTests = async () => {
  return globAsync('./**/*.test.mjs')
}

// const _runTests = async () => {
//   const tests = await _findTests()

//   const results = {
//     run: 0,
//     failed: 0
//   }

//   for (let test of tests) {
//     results.run++
//     try {
//       // import(test);
//       throw new Error("Node doesn't support dynamic import yet.")
//     } catch (e) {
//       console.error(`Test ${test} failed`)
//       console.error(e)
//       results.failed++
//     }
//   }

//   console.log()
//   console.log(`Results: ${results.run} test(s) run with ${results.failed} failed`)
// }

// _runTests();

// -------------------
// horrid workaround upon the workaround :)
let count = 0
/* eslint-disable */
import { test as testAppConfig } from './lib/app-config.test'
import { test as testUtil } from './lib/util.test'
import { test as testLogging } from './lib/logging.test';
import { test as testProjectService } from './lib/project-service.test'
import { test as testRuleService } from './lib/rule-service.test'
import { test as testTemplatingService } from './lib/templating-service.test'
import { test as testAdminstrationServer } from './lib/administration-server.test'
import { test as testMockServer } from './lib/mock-server.test'
import { test as testLearningModeDbService } from './lib/learning-mode.db.service.test'
import { test as testLearningModeService } from './lib/learning-mode.service.test'
import { test as testLearningModeReverseProxy } from'./lib/learning-mode.reverse-proxy.test'
import { test as testApiServer } from './lib/api-server.test'
/* eslint-enable */
const runTest = (testFn) => {
  count++
  return testFn()
}

(async () => {
  await runTest(testAppConfig)
  await runTest(testUtil)
  await runTest(testLogging)
  await runTest(testProjectService)
  await runTest(testRuleService)
  await runTest(testTemplatingService)
  await runTest(testAdminstrationServer)
  await runTest(testMockServer)
  await runTest(testLearningModeDbService)
  await runTest(testLearningModeService)
  await runTest(testLearningModeReverseProxy)
  await runTest(testApiServer)

  const tests = await _findTests()
  if (tests.length !== count) {
    throw new Error(`It seems some of the test have not been added in the runner: ${tests.length} <=> ${count}`)
  }
})().catch((e) => {
  console.error(e)
  process.exit(1)
})

process.on('unhandledRejection', error => {
  console.log('unhandledRejection', error)
  process.exit(1)
})

process.on('exit', (code) => {
  if (code === 0) {
    console.log()
    console.log(`All tests passed (${count})`)
  }
})
