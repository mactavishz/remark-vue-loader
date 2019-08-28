<script>
export default {
  name: 'MyCustomComp',

  data () {
    return {
      timer: null,
      timestamp: Date.now()
    }
  },

  mounted () {
    this.timer = setInterval(() => {
      this.timestamp = Date.now()
    }, 1000)
  },

  beforeDestroyed () {
    this.timer && clearInterval(this.timer)
  }
}
</script>
<template>
  <p>Here is the dynamic component content: <strong>{{timestamp}}</strong></p>
</template>
