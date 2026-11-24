---
layout: page
title: 갤러리
---

<div class="gallery-page">

# 갤러리

<p class="gallery-note">각 작품의 저작권은 작가에게 있으며, 라이선스는 카드에 표시됩니다. 제출하면 이 이벤트에서의 전시와 사용을 허락한 것으로 봅니다.</p>

<TreeGallery />

</div>

<style>
.gallery-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 48px 24px 96px;
}

.gallery-page h1 {
  font-size: 32px;
  font-weight: 700;
  margin: 0;
}

.gallery-note {
  margin: 8px 0 0;
  color: var(--vp-c-text-2);
  font-size: 14px;
}

@media (max-width: 640px) {
  .gallery-page {
    padding: 32px 16px 64px;
  }
}
</style>
