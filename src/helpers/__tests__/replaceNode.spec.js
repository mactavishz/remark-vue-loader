const { root, paragraph, text, strong } = require('mdast-builder')
const isNode = require('unist-util-is')
const replaceNode = require('../replaceNode')

describe('Helpers#replaceNode', () => {
  const tree = root([
    paragraph([
      text('Hello World')
    ])
  ])

  const nodeToReplace = tree.children[0]
  const newNode = paragraph([
    strong([
      text('Hellow World')
    ])
  ])

  replaceNode(tree, nodeToReplace, newNode)

  test('Old node should be replaced', () => {
    expect(isNode(tree.children[0], nodeToReplace)).toBe(false)
    expect(isNode(tree.children[0], newNode)).toBe(true)
  })
})
