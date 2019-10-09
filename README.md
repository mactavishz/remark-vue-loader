# remark-vue-loader 📦

<p align="left">
    <a href="https://www.npmjs.com/package/remark-vue-loader" alt="NPM Version">
      <img src="https://img.shields.io/npm/v/remark-vue-loader?style=flat" />
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

## Getting Started

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

***
_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_
