/**
 * Unexpected but non-fatal technical error.
 *
 * @class TechnicalError
 * @extends {Error}
 */
class TechnicalError extends Error {}

/**
 * Error indicating a technical validation of input failed.
 *
 * @class TechnicalValidationError
 * @extends {Error}
 */
class TechnicalValidationError extends Error {}

/**
 * Error indicating a functional validation of input failed.
 *
 * @class FunctionalValidationError
 * @extends {Error}
 */
class FunctionalValidationError extends Error {}

export { TechnicalError, TechnicalValidationError, FunctionalValidationError }
