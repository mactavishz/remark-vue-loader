const path = require('path')

module.exports = {
  configureWebpack: {
    module: {
      rules: [{
        test: /\.md$/,
        include: [
          path.resolve(__dirname, './markdown')
        ],
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
