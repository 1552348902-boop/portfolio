/* =========================================================
   交互脚本：渲染 + 案例弹层 + 动效
   ========================================================= */
(function () {
  'use strict';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  let currentCat = 'all';
  let visible = [];       // 当前筛选下可见的作品
  let openIdx = -1;       // 当前打开的作品在 visible 中的下标

  /* ---------- 筛选按钮 ---------- */
  function renderFilters() {
    const box = $('#filters');
    if (!box) return;
    box.innerHTML = CATEGORIES.map(c =>
      `<button data-cat="${c.key}" class="${c.key === 'all' ? 'is-on' : ''}">${c.label}</button>`
    ).join('');

    box.addEventListener('click', e => {
      const btn = e.target.closest('button[data-cat]');
      if (!btn) return;
      $$('button', box).forEach(b => b.classList.remove('is-on'));
      btn.classList.add('is-on');
      currentCat = btn.dataset.cat;
      renderWorks();
    });
  }

  /* ---------- 作品卡片 ---------- */
  const HEART = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21s-7.5-4.9-9.6-9A5.6 5.6 0 0 1 12 5.5 5.6 5.6 0 0 1 21.6 12c-2.1 4.1-9.6 9-9.6 9z"/></svg>';

  function typeCoverHTML(w, cls) {
    const t = w.typeCover || {};
    return `<${cls === 'modal' ? 'figure' : 'div'} class="${cls === 'modal' ? 'cs__cover' : 'card__cover'} card__cover--ph ph--${w.cat}"${cls === 'modal' ? '' : ''}>
        <span class="card__badge">${esc(w.catLabel)}</span>
        <span class="card__phnum">${w.idx}</span>
        ${t.big   ? `<span class="card__phbig">${esc(t.big)}</span>` : ''}
        ${t.sub   ? `<span class="card__phsub">${esc(t.sub)}</span>` : ''}
        ${(t.lines || []).length ? `<ul class="card__phlines">${t.lines.map(l => `<li>${esc(l)}</li>`).join('')}</ul>` : ''}
      </${cls === 'modal' ? 'figure' : 'div'}>`;
  }

  function coverHTML(w) {
    const badge = `<span class="card__badge">${esc(w.catLabel)}</span>`;
    const likes = w.likes ? `<span class="card__likes">${HEART}<span>${esc(w.likes)}</span></span>` : '';
    const play  = w.video ? '<span class="card__play" aria-hidden="true">▶</span>' : '';
    if (w.cover) {
      return `<div class="card__cover">
                <img src="${w.cover}" alt="${esc(w.title)}" loading="lazy">
                ${badge}${likes}${play}
              </div>`;
    }
    return typeCoverHTML(w, 'card');
  }

  function renderWorks() {
    const box = $('#works');
    if (!box) return;

    visible = WORKS.filter(w => currentCat === 'all' || w.cat === currentCat);

    box.innerHTML = visible.map(w => `
      <article class="card" data-id="${w.id}" tabindex="0" role="button" aria-label="查看案例：${esc(w.title)}">
        ${coverHTML(w)}
        <div class="card__body">
          <p class="card__meta"><span class="card__co">${esc(w.company)}</span><span class="card__time"> · ${esc(w.time)}</span></p>
          <h3 class="card__title">${esc(w.title)}</h3>
          <p class="card__brief">${esc(w.brief)}</p>
          <div class="card__foot">
            <span class="card__result">${esc(w.result)}</span>
            <span class="card__go">查看详情 →</span>
          </div>
        </div>
      </article>
    `).join('');

    $$('.card', box).forEach((card, i) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(18px)';
      requestAnimationFrame(() => {
        setTimeout(() => {
          card.style.transition = 'opacity .6s cubic-bezier(.22,.61,.36,1), transform .6s cubic-bezier(.22,.61,.36,1)';
          card.style.opacity = '1';
          card.style.transform = 'none';
        }, i * 55);
      });

      card.addEventListener('click', () => openCase(i));
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCase(i); }
      });
    });
  }

  /* ---------- 时间线 ---------- */
  function renderTimeline() {
    const box = $('#timeline');
    if (!box) return;
    box.innerHTML = EXPERIENCES.map(exp => {
      const chips = (exp.proj || []).map(id => {
        const w = WORKS.find(x => x.id === id);
        return w ? `<button data-goto="${id}">${esc(w.idx)} ${esc(shortTitle(w.title))}</button>` : '';
      }).join('');
      const ul = (exp.ul || []).length
        ? `<ul class="tl__ul">${exp.ul.map(t => `<li>${t}</li>`).join('')}</ul>` : '';
      return `
        <div class="tl">
          <div class="tl__top">
            <span class="tl__role">${esc(exp.role)}</span>
            <span class="tl__co">${esc(exp.co)}</span>
            <span class="tl__time">${esc(exp.time)}</span>
          </div>
          <p class="tl__desc">${esc(exp.desc)}</p>
          ${ul}
          ${chips ? `<div class="tl__proj">${chips}</div>` : ''}
        </div>`;
    }).join('');

    $$('[data-goto]', box).forEach(b => {
      b.addEventListener('click', () => openCaseById(b.dataset.goto));
    });
  }

  /* ---------- 案例弹层 ---------- */
  const modal = $('#modal');

  function caseHTML(w) {
    const likes = w.likes ? `<span class="card__likes">${HEART}<span>${esc(w.likes)}</span></span>` : '';
    let cover;
    if (w.video) {
      cover = `<figure class="cs__cover cs__cover--video">
          <video src="${w.video}" poster="${w.poster || w.cover}" controls playsinline preload="metadata" data-fit></video>
          <span class="card__badge">${esc(w.catLabel)}</span>
        </figure>`;
    } else if (w.cover) {
      cover = `<figure class="cs__cover"><img src="${w.cover}" alt="${esc(w.title)}"><span class="card__badge">${esc(w.catLabel)}</span>${likes}</figure>`;
    } else {
      cover = typeCoverHTML(w, 'modal');
    }

    const sections = (w.sections || []).map((s, i) => `
      <section class="cs__sec">
        <h4 class="cs__secH"><b>0${i + 1}</b>${esc(s.h)}</h4>
        ${s.ps.map(p => `<p>${p}</p>`).join('')}
      </section>`).join('');

    const list = w.list ? `
      <section class="cs__sec">
        <h4 class="cs__secH"><b>◆</b>${esc(w.list.h)}</h4>
        <ul class="cs__list">${w.list.items.map(it => `<li>${it}</li>`).join('')}</ul>
      </section>` : '';

    const kpis = (w.kpis || []).length ? `
      <section class="cs__sec">
        <h4 class="cs__secH"><b>◆</b>数据表现</h4>
        <div class="cs__kpis">
          ${w.kpis.map(k => `<div class="cs__kpi"><strong>${esc(k.n)}</strong><span>${esc(k.l)}</span></div>`).join('')}
        </div>
      </section>` : '';

    const linked = (w.gallery || []).filter(g => g.url).length;
    const gal = (!w.video && (w.gallery || []).length) ? `
      <section class="cs__sec">
        <h4 class="cs__secH"><b>◆</b>上线内容${linked ? '<span class="cs__galhint">点击图片 · 在小红书看原帖 ↗</span>' : ''}</h4>
        <div class="cs__gal">
          ${w.gallery.map(g => {
            const inner = `<img src="${g.src}" alt="${esc(g.cap)}" loading="lazy">
              ${g.note ? `<span class="cs__galnote">${esc(g.note)}</span>` : ''}
              <figcaption>
                <span class="cs__galcap">${g.tag ? `<em class="cs__galtag">${esc(g.tag)}</em>` : ''}${esc(g.cap)}</span>
                ${g.likes ? `<span class="cs__gallikes">${HEART}${esc(g.likes)}</span>` : ''}
              </figcaption>`;
            return g.url
              ? `<a class="cs__galitem is-link" href="${g.url}" target="_blank" rel="noopener">${inner}</a>`
              : `<div class="cs__galitem">${inner}</div>`;
          }).join('')}
        </div>
      </section>` : '';

    const links = (w.links || []).length ? `
      <section class="cs__sec">
        <h4 class="cs__secH"><b>◆</b>作品链接</h4>
        <div class="cs__links">
          ${w.links.map(l => `<a class="cs__link ${l.ghost ? 'cs__link--ghost' : ''}" href="${l.url}" target="_blank" rel="noopener">${esc(l.label)} <span class="btn__arrow">↗</span>${l.note ? ` <small>${esc(l.note)}</small>` : ''}</a>`).join('')}
        </div>
      </section>` : '';

    return `
      <div class="cs__top">
        ${cover}
        <div class="cs__head">
          <p class="cs__kicker">${esc(w.kicker)}</p>
          <h3 class="cs__title">${esc(w.title)}</h3>
          <p class="cs__brief">${esc(w.brief)}</p>
          <dl class="cs__meta">
            <div><dt>公司 / 项目</dt><dd>${esc(w.company)}</dd></div>
            <div><dt>时间</dt><dd>${esc(w.time)}</dd></div>
            <div><dt>我的角色</dt><dd>${esc(w.role)}</dd></div>
          </dl>
        </div>
      </div>
      <div class="cs__body">
        ${sections}
        ${list}
        ${kpis}
        ${gal}
        ${links}
      </div>`;
  }

  function openCase(i) {
    openIdx = i;
    paintCase();
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    $('#modalScroll').scrollTop = 0;
  }

  function openCaseById(id) {
    let i = visible.findIndex(w => w.id === id);
    if (i < 0) {                       // 不在当前筛选里 → 切到全部再打开
      currentCat = 'all';
      $$('#filters button').forEach(b => b.classList.toggle('is-on', b.dataset.cat === 'all'));
      renderWorks();
      i = visible.findIndex(w => w.id === id);
    }
    if (i >= 0) openCase(i);
  }

  function paintCase() {
    const w = visible[openIdx];
    if (!w) return;
    $('#modalScroll').innerHTML = caseHTML(w);
    $('#navIdx').textContent = `${w.idx} / ${visible.length} · ${w.catLabel}`;
    fitVideos($('#modalScroll'));
  }

  /* 视频：按真实宽高比调整容器，避免黑边 */
  function fitVideos(root) {
    if (!root) return;
    $$('video[data-fit]', root).forEach(v => {
      const set = () => {
        if (!v.videoWidth) return;
        const fig = v.closest('.cs__cover--video');
        if (fig) fig.style.aspectRatio = v.videoWidth + ' / ' + v.videoHeight;
      };
      if (v.readyState >= 1) set();
      else v.addEventListener('loadedmetadata', set, { once: true });
    });
  }

  function closeCase() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function stepCase(dir) {
    if (!visible.length) return;
    openIdx = (openIdx + dir + visible.length) % visible.length;
    paintCase();
    $('#modalScroll').scrollTop = 0;
  }

  /* ---------- 动效：滚动揭示 ---------- */
  function initReveal() {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    $$('.reveal').forEach(el => io.observe(el));

    const io2 = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io2.unobserve(en.target); }
      });
    }, { threshold: 0.3 });
    $$('.bars').forEach(el => io2.observe(el));
  }

  /* ---------- 数字滚动 ---------- */
  function initCounters() {
    const nums = $$('.stat__num');
    if (!nums.length) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        const el = en.target;
        const target = parseFloat(el.dataset.count) || 0;
        const suffix = el.dataset.suffix || '';
        let t0 = null;
        const dur = 1100;
        function frame(ts) {
          if (!t0) t0 = ts;
          const p = Math.min((ts - t0) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased) + suffix;
          if (p < 1) requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
      });
    }, { threshold: 0.5 });
    nums.forEach(n => io.observe(n));
  }

  /* ---------- 滚动进度 & 导航 ---------- */
  function initScrollUI() {
    const nav = $('#nav');
    const bar = $('#progress span');
    function onScroll() {
      const y = window.scrollY || document.documentElement.scrollTop;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      if (bar) bar.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
      if (nav) nav.classList.toggle('is-stuck', y > 40);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- 工具 ---------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function shortTitle(t) {
    return t.split('｜')[0].replace(/《|》/g, '').slice(0, 14);
  }

  /* ---------- 启动 ---------- */
  function init() {
    renderFilters();
    renderWorks();
    renderTimeline();
    initReveal();
    initCounters();
    initScrollUI();

    $$('[data-close]', modal).forEach(el => el.addEventListener('click', closeCase));
    $('#prevBtn').addEventListener('click', () => stepCase(-1));
    $('#nextBtn').addEventListener('click', () => stepCase(1));
    document.addEventListener('keydown', e => {
      if (!modal.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeCase();
      if (e.key === 'ArrowLeft') stepCase(-1);
      if (e.key === 'ArrowRight') stepCase(1);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
