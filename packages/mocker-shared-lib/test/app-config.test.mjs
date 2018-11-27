import chai from 'chai'
import { AppConfig } from '../src/app-config'

const expect = chai.expect

const test = () => {
  const config = new AppConfig()

  // ---- Test type registration ----
  class BaseTest {}
  class SubTest extends BaseTest {}
  config.registerType(BaseTest, SubTest)

  // expect the result to be an instance of SubTest
  expect(config.getClassInstance(BaseTest)).to.be.an.instanceof(SubTest)

  config.unregisterType(BaseTest)

  // expect an exception when trying to retrieve instance for a class that isn't registered
  expect(() => config.getClassInstance(BaseTest)).to.throw('To get an instance for class BaseTest, a type should be registered for the class')

  // does not fail when unregister something that isn't registered
  expect(() => config.unregisterType(BaseTest)).to.not.throw()

  // ---- Test type registration with arguments ----
  class BaseTestWithArguments {
    constructor (a, b = 'z') {
      this.a = a
      this.b = b
    }
  }
  class SubTestWithArguments extends BaseTestWithArguments {}
  config.registerType(BaseTestWithArguments, SubTestWithArguments)

  // no arguments
  const instanceWithoutArguments = config.getClassInstance(BaseTestWithArguments)
  expect(instanceWithoutArguments).to.be.an.instanceof(SubTestWithArguments)
  expect(instanceWithoutArguments.a).to.be.equal(undefined)
  expect(instanceWithoutArguments.b).to.be.equal('z')

  // 1 argument
  const instanceWithOneArgument = config.getClassInstance(BaseTestWithArguments, 'y')
  expect(instanceWithOneArgument.a).to.be.equal('y')
  expect(instanceWithOneArgument.b).to.be.equal('z')

  // 2 arguments
  const instanceWithTwoArguments = config.getClassInstance(BaseTestWithArguments, 'y', 'x')
  expect(instanceWithTwoArguments.a).to.be.equal('y')
  expect(instanceWithTwoArguments.b).to.be.equal('x')

  // Too many arguments
  const instanceWithTooManyArguments = config.getClassInstance(BaseTestWithArguments, 'y', 'x', 'w')
  expect(instanceWithTooManyArguments.a).to.be.equal('y')
  expect(instanceWithTooManyArguments.b).to.be.equal('x')

  // ---- Register instance ----
  class TestInstance {}
  const instance = new TestInstance()
  config.registerInstance(TestInstance, instance)

  expect(config.getInstance(TestInstance)).to.be.equal(instance)

  config.unregisterInstance(TestInstance)

  // expect an exception when trying to retrieve instance for a class that isn't registered
  expect(() => config.getInstance(TestInstance)).to.throw('No instance has been registered for \'class TestInstance {}\'')

  // register by name
  config.registerInstance('name', instance)
  expect(config.getInstance('name')).to.be.equal(instance)

  // ---- Register property ----
  const property = 'test.property'
  config.registerProperty('test.property', 'test_property')

  expect(config.getProperty(property)).to.be.equal('test_property')
  expect(config.getOptionalProperty(property)).to.be.equal('test_property')

  config.unregisterProperty(property)

  // expect an exception when trying to retrieve property that isn't registered
  expect(() => config.getProperty(property)).to.throw('No property has been registered for \'test.property\'')

  // expect undefined when trying to retrieve optional property that isn't registered
  expect(config.getOptionalProperty(property)).to.equal(undefined)
}

export {
  test
}
