const isNode = require('unist-util-is')
const visit = require('unist-util-visit')

/**
 * @description replace node with new node in ast
 * @param {object} tree ast
 * @param {object} oldNode old ast node
 * @param {object} newNode new ast node to replace with
 */
function replaceNode (tree, oldNode, newNode) {
  visit(tree, function visitor (node, index, parent) {
    if (isNode(oldNode, node)) {
      parent.children.splice(index, 1, newNode)
      return visit.SKIP
    }
  })
}

module.exports = replaceNode
