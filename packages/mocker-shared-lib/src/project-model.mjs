class ProjectsFile {
  constructor (projects = []) {
    this.projects = projects // list of ProjectFile
  }

  set projects (projects) {
    this._projects = projects
  }

  get projects () {
    return this._projects
  }
}

class ProjectFile {
  constructor (name, rules = []) {
    this.name = name
    this.rules = rules // list of strings containing references to rule files
  }

  set name (name) {
    this._name = name ? name.trim() : null
  }

  get name () {
    return this._name
  }

  set rules (rules) {
    this._rules = rules
  }

  get rules () {
    return this._rules
  }
}

class Project {
  constructor (name, rules = []) {
    this.name = name
    this.rules = rules // list of ProjectRules
  }

  set name (name) {
    this._name = name ? name.trim() : null
  }

  get name () {
    return this._name
  }

  set rules (rules) {
    this._rules = rules
  }

  get rules () {
    return this._rules
  }
}

class ProjectRule {
  constructor (location, rule) {
    this.location = location
    this.rule = rule
  }

  set location (location) {
    this._location = location ? location.trim() : null
  }

  get location () {
    return this._location
  }

  set rule (rule) {
    this._rule = rule
  }

  get rule () {
    return this._rule
  }
}

export {
  ProjectsFile,
  ProjectFile,
  Project,
  ProjectRule
}
