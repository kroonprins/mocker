// Temporary workaround because it does not seem possible to use test frameworks like mocha/ava/... with modules

import { globAsync } from './../lib/fs-util'
import path from 'path'
import columnify from 'columnify'
import colors from 'colors'

const findTests = async () => {
  return (await globAsync('./**/*.test.mjs')).map(testFile => path.resolve(testFile))
}

class TestResult {
  constructor (fileName, failure) {
    this.fileName = fileName
    this.failure = failure
  }

  get fileName () {
    return this.relativePath
  }
  set fileName (fileName) {
    this._fileName = fileName
    this.relativePath = path.relative('', this._fileName)
  }
}

const logHeader = (header) => {
  console.log()
  console.log()
  console.log(header)
  console.log()
}

const reportTestResults = (testResults) => {
  const failures = testResults.filter(testResult => {
    return testResult.failure
  })
  if(failures.length > 0) {
    logHeader(colors.red('Failures:'))
    for(let failure of failures) {
      console.log(`${failure.fileName}:`)
      console.error(failure.failure)
      console.log()
    }
  }

  logHeader('Results:')
  const columns = testResults.map(testResult => {
    const color = testResult.failure ? colors.red : colors.green
    return {
      'test': color(testResult.fileName),
      '#failures': color(testResult.failure ? 1 : 0),
      'failure': color(testResult.failure ? testResult.failure.message : '')
    }
  })
  console.log(columnify(columns))
}

(async () => {

  const testFiles = await findTests()

  const testResults = []
  let testFailure = false;

  for (let testFile of testFiles) {
    const testResult = new TestResult(testFile)

    try {
      const testModule = await import(testFile)
      await testModule.test()
    } catch (e) {
      testResult.failure = e
      testFailure = true
    }
    testResults.push(testResult)
  }

  reportTestResults(testResults)

  if(testFailure) {
    console.log()
    process.exit(1)
  }
})()

process.on('unhandledRejection', error => {
  console.log('unhandledRejection', error)
  process.exit(1)
})
