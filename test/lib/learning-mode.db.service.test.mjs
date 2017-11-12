import chai from 'chai'
import { RecordedRequest } from './../../lib/learning-mode.model'
import { LearningModeDbService } from './../../lib/learning-mode.db.service'
import { Logger, PinoLogger } from './../../lib/logging'
import { config } from './../../lib/config'

const expect = chai.expect

// could split this up so that not all test run synchronously
const test = async () => {
  try {
    config
      .registerProperty('logging.level.startup', 'debug')
      .registerType(Logger, PinoLogger)

    let learningModeDbService = new LearningModeDbService('./test/tmp/test.db')

    const checkEmptyDb = await learningModeDbService.findRecordedRequests('project')
    expect(checkEmptyDb.length).to.be.equal(0)

    await learningModeDbService.insertRecordedRequest(new RecordedRequest('id1', 'project', null, null))
    await learningModeDbService.insertRecordedRequest(new RecordedRequest('id2', 'project', null, null)) // could be done in parallel

    const retrievedResult = await learningModeDbService.findRecordedRequests('project')
    expect(retrievedResult.length).to.be.equal(2)

    const numRemoved = await learningModeDbService.removeAll('project')
    expect(numRemoved).to.be.equal(2)

    const retrievedResultAfterRemoveAll = await learningModeDbService.findRecordedRequests('project')
    expect(retrievedResultAfterRemoveAll.length).to.be.equal(0)

    const recordedRequest3 = new RecordedRequest('id3', 'project', null, null)
    await learningModeDbService.insertRecordedRequest(recordedRequest3)

    const recordedRequest4 = new RecordedRequest('id4', 'project', null, null)
    await learningModeDbService.insertRecordedRequest(recordedRequest4)

    const retrievedResultAfterInsert = await learningModeDbService.findRecordedRequests('project')
    expect(retrievedResultAfterInsert.length).to.be.equal(2)

    const numRemovedAfterRemoveRecorededRequest = await learningModeDbService.removeRecordedRequest(recordedRequest3)
    expect(numRemovedAfterRemoveRecorededRequest).to.be.equal(1)
    const retrievedResultRemoveRecorededRequest = await learningModeDbService.findRecordedRequests('project')
    expect(retrievedResultRemoveRecorededRequest.length).to.be.equal(1)

    let exceptionThrown = false
    try {
      await learningModeDbService.insertRecordedRequest(recordedRequest4)
    } catch (e) {
      expect(e.message).to.be.equal("Can't insert key id4, it violates the unique constraint")
      exceptionThrown = true
    }
    expect(exceptionThrown).to.be.equal(true)
  } finally {
    config.reset()
  }
}

export {
  test
}
