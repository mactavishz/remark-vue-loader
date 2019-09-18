const isNode = require('unist-util-is')
const visitChildren = require('unist-util-visit-children')
const findNodeAfter = require('unist-util-find-after')
const findAllNodesBetween = require('unist-util-find-all-between')
// const inspectAST = require('unist-util-inspect')
const querystring = require('querystring')

function containerFenceRegexFactory (name) {
  if (!name) throw new Error('Must specify the name')
  return new RegExp(`^(?::::)\\s${name}\\??(?<params>[a-zA-Z,_=0-9]*)`)
}

function findContainers (name, mdast) {
  const CONTAINER_START_REGEX = containerFenceRegexFactory(name)
  const CONTAINER_END_REGEX = /^(?::::)$/
  const CONTAINER_SAME_LINE_END_REGEX = /(?::::)$/
  const containers = []
  const containerStartNodes = []

  function isContainerStartNode (node) {
    if (isNode(node, 'paragraph') && node.children.length > 0 && isNode(node.children[0], 'text')) {
      const { value } = node.children[0]
      return CONTAINER_START_REGEX.test(value)
    }
  }

  function isContainerEndNode (node) {
    if (isNode(node, 'paragraph') && node.children.length > 0 && isNode(node.children[0], 'text')) {
      const { value } = node.children[0]
      return CONTAINER_END_REGEX.test(value)
    }
  }

  // traverse the mdast tree, find all possible containers' start node
  visitChildren((node, index, parent) => {
    if (isContainerStartNode(node)) {
      containerStartNodes.push({
        node,
        index
      })
    }
  })(mdast)

  containerStartNodes.forEach(({ node: startNode, index }) => {
    const { value } = startNode.children[0]
    const startMatched = value.match(CONTAINER_START_REGEX)
    const endMatched = value.match(CONTAINER_SAME_LINE_END_REGEX)
    let  { params } = startMatched.groups
    params = querystring.parse(params.replace(/,/g, '&'))
    const containerStartStr = startMatched[0]
    if (CONTAINER_SAME_LINE_END_REGEX.test(value)) {
      containers.push({
        name,
        index,
        start: startNode,
        between: value.slice(containerStartStr.length, endMatched.index),
        end: startNode,
        params
      })
    } else {
      const endNode = findNodeAfter(mdast, startNode, isContainerEndNode)
      const nodesBetween = findAllNodesBetween(mdast, startNode, endNode)
      if (startNode.children.length > 1) {
        nodesBetween.unshift(...startNode.children.slice(1, startNode.children.length))
      }
      containers.push({
        name,
        index,
        start: startNode,
        between: nodesBetween,
        end: endNode,
        params
      })
    }
  })

  return containers
}

module.exports = findContainers
