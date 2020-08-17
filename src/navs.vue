<template>
  <div class="navs">
    <router-link to="/height-fixed">height-fixed</router-link>
    <router-link to="/height-dynamic">height-dynamic</router-link>
  </div>
</template>

<script>
/* eslint-disable no-console */

export default {
  name: 'navs',
  data() {
    return {};
  },
};
</script>

<style scoped lang="scss">
.navs {
  padding: 20px;
  a {
    display: block;
    margin-bottom: 10px;
    font-size: 20px;
  }
}
</style>