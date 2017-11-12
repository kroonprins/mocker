/**
 * Base error for the error types.
 *
 * @extends {Error}
 */
class BaseError extends Error {
  /**
   * Creates an instance of BaseError.
   *
   * @param {any} message The message of the error.
   * @param {any} code A unique code for the error that can be used for translation.
   * @param {any} [data={}] Optional extra dynamic data that can be include in the error.
   * @memberof BaseError
   */
  constructor (message, code, data = {}) {
    super(message)
    this.code = code
    this.data = data
  }
}

/**
 * Unexpected but non-fatal technical error.
 *
 * @extends {BaseError}
 */
class TechnicalError extends BaseError {}

/**
 * Error indicating a technical validation of input failed.
 *
 * @extends {BaseError}
 */
class TechnicalValidationError extends BaseError {}

/**
 * Error indicating a functional validation of input failed.
 *
 * @extends {BaseError}
 */
class FunctionalValidationError extends BaseError {}

export { TechnicalError, TechnicalValidationError, FunctionalValidationError }
