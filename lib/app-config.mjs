/**
 * Error used when incorrect or incomplete configuration makes it not possible to return an instance or property.
 *
 * @class AppConfigurationError
 * @extends {Error}
 */
class AppConfigurationError extends Error {}

/**
 * Extremely basic DI container.
 * Allows registering instances, types and properties.
 * Does not resolve dependencies itself but expects that the application uses constructor dependency injection with the default value of the dependency being retrieved from the configuration. See example below. This means it is important to register instances in the correct order and that circular dependencies won't work.
 * @example
 * class A {}
 * class B {
 *   constructor(a = config.getInstance(A)) {
 *     this.a = a
 *   }
 * }
 *
 * const config = new AppConfig()
 *   .register(A, new A())
 *   .register(B, new B())
 */
class AppConfig {
  constructor () {
    this.typesContainer = {}
    this.instanceContainer = {}
    this.propertiesContainer = {}
  }

  /**
   * Register a type. Overwrites the existing type if it was already registered.
   * @example
   * const config = new AppConfig()
   * config.registerType(DbService, MockDbService)
   * config.getClassInstance(DbService[, <constructor arguments>]).query(...)
   *
   * @param {any} clazz type to register.
   * @param {any} implementationType type to create when requesting an instance.
   * @returns this.
   * @memberof AppConfig
   */
  registerType (clazz, implementationType) {
    this.typesContainer[clazz] = implementationType
    return this
  }

  /**
   * Unregister a previously registered type. Does not fail if the type has not been registered.
   *
   * @param {any} clazz the type to unregister.
   * @returns this.
   * @memberof AppConfig
   */
  unregisterType (clazz) {
    delete this.typesContainer[clazz]
    return this
  }

  /**
   * Register an instance.
   * @example
   * const config = new AppConfig()
   * config.registerInstance(DbService, new MockDbService())
   * config.getInstance(DbService).query(...)
   * config.registerInstance('database-service', new MockDbService())
   * config.getInstance('database-service').query(...)
   *
   * @param {any} id id for the instance. Can be anything, but expected to be either a type or a string identifier.
   * @param {any} instance the instance to register.
   * @returns this.
   * @memberof AppConfig
   */
  registerInstance (id, instance) {
    this.instanceContainer[id] = instance
    return this
  }

  /**
   * Unregister a previously registered instance. Does not fail if the instance has not been registered.
   *
   * @param {any} id the id of the instance to unregister.
   * @returns this.
   * @memberof AppConfig
   */
  unregisterInstance (id) {
    delete this.instanceContainer[id]
    return this
  }

  /**
   * Register a property.
   *
   * @example
   * const config = new AppConfig()
   * config.registerProperty('app.server.port', 8080)
   * config.getProperty('app.server.port')
   *
   * @param {string} property property name.
   * @param {string} propertyValue property value.
   * @returns this.
   * @memberof AppConfig
   */
  registerProperty (property, propertyValue) {
    this.propertiesContainer[property] = propertyValue
    return this
  }

  /**
   * Unregister a previously registered property. Does not fail if the property has not been registered.
   *
   * @param {any} property property name.
   * @returns this.
   * @memberof AppConfig
   */
  unregisterProperty (property) {
    delete this.propertiesContainer[property]
    return this
  }

  /**
   * Retrieve a registered instance.
   *
   * @param {any} id id of the registered instance.
   * @returns the instance.
   * @throws {AppConfigurationError} if nothing is registered for the given id.
   * @memberof AppConfig
   */
  getInstance (id) {
    if (!(id in this.instanceContainer)) {
      throw new AppConfigurationError(`No instance has been registered for '${id}'`)
    }
    return this.instanceContainer[id]
  }

  /**
   * Retrieve an instance for a registered type.
   *
   * @param {any} clazz the registered type.
   * @param {any} args constructor arguments required for creating the instance.
   * @returns the created instance.
   * @throws {AppConfigurationError} if nothing is registered for the given type.
   * @memberof AppConfig
   */
  getClassInstance (clazz, ...args) {
    if (!(clazz in this.typesContainer)) {
      throw new AppConfigurationError(`To get an instance for class ${clazz.name}, a type should be registered for the class`)
    }
    return new this.typesContainer[clazz](...args)
  }

  /**
   * Retrieve a property value for a registered property.
   *
   * @param {any} property the property.
   * @returns the property value.
   * @throws {AppConfigurationError} if nothing is registered for the given property.
   * @memberof AppConfig
   */
  getProperty (property) {
    if (!(property in this.propertiesContainer)) {
      throw new AppConfigurationError(`No property has been registered for '${property}'`)
    }
    return this.propertiesContainer[property]
  }

  /**
   * Remove everything that has been registered from the configuration.
   *
   * @memberof AppConfig
   */
  reset () {
    this.typesContainer = {}
    this.instanceContainer = {}
    this.propertiesContainer = {}
  }
}

export default AppConfig
