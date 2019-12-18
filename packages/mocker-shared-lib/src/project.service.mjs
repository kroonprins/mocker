import { ProjectStore } from './project.store.mjs'
import { Logger } from './logging.mjs'
import { config } from './config.mjs'

class ProjectService {
  constructor (projectStore = config.getInstance(ProjectStore)) {
    this.projectStore = projectStore
    this.logger = config.getClassInstance(Logger, { id: 'project-service' })
  }
  async reInitialize () {
    return this.projectStore.reInitialize()
  }
  async listProjects () {
    return this.projectStore.listProjects()
  }
  async createProject (projectName) {
    this.logger.debug("Creating new project '%s'", projectName)
    return this.projectStore.createNewProject(projectName)
  }
  async retrieveProject (projectName) {
    this.logger.debug("Retrieving project '%s'", projectName)
    return this.projectStore.retrieveProject(projectName)
  }
  async updateProject (projectName, updatedProject) { // only allows updating project properties, not its rules
    this.logger.debug(updatedProject, "Updating project '%s'", projectName)
    return this.projectStore.updateProject(projectName, updatedProject)
  }
  async removeProject (projectName) {
    this.logger.debug("Removing project '%s'", projectName)
    return this.projectStore.removeProject(projectName)
  }
  async listProjectRules (projectName) {
    this.logger.debug("List rules for project '%s' from file '%s'", projectName)
    const project = await this.projectStore.retrieveProject(projectName)
    return project.rules
  }
  async retrieveProjectRule (projectName, ruleName) {
    this.logger.debug("Retrieve rule with name %s for project '%s'", ruleName, projectName)
    return this.projectStore.retrieveProjectRule(projectName, ruleName)
  }
  async createProjectRule (projectName, projectRule) {
    this.logger.debug(projectRule, "Creating new rule for project '%s'", projectName)
    return this.projectStore.createProjectRule(projectName, projectRule)
  }
  async updateProjectRule (projectName, originalRuleName, updatedProjectRule) {
    this.logger.debug(updatedProjectRule, "Update rule with name '%s' for project '%s'", originalRuleName, projectName)
    return this.projectStore.updateProjectRule(projectName, originalRuleName, updatedProjectRule)
  }
  async removeProjectRule (projectName, ruleName) {
    this.logger.debug("Removing rule with name '%s' for project '%s'", ruleName, projectName)
    return this.projectStore.removeProjectRule(projectName, ruleName)
  }
}

export {
  ProjectService
}
