import yaml from 'js-yaml'
import chokidar from 'chokidar'
import EventEmitter from 'events'
import path from 'path'
import { readFileAsync } from './fs-util'
import { ClassValidationService } from './class-validation.service'
import { ProjectsFile } from './project-model'
import { ProjectsFileSerializationModel } from './project-serialization-model'
import { deserialize } from './mjs_workaround/serializr-es6-module-loader'
import { Logger } from './logging'
import { config } from './config'

class ProjectChangeEventEmitter extends EventEmitter {}

// watches directly for file system changes instead of events raised by project-service so that manual changes to project file/rule files are also detected
class ProjectChangeWatcher {
  constructor (projectName, projectFileLocation = config.getProperty('project.location'), classValidator = config.getInstance(ClassValidationService)) {
    this.projectName = projectName
    this.projectFileLocation = projectFileLocation
    this.projectFileDirectory = path.dirname(this.projectFileLocation)
    this.classValidator = classValidator
    this.logger = config.getClassInstance(Logger, { id: 'project-change-watcher' })
    this.watcher = null
    this.eventEmitter = null
  }

  async start () {
    this.logger.debug('Starting watch for changes on project %s', this.projectName)
    let rules
    try {
      rules = await this.readRulesFromProjectsFile()
    } catch (e) {
      this.logger.error('An error occurred when trying to retrieve the rule locations for project %s from project file %s', this.projectName, this.projectName, e)
    }

    this.logger.debug('Will watch for', rules)
    this.eventEmitter = new ProjectChangeEventEmitter()
    this.watcher = chokidar.watch(rules, {
      ignoreInitial: true,
      persistent: false
    }).on('all', (event, path) => {
      this.logger.debug('Change detected for project %s, %s, %s', this.projectName, event, path)
      this.eventEmitter.emit('changeDetected')
      // TODO retrieve rules again, close watcher, add new rules on watcher
    })
    this.logger.debug('Watching', this.watcher.getWatched())

    return this.eventEmitter
  }

  stop () {
    if (this.watcher) {
      this.watcher.close()
    }
  }

  async readRulesFromProjectsFile () {
    const rawFileContent = await readFileAsync(this.projectFileLocation)
    const parsedFileContent = yaml.safeLoad(rawFileContent)
    if (!parsedFileContent || !('projects' in parsedFileContent) || !parsedFileContent.projects) {
      throw new Error('The project file %s does not contain any projects', this.projectFileLocation)
    }

    const projectsFile = deserialize(ProjectsFileSerializationModel, parsedFileContent)
    await this.classValidator.validate(ProjectsFile, projectsFile)

    const projectFile = projectsFile.projects.filter(projectFile => {
      return projectFile.name === this.projectName
    })

    if (!projectFile || projectFile.length !== 1) {
      throw new Error(`The project ${this.projectName} is not present in ${this.projectFileLocation}`)
    }

    this.logger.debug('Found projectFile', projectFile)
    return projectFile[0].rules.map(rule => {
      const isAbsolutePath = rule === path.resolve(rule)
      this.logger.debug(`The rule file pattern ${rule} is considered an absolute path: ${isAbsolutePath}`)

      const ruleFilePatternNormalized = isAbsolutePath ? rule : path.normalize(path.join(this.projectFileDirectory, rule))
      this.logger.debug(`Normalized ruleFilePattern: ${ruleFilePatternNormalized}`)
      return ruleFilePatternNormalized
    })
  }
}

export {
  ProjectChangeWatcher
}
