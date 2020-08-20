<template>
  <ul
    ref="scroller"
    class="height-dynamic"
    @scroll="handleScroll"
  >
    <!-- 负责撑开 ul 的高度 -->
    <li
      class="height-dynamic__scroll-runway"
      ref="scrollRunway"
      :style="`transform: translate(0, ${scrollRunwayEnd}px)`"
    ></li>
    <!-- 下拉占位符 -->
    <place-holder
      class="height-dynamic__placeholder"
      v-for="(item, index) in topPlaceholders"
      :key="-index - 1"
      :style="`transform: translate(0, ${cachedScrollY[firstAttachedItem] - ESTIMATED_HEIGHT * (index + 1)}px)`"
    />
    <item
      class="height-dynamic__item"
      v-for="item in visibleData"
      ref="items"
      :data="item"
      :fixed-height="false"
      :key="item.username + item.phone"
      :index="item.index"
      :style="`transform: translate(0, ${cachedScrollY[item.index] || item.index * ESTIMATED_HEIGHT}px)`"
      @size-change="handleSizeChange"
    />
    <!-- 上拉占位符 -->
    <place-holder
      class="height-dynamic__placeholder"
      v-for="(item, index) in bottomPlaceholders"
      :key="index + 1"
      :style="`transform: translate(0, ${cachedScrollY[lastAttachedItem - 1] + cachedHeight[lastAttachedItem - 1] + ESTIMATED_HEIGHT * (index + 1)}px)`"
    />
  </ul>
</template>

<script>
/* eslint-disable no-console */
import Item from './components/item';
import PlaceHolder from './components/placeholder';
import { fetchData } from './helpers';

const PLACEHOLDER_COUNT = 5;
const BUFFER_SIZE = 3;
const ESTIMATED_HEIGHT = 180;
let VISIBLE_COUNT = BUFFER_SIZE * 2;

export default {
  name: 'height-dynamic',
  data() {
    return {
      ESTIMATED_HEIGHT,
      anchorItem: { index: 0, offset: 0 },
      listData: [],
      visibleData: [],
      topPlaceholders: 0,
      bottomPlaceholders: 0,
      firstAttachedItem: 0,
      lastAttachedItem: 0,
      lastScrollTop: 0,
      cachedScrollY: [],
      cachedHeight: [],
      revising: false,
    };
  },
  computed: {
    scrollRunwayEnd() {
      const fallbackEnd = this.listData.length * ESTIMATED_HEIGHT;
      const estimatedEnd =
        this.cachedHeight.reduce((sum, h) => (sum += h || ESTIMATED_HEIGHT), 0) +
        (this.listData.length - this.cachedHeight.length) * ESTIMATED_HEIGHT;
      return estimatedEnd || fallbackEnd;
    },
  },
  mounted() {
    VISIBLE_COUNT = Math.ceil(this.$refs.scroller.offsetHeight / ESTIMATED_HEIGHT);
    this.lastAttachedItem = VISIBLE_COUNT + BUFFER_SIZE;
    this.fetchData();
    this.updateVisibleData();
  },
  methods: {
    handleSizeChange(index, { height }) {
      this.calItemScrollY(index, height);
    },
    handleScroll() {
      if (this.revising) return;

      const delta = this.$refs.scroller.scrollTop - this.lastScrollTop;
      this.lastScrollTop = this.$refs.scroller.scrollTop;

      this.updateAnchorItem(delta);
      this.updateVisibleData();
      this.updatePlaceholder(delta >= 0);
      this.handleLoadMore();
    },
    async updateAnchorItem(delta) {
      const lastIndex = this.anchorItem.index;
      const lastOffset = this.anchorItem.offset;
      delta += lastOffset;

      let index = lastIndex;
      if (delta >= 0) {
        while (index < this.listData.length && delta > (this.cachedHeight[index] || ESTIMATED_HEIGHT)) {
          if (!this.cachedHeight[index]) {
            this.$set(this.cachedHeight, index, ESTIMATED_HEIGHT);
          }
          delta -= this.cachedHeight[index];
          index++;
        }
        if (index >= this.listData.length) {
          this.anchorItem = { index: this.listData.length - 1, offset: 0 };
        } else {
          this.anchorItem = { index, offset: delta };
        }
      } else {
        while (delta < 0) {
          if (!this.cachedHeight[index - 1]) {
            this.$set(this.cachedHeight, index - 1, ESTIMATED_HEIGHT);
          }
          delta += this.cachedHeight[index - 1];
          index--;
        }
        if (index < 0) {
          this.anchorItem = { index: 0, offset: 0 };
        } else {
          this.anchorItem = { index, offset: delta };
        }
      }
      // 修正拖动过快导致的滚动到顶端滚动条不足的偏差
      if (this.cachedScrollY[this.firstAttachedItem] <= -1) {
        console.log('revising insufficient');
        this.revising = true;
        const actualScrollY = this.cachedHeight.slice(0, Math.max(0, this.anchorItem.index)).reduce((sum, h) => (sum += h), 0);
        this.$refs.scroller.scrollTop = actualScrollY + this.anchorItem.offset;
        this.lastScrollTop = this.$refs.scroller.scrollTop;
        if (this.$refs.scroller.scrollTop === 0) {
          this.anchorItem = { index: 0, offset: 0 };
        }
        this.calItemScrollY();
        this.revising = false;
      }
    },
    // 计算每一个 item 的 translateY 的高度
    async calItemScrollY(index, height) {
      await this.$nextTick();
      // 修正 vue diff 算法导致 item 顺序不正确的问题
      this.$refs.items.sort((a, b) => a.index - b.index);

      const anchorDomIndex = this.$refs.items.findIndex(item => item.index === this.anchorItem.index);
      const anchorDom = this.$refs.items[anchorDomIndex];
      const anchorDomHeight = anchorDom.$el.getBoundingClientRect().height;

      this.$set(this.cachedScrollY, this.anchorItem.index, this.$refs.scroller.scrollTop - this.anchorItem.offset);
      this.$set(this.cachedHeight, this.anchorItem.index, anchorDomHeight);

      // 计算 anchorItem 后面的 item scrollY
      for (let i = anchorDomIndex + 1; i < this.$refs.items.length; i++) {
        const item = this.$refs.items[i];
        const { height } = item.$el.getBoundingClientRect();
        this.$set(this.cachedHeight, item.index, height);
        const scrollY = this.cachedScrollY[item.index - 1] + this.cachedHeight[item.index - 1];
        this.$set(this.cachedScrollY, item.index, scrollY || 0 /** 第一个 item.index === 0 不存在上一个 item，所以 scrollY 可能为 NaN */);
      }
      // 计算 anchorItem 前面的 item scrollY
      for (let i = anchorDomIndex - 1; i >= 0; i--) {
        const item = this.$refs.items[i];
        this.$set(this.cachedHeight, item.index, item.$el.getBoundingClientRect().height);
        const scrollY = this.cachedScrollY[item.index + 1] - this.cachedHeight[item.index];
        this.$set(this.cachedScrollY, item.index, scrollY);
      }
      // 修正拖动过快导致的滚动到顶端有空余的偏差
      if (this.cachedScrollY[0] > 0) {
        console.log('revising redundant');
        this.revising = true;
        const delta = this.cachedScrollY[0];
        const last = Math.min(this.lastAttachedItem, this.listData.length);
        for (let i = 0; i < last; i++) {
          this.$set(this.cachedScrollY, i, this.cachedScrollY[i] - delta);
        }
        const scrollTop = this.cachedScrollY[this.anchorItem.index - 1]
          ? this.cachedScrollY[this.anchorItem.index - 1] + this.anchorItem.offset
          : this.anchorItem.offset;
        this.$refs.scroller.scrollTop = scrollTop;
        this.lastScrollTop = this.$refs.scroller.scrollTop;
        this.revising = false;
      }
    },
    updateVisibleData() {
      const start = (this.firstAttachedItem = Math.max(0, this.anchorItem.index - BUFFER_SIZE));
      this.lastAttachedItem = this.firstAttachedItem + VISIBLE_COUNT + BUFFER_SIZE * 2;
      const end = Math.min(this.lastAttachedItem, this.listData.length);

      this.visibleData = this.listData.slice(start, end);
    },
    updatePlaceholder(isPositive) {
      if (isPositive) {
        this.topPlaceholders = 0;
        this.bottomPlaceholders = Math.min(PLACEHOLDER_COUNT, Math.abs(this.listData.length - this.lastAttachedItem));
      } else {
        this.topPlaceholders = Math.min(PLACEHOLDER_COUNT, this.firstAttachedItem);
        this.bottomPlaceholders = 0;
      }
    },
    fetchData() {
      const data = fetchData();
      // 给每个 item 打上序号标记
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        item.index = this.listData.length;
        this.listData.push(item);
      }
      this.updateVisibleData();
    },
    handleLoadMore() {
      const scrollEnd = this.$refs.scroller.scrollTop + this.$refs.scroller.offsetHeight + ESTIMATED_HEIGHT;
      scrollEnd >= this.scrollRunwayEnd && this.fetchData();
    },
  },
  components: { Item, PlaceHolder },
};
</script>

<style scoped lang="scss">
.height-dynamic {
  margin: 0;
  padding: 0;
  overflow-x: hidden;
  overflow-y: scroll;
  -webkit-overflow-scrolling: touch;
  width: 100%;
  height: 100%;
  position: absolute;
  contain: layout;
  will-change: transform;
  background-color: #eee;
  &__item,
  &__placeholder {
    position: absolute;
    contain: layout;
    will-change: transform;
  }
  &__scroll-runway {
    position: absolute;
    width: 1px;
    height: 1px;
    transition: transform 0.2s;
  }
}
</style>