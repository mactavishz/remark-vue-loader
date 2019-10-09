<template>
  <h1 class="heading">{{msg}}</h1>
</template>

<script>
  import capitalize from 'lodash-es/capitalize'
  export default {
    name: 'Standard',

    data () {
      return {
        msg: capitalize('Hello World')
      }
    }
  }
</script>

<style>
  .heading {
    color: rebeccapurple;
  }
</style>
