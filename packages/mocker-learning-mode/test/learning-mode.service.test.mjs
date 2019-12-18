import chai from 'chai'
import { AppClassValidationService } from '@kroonprins/mocker-shared-lib/app-class-validation.service.mjs'
import { unlinkAsync } from '@kroonprins/mocker-shared-lib/fs-util.mjs'
import { Logger, PinoLogger } from '@kroonprins/mocker-shared-lib/logging.mjs'
import { config } from '@kroonprins/mocker-shared-lib/config.mjs'
import { RecordedRequest } from '../src/learning-mode.model.mjs'
import { QueryOpts } from '../src/learning-mode.db.model.mjs'
import { LearningModeDbValidationModel } from '../src/learning-mode.db.validation-model.mjs'
import { LearningModeDbService } from '../src/learning-mode.db.service.mjs'
import { LearningModeService } from '../src/learning-mode.service.mjs'

const expect = chai.expect

// could split this up so that not all test run synchronously
const test = async () => {
  const dbFile = './test/tmp/test3.db'
  try {
    config
      .registerProperty('logging.level.startup', 'info')
      .registerType(Logger, PinoLogger)
      .registerInstance(LearningModeDbValidationModel, new LearningModeDbValidationModel())

    let learningModeDbService = new LearningModeDbService(dbFile, new AppClassValidationService())
    let learningModeService = new LearningModeService(learningModeDbService)

    const checkEmptyDb = await learningModeService.findRecordedRequests('project_learningModeService')
    expect(checkEmptyDb.length).to.be.equal(0)

    const timestamp1 = new Date()
    const timestamp2 = new Date()
    timestamp2.setDate(timestamp1.getDate() + 1)
    await learningModeService.saveRecordedRequest(new RecordedRequest(undefined, 'project_learningModeService', timestamp1, null))
    await learningModeService.saveRecordedRequest(new RecordedRequest(undefined, 'project_learningModeService', timestamp2, null)) // could be done in parallel

    const retrievedResult = await learningModeService.findRecordedRequests('project_learningModeService')
    expect(retrievedResult.length).to.be.equal(2)
    const id = retrievedResult[0].id

    const retrievedRequestWithQueryOpts = await learningModeService.findRecordedRequests('project_learningModeService', new QueryOpts({
      timestamp: -1
    }))
    expect(retrievedRequestWithQueryOpts.length).to.be.equal(2)
    expect(retrievedRequestWithQueryOpts[0].timestamp.getTime()).to.be.equal(timestamp2.getTime())
    expect(retrievedRequestWithQueryOpts[1].timestamp.getTime()).to.be.equal(timestamp1.getTime())

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
    await unlinkAsync(dbFile)
  }
}

export {
  test
}
