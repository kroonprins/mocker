import NeDbDatastore from 'nedb'
import util from 'util'

import { deserialize, serialize } from './mjs_workaround/serializr-es6-module-loader'
import { RecordedRequestSerializationModel } from './learning-mode.serialization-model'
import { Logger } from './logging'
import { config } from './config'

class PromiseBasedNeDbDatastore {
  constructor (neDbDatastore) {
    this.db = neDbDatastore
    this.db.insertAsync = util.promisify(this.db.insert)
    this.db.findAsync = util.promisify(this.db.find)
    this.db.removeAsync = util.promisify(this.db.remove)
  }
  insert (doc) {
    return this.db.insertAsync(doc)
  }
  find (query) {
    return this.db.findAsync(query)
  }
  remove (query, options) {
    return this.db.removeAsync(query, options)
  }
}

class LearningModeDbService {
  constructor (dbLocation = config.getProperty('learning-mode.db.location')) {
    this.learningModeDb = new PromiseBasedNeDbDatastore(
      new NeDbDatastore({
        filename: dbLocation,
        autoload: true
      }))
    this.logger = config.getClassInstance(Logger, { id: 'learning-mode.db.service' })
  }
  async insertRecordedRequest (recordedRequest) {
    try {
      const serialized = serialize(recordedRequest)
      const inserted = await this.learningModeDb.insert(serialized)
      return deserialize(RecordedRequestSerializationModel, inserted)
    } catch (e) {
      this.logger.error(e, 'Something went wrong when trying to create recorded request in the database')
      throw e
    }
  }
  async findRecordedRequests (projectName) {
    try {
      const recordedRequests = await this.learningModeDb.find({
        project: projectName
      })
      return recordedRequests.map((recordedRequest) => {
        return deserialize(RecordedRequestSerializationModel, recordedRequest)
      })
    } catch (e) {
      this.logger.error(e, `Something went wrong when trying to find recorded request in the database for project ${projectName}`)
      throw e
    }
  }
  async removeRecordedRequest (recordedRequest) {
    try {
      return this.learningModeDb.remove({
        _id: recordedRequest.id
      }, {})
    } catch (e) {
      this.logger.error(e, `Something went wrong when trying to delete all recorded request in the database with id ${recordedRequest.id}`)
      throw e
    }
  }
  async removeAll (projectName) {
    try {
      return this.learningModeDb.remove({
        project: projectName
      }, {
        multi: true
      })
    } catch (e) {
      this.logger.error(e, `Something went wrong when trying to delete all recorded requests in the database for project ${projectName}`)
      throw e
    }
  }
}

export {
  LearningModeDbService
}
