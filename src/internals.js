const { html } = require('mdast-builder')
const findContainers = require('./helpers/findContainers')
const replaceNode = require('./helpers/replaceNode')
const hash = require('hash-sum')
const qs = require('querystring')

/**
 * @description internal SFC container transformer
 * @param {object} mdast markdown ast
 * @param {object} options transformer options
 * @returns
 */
async function SFCContainerTransformer (mdast, options) {
  const { api } = options
  const SFCContainers = findContainers('SFC', mdast)
  for (let container of SFCContainers) {
    let { value: code, meta } = container
    meta = qs.parse(meta)
    const componentName = meta.componentName || `SFC${hash(code)}`
    const normalizedComponentName = api.injectComponent(componentName, code)
    replaceNode(mdast, container, html(`<${normalizedComponentName} />`))
  }
  return mdast
}

module.exports = {
  SFCContainerTransformer
}
