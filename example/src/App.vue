<template>
  <div id="app">
    <h1 class="example-header">
      <a href="https://github.com/Mactaivsh/remark-vue-loader">remark-vue-loader</a> Examples
    </h1>
    <ul
      v-show="!currentDemo"
      class="example-list">
      <li
        v-for="demo in demoList"
        :key="demo.name">
        <a href="javascript:void(0);" @click="showDemo(demo)">{{ demo.name }}</a>
      </li>
    </ul>
    <a
      v-show="currentDemo"
      href="javascript:void(0);"
      class="example-back"
      @click="hideDemo">🔙 Back To List</a>
      <section
        v-if="currentDemo"
        class="example-demo">
        <code class="example-demo-code">
          <pre>{{currentDemo.source}}</pre>
        </code>
        <component
          class="example-demo-comp"
          :is="currentDemo.component">
        </component>
      </section>
  </div>
</template>

<script>

import dataset from '../data.json'

export default {
  name: 'app',

  data () {
    return {
      currentDemo: null
    }
  },

  computed: {
    demoList () {
      return dataset.map(item => {
        return {
          ...item,
          component: () => import(`../markdown/${item.filename}`),
          source: require(`!!raw-loader!../markdown/${item.filename}`).default
        }
      })
    }
  },

  methods: {
    showDemo (demo) {
      this.currentDemo = demo
    },

    hideDemo () {
      this.currentDemo = null
    }
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  max-width: 80vw;
  margin: 60px auto 0 auto;
}

.example-header {
  text-align: center;
  margin-bottom: 2em;
}

.example-list,
.example-back {
  font-size: 1.2em;
}

.example-list > li {
  margin: .5em 0;
}

.example-demo {
  display: flex;
  align-items: flex-start;
  margin-top: 1.5em;
}

.example-comp {
  flex-shrink: 0;
  width: 50%;
}

.example-demo-code {
  box-sizing: border-box;
  flex-shrink: 0;
  padding: 1em;
  margin-right: 1em;
  background-color: blanchedalmond;
  width: calc(50% - 1em);
  overflow-x: auto;
}

p img {
  display: inline-block;
  max-width: 25vw;
}
</style>
