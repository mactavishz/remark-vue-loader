const { root, html } = require('mdast-builder')
const isNode = require('unist-util-is')
const removeNode = require('unist-util-remove')
const findContainers = require('./helpers/findContainers')
const mdastToHTML = require('./helpers/mdastToHTML')

async function SFCContainerTransformer (mdast, options) {
  const containers = findContainers('SFC', mdast)
  // console.log(`${options.resourcePath} has ${containers.length} containers`)
  for (let container of containers) {
    const { start, between, end } = container
    let partialMdast = null
    if (typeof between !== 'string') {
      partialMdast = root([
        ...between.filter(node => isNode(node, 'html'))
      ])
      const SFCStr = await mdastToHTML(partialMdast)
      between.forEach(bnode => removeNode(mdast, node => isNode(node, bnode)))
    }
    removeNode(mdast, node => isNode(node, start))
    removeNode(mdast, node => isNode(node, end))
  }
  // if (options.resourcePath.endsWith('container.md')) {
  //   console.dir(mdast, { depth: null })
  // }
  return mdast
}

module.exports = {
  SFCContainerTransformer
}
