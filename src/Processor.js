const fs = require('fs')
const path = require('path')
const unified = require('unified')
const inspectAST = require('unist-util-inspect')
const markdownParser = require('remark-parse')
const assertMdast = require('mdast-util-assert')
const compactNodes = require('mdast-util-compact')
const Handlebars = require('handlebars')
const HooksAPI = require('./API')
const globby = require('globby')
const babelTemplate = require('@babel/template').default
const babelTypes = require('@babel/types')
const babelCodegen = require('@babel/generator').default
const Case = require('case')
const { SFCContainerTransformer } = require('./internals')
const mdastToHTML = require('./helpers/mdastToHTML')

/**
 * @description Processor that transform markdown source text into a standard Vue SFC source code
 * @class Processor
 */
class Processor {
  /**
   * Creates an instance of Processor.
   * @param {object} [{ source, loader, options }={}] options
   * @memberof Processor
   */
  constructor ({ source, loader, options } = {}) {
    this.source = source
    this.loader = loader
    this.options = options
    this.baseContext = this.options.context
    // markdown ast
    this.mdast = null
    this.templates = null
    this.scriptBlockAstFactory = babelTemplate(`
      %%importStatements%%
      export default {
        components: %%componentsObject%%
      }
    `)
    this.resolvedComponents = []
    this.hooks = ['preprocess', 'beforetransform', 'aftertransform', 'postprocess']
    this.hooksApi = new HooksAPI(this)
    this.internalTransformers = [{
      type: 'Internal',
      options: {},
      handler: SFCContainerTransformer
    }]
    this.transformers = this.options.transformers.map(fn => {
      return {
        type: 'Normal',
        options: {},
        handler: fn
      }
    })
    // compiled Vue SFC code
    this.resultCode = null
    this.init()
  }

  /**
   * get hook function from loader options and eval it
   * @param {string} name name of the hook
   * @param  {array} args arguments to pass to the hook function
   */
  async callHook (name, ...args) {
    if (this.hooks.includes(name)) {
      const fn = this.options[name]
      const result = fn ? fn.apply(null, args) : Promise.resolve()
      return result
    }
  }

  /**
   * initializing processor:
   * 1. init SFC handlebars templates
   * 2. resolve components specified in loader options
   */
  init () {
    const SFCTemplate = fs.readFileSync(path.resolve(__dirname, '../templates/SFC.hbs'), 'utf8')
    this.templates = {
      SFC: {
        source: SFCTemplate,
        render: Handlebars.compile(SFCTemplate)
      }
    }

    if (!path.isAbsolute(this.baseContext)) {
      throw new TypeError(`loader options.context must be an absolute path`)
    }
    // resolve components from loader options.components
    this.resolvedComponents = this.resolveComponents(this.options.components)
  }

  /**
   * @description generate script block code for Vue SFC
   * @memberof Processor
   */
  genScriptBlockCode () {
    if (!this.resolvedComponents.length) return
    const importStatements = []
    this.resolvedComponents.forEach(config => {
      importStatements.push(config.importStatement)
    })
    const scriptBlockAst = this.scriptBlockAstFactory({
      importStatements,
      componentsObject: babelTypes.objectExpression([
        ...this.resolvedComponents.map(config => {
          return babelTypes.objectProperty(config.ImportDefaultSpecifier, config.ImportDefaultSpecifier)
        })
      ])
    })

    const { code } = babelCodegen({
      type: 'Program',
      body: scriptBlockAst
    })
    return code
  }

  /**
   * parse markdown to mdast (a markdown AST)
   * @ref https://github.com/syntax-tree/mdast
   */
  async parse () {
    await this.callHook('preprocess', this.source, this.hooksApi)
    this.mdast = unified()
      .use(markdownParser)
      .parse(this.source)
    this.mdast = compactNodes(this.mdast)
    // console.log(inspectAST(this.mdast))
  }

  /**
   * transform markdown AST
   */
  async transform () {
    await this.callHook('beforetransform', this.mdast, this.hooksApi)
    for (let config of [...this.internalTransformers, ...this.transformers]) {
      const options = Object.assign({}, config.options, {
        context: this.baseContext,
        resourcePath: this.loader.resourcePath
      })
      const newAst = await config.handler.apply(null, [this.mdast, options])
      assertMdast(newAst)
      this.mdast = newAst
    }
    await this.callHook('aftertransform', this, this.hooksApi)
  }

  /**
   * resolve vue components from loader options
   * @param {*} components
   */
  resolveComponents (components) {
    const result = []
    // handle options for: [ './src/**/*.vue' ]
    if (Array.isArray(components)) {
      for (let globPath of components) {
        if (!path.isAbsolute(globPath)) globPath = path.posix.join(this.baseContext, globPath)
        const componentFiles = globby.sync(globPath)
        componentFiles.forEach(file => {
          let name = path.basename(file, '.vue') || path.basename(file, '.js')
          if (!name) return
          name = Case.pascal(name.replace(/\s/, ''))
          // construct a relative path from the markdown file to resolved vue component
          const relativePath = path.relative(this.loader.context, file)
          result.push({
            ImportDefaultSpecifier: babelTypes.identifier(name),
            importStatement: babelTemplate.statement(`import ${name} from '${relativePath}'`)()
          })
          // make resolved components watchable to loader
          this.loader.addDependency(file)
        })
      }

      // handle options for: { "my-component": "./src/components/MyComponent.vue" }
    } else if (typeof components === 'object') {
      const componentNames = Object.keys(components)
      componentNames.forEach(name => {
        name = Case.pascal(name.replace(/\s/, ''))
        let file = components[name]
        if (!path.isAbsolute(file)) file = path.posix.join(this.baseContext, file)
        if (!fs.existsSync(file)) return
        const relativePath = path.relative(this.loader.context, file)
        result.push({
          ImportDefaultSpecifier: babelTypes.identifier(name),
          importStatement: babelTemplate.statement(`import ${name} from '${relativePath}'`)()
        })
        // make resolved components watchable to loader
        this.loader.addDependency(file)
      })
    }

    return result
  }

  unshiftTransformer (type, options, handler) {
    this.transformers.unshift({
      type,
      handler,
      options
    })
  }

  /**
   * @description compile markdown AST to Vue SFC
   * @returns {promise} promise that resolve with Vue SFC code or reject with error
   * @memberof Processor
   */
  async compile () {
    const html = await mdastToHTML(this.mdast)
    return this.templates.SFC.render({
      script: this.genScriptBlockCode(),
      template: html,
    })
  }

  /**
   * @description Run Processor, go through parse, transform and compile phase
   * @returns {promise} promise that resolve with Vue SFC code or reject with error
   * @memberof Processor
   */
  async run() {
    await this.parse()
    await this.transform()
    this.resultCode = await this.compile()
    await this.callHook('postprocess', this.resultCode, this.hooksApi)
    return this.resultCode
  }
}

module.exports = Processor
