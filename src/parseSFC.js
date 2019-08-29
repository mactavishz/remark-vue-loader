const compiler = require('vue-template-compiler')
const { parse: parseSFC, compileTemplate } = require('@vue/component-compiler-utils')
const babelParser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const codegen = require('@babel/generator').default
const t = require('@babel/types')
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
        %%declarations%%\n
        const componentOptions = %%options%%\n
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
        if (t.isObjectExpression(path.node.declaration))
          this.componentOptions = path.node.declaration
          path.stop()
        }
    }
    this.scriptBlock.ast = babelParser.parse(this.scriptBlock.content, this.babelParserOptions)
    // get component options object
    traverse(this.scriptBlock.ast, componentScriptBlockVisitor)
  }

  parseStyleBlocks () {
  }

  parseTemplateBlock () {
    const templateCompileResult = compileTemplate({
      source: this.templateBlock.content,
      compiler
    })
    this.templateBlock.code = templateCompileResult.code
    this.templateBlock.ast = babelParser.parse(templateCompileResult.code, this.babelParserOptions)
    this.componentDeclaration = this.componentAstFactory({
      options: this.componentOptions,
      declarations: this.templateBlock.ast.program.body.slice(),
      componentName: t.identifier(this.componentName)
    })
    // console.log(codegen(this.componentDeclaration).code)
  }

  parse() {
    this.parseSFCToBlocks()
    this.parseScriptBlock()
    this.parseTemplateBlock()
  }
}

module.exports = SFCParser
