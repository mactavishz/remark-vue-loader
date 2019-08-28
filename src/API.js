class HooksAPI {
  constructor (processor) {
    this.processor = processor
  }

  /**
   * add a file as dependency of the loader result, to make external dependencies watchable
   * @param {String} file filepath
   */
  addDependency (file) {
  }

  /**
   * add a directory as dependency of the loader, to make external dependencies watchable
   * @param {*} directory directory path
   */
  addContextDependency (directory) {
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
  addContainer (name, ast) {
  }
}

module.exports = HooksAPI
