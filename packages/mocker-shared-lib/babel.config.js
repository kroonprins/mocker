
module.exports = function (api) {
  api.cache(true)

  const presets = [
    // '@babel/env'
  ]
  const plugins = [
    'dynamic-import-node',
    '@babel/plugin-transform-modules-commonjs'
  ]

  return {
    presets,
    plugins
  }
}

// issues:
//  * test-runner selects by *.mjs
//  * serializr module not working (.default shouldn't be there)
