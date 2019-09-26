const compiler = require('vue-template-compiler')
const { parse: parseSFC, compileTemplate } = require('@vue/component-compiler-utils')
const babelParser = require('@babel/parser')
const babelTraverse = require('@babel/traverse').default
const babelTypes = require('@babel/types')
const template = require('@babel/template').default
const Case = require('case')

/**
 * @description Parse Vue single file component into asts
 * @class SFCParser
 */
class SFCParser {
  /**
   *Creates an instance of SFCParser.
   * @param {*} {
   *     source = '', vue sfc source code
   *     componentName = '', component name for component registration
   *     babelParserOptions = {} babel parser options
   *   }
   * @memberof SFCParser
   */
  constructor ({
    source = '',
    componentName = '',
    babelParserOptions = {}
  }) {
    const defaultBabelParserOptions = {
      sourceType: 'unambiguous',
      plugins: [
        'asyncGenerators',
        'bigInt',
        'dynamicImport',
        'objectRestSpread'
      ]
    }
    this.source = source
    // force component name in pascal case for simplicity
    this.componentName = Case.pascal(componentName)
    this.extractedImportDeclarations = []
    this.componentOptions = null
    this.componentDeclaration = null
    // handle different cases in SFC, but SFC should at least contains a script tag or a template tag
    this.componentAstFactory = (hasTemplate = true, hasScript = true) => template(`
    const %%componentName%% = (function() {
      %%afterImportDeclarations%%
      ${hasTemplate ? '%%renderFns%%\n' : ''}
      ${hasScript ? 'const componentOptions = %%componentOptions%%\n' : ''}
      return {
        ${hasScript ? '...componentOptions,' : ''}
        ${hasTemplate ? 'render,\nstaticRenderFns' : ''}
      }
    })();
  `)
    this.babelParserOptions = Object.assign({}, defaultBabelParserOptions, babelParserOptions)
  }

  /**
   * @description generate component declaration ast for futher usage
   * @memberof SFCParser
   */
  genComponentDeclarationAst () {
    const hasTemplate = Boolean(this.templateBlock)
    const hasScript = Boolean(this.scriptBlock)
    const subsititutions = {
      componentName: babelTypes.identifier(this.componentName)
    }

    // when SFC contains a template tag
    if (hasTemplate) {
      subsititutions.renderFns = this.templateBlock.ast.program.body.slice()
      subsititutions.afterImportDeclarations = []
    }

    // when SFC contains a script tag
    if (hasScript) {
      subsititutions.componentOptions = this.componentOptions
      subsititutions.afterImportDeclarations = this.scriptBlock.ast.program.body.slice()
    }
    this.componentDeclaration = this.componentAstFactory(hasTemplate, hasScript)(subsititutions)
  }

  /**
   * @description parse sfc into different block
   * @returns {object} blocks
   * @memberof SFCParser
   */
  parseSFCToBlocks () {
    const { template, script, styles } = parseSFC({
      source: this.source,
      compiler,
      needMap: false
    })
    if (!template && !script) {
      throw new Error(`At least provide a script block or a template block\nSource: ${this.source} \n`)
    }
    this.templateBlock = template
    this.scriptBlock = script
    this.styleBlocks = styles

    return {
      template,
      script,
      styles
    }
  }

  /**
   * @description parse script block in sfc, extract import statements, export default object and statements between
   * @memberof SFCParser
   */
  parseScriptBlock () {
    if (!this.scriptBlock) return
    // keep whats left between export default and import
    const componentScriptBlockVisitor = {
      ImportDeclaration: path => {
        if (Array.isArray(path.node.leadingComments) && path.node.leadingComments.length > 0) {
          delete path.node.leadingComments
        }
        this.extractedImportDeclarations.push(path.node)
        path.remove()
        return
      },
      ExportDefaultDeclaration: path => {
        // consider export default was wrapper with function like 'Object.assign'
        this.componentOptions = path.node.declaration
        path.remove()
        return
      }
    }
    this.scriptBlock.ast = babelParser.parse(this.scriptBlock.content, this.babelParserOptions)
    // get component options object
    babelTraverse(this.scriptBlock.ast, componentScriptBlockVisitor)
  }

  /**
   * @description verfiy style block, make sure they don are not scoped
   * @memberof SFCParser
   */
  verifyStyleBlocks () {
    this.styleBlocks.forEach(style => {
      if (style.module || style.scoped) {
        throw new TypeError('scoped style and css module is not supported')
      }
    })
  }

  /**
   * @description parse template block in sfc into render function
   * @memberof SFCParser
   */
  parseTemplateBlock () {
    if (!this.templateBlock) return
    const templateCompileResult = compileTemplate({
      source: this.templateBlock.content,
      compiler
    })
    this.templateBlock.code = templateCompileResult.code
    this.templateBlock.ast = babelParser.parse(templateCompileResult.code, this.babelParserOptions)
  }

  /**
   * @description parse everything into ast except style tags
   * @returns {object} sfc asts and infos
   * @memberof SFCParser
   */
  parse() {
    this.parseSFCToBlocks()
    this.parseScriptBlock()
    this.parseTemplateBlock()
    this.genComponentDeclarationAst()
    this.verifyStyleBlocks()
    return {
      normalizedComponentName: this.componentName,
      componentDeclaration: this.componentDeclaration,
      importDeclarations: this.extractedImportDeclarations,
      styles: this.styleBlocks
    }
  }
}

module.exports = SFCParser
