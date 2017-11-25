import { RuleValidationModel } from './rule-validation-model'

const ProjectFileValidationModel = {
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
    ],
    'additionalProperties': false
  },
  '$ref': '#/ProjectFile'
}

const ProjectsFileValidationModel = {
  '$id': 'uri://mocker/project/ProjectsFileValidationModel',
  'ProjectsFile': {
    'type': 'object',
    'properties': {
      'projects': {
        'type': 'array',
        'items': {
          '$ref': `${ProjectFileValidationModel.$id}#/ProjectFile`
        }
      }
    },
    'required': [
      'projects'
    ],
    'additionalProperties': false
  },
  '$ref': '#/ProjectsFile'
}

const ProjectRuleValidationModel = {
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
        '$ref': `${RuleValidationModel.$id}#/Rule`
      }
    },
    'required': [
      'location', 'rule'
    ],
    'additionalProperties': false
  },
  '$ref': '#/ProjectRule'
}

const ProjectValidationModel = {
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
          '$ref': `${ProjectRuleValidationModel.$id}#/ProjectRule`
        }
      }
    },
    'required': [
      'name'
    ],
    'additionalProperties': false
  },
  '$ref': '#/ProjectRule'
}

export { ProjectsFileValidationModel, ProjectFileValidationModel, ProjectRuleValidationModel, ProjectValidationModel }
