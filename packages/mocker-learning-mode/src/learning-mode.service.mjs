import { LearningModeDbService } from './learning-mode.db.service'
import { Logger } from '@kroonprins/mocker-shared-lib/logging'
import { config } from '@kroonprins/mocker-shared-lib/config'

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
