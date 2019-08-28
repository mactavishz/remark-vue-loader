<template>
  <div id="app">
    <h1 class="example-header">
      <a href="https://github.com/Mactaivsh/remark-vue-loader">remark-vue-loader</a> Examples
    </h1>
    <ul
      v-show="!currentDemoComp"
      class="example-list">
      <li
        v-for="demo in demoList"
        :key="demo.name">
        <a href="javascript:void(0);" @click="showDemo(demo)">{{ demo.name }}</a>
      </li>
    </ul>
    <a
      v-show="currentDemoComp"
      href="javascript:void(0);"
      class="example-back"
      @click="hideDemo">🔙 Back To List</a>
    <component v-if="currentDemoComp" :is="currentDemoComp"></component>
  </div>
</template>

<script>

import dataset from '../data.json'

export default {
  name: 'app',

  data () {
    return {
      currentDemoComp: null
    }
  },

  computed: {
    demoList () {
      return dataset.map(item => {
        return {
          ...item,
          component: () => import(`../markdown/${item.filename}`)
        }
      })
    }
  },

  methods: {
    showDemo (demo) {
      this.currentDemoComp = demo.component
    },

    hideDemo () {
      this.currentDemoComp = null
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
  max-width: 50vw;
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

p img {
  display: inline-block;
  max-width: 25vw;
}
</style>
