const compiler = require('vue-template-compiler')
const { parse: parseSFC, compileTemplate } = require('@vue/component-compiler-utils')
const babelParser = require('@babel/parser')
const babelTraverse = require('@babel/traverse').default
const babelTypes = require('@babel/types')
// const codegen = require('@babel/generator').default
const template = require('@babel/template').default
const Case = require('case')

class SFCParser {
  constructor ({
    source = '',
    componentName = '',
    parserOptions = {}
  }) {
    const defaultOptions = {
      sourceType: 'unambiguous',
      plugins: [
        'asyncGenerators',
        'bigInt',
        'dynamicImport',
        'objectRestSpread'
      ]
    }
    this.source = source
    this.componentName = Case.pascal(componentName)
    this.extractedImportDeclarations = []
    this.componentOptions = null
    this.componentDeclaration = null
    this.componentAstFactory = template(`
      const %%componentName%% = (function() {
        %%renderFnsAndOtherStatements%%\n
        const componentOptions = %%componentOptions%%\n
        return {
          ...componentOptions,
          render,
          staticRenderFns
        }
      })();
    `)
    this.babelParserOptions = Object.assign({}, defaultOptions, parserOptions)
  }

  parseSFCToBlocks () {
    const { template, script, styles } = parseSFC({
      source: this.source,
      compiler,
      needMap: false
    })
    this.templateBlock = template
    this.scriptBlock = script
    this.styleBlocks = styles
  }

  parseScriptBlock () {
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

  verifyStyleBlocks () {
    this.styleBlocks.forEach(style => {
      if (style.module || style.scoped) {
        throw new TypeError('scoped style and css module is not supported')
      }
    })
  }

  parseTemplateBlock () {
    const templateCompileResult = compileTemplate({
      source: this.templateBlock.content,
      compiler
    })
    this.templateBlock.code = templateCompileResult.code
    this.templateBlock.ast = babelParser.parse(templateCompileResult.code, this.babelParserOptions)
    this.componentDeclaration = this.componentAstFactory({
      componentOptions: this.componentOptions,
      renderFnsAndOtherStatements: [].concat(this.templateBlock.ast.program.body.slice(), this.scriptBlock.ast.program.body.slice()),
      componentName: babelTypes.identifier(this.componentName)
    })
  }

  parse() {
    this.parseSFCToBlocks()
    this.parseScriptBlock()
    this.parseTemplateBlock()
    this.verifyStyleBlocks()
    return {
      componentName: this.componentName,
      componentDeclaration: this.componentDeclaration,
      imports: this.extractedImportDeclarations,
      styles: this.styleBlocks
    }
  }
}

module.exports = SFCParser
