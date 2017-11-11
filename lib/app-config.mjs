class AppConfig {
  constructor () {
    this.typesContainer = {}
    this.instanceContainer = {}
    this.propertiesContainer = {}
  }
  registerType (clazz, implementationType) {
    this.typesContainer[clazz] = implementationType
  }
  unregisterType (clazz) {
    delete this.typesContainer[clazz]
  }
  registerInstance (id, instance) {
    this.instanceContainer[id] = instance
  }
  unregisterInstance (id) {
    delete this.instanceContainer[id]
  }
  registerProperty (property, propertyValue) {
    this.propertiesContainer[property] = propertyValue
  }
  unregisterProperty (property) {
    delete this.propertiesContainer[property]
  }
  getInstance (id) {
    if (!(id in this.instanceContainer)) {
      throw new Error(`No instance has been registered for '${id}'`)
    }
    return this.instanceContainer[id]
  }
  getClassInstance (clazz, ...args) {
    if (!(clazz in this.typesContainer)) {
      throw new Error(`To get an instance for class ${clazz.name}, a type should be registered for the class`)
    }
    return new this.typesContainer[clazz](...args)
  }
  getProperty (property) {
    if (!(property in this.propertiesContainer)) {
      throw new Error(`No property has been registered for '${property}'`)
    }
    return this.propertiesContainer[property]
  }
  reset () {
    this.typesContainer = {}
    this.instanceContainer = {}
    this.propertiesContainer = {}
  }
}

export default AppConfig
