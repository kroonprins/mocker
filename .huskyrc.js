const tasks = arr => arr.join(' && ')

module.exports = {
  'hooks': {
    'pre-commit': tasks([
      'npm run lint-check',
      'npm test',
      'cd packages/mocker-ui/src/angular',
      'npm run lint',
      'npm run build-prod'
    ])
  }
}
