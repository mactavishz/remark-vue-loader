const path = require('path')

module.exports = {
  configureWebpack: {
    module: {
      rules: [{
        test: /\.md$/,
        use: [
          {
            loader: 'vue-loader'
          },
          {
            loader: path.resolve(__dirname, '../index.js'),
            // TODO: add options
            options: {}
          }
        ]
      }]
    }
  }
}
