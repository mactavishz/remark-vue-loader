const SFCParser = require('./SFCParser')
const babelTypes = require('@babel/types')
const babelTemplate = require('@babel/template')
const assertMdast = require('mdast-util-assert')
const findContainers = require('./helpers/findContainers')
const replaceNode = require('./helpers/replaceNode')
const Case = require('case')
const path = require('path')

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
   * @description inject new child component to markdown component using source code
   * @param {*} componentName
   * @param {*} code
   * @returns {string} pascal-case component name
   * @memberof ExternalAPI
   */
  injectComponent (componentName, code) {
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
   * @param {string} name component name
   * @param {string} from valid import module name, could be a file path or module name
   * @returns {string} pascal-case component name
   * @memberof ExternalAPI
   */
  importComponent (name, from) {
    const normalizedComponentName = Case.pascal(name)
    const loaderContext = this.processor.loader.context
    if (!path.isAbsolute(from)) from = path.resolve(loaderContext, from)
    const relativePath = path.relative(loaderContext, from)
    this.processor.addImportDeclaration(babelTemplate.statement(`import ${normalizedComponentName} from '${relativePath}'`)())
    this.processor.addComponentObjectProperty(
      babelTypes.objectProperty(
        babelTypes.identifier(normalizedComponentName), babelTypes.identifier(normalizedComponentName)
      )
    )
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
   * @description add custom container for markdown, it will replace the specific content with ast nodes, it internally adds a transformer function
   * @param {string} name custom container name
   * @param {function} handler handler to transform markdown ast
   * @memberof ExternalAPI
   */
  addContainer (name, handler) {
    // add container after ast transformation is meaningless
    if (this.processor.currentHook === 'aftertransform') return
    const options = { name }
    this.processor.unshiftTransformer('parseContainers', options, function findAndReplaceBlock (mdast) {
      const containers = findContainers(name, mdast)
      containers.forEach(node => {
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
