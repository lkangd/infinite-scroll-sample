<template>
  <ul
    ref="scroller"
    class="height-fixed"
    @scroll="handleScroll"
  >
    <!-- 负责撑开 ul 的高度 -->
    <li
      class="height-fixed__scroll-runway"
      ref="scrollRunway"
      :style="`transform: translate(0, ${scrollRunwayEnd}px)`"
    ></li>
    <!-- 下拉占位符 -->
    <place-holder
      class="height-fixed__placeholder"
      v-for="(item, index) in topPlaceholders"
      :key="-index - 1"
      :style="`transform: translate(0, ${FIXED_HEIGHT * (firstAttachedItem - index - 1)}px)`"
    />
    <item
      class="height-fixed__item"
      v-for="item in visibleData"
      :data="item"
      :index="item.index"
      :key="item.username + item.phone"
      :style="`transform: translate(0, ${item.scrollY}px)`"
    />
    <!-- 上拉占位符 -->
    <place-holder
      class="height-fixed__placeholder"
      v-for="(item, index) in bottomPlaceholders"
      :key="index + 1"
      :style="`transform: translate(0, ${FIXED_HEIGHT * (lastAttachedItem + index + 1)}px)`"
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
const FIXED_HEIGHT = 180;
let VISIBLE_COUNT = BUFFER_SIZE * 2;

export default {
  name: 'height-fixed',
  data() {
    return {
      FIXED_HEIGHT,
      anchorItem: { index: 0, offset: 0 },
      listData: [],
      visibleData: [],
      topPlaceholders: 0,
      bottomPlaceholders: 0,
      firstAttachedItem: 0,
      lastAttachedItem: 0,
      scrollRunwayEnd: 0,
      lastScrollTop: 0,
    };
  },
  mounted() {
    VISIBLE_COUNT = Math.ceil(this.$refs.scroller.offsetHeight / FIXED_HEIGHT);
    this.lastAttachedItem = VISIBLE_COUNT + BUFFER_SIZE;
    this.fetchData();
    this.visibleData = this.listData.slice(this.firstAttachedItem, this.lastAttachedItem);
  },
  methods: {
    handleScroll() {
      const delta = this.$refs.scroller.scrollTop - this.lastScrollTop;
      this.lastScrollTop = this.$refs.scroller.scrollTop;

      this.anchorItem.offset += delta;
      const isPositive = delta >= 0;
      // 判断滚动方向
      if (isPositive) {
        if (this.anchorItem.offset >= FIXED_HEIGHT) {
          this.updateAnchorItem();
        }
        if (this.anchorItem.index - this.firstAttachedItem >= BUFFER_SIZE) {
          this.firstAttachedItem = Math.min(this.listData.length - VISIBLE_COUNT, this.anchorItem.index - BUFFER_SIZE);
        }
      } else {
        // 处理滚动到顶部，置为初始值
        if (this.$refs.scroller.scrollTop <= 0) {
          this.anchorItem = { index: 0, offset: 0 };
        } else if (this.anchorItem.offset < 0) {
          this.updateAnchorItem();
        }
        if (this.anchorItem.index - this.firstAttachedItem < BUFFER_SIZE) {
          this.firstAttachedItem = Math.max(0, this.anchorItem.index - BUFFER_SIZE);
        }
      }
      this.lastAttachedItem = Math.min(this.firstAttachedItem + VISIBLE_COUNT + BUFFER_SIZE * 2, this.listData.length);
      this.visibleData = this.listData.slice(this.firstAttachedItem, this.lastAttachedItem);

      this.updatePlaceholder(isPositive);
      this.handleLoadMore();
    },
    updateAnchorItem() {
      const index = Math.floor(this.$refs.scroller.scrollTop / FIXED_HEIGHT);
      const offset = this.$refs.scroller.scrollTop - index * FIXED_HEIGHT;
      this.anchorItem = { index, offset };
    },
    // 计算每一个 item 的 translateY 的高度
    calItemScrollY(list) {
      let latestIndex = this.listData.length;
      for (let i = 0; i < list.length; i++, latestIndex++) {
        const item = list[i];
        item.scrollY = this.scrollRunwayEnd + i * FIXED_HEIGHT;
        item.index = latestIndex;
        Object.freeze(item);
      }
      return list;
    },
    updatePlaceholder(isPositive) {
      if (isPositive) {
        this.topPlaceholders = 0;
        this.bottomPlaceholders = Math.min(PLACEHOLDER_COUNT, this.listData.length - this.lastAttachedItem);
      } else {
        this.topPlaceholders = Math.min(PLACEHOLDER_COUNT, this.firstAttachedItem);
        this.bottomPlaceholders = 0;
      }
    },
    fetchData() {
      this.listData.push(...this.calItemScrollY(fetchData()));
      this.scrollRunwayEnd = this.listData.length * FIXED_HEIGHT;
    },
    handleLoadMore() {
      const scrollEnd = this.$refs.scroller.scrollTop + this.$refs.scroller.offsetHeight;
      scrollEnd >= this.scrollRunwayEnd && this.fetchData();
    },
  },
  components: { Item, PlaceHolder },
};
</script>

<style scoped lang="scss">
.height-fixed {
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