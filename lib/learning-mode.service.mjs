import { RecordedRequest } from './learning-mode.model';
import { LearningModeDbService } from './learning-mode.db.service';

const LearningModeService = {
    async saveRecordedRequest(recordedRequest) {
        return LearningModeDbService.insertRecordedRequest(recordedRequest);
    },
    async findRecordedRequests(projectName) {
        return LearningModeDbService.findRecordedRequests(projectName);
    },
    async removeRecordedRequest(recordedRequest) {
        return LearningModeDbService.removeRecordedRequest(recordedRequest);
    },
    async removeAll(projectName) {
        return LearningModeDbService.removeAll(projectName);
    }
}

export { LearningModeService }