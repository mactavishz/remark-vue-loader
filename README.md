# remark-vue-loader 📦

<p align="left">
    <a href="https://www.npmjs.com/package/remark-vue-loader" alt="NPM Version">
      <img src="https://img.shields.io/npm/v/remark-vue-loader?style=flat" />
    </a>
    <a href="https://github.com/Mactaivsh/remark-vue-loader/blob/master/LICENSE" alt="License">
      <img src="https://img.shields.io/github/license/mactaivsh/remark-vue-loader?style=flat" />
    </a>
    <a href="https://app.netlify.com/sites/stoic-mestorf-843a7b/deploys" alt="Netlify Status">
      <img src="https://api.netlify.com/api/v1/badges/7b51f311-12ca-490b-ba21-33e471b97414/deploy-status" />
    </a>
</p>

Use your markdown as [Vue SFC](https://vue-loader.vuejs.org/spec.html), check out the [Demo](https://remark-vue-loader-demo.netlify.com/) here.

## Intro

`remark-vue-loader` is a [webpack loader](https://webpack.js.org/concepts/#loaders) that process your markdown file and transform into a [Vue SFC (Single-File Component)](https://vue-loader.vuejs.org/spec.html).

`remark-vue-loader` fully embraces the power of [AST](https://en.wikipedia.org/wiki/Abstract_syntax_tree?oldformat=true), it uses [unified](https://github.com/unifiedjs/unified) and [Babel](https://github.com/babel/babel) under the hood.

Also, it allows you to write your own AST transformer, and hook into the lifecycle of the loader process, make it eazy to extend.

## Getting started

To begin, you'll need to install `remark-vue-loader`:

```sh
# using yarn
yarn add remark-vue-loader -D

# using npm
npm install remark-vue-loader -D
```

Then add the loader into your `webpack` config, for example:

``` js
module.export = {
  module: {
    rules: [
      {
        test: /\.md$/,
        use: ['vue-loader', 'remark-vue-loader']
      }
    ]
  }
}
```

**Make sure to place `vue-loader` after the `remark-vue-loader` in the loader chain !**

## Guides

### Using components in markdown

You can reference Vue components directly in markdown:

``` md
# Hello World

<SomeComponent />
```

Before you do that, you need to specify where to find the component, add a `components` option in loader options:

``` js
module.export = {
  module: {
    rules: [
      {
        test: /\.md$/,
        use: [
          {
            loader: 'vue-loader'
          },
          {
            loader:  'remark-vue-loader',
            options: {
              components: [
                '../src/components/*.vue'
              ]
            }
          }
        ]
      }
    ]
  }
}
```

You can use glob pattern to find all the components.

Notice that, **if you use glob pattern, all the components will be registered using Pascal Case of the component's file name**, for example:

`some-component.vue -> SomeComponent`, then you can either use `<some-component></some-component>` or `<SomeComponent />` to reference the component in markdown.

you can also specify the components using object format, but the `property value` must be a specific file:

``` js
components: {
  'someComponent': '../src/components/some-component.vue'
}
```

And if you change the content of any of theres component file, the loader result will immediately regenerate.

### Write single-file component code in markdown

There's another powerful feature that lets you write Vue single-file component code in markdown, that is the **custom container**, just like [markdown-it-container](https://github.com/markdown-it/markdown-it-container)

`remark-vue-loader` has a builtin custom container block support for Vue SFC, for example:

```` md
This is normal markdown paragraph

::: SFC
<template>
  <h1>{{msg}}</h1>
</template>
<script>
export default {
  data () {
    return {
      msg: 'Hello World'
    }
  }
}
</script>
:::
````

As you see above, the `SFC` container will be rendered as its content, you can even write `import` statements inside the `script` block

You can check out more examples in the [online demo](https://remark-vue-loader-demo.netlify.com/).

What's more, you can even define your own custom blocks, it will be covered later.

### Write your own transformer

One other feature, is that you can write your own transformer to manipulate the markdown ast.

First, specify your trnasformer in loader options:

``` js
module.export = {
  module: {
    rules: [
      {
        test: /\.md$/,
        use: [
          {
            loader: 'vue-loader'
          },
          {
            loader:  'remark-vue-loader',
            options: {
              transformers: [
                function MyTransformer (ast, options) {
                  ast.children.forEach(node => {
                    if (node.type === 'heading') {
                      const value = node.children[0].value
                      node.type = 'html'
                      node.value = `<h${node.depth} style="color: DarkViolet;">${value}</h${node.depth}>`
                      delete node.children
                    }
                  })
                  return ast
                }
              ]
            }
          }
        ]
      }
    ]
  }
}
```

The example above defines a transformer which turns all the `heading` into HTML tag and set their color to `DarkViolet`.

Transformers are just pure functions that receive ast and return new ast, yet ast is far more convenient that plain text in the aspect of manipulating.

### Hook into loader's lifecycle

## Options

| Name                                      | Type            | Default              | Description                                                                             |
| ----------------------------------------- | --------------- | -------------------- | --------------------------------------------------------------------------------------- |
| **[`context`](#context)**                 | `String`        | `loader.rootContext` | Base path for resolving components and watch files                                      |
| **[`cahce`](#cache)**                     | `Boolean`       | `true`               | Whether loader result is cacheable                                                      |
| **[`preprocess`](#preprocess)**           | `Function`      | -                    | Hook function to be executed before parsing markdown into an ast                        |
| **[`beforetransform`](#beforetransform)** | `Function`      | -                    | Hook function to be executed before applying transformers to markdown ast               |
| **[`aftertransform`](#aftertransform)**   | `Function`      | -                    | Hook function to be executed after transformers applied to markdown ast                 |
| **[`postprocess`](#postprocess)**         | `Function`      | -                    | Hook function to be executed when markdown transformed into a vue single file component |
| **[`components`](#components)**           | `Object\|Array` | `[]`                 | Components which should be resolved and registered in markdown                          |
| **[`transformers`](#transformers)**       | `Array`         | `[]`                 | An array of transformers to manipulate the markdown ast                                 |
| **[`watchFiles`](#watchFiles)**           | `Array`         | `[]`                 | Files which should be included as dependencies of the loader result                     |

### `context`

### `cache`

### `preprocess`

### `beforetransform`

### `aftertransform`

### `postprocess`

### `components`

### `transformers`

### `watchFiles`

## Contribute

Give a ⭐️ if this project helped you!

