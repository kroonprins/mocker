#!/usr/bin/env sh
':' // ; exec "$(command -v nodejs || command -v node)" "--experimental-modules" "$0" "$@"

// Temporary workaround because it does not seem possible to use test frameworks like mocha/ava/... with modules

import { globAsync } from './fs-util'
import path from 'path'
import columnify from 'columnify'
import colors from 'colors'
import cjs from './mjs_workaround/cjs'
import { createModulePath } from './dynamic-module-import-helper'

const filterArgs = process.argv.slice(2)
let filters = []
for (let filterArg of filterArgs) {
  filters = filters.concat(filterArg.split(/[,;]/))
}
const DO_FILTER = filters.length > 0
const FILTER_REGEX = new RegExp(filters.join('|'))

const findTests = async () => {
  return (await globAsync('./test/**/*.test.mjs')).map(testFile => path.resolve(testFile))
}

class TestResult {
  constructor (fileName, failure, executed) {
    this.fileName = fileName
    this.failure = failure
    this.executed = executed
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

  logHeader(`Results (${testResults.length}):`)
  const columns = testResults.map(testResult => {
    const color = testResult.executed ? (testResult.failure ? colors.red : colors.green) : colors.gray
    return {
      'test': color(testResult.fileName),
      '#executions': color(testResult.executed ? 1 : 0),
      '#failures': color(testResult.failure ? 1 : 0),
      'failure': color(testResult.failure ? testResult.failure.message : '')
    }
  })
  console.log(columnify(columns))
}

const skipTest = (testFile) => {
  if(!DO_FILTER) {
    return false
  }
  return !path.basename(testFile).match(FILTER_REGEX)
}

(async () => {

  const testFiles = await findTests()

  const testResults = []
  let testFailure = false

  for (let testFile of testFiles) {
    const testResult = new TestResult(testFile)
    testResults.push(testResult)

    if(skipTest(testFile)) {
      testResult.executed = false
      continue
    } else {
      testResult.executed = true
    }

    // console.log('hier'+testFile)
    // console.log(createModulePath(testFile, cjs.__dirname))
    try {
      const testModule = await import(createModulePath(testFile, cjs.__dirname))
      // const testModule = await import(testFile)
      await testModule.test()
    } catch (e) {
      testResult.failure = e
      testFailure = true
    }
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