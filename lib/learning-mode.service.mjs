import { LearningModeDbService } from './learning-mode.db.service'
import { Logger } from './logging'
import { config } from './config'

class LearningModeService {
  constructor (learningModeDbService = config.getInstance(LearningModeDbService)) {
    this.learningModeDbService = learningModeDbService
    this.logger = config.getClassInstance(Logger, { id: 'learning-mode.service' })
  }
  async saveRecordedRequest (recordedRequest) {
    return this.learningModeDbService.insertRecordedRequest(recordedRequest)
  }
  async findRecordedRequests (projectName) {
    return this.learningModeDbService.findRecordedRequests(projectName)
  }
  async removeRecordedRequest (recordedRequest) {
    return this.learningModeDbService.removeRecordedRequest(recordedRequest)
  }
  async removeAll (projectName) {
    return this.learningModeDbService.removeAll(projectName)
  }
}

export {
  LearningModeService
}
