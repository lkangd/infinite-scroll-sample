<template>
  <li class="placeholder">
    <div class="placeholder__wrapper">
      <div class="placeholder__info">
        <div class="placeholder__avatar"></div>
        <p class="placeholder__name">p</p>
        <p class="placeholder__date">p</p>
      </div>
      <p class="placeholder__text">p</p>
      <p class="placeholder__text">p</p>
      <p class="placeholder__text">p</p>
      <p class="placeholder__text">p</p>
    </div>
  </li>
</template>

<script>
/* eslint-disable no-console */

export default {
  name: 'placeholder',
};
</script>

<style scoped lang="scss">
.placeholder {
  padding: 11px 20px;
  width: 100%;
  &__wrapper {
    padding: 20px;
    padding-top: 0;
    background-color: #fff;
    border: 1px solid #eaeaea;
    border-radius: 5px;
  }
  &__info {
    padding: 20px 0 20px 60px;
    position: relative;
  }
  &__avatar {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    margin: auto 0;
    width: 50px;
    height: 50px;
    background-color: #eaeaea;
    border-radius: 100%;
    overflow: hidden;
  }
  &__name,
  &__date,
  &__text {
    margin-bottom: 4px;
    font-weight: bold;
    font-size: 12px;
    color: rgba($color: #000000, $alpha: 0);
    background-color: #eaeaea;
  }
  &__text {
    font-weight: normal;
  }
  &__name {
    width: 60px;
  }
  &__date {
    width: 300px;
  }
  &__text {
    &:nth-child(2) {
      width: 250px;
    }
    &:nth-child(3) {
      width: 100px;
    }
    &:nth-child(4) {
      width: 120px;
    }
    &:nth-child(5) {
      width: 80px;
    }
  }
}
</style>