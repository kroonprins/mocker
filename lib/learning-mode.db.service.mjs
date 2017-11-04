import NeDbDatastore from 'nedb';
import util from 'util';

import { deserialize, serialize } from './serializr-es6-module-loader';
import { RecordedRequest } from './learning-mode.model';
import { RecordedRequestSerializationModel } from './learning-mode.serialization-model';
import { config } from './config';
import { logger } from './logging';

class PromiseBasedNeDbDatastore {
    constructor(neDbDatastore) {
        this.db = neDbDatastore;
        this.db.insertAsync = util.promisify(this.db.insert);
        this.db.findAsync = util.promisify(this.db.find);
        this.db.removeAsync = util.promisify(this.db.remove);
    }
    insert(doc) {
        return this.db.insertAsync(doc);
    }
    find(query) {
        return this.db.findAsync(query);
    }
    remove(query, options) {
        return this.db.removeAsync(query, options);
    }

}

const LearningModeDb = new PromiseBasedNeDbDatastore(
    new NeDbDatastore({
        filename: config.learningModeDb,
        autoload: true
    }));

const LearningModeDbService = {
    async insertRecordedRequest(recordedRequest) {
        try {
            const serialized = serialize(recordedRequest);
            const inserted = await LearningModeDb.insert(serialized);
            return deserialize(RecordedRequestSerializationModel, inserted);
        } catch(e) {
            logger.error(e,'Something went wrong when trying to create recorded request in the database');
            throw e;
        }
    },
    async findRecordedRequests(projectName) {
        try {
            const recordedRequests = await LearningModeDb.find({
                project: projectName
            });
            return recordedRequests.map((recordedRequest) => {
                return deserialize(RecordedRequestSerializationModel, recordedRequest);
            })
        } catch(e) {
            logger.error(e,`Something went wrong when trying to find recorded request in the database for project ${projectName}`);
            throw e;
        }
    },
    async removeRecordedRequest(recordedRequest) {
        try {
            return LearningModeDb.remove({
                _id: recordedRequest.id
            }, {});
        } catch(e) {
            logger.error(e,`Something went wrong when trying to delete all recorded request in the database with id ${recordedRequest.id}`);
            throw e;
        }
    },
    async removeAll(projectName) {
        try {
            return LearningModeDb.remove({
                project: projectName
            }, {
                multi: true
            })
        } catch(e) {
            logger.error(e,`Something went wrong when trying to delete all recorded requests in the database for project ${projectName}`);
            throw e;
        }
    }
}

export { LearningModeDbService }