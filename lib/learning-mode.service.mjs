import { RecordedRequest } from './learning-mode.model';
import { LearningModeDbService } from './learning-mode.db.service';

const LearningModeService = {
    async saveRecordedRequest(recordedRequest) {
        return LearningModeDbService.insertRecordedRequest(recordedRequest);
    },
    async findRecordedRequests(projectName) {
        return LearningModeDbService.findRecordedRequests(projectName);
    }
}

export { LearningModeService }