import chai from 'chai'
import { RecordedRequest } from './../../lib/learning-mode.model'
import { LearningModeDbService } from './../../lib/learning-mode.db.service'

const expect = chai.expect

// could split this up so that not all test run synchronously
const test = async () => {
  const checkEmptyDb = await LearningModeDbService.findRecordedRequests('project')
  expect(checkEmptyDb.length).to.be.equal(0)

  await LearningModeDbService.insertRecordedRequest(new RecordedRequest('id1', 'project', null, null))
  await LearningModeDbService.insertRecordedRequest(new RecordedRequest('id2', 'project', null, null)) // could be done in parallel

  const retrievedResult = await LearningModeDbService.findRecordedRequests('project')
  expect(retrievedResult.length).to.be.equal(2)

  const numRemoved = await LearningModeDbService.removeAll('project')
  expect(numRemoved).to.be.equal(2)

  const retrievedResultAfterRemoveAll = await LearningModeDbService.findRecordedRequests('project')
  expect(retrievedResultAfterRemoveAll.length).to.be.equal(0)

  const recordedRequest3 = new RecordedRequest('id3', 'project', null, null)
  await LearningModeDbService.insertRecordedRequest(recordedRequest3)

  const recordedRequest4 = new RecordedRequest('id4', 'project', null, null)
  await LearningModeDbService.insertRecordedRequest(recordedRequest4)

  const retrievedResultAfterInsert = await LearningModeDbService.findRecordedRequests('project')
  expect(retrievedResultAfterInsert.length).to.be.equal(2)

  const numRemovedAfterRemoveRecorededRequest = await LearningModeDbService.removeRecordedRequest(recordedRequest3)
  expect(numRemovedAfterRemoveRecorededRequest).to.be.equal(1)
  const retrievedResultRemoveRecorededRequest = await LearningModeDbService.findRecordedRequests('project')
  expect(retrievedResultRemoveRecorededRequest.length).to.be.equal(1)

  let exceptionThrown = false
  try {
    await LearningModeDbService.insertRecordedRequest(recordedRequest4)
  } catch (e) {
    expect(e.message).to.be.equal("Can't insert key id4, it violates the unique constraint")
    exceptionThrown = true
  }
  expect(exceptionThrown).to.be.equal(true)
}

test()
