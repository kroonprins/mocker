import chai from 'chai'
import { RecordedRequest } from './../../lib/learning-mode.model'
import { QueryOpts } from './../../lib/learning-mode.db.model'
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

    const timestamp1 = new Date()
    const timestamp2 = new Date()
    timestamp2.setDate(timestamp1.getDate() + 1)
    await learningModeDbService.insertRecordedRequest(new RecordedRequest('id1', 'project', timestamp1, null))
    await learningModeDbService.insertRecordedRequest(new RecordedRequest('id2', 'project', timestamp2, null)) // could be done in parallel

    const retrievedResult = await learningModeDbService.findRecordedRequests('project')
    expect(retrievedResult.length).to.be.equal(2)
    expect(retrievedResult[0].id).to.be.equal('id1')
    expect(retrievedResult[1].id).to.be.equal('id2')

    const retrievedRequestSortedByTimestamp = await learningModeDbService.findRecordedRequests('project', new QueryOpts({
      timestamp: -1
    }))
    expect(retrievedRequestSortedByTimestamp.length).to.be.equal(2)
    expect(retrievedRequestSortedByTimestamp[0].id).to.be.equal('id2')
    expect(retrievedRequestSortedByTimestamp[1].id).to.be.equal('id1')

    const retrievedRequestSkipOne = await learningModeDbService.findRecordedRequests('project', new QueryOpts({
      timestamp: -1
    }, 1))
    expect(retrievedRequestSkipOne.length).to.be.equal(1)
    expect(retrievedRequestSkipOne[0].id).to.be.equal('id1')

    const retrievedRequestSkipWithoutSort = await learningModeDbService.findRecordedRequests('project', new QueryOpts(undefined, 1))
    expect(retrievedRequestSkipWithoutSort.length).to.be.equal(1)
    expect(retrievedRequestSkipWithoutSort[0].id).to.be.equal('id2')

    const retrievedRequestLimitedToOne = await learningModeDbService.findRecordedRequests('project', new QueryOpts({
      timestamp: -1
    }, 0, 1))
    expect(retrievedRequestLimitedToOne.length).to.be.equal(1)
    expect(retrievedRequestLimitedToOne[0].id).to.be.equal('id2')

    const retrievedRequest = await learningModeDbService.findRecordedRequest('id1')
    expect(retrievedRequest.project).to.be.equal('project')

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

    const numRemovedAfterRemoveRecorededRequest = await learningModeDbService.removeRecordedRequest('id3')
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
