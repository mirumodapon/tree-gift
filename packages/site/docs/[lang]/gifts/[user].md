---
layout: page
title: 你的聖誕禮物
---

<div class="gift-page">

<GiftPage :user="$params.user" />

</div>

<style>
.gift-page {
  padding: 48px 24px 96px;
}

@media (max-width: 640px) {
  .gift-page {
    padding: 32px 16px 64px;
  }
}
</style>
