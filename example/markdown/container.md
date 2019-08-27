# Vue SFC Container

## Demo

Check out the demo below:

::: SFC
<script>
  export default {
    name: 'VueSFCContainer',

    data () {
      return {
        count: 0
      }
    }
  }
</script>

<template>
  <div class="vue-sfc-container">
    <p>This is a embedded Vue SFC: </p>
    <p><input type="number" v-model="count" placeholder="input count"></p>
    <p>Counter: <span>{{ count }}</span></p>
  </div>
</template>

<style>
  .vue-sfc-container {
    margin-top: 1em;
  }

  .vue-sfc-container > p {
    font-weight: bold;
  }

  .vue-sfc-container span {
    font-weight: normal;
  }
</style>
:::
