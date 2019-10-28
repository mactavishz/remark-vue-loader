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
    let { value, meta } = container
    meta = qs.parse(meta)
    const componentName = meta.componentName || `SFC${hash(value)}`
    const normalizedComponentName = api.addComponent(componentName, value)
    replaceNode(mdast, container, html(`<${normalizedComponentName} />`))
  }
  return mdast
}

module.exports = {
  SFCContainerTransformer
}
