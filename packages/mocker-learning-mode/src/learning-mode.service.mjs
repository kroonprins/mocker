import { Logger } from '@kroonprins/mocker-shared-lib/logging.mjs'
import { config } from '@kroonprins/mocker-shared-lib/config.mjs'
import { LearningModeDbService } from './learning-mode.db.service.mjs'

class LearningModeService {
  constructor (learningModeDbService = config.getInstance(LearningModeDbService)) {
    this.learningModeDbService = learningModeDbService
    this.logger = config.getClassInstance(Logger, { id: 'learning-mode.service' })
  }

  async saveRecordedRequest (recordedRequest) {
    return this.learningModeDbService.insertRecordedRequest(recordedRequest)
  }

  async findRecordedRequests (projectName, queryOpts) {
    return this.learningModeDbService.findRecordedRequests(projectName, queryOpts)
  }

  async retrieveRecordedRequest (projectName, recordedRequestId) {
    return this.learningModeDbService.findRecordedRequest(recordedRequestId)
  }

  async removeRecordedRequest (projectName, recordedRequestId) {
    return this.learningModeDbService.removeRecordedRequest(recordedRequestId)
  }

  async removeAll (projectName) {
    return this.learningModeDbService.removeAll(projectName)
  }
}

export {
  LearningModeService
}
