import chai from 'chai'
import { RecordedRequest } from './../../lib/learning-mode.model'
import { LearningModeDbService } from './../../lib/learning-mode.db.service'
import { LearningModeService } from './../../lib/learning-mode.service'
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
    let learningModeService = new LearningModeService(learningModeDbService)

    const checkEmptyDb = await learningModeService.findRecordedRequests('project_learningModeService')
    expect(checkEmptyDb.length).to.be.equal(0)

    await learningModeService.saveRecordedRequest(new RecordedRequest(undefined, 'project_learningModeService', null, null))
    await learningModeService.saveRecordedRequest(new RecordedRequest(undefined, 'project_learningModeService', null, null)) // could be done in parallel

    const retrievedResult = await learningModeService.findRecordedRequests('project_learningModeService')
    expect(retrievedResult.length).to.be.equal(2)
    const id = retrievedResult[0].id

    const retrievedRequest = await learningModeService.retrieveRecordedRequest(null, id)
    expect(retrievedRequest.project).to.be.equal('project_learningModeService')

    const numRemoved = await learningModeService.removeAll('project_learningModeService')
    expect(numRemoved).to.be.equal(2)

    const retrievedResultAfterRemoveAll = await learningModeService.findRecordedRequests('project_learningModeService')
    expect(retrievedResultAfterRemoveAll.length).to.be.equal(0)

    const recordedRequest3 = new RecordedRequest(undefined, 'project_learningModeService', null, null)
    const savedRequest3 = await learningModeService.saveRecordedRequest(recordedRequest3)

    const recordedRequest4 = new RecordedRequest(undefined, 'project_learningModeService', null, null)
    await learningModeService.saveRecordedRequest(recordedRequest4)

    const retrievedResultAfterInsert = await learningModeService.findRecordedRequests('project_learningModeService')
    expect(retrievedResultAfterInsert.length).to.be.equal(2)

    const numRemovedAfterRemoveRecorededRequest = await learningModeService.removeRecordedRequest(null, savedRequest3['id'])
    expect(numRemovedAfterRemoveRecorededRequest).to.be.equal(1)
    const retrievedResultRemoveRecorededRequest = await learningModeService.findRecordedRequests('project_learningModeService')
    expect(retrievedResultRemoveRecorededRequest.length).to.be.equal(1)

    await learningModeService.removeAll('project_learningModeService')
  } finally {
    config.reset()
  }
}

export {
  test
}
