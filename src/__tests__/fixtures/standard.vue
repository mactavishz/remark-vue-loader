<template>
  <h1 class="heading">{{msg}}</h1>
</template>

<script>
  export default {
    name: 'Standard',

    data () {
      return {
        msg: 'Hello World'
      }
    }
  }
</script>

<style>
  .heading {
    color: rebeccapurple;
  }
</style>
