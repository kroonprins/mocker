
module.exports = function (api) {
  api.cache(true)

  const presets = [
    // '@babel/env'
  ]
  const plugins = [
    'dynamic-import-node',
    '@babel/plugin-transform-modules-commonjs',
    '@babel/plugin-syntax-import-meta',
    'babel-plugin-transform-import-meta'
  ]

  return {
    presets,
    plugins
  }
}

// issues:
//  * test-runner selects by *.mjs
//  * serializr module not working (.default shouldn't be there)
