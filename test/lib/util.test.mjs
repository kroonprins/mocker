import chai from 'chai'
import { overwriteFile, readFileAsync, rimrafAsync } from './../../lib/fs-util'

const expect = chai.expect

// could split this up so that not all test run synchronously
const test = async () => {
  const tempDir = './test/tmp2'

  const testFile1 = `${tempDir}/bla/test.txt`
  await overwriteFile(testFile1, 'testtest')

  const testFile1content = await readFileAsync(testFile1)
  expect(testFile1content.toString()).to.be.equal('testtest')

  await overwriteFile(testFile1, 'test')

  const overwrittenTestFile1content = await readFileAsync(testFile1)
  expect(overwrittenTestFile1content.toString()).to.be.equal('test')

  // cleanup
  await rimrafAsync(tempDir)
}

export {
  test
}
