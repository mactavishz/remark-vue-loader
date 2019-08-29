const compiler = require('vue-template-compiler')
const { parse: parseSFC, compileTemplate } = require('@vue/component-compiler-utils')
const babelParser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const codegen = require('@babel/generator').default
const t = require('@babel/types')
const template = require('@babel/template').default
const Case = require('case')
const fs = require('fs')
const path = require('path')

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
    this.componentDeclaration = null
    this.componentAstFactory = template(`
    const %%componentName%% = (function() {
      %%declarations%%\n
      return {
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
    // TODO:
    // extract import statements
    // get component object properties
    this.scriptBlock.ast = babelParser.parse(this.scriptBlock.content, this.babelParserOptions)
    fs.writeFileSync(path.resolve(__dirname, '../test/scriptAst.json'), JSON.stringify(this.scriptBlock.ast, null, '  '), 'utf8')
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
      declarations: this.templateBlock.ast.program.body.slice(),
      componentName: t.identifier(this.componentName)
    })
    console.log(codegen(this.componentDeclaration))
  }

  parse() {
    this.parseSFCToBlocks()
    this.parseScriptBlock()
    this.parseTemplateBlock()
  }
}

module.exports = SFCParser
