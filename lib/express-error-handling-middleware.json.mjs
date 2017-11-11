import { FunctionalValidationError, TechnicalValidationError, TechnicalError } from './error-types.mjs'
import uuidv4 from 'uuid/v4'

/**
 * Re-usable error handling that can be used on express app that exposes services returning json. Based on the error type a different response is given:
 * <ul>
 *  <li>{@link FunctionalValidationError}: HTTP/200 with a flag "error" = true in the body</li>
 *  <li>{@link TechnicalValidationError}: HTTP/400</li>
 *  <li>{@link TechnicalError}: HTTP/500
 *  <li>For other types a HTTP/500 with a generic error message</li>
 * </ul>
 * Be careful, for some reason the error handling must be set on the express app after the router is complety defined on the express app!
 *
 * @param {any} opts Object containing following possible options:<br><ul><li>'logger': an instance of {@link Logger} that can log the error to the log</li></ul>
 * @returns the middleware.
 */
const jsonErrorHandlingMiddleware = (opts) => {
  return (err, req, res, next) => {
    const UUID = uuidv4()
    let logType
    if (err instanceof FunctionalValidationError) {
      logType = 'debug'
      res.status(200)
      res.json({
        error: true,
        msg: err.message,
        uuid: UUID
      })
    } else if (err instanceof TechnicalValidationError) {
      logType = 'warn'
      res.status(400)
      res.json({
        msg: err.message,
        uuid: UUID
      })
    } else if (err instanceof TechnicalError) {
      logType = 'error'
      res.status(500)
      res.json({
        msg: err.message,
        uuid: UUID
      })
    } else {
      logType = 'error'
      res.status(500)
      res.json({
        msg: 'An unexpected error occurred',
        uuid: UUID
      })
    }
    if (opts && opts.logger) {
      // TODO there should be a way to get both the error and the uuid as separate fields in one line of output...
      opts.logger[logType]({ uuid: UUID }, 'An error occurred. Generated UUID: \'%s\'', UUID)
      opts.logger[logType](err, 'Stacktrace for error UUID: \'%s\'', UUID)
    }
  }
}

export default jsonErrorHandlingMiddleware
