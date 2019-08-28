const Processor = require('./src/Processor')
const loaderUtils = require('loader-utils')
const validateOptions = require('schema-utils')
const optionSchema = require('./src/options.json')

module.exports = async function RemarkVueLoader (source, map, meta) {
  // default loader options
  const defaultOptions = {
    context: this.rootContext,
    cache: true,
    components: [],
    transformers: [],
    preprocess (sourcem, api) {},
    processing (ast, api) {},
    postprocess (sfc, api) {}
  }

  const logger = this.getLogger() ? this.getLogger() : console
  const options = Object.assign({}, defaultOptions, loaderUtils.getOptions(this))

  validateOptions(optionSchema, options, {
    name: 'remark-vue-loader',
    baseDataPath: 'options'
  })

  options.cache && this.cacheable(Boolean(options.cache))

  const callback = this.async()
  const processor = new Processor({
    source,
    loader: this,
    options: options
  })

  try {
    await processor.run()
    // logger.log(processor.result)
    callback(null, processor.result, map, meta)
  } catch (err) {
    const error = typeof err === 'string' ? new Error(err) : err
    callback(error, source)
  }
}
