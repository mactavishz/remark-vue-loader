const path = require('path')

function MyTransformer (ast, options) {
  ast.children.forEach(node => {
    if (node.type === 'heading') {
      const value = node.children[0].value
      node.type = 'html'
      node.value = `<h${node.depth} style="color: DarkViolet;">${value}</h${node.depth}>`
      delete node.depth
      delete node.children
    }
  })
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
            loader: 'remark-vue-loader',
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
                MyTransformer
              ],
              watchFiles: [],
              preprocess (source, api) {
                return source
              },
              beforetransform (ast, api) {
                api.addContainer('uppercase', function (value, meta) {
                  return {
                    type: 'paragraph',
                    children: [{
                      type: 'text',
                      value: String(value).toUpperCase()
                    }]
                  }
                })
              },
              aftertransform (ast, api) {
              },
              postprocess (sfc) {
                return sfc
              }
            }
          }
        ]
      }]
    }
  },
  parallel: false
}
