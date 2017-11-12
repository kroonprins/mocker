import NeDbDatastore from 'nedb'
import util from 'util'

import { deserialize, serialize } from './mjs_workaround/serializr-es6-module-loader'
import { RecordedRequestSerializationModel } from './learning-mode.serialization-model'
import { Logger } from './logging'
import { config } from './config'

/**
 * NeDB datastore with all the operations on the standard NeDB datastore promisified.
 */
class PromiseBasedNeDbDatastore {
  /**
   * Creates an instance of PromiseBasedNeDbDatastore.
   * @param {any} neDbDatastore the standard NeDB datastore to wrap.
   * @memberof PromiseBasedNeDbDatastore
   */
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
/**
 * Service to handle learning mode requests in the database.
 */
class LearningModeDbService {
  /**
   * Creates an instance of LearningModeDbService.
   * @param {string} [dbLocation=config.getProperty('learning-mode.db.location')] the location where to store the file-based database
   * @memberof LearningModeDbService
   */
  constructor (dbLocation = config.getProperty('learning-mode.db.location')) {
    this.learningModeDb = new PromiseBasedNeDbDatastore(
      new NeDbDatastore({
        filename: dbLocation,
        autoload: true
      }))
    this.logger = config.getClassInstance(Logger, { id: 'learning-mode.db.service' })
  }

  /**
   * Save a recorded request in the database.
   *
   * @param {RecordedRequest} recordedRequest the recorded request to save.
   * @returns the saved recorded request of type {@see RecordedRequest}.
   * @memberof LearningModeDbService
   */
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

  /**
   * List recorded request for a given project.
   *
   * @param {string} projectName Name of the project for which to list the recorded requests.
   * @returns array of recorded requests of type {@see RecordedRequest}
   * @memberof LearningModeDbService
   */
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

  /**
   * Remove a recorded request from a project.
   *
   * @param {RecordedRequest} recordedRequest the recorded request to remove.
   * @returns number of removed recorded requests.
   * @memberof LearningModeDbService
   */
  async removeRecordedRequest (recordedRequest) {
    try {
      return this.learningModeDb.remove({
        _id: recordedRequest.id
      }, {})
    } catch (e) {
      this.logger.error(e, `Something went wrong when trying to delete a recorded request in the database with id ${recordedRequest.id}`)
      throw e
    }
  }

  /**
   * Remove all recorded requests for a project.
   *
   * @param {any} projectName the name of the project for which to remove the recorded requests.
   * @returns the number of removed recorded requests.
   * @memberof LearningModeDbService
   */
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
