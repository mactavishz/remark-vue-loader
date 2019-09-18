const path = require('path')

const testTransformer = (ast, options) => {
  return ast
}
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
            options: {
              cache: false,
              // components: [
              //   './src/components/*.vue'
              // ],
              // There's another way:
              components: {
                'MyCustomComp': './src/components/MyCustomComp.vue'
              },
              transformers: [
                testTransformer
              ],
              watchFiles: [],
              preprocess (source, api) {},
              beforetransform (ast, api) {},
              aftertransform (ast) {},
              postprocess (sfc) {}
            }
          }
        ]
      }]
    }
  }
}
