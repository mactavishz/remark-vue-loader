class HooksAPI {
  constructor (processor) {
    this.processor = processor
  }

  addComponent () {
  }

  /**
    * add custom container for markdown
    *
    * syntax:
    * ::: container-name
    *   custom contents ...
    * :::
    * @param {String} name
    * @param {Function} handler handler to handle markdown ast
    */
  addContainer (name, handler) {
    this.processor.injectTransformer('ParseContainer', { name }, handler)
  }
}

module.exports = HooksAPI
