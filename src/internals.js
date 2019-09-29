const { html } = require('mdast-builder')
const findCodeBlocks = require('./helpers/findCodeBlocks')
const replaceNode = require('./helpers/replaceNode')
const hash = require('hash-sum')
const qs = require('querystring')

/**
 * @description internal SFC
 * @param {*} mdast
 * @param {*} options
 * @returns
 */
async function SFCCodeBlockTransformer (mdast, options) {
  const { api } = options
  const SFCCodeblocks = findCodeBlocks('SFC', mdast)
  for (let block of SFCCodeblocks) {
    let { value, meta } = block
    meta = qs.parse(meta)
    const componentName = meta.componentName || `SFC${hash(value)}`
    const normalizedComponentName = api.addComponent(componentName, value)
    replaceNode(mdast, block, html(`<${normalizedComponentName} />`))
  }
  return mdast
}

module.exports = {
  SFCCodeBlockTransformer
}
