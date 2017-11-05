class ProjectsFile {
  constructor (projects = []) {
    this.projects = projects // list of ProjectFile
  }
}

class ProjectFile {
  constructor (name, rules = []) {
    this.name = name
    this.rules = rules // list of strings containing references to rule files
  }
}

class Project {
  constructor (name, rules = []) {
    this.name = name
    this.rules = rules // list of ProjectRules
  }
}

class ProjectRule {
  constructor (location, rule) {
    this.location = location
    this.rule = rule
  }
}

export {
  ProjectsFile,
  ProjectFile,
  Project,
  ProjectRule
}
