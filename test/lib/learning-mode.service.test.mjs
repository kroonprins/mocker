import chai from 'chai';
const expect = chai.expect;

import { RecordedRequest } from './../../lib/learning-mode.model';
import { LearningModeService } from './../../lib/learning-mode.service';

// could split this up so that not all test run synchronously
const result = (async () => {

    const checkEmptyDb = await LearningModeService.findRecordedRequests("project_learningModeService");
    expect(checkEmptyDb.length).to.be.equal(0);

    await LearningModeService.saveRecordedRequest(new RecordedRequest(undefined, "project_learningModeService", null, null));
    await LearningModeService.saveRecordedRequest(new RecordedRequest(undefined, "project_learningModeService", null, null)); // could be done in parallel

    const retrievedResult = await LearningModeService.findRecordedRequests("project_learningModeService");
    expect(retrievedResult.length).to.be.equal(2);

    const numRemoved = await LearningModeService.removeAll("project_learningModeService");
    expect(numRemoved).to.be.equal(2);

    const retrievedResultAfterRemoveAll = await LearningModeService.findRecordedRequests("project_learningModeService");
    expect(retrievedResultAfterRemoveAll.length).to.be.equal(0);

    const recordedRequest3 = new RecordedRequest(undefined, "project_learningModeService", null, null);
    const savedRequest3 = await LearningModeService.saveRecordedRequest(recordedRequest3);

    const recordedRequest4 = new RecordedRequest(undefined, "project_learningModeService", null, null);
    const savedRequest4 = await LearningModeService.saveRecordedRequest(recordedRequest4);

    const retrievedResultAfterInsert = await LearningModeService.findRecordedRequests("project_learningModeService");
    expect(retrievedResultAfterInsert.length).to.be.equal(2);

    const numRemovedAfterRemoveRecorededRequest = await LearningModeService.removeRecordedRequest(savedRequest3);
    expect(numRemovedAfterRemoveRecorededRequest).to.be.equal(1);
    const retrievedResultRemoveRecorededRequest = await LearningModeService.findRecordedRequests("project_learningModeService");
    expect(retrievedResultRemoveRecorededRequest.length).to.be.equal(1);

    await LearningModeService.removeAll("project_learningModeService");

})();