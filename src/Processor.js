const fs = require('fs')
const path = require('path')
const unified = require('unified')
const markdownParser = require('remark-parse')
const remarkFormatter = require('remark-frontmatter')
const assertMdast = require('mdast-util-assert')
const Handlebars = require('handlebars')
const ExternalAPI = require('./API')
const globby = require('globby')
const babelTemplate = require('@babel/template').default
const babelTypes = require('@babel/types')
const babelCodegen = require('@babel/generator').default
const Case = require('case')
const { SFCCodeBlockTransformer } = require('./internals')
const mdastToHTML = require('./helpers/mdastToHTML')
const findYamlFrontmatter = require('./helpers/findYamlFrontmatter')
const hash = require('hash-sum')
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
    this.filename = path.basename(this.loader.resourcePath, '.md')
    // markdown ast
    this.mdast = null
    this.frontmatter = {}
    this.templates = null
    this.scriptBlockAstFactory = ({ componentName, frontmatter, source }) => {
      return babelTemplate(`
        %%importDeclarations%%
        %%afterImportDeclarations%%
        export default {
          name: '${componentName}',
          components: %%componentsObject%%,
          frontmatter: JSON.parse('${frontmatter}')
        }
      `)
    }
    this.importDeclarations = []
    this.afterImportDeclarations = []
    this.componentObjectProperties = []
    this.styleBlocks = []
    this.hooks = ['preprocess', 'beforetransform', 'aftertransform', 'postprocess']
    this.currentHook = null
    this.externalApi = new ExternalAPI(this)
    this.internalTransformers = [{
      type: 'Internal',
      options: {
        api: this.externalApi
      },
      handler: SFCCodeBlockTransformer
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
   * @description add files from watchFiles loader options into module dependencies
   * @memberof Processor
   */
  addDependencies () {
    const { watchFiles = [] } = this.options
    for (let globPath of watchFiles) {
      if (!path.isAbsolute(globPath)) globPath = path.posix.join(this.baseContext, globPath)
      const files = globby.sync(globPath)
      files.forEach(file => this.loader.addDependency(file))
    }
  }

  /**
   * @description add import declaration
   * @param {object|string} maybeAst uncertain ast input, ast or string
   * @memberof Processor
   */
  addImportDeclaration (maybeAst) {
    if (typeof maybeAst === 'string') {
      maybeAst = babelTemplate.statement(maybeAst)
    }

    if (babelTypes.isImportDeclaration(maybeAst)) {
      this.importDeclarations.push(maybeAst)
    } else {
      throw new TypeError(`${maybeAst} is not a vaild ImportDeclaration ast node or string`)
    }
  }

  /**
   * @description add statements after import declarations
   * @param {object|string} maybeAst uncertain ast input, ast or string
   * @memberof Processor
   */
  addAfterImportDeclarations (maybeAst) {
    if (typeof maybeAst === 'string') {
      maybeAst = babelTemplate.statement(maybeAst)
    }

    if (babelTypes.isStatement(maybeAst)) {
      this.afterImportDeclarations.push(maybeAst)
    } else {
      throw new TypeError(`${maybeAst} is not a vaild Statement ast node or string`)
    }
  }

  /**
   * @description add component object property
   * @param {object} ast object property ast node
   * @memberof Processor
   */
  addComponentObjectProperty (ast) {
    if (babelTypes.isObjectProperty(ast)) {
      this.componentObjectProperties.push(ast)
    } else {
      throw new TypeError(`${ast} is not a vaild ObjectProperty ast node or string`)
    }
  }

  /**
   * @description add style blocks from sfc containers
   * @param {array} styles
   * @memberof Processor
   */
   addStyleBlocks (blocks) {
    if (Array.isArray(blocks)) {
      this.styleBlocks.push(...blocks)
    }
  }

  /**
   * get hook function from loader options and eval it
   * @param {string} name name of the hook
   * @param {array} args arguments to pass to the hook function
   */
  async callHook (name, ...args) {
    if (this.hooks.includes(name)) {
      this.currentHook = name
      const fn = this.options[name]
      const result = fn ? fn.apply(null, args) : Promise.resolve()
      return result
    }
  }

  /**
   * @description initializing processor
   * 1. init SFC handlebars templates
   * 2. resolve components specified in loader options - components
   * 3. add file dependencies specified in loader options - watchFiles
   * @memberof Processor
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
    this.resolveComponents(this.options.components)
    this.addDependencies()
  }

  /**
   * @description generate script block code for Vue SFC
   * @returns {string} code
   * @memberof Processor
   */
  genScriptBlockCode () {
    const { componentName = `${Case.pascal(this.filename + hash(this.loader.resourcePath))}` } = this.frontmatter
    this.frontmatter.componentName = componentName
    const scriptBlockAst = this.scriptBlockAstFactory({
      componentName,
      frontmatter: JSON.stringify(this.frontmatter),
      source: this.source
    })({
      importDeclarations: this.importDeclarations,
      componentsObject: babelTypes.objectExpression([
        ...this.componentObjectProperties
      ]),
      afterImportDeclarations: this.afterImportDeclarations
    })

    const { code } = babelCodegen({
      type: 'Program',
      body: scriptBlockAst
    })
    return code
  }

  /**
   * @description generate style blocks code for Vue SFC
   * @returns {string} code
   * @memberof Processor
   */
  genStyleBlocksCode () {
    return this.styleBlocks.reduce((prev, block) => {
      const { content = '', lang = 'css' } = block
      // remove extra newlines at beginnings
      prev += `<style lang="${lang}">${content.replace(/^[\r\n]*/, '\n')}</style>\n`
      return prev
    }, '')
  }

  /**
   * @description parse markdown to mdast (a markdown AST)
   * @see https://github.com/syntax-tree/mdast
   * @memberof Processor
   */
  async parse () {
    this.source = await this.callHook('preprocess', this.source, this.externalApi)
    this.mdast = unified()
      .use(markdownParser)
      .use(remarkFormatter, ['yaml'])
      .parse(this.source)
    // find and parse frontmatter
    this.frontmatter = findYamlFrontmatter(this.mdast)
  }

  /**
   * @description apply both internal and user-defined transformers on markdown ast
   * @memberof Processor
   */
  async transform () {
    await this.callHook('beforetransform', this.mdast, this.externalApi)
    for (let config of [...this.internalTransformers, ...this.transformers]) {
      const options = Object.assign({}, config.options, {
        context: this.baseContext,
        resourcePath: this.loader.resourcePath
      })
      const newAst = await config.handler.apply(null, [this.mdast, options])
      // check validity of ast
      assertMdast(newAst)
      this.mdast = newAst
    }
    await this.callHook('aftertransform', this.mdast, this.externalApi)
  }

  /**
   * @description resolve glob component path from loader options, register and add its dependency
   * @param {array} components componet glob paths
   * @memberof Processor
   */
  resolveComponents (components) {
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
          this.importDeclarations.push(babelTemplate.statement(`import ${name} from '${relativePath}'`)())
          this.componentObjectProperties.push(babelTypes.objectProperty(babelTypes.identifier(name), babelTypes.identifier(name)))
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
        this.importDeclarations.push(babelTemplate.statement(`import ${name} from '${relativePath}'`)())
        this.componentObjectProperties.push(babelTypes.objectProperty(babelTypes.identifier(name), babelTypes.identifier(name)))
        // make resolved components watchable to loader
        this.loader.addDependency(file)
      })
    }
  }

  /**
   * @description insert a mdast transformer before other defined transformers
   * @param {string} type type of the transformer
   * @param {string} options params to feed to transformer
   * @param {string} handler transformer function
   * @memberof Processor
   */
  unshiftTransformer (type, options, handler) {
    this.transformers.unshift({
      type,
      options,
      handler
    })
  }

  /**
   * @description compile markdown AST to Vue SFC
   * @returns {promise} promise that resolve with Vue SFC code or reject with error
   * @memberof Processor
   */
  async compile () {
    const html = await mdastToHTML(this.mdast)
    // this.genStyleBlocksCode()
    return this.templates.SFC.render({
      script: this.genScriptBlockCode(),
      template: html,
      styles: this.genStyleBlocksCode()
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
    this.resultCode = await this.callHook('postprocess', this.resultCode)
    return this.resultCode
  }
}

module.exports = Processor
