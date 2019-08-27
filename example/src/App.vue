<template>
  <div id="app">
    <h1 class="example-header">
      <a href="https://github.com/Mactaivsh/remark-vue-loader">remark-vue-loader</a> Examples
    </h1>
    <normal />
  </div>
</template>

<script>

import Normal from '../markdown/normal.md'

export default {
  name: 'app',

  components: {
    Normal
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

p img {
  display: inline-block;
  max-width: 25vw;
}
</style>
