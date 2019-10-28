## Vue SFC Container

Remember to open your **[Vue devtools](https://github.com/vuejs/vue-devtools)** and check out the demo below:

<p>frontmatter: {{ $options.frontmatter }}</p>

::: SFC
<template>
  <div>
    <h3>Hello World</h3>
    <h4>This is a Static template</h4>
  </div>
</template>
:::


::: SFC param1="this is a param"
<script>
  import now from 'lodash-es/now'
  export default {
    name: 'VueSFCContainer',

    data () {
      return {
        count: 0
      }
    },

    computed: {
      lastOptInfo () {
        return `At ${now()}, count is ${this.count}`
      }
    }
  }
</script>

<template>
  <div class="vue-sfc-container">
    <p>This is a embedded Vue SFC: </p>
    <p>Last Opt: <strong>{{lastOptInfo}}</strong></p>
    <p>
      Counter: <input type="number" v-model="count" placeholder="input count" readonly>
      <button @click="count++">+</button><button @click="count = Math.max(0, count - 1)">-</button>
    </p>
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


::: SFC componentName="user-defined-comp-name"
<script>
  import pick from 'lodash-es/pick'
  export default {
    data () {
      return {
        obj: {
          prop1: 'value of property 1',
          prop2: 'value of property 2',
          prop3: 'value of property 3'
        }
      }
    },

    computed: {
      pickedObj () {
        return pick(this.obj, ['prop2', 'prop3'])
      }
    }
  }
</script>
<template>
  <section class="pick-demo">
    <h3>Stylus Decorated: </h3>
    <p>pickedObject: {{ JSON.stringify(pickedObj) }}</p>
  </section>
</template>
<style lang="stylus">
  .pick-demo
    color: DeepPink;
</style>
:::
