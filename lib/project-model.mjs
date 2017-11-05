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
    this.rules = rules // list of Rules
  }
}

export {
  ProjectsFile,
  ProjectFile,
  Project
}
