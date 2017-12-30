import { ValidationModel } from './app-class-validation.service'
import { ProjectsFile, ProjectFile, Project, ProjectRule } from './project-model'
import { RuleValidationModel } from './rule-validation-model'
import { Rule } from './rule-model'
import { config } from './config'

class ProjectValidationModel extends ValidationModel {
  constructor (ruleValidationModel = config.getInstance(RuleValidationModel)) {
    super()
    this[ProjectFile] = {
      '$id': 'uri://mocker/project/ProjectFileValidationModel',
      'ProjectFile': {
        'type': 'object',
        'properties': {
          'name': {
            'type': 'string',
            'minLength': 1,
            'maxLength': 40
          },
          'rules': {
            'type': 'array',
            'items': {
              'type': 'string'
            }
          }
        },
        'required': [
          'name'
        ]
        // 'additionalProperties': false // TODO disadvantage of using getters/setters is that the private properties are additional properties...
      },
      '$ref': '#/ProjectFile'
    }

    this[ProjectsFile] = {
      '$id': 'uri://mocker/project/ProjectsFileValidationModel',
      'ProjectsFile': {
        'type': 'object',
        'properties': {
          'projects': {
            'type': 'array',
            'items': {
              '$ref': `${this[ProjectFile].$id}#/ProjectFile`
            }
          }
        },
        'required': [
          'projects'
        ]
        // 'additionalProperties': false
      },
      '$ref': '#/ProjectsFile'
    }

    this[ProjectRule] = {
      '$id': 'uri://mocker/project/ProjectRuleValidationModel',
      'ProjectRule': {
        'type': 'object',
        'properties': {
          'location': {
            'type': 'string',
            'minLength': 1,
            'maxLength': 1000
          },
          'rule': {
            '$ref': `${ruleValidationModel[Rule].$id}#/Rule`
          }
        },
        'required': [
          'location', 'rule'
        ]
        // 'additionalProperties': false
      },
      '$ref': '#/ProjectRule'
    }

    this[Project] = {
      '$id': 'uri://mocker/project/ProjectValidationModel',
      'Project': {
        'type': 'object',
        'properties': {
          'name': {
            'type': 'string',
            'minLength': 1,
            'maxLength': 40
          },
          'rules': {
            'type': 'array',
            'items': {
              '$ref': `${this[ProjectRule].$id}#/ProjectRule`
            }
          }
        },
        'required': [
          'name'
        ]
        // 'additionalProperties': false
      },
      '$ref': '#/Project'
    }
  }
}

export {
  ProjectValidationModel
}
