const fs = require('fs')
const path = require('path')
const unified = require('unified')
const inspectAST = require('unist-util-inspect')
const markdownParser = require('remark-parse')
const HTMLStringify = require('rehype-stringify')
const mdastToHast = require('remark-rehype')
const compactNodes = require('mdast-util-compact')
const Handlebars = require('handlebars')
const HooksAPI = require('./API')
const globby = require('globby')
const Case = require('case')


class Processor {
  constructor ({ source, loader, options } = {}) {
    this.source = source
    this.loader = loader
    this.options = options
    this.baseContext = this.options.context
    // markdown ast
    this.ast = null
    this.templates = null
    this.childComponents = []
    this.hooks = ['preprocess', 'beforetransform', 'aftertransform', 'postprocess']
    this.hooksApi = new HooksAPI(this)
    this.transformers = this.options.transformers.map(fn => {
      return {
        type: 'Normal',
        data: null,
        handler: fn
      }
    })
    this.code = null
    this.init()
  }

  /**
   * get hook function from loader options and eval it
   * @param {*} name name of the hook
   * @param  {...any} args arguments to pass to the hook function
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
    this.childComponents = this.resolveComponents(this.options.components)
  }

  /**
   * Generate import statements for final Vue SFC script block
   */
  genImportStatements () {
    const statements = []
    // TODO: refactor using babel
    if (this.childComponents.length > 0) {
      this.childComponents.forEach((comp, index) => {
        let importStr = comp.importStatement
        if (index > this.childComponents.length - 1) importStr += '\n'
        statements.push(importStr)
      })
    }
    return statements
  }

  /**
   * Generate component defination for final Vue component's child component
   */
  getComponentDefs () {
    const defs = []
    // TODO: refactor using babel
    if (this.childComponents.length > 0) {
      this.childComponents.forEach((comp, index) => {
        let defStr = `'${comp.name}': ${comp.importName}`
        if (index < this.childComponents.length - 1) defStr += `,\n`
        defs.push(defStr)
      })
    }
    return defs
  }

  /**
   * parse markdown to mdast (a markdown AST)
   * @ref https://github.com/syntax-tree/mdast
   */
  async parse () {
    await this.callHook('preprocess', this.source, this.hooksApi)
    this.ast = unified()
      .use(markdownParser)
      .parse(this.source)
    this.ast = compactNodes(this.ast)
    // console.log(inspectAST(this.ast))
  }

  /**
   * transform markdown AST
   */
  async transform () {
    await this.callHook('beforetransform', this.ast, this.hooksApi)
    for (let config of this.transformers) {
      const newAst = await config.handler.apply(null, [this.ast, config.data])
      if (!newAst) throw new TypeError('transform function must return Markdown Abstract Syntax Tree format, see https://github.com/syntax-tree/mdast')
      this.ast = newAst
    }
    await this.callHook('aftertransform', this.ast, this.hooksApi)
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
            name,
            importName: name,
            importStatement: `import ${name} from '${relativePath}'`
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
          name,
          importName: name,
          importStatement: `import ${name} from '${relativePath}'`
        })
      })
    }

    return result
  }

  injectTransformer (type, data, handler) {
    this.transformers.unshift({
      type,
      data,
      handler
    })
  }


  /**
   * compile markdown AST to Vue SFC
   */
  async compile () {
    return new Promise((resolve, reject) => {
      unified()
        .use(mdastToHast, {
          allowDangerousHTML: true
        })
        .run(this.ast, (err, newAst) => {
          if (err) reject(err)
          // console.log(inspectAST(newAst))
          const templateStr = unified()
            .use(HTMLStringify, {
              allowDangerousCharacters: true,
              allowDangerousHTML: true
            })
            .stringify(newAst)
          const result = this.templates.SFC.render({
            imports: this.genImportStatements().join(''),
            components: `{
              ${this.getComponentDefs().join('')}
            }`,
            template: templateStr,
          })
          // console.log(result)
          this.code = result
          resolve()
        })
    })
  }

  async run() {
    await this.parse()
    await this.transform()
    await this.compile()
    await this.callHook('postprocess', this.code, this.hooksApi)
  }
}

module.exports = Processor
