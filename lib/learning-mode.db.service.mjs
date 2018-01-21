import NeDbDatastore from 'nedb'
import util from 'util'
import { deserialize, serialize } from './mjs_workaround/serializr-es6-module-loader'
import { RecordedRequestSerializationModel } from './learning-mode.serialization-model'
import { TechnicalValidationError } from './error-types'
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
  find (query, opts) {
    if (opts) {
      return this._findWithOptions(query, opts)
    } else {
      return this.db.findAsync(query)
    }
  }
  remove (query, options) {
    return this.db.removeAsync(query, options)
  }
  _findWithOptions (query, opts) {
    return new Promise((resolve, reject) => {
      let cursor = this.db.find(query)
      if (opts.sortQuery) {
        cursor = cursor.sort(opts.sortQuery)
      }
      if (opts.skip && opts.skip > 0) {
        cursor = cursor.skip(opts.skip)
      }
      if (opts.limit) {
        cursor = cursor.limit(opts.limit)
      }
      cursor.exec(function (err, doc) {
        if (err) {
          reject(err)
        } else {
          resolve(doc)
        }
      })
    })
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
      const serialized = serialize(RecordedRequestSerializationModel, recordedRequest)
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
   * @param {QueryOpts} queryOpts Query options for sorting and pagination
   * @returns array of recorded requests of type {@see RecordedRequest}
   * @memberof LearningModeDbService
   */
  async findRecordedRequests (projectName, queryOpts) {
    try {
      this.logger.debug('Listing recorded requests for project %s with query opts %s', projectName, queryOpts)
      // this._validateQueryOpts(queryOpts) TODO
      const recordedRequests = await this.learningModeDb.find({
        project: projectName
      }, queryOpts)
      return recordedRequests.map((recordedRequest) => {
        return deserialize(RecordedRequestSerializationModel, recordedRequest)
      })
    } catch (e) {
      this.logger.error(e, `Something went wrong when trying to find recorded request in the database for project ${projectName}`)
      throw e
    }
  }

  /**
   * Retrieve recorded request for a given id.
   *
   * @param {string} recordedRequestId Id of the recorded request.
   * @returns recorded request of type {@see RecordedRequest}.
   * @throws {TechnicalValidationError} if no request found for given id.
   * @memberof LearningModeDbService
   */
  async findRecordedRequest (recordedRequestId) {
    try {
      const recordedRequests = await this.learningModeDb.find({
        _id: recordedRequestId
      })
      if (recordedRequests.length !== 1) {
        throw new TechnicalValidationError(
          `The recorded request with id ${recordedRequestId} does not exist`,
          'recorded request not found',
          {
            id: recordedRequestId
          }
        )
      }
      return deserialize(RecordedRequestSerializationModel, recordedRequests[0])
    } catch (e) {
      this.logger.error(e, `Something went wrong when trying to find recorded request in the database for id ${recordedRequestId}`)
      throw e
    }
  }

  /**
   * Remove a recorded request from a project.
   *
   * @param {string} recordedRequestId the id of the recorded request to remove.
   * @returns number of removed recorded requests.
   * @memberof LearningModeDbService
   */
  async removeRecordedRequest (recordedRequestId) {
    try {
      const numRemoved = await this.learningModeDb.remove({
        _id: recordedRequestId
      }, {})
      if (numRemoved === 0) {
        throw new TechnicalValidationError(
          `Trying to delete recorded request with id ${recordedRequestId} which does not exist`,
          'recorded request not found',
          {
            id: recordedRequestId
          }
        )
      }
      return numRemoved
    } catch (e) {
      this.logger.error(e, `Something went wrong when trying to delete a recorded request in the database with id ${recordedRequestId}`)
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
