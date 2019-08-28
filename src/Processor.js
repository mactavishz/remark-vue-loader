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
    this.rootContext = this.options.context
    // markdown ast
    this.AST = null
    this.templates = null
    this.childComponents = []
    this.hooks = ['preprocess', 'aftertransform', 'postprocess']
    this.hooksApi = new HooksAPI(this)
    this.result = null
    this.init()
  }

  /**
   * get hook function from loader options and eval it
   * @param {*} name name of the hook
   * @param  {...any} args arguments to pass to the hook function
   */
  callHook (name, ...args) {
    if (this.hooks.includes(name)) {
      const fn = this.options[name]
      fn && fn.apply(null, args)
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

    if (!path.isAbsolute(this.rootContext)) {
      throw new TypeError(`loader options.context must be an absolute path`)
    }

    this.childComponents = this.resolveComponents(this.options.components)
  }

  getImportStatements () {
    const statements = []
    if (this.childComponents.length > 0) {
      this.childComponents.forEach((comp, index) => {
        let importStr = comp.importStatement
        if (index > this.childComponents.length - 1) importStr += '\n'
        statements.push(importStr)
      })
    }
    return statements
  }

  getComponentDefs () {
    const defs = []
    if (this.childComponents.length > 0) {
      this.childComponents.forEach((comp, index) => {
        let defStr = `'${comp.name}': ${comp.name}`
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
  parse () {
    this.callHook('preprocess', this.source, this.hooksApi)
    this.AST = unified()
      .use(markdownParser)
      .parse(this.source)
      this.AST = compactNodes(this.AST)
      // console.log(inspectAST(this.AST))
  }

  /**
   * transform markdown AST
   */
  transform () {
  }

  resolveComponents (components) {
    let result = []
    if (Array.isArray(components)) {
      for (let globPath of components) {
        if (!path.isAbsolute(globPath)) globPath = path.posix.join(this.rootContext, globPath)
        const componentFiles = globby.sync(globPath)
        componentFiles.forEach(file => {
          let name = path.basename(file, '.vue') || path.basename(file, '.js')
          if (!name) return
          name = Case.pascal(name.replace(/\s/, ''))
          result.push({
            name,
            importStatement: `import ${name} from '${file}'`
          })
          this.loader.addDependency(file)
        })
      }
    } else if (typeof components === 'object') {
    }
    return result
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
        .run(this.AST, (err, newAST) => {
          if (err) reject(err)
          // console.log(inspectAST(newAST))
          const templateStr = unified()
            .use(HTMLStringify, {
              allowDangerousCharacters: true,
              allowDangerousHTML: true
            })
            .stringify(newAST)
          const result = this.templates.SFC.render({
            imports: this.getImportStatements().join(''),
            components: `{
              ${this.getComponentDefs().join('')}
            }`,
            template: templateStr,
          })
          // console.log(result)
          resolve(result)
        })
    })
  }

  async run() {
    this.parse()
    this.result = await this.compile()
  }
}

module.exports = Processor
