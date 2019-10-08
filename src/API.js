const SFCParser = require('./SFCParser')
const babelTypes = require('@babel/types')
const assertMdast = require('mdast-util-assert')
const findCodeBlocks = require('./helpers/findCodeBlocks')
const replaceNode = require('./helpers/replaceNode')

/**
 * @description External API for processor hooks
 * @class ExternalAPI
 */
class ExternalAPI {
  /**
   * Creates an instance of ExternalAPI.
   * @param {object} processor read only processor
   * @memberof ExternalAPI
   */
  constructor (processor) {
    Object.defineProperty(this, 'processor', {
      get () {
        return processor
      }
    })
  }

  /**
   * @description add new child component to markdown (transformed) component
   * @param {*} componentName
   * @param {*} code
   * @returns
   * @memberof ExternalAPI
   */
  addComponent (componentName, code) {
    const {
      normalizedComponentName,
      componentDeclaration,
      importDeclarations,
      styles
    } = new SFCParser({ source: code, componentName }).parse()
    importDeclarations.forEach(ast => this.processor.addImportDeclaration(ast))
    this.processor.addAfterImportDeclarations(componentDeclaration)
    this.processor.addComponentObjectProperty(
      babelTypes.objectProperty(
        babelTypes.identifier(normalizedComponentName), babelTypes.identifier(normalizedComponentName)
      )
    )
    this.processor.addStyleBlocks(styles)
    return normalizedComponentName
  }

  /**
   * @description add dependency using webpack loader api
   * @param {string} path dependecy file path
   * @memberof ExternalAPI
   */
  addDependency (path) {
    this.processor.loader.addDependency(path)
  }

  /**
   * @description add custom code block for markdown, will replace the specific block with new ast, it internally adds a transformer function
   * @param {string} name custom code block name
   * @param {function} handler handler to transform markdown ast
   * @memberof ExternalAPI
   */
  addCodeBlock (name, handler) {
    // add code blocks after ast transformation is meaningless
    if (this.processor.currentHook === 'aftertransform') return
    const options = { name }
    this.processor.unshiftTransformer('parseCodeBlock', options, function findAndReplaceBlock (mdast) {
      const blocks = findCodeBlocks(name, mdast)
      blocks.forEach(node => {
        const { value, meta } = node
        const newNode = handler(value, meta)
        assertMdast(newNode)
        replaceNode(mdast, node, newNode)
      })
      return mdast
    })
  }
}

module.exports = ExternalAPI
