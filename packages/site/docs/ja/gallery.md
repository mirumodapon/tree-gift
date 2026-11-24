---
layout: page
title: ギャラリー
---

<div class="gallery-page">

# ギャラリー

<p class="gallery-note">各作品の著作権はそれぞれの作者に帰属し、ライセンスはカードに表示されます。投稿することで、本イベントでの展示と利用を許諾したものとみなします。</p>

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
