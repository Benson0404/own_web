async function loadSiteData() {
  const res = await fetch("data/site.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load data/site.json");
  return res.json();
}

function el(id){ return document.getElementById(id); }

function setText(id, value){
  const node = el(id);
  if (node) node.textContent = value ?? "";
}

function setAttr(id, attr, value){
  const node = el(id);
  if (node) node.setAttribute(attr, value);
}

function renderChips(chips){
  const wrap = el("heroChips");
  wrap.innerHTML = "";
  (chips || []).forEach(t => {
    const s = document.createElement("span");
    s.className = "chip";
    s.textContent = t;
    wrap.appendChild(s);
  });
}

function renderBullets(listId, bullets){
  const ul = el(listId);
  ul.innerHTML = "";
  (bullets || []).forEach(t => {
    const li = document.createElement("li");
    li.textContent = t;
    ul.appendChild(li);
  });
}

function renderQuickLinks(items){
  const wrap = el("quickLinks");
  wrap.innerHTML = "";
  (items || []).forEach(x => {
    const a = document.createElement("a");
    a.className = "btn";
    a.href = x.url;
    a.target = x.url.startsWith("http") ? "_blank" : "_self";
    a.rel = x.url.startsWith("http") ? "noopener" : "";
    a.textContent = x.label;
    wrap.appendChild(a);
  });
}

function pickAccent(i){
  const accents = [
    "rgba(124,58,237,.55)", // 紫
    "rgba(6,182,212,.55)",  // 青
    "rgba(249,115,22,.55)", // 橘
    "rgba(34,197,94,.55)",  // 綠
    "rgba(236,72,153,.55)", // 粉
    "rgba(245,158,11,.55)"  // 黃
  ];
  return accents[i % accents.length];
}

function renderGallery(items){
  const g = el("gallery");
  g.innerHTML = "";

  (items || []).forEach((w, idx) => {
    const card = document.createElement("div");
    card.className = "work";
    card.dataset.index = String(idx);

    const img = document.createElement("img");
    img.src = (w.images && w.images.length ? w.images[0] : w.img);
    img.alt = w.title;

    const cap = document.createElement("div");
    cap.className = "cap";

    // Tag（可選）
    const tag = document.createElement("span");
    tag.textContent = (w.tag || "FEATURED");
    tag.className = "work-tag";

    const title = document.createElement("b");
    title.textContent = w.title;

    const sub = document.createElement("span");
    sub.textContent = w.sub || "";

    // 下載列（最多顯示 2 個，避免卡片太擠）
    const dlWrap = document.createElement("div");
    dlWrap.className = "work-dl";
    const dls = (w.downloads || []).slice(0, 2);

    if (dls.length > 0) {
      dls.forEach(d => {
        const a = document.createElement("a");
        a.className = "work-dl-btn";
        a.href = d.url;
        a.download = "";              // 讓瀏覽器傾向下載
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = d.label || "下載";
        a.addEventListener("click", (e) => e.stopPropagation()); // 不要觸發燈箱
        dlWrap.appendChild(a);
      });

      // 如果還有更多附件，顯示 +N
      const more = (w.downloads || []).length - dls.length;
      if (more > 0) {
        const m = document.createElement("span");
        m.className = "work-dl-more";
        m.textContent = `+${more}`;
        dlWrap.appendChild(m);
      }
    }

    cap.appendChild(tag);
    cap.appendChild(title);
    cap.appendChild(sub);
    if (dls.length > 0) cap.appendChild(dlWrap);

    card.appendChild(img);
    card.appendChild(cap);
    g.appendChild(card);
  });
}


function renderTimeline(items){
  const t = el("timeline");
  t.innerHTML = "";
  (items || []).forEach(x => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <div class="when">${escapeHtml(x.when || "")}</div>
      <div>
        <h3 class="role">${escapeHtml(x.role || "")}</h3>
        <div class="org">${escapeHtml(x.org || "")}</div>
        <ul class="list">
          ${(x.bullets || []).map(b => `<li>${escapeHtml(b)}</li>`).join("")}
        </ul>
      </div>
    `;
    t.appendChild(div);
  });
}

function renderSkillCards(cards){
  const wrap = el("skillCards");
  wrap.innerHTML = "";
  (cards || []).forEach(c => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <h3>${escapeHtml(c.title || "")}</h3>
      <ul class="list">
        ${(c.items || []).map(s => `<li>${escapeHtml(s)}</li>`).join("")}
      </ul>
    `;
    wrap.appendChild(div);
  });
}

function renderContactList(items){
  const ul = el("contactList");
  ul.innerHTML = "";
  (items || []).forEach(x => {
    const li = document.createElement("li");
    li.innerHTML = `<b>${escapeHtml(x.label)}：</b> ${escapeHtml(x.value)}`;
    ul.appendChild(li);
  });
}

function setupLightbox(portfolioItems){
  const lb = el("lightbox");
  const lbImg = el("lbImg");
  const lbTitle = el("lbTitle");
  const lbSub = el("lbSub");
  const lbDesc = el("lbDesc");
  const lbDlList = el("lbDlList");
  const closeBtn = el("lbClose");

  // slider controls
  const lbPrev = el("lbPrev");
  const lbNext = el("lbNext");
  const lbDots = el("lbDots");
  const lbStage = el("lbStage");

  let currentIndex = 0;
  let currentImages = [];

  function renderDots(){
    lbDots.innerHTML = "";
    currentImages.forEach((_, i) => {
      const d = document.createElement("button");
      d.className = "lb-dot" + (i === currentIndex ? " active" : "");
      d.type = "button";
      d.setAttribute("aria-label", `第 ${i+1} 張`);
      d.addEventListener("click", () => show(i));
      lbDots.appendChild(d);
    });
  }

  function updateNav(){
    const many = currentImages.length > 1;
    lbPrev.style.display = many ? "" : "none";
    lbNext.style.display = many ? "" : "none";
    lbDots.style.display = many ? "flex" : "none";

    lbPrev.disabled = currentIndex <= 0;
    lbNext.disabled = currentIndex >= currentImages.length - 1;
  }

  function show(i){
    if (!currentImages.length) return;
    currentIndex = Math.max(0, Math.min(i, currentImages.length - 1));
    lbImg.src = currentImages[currentIndex];
    renderDots();
    updateNav();
  }

  function openAt(index){
    const w = portfolioItems[index];
    if (!w) return;

    // images
    currentImages = (w.images && w.images.length) ? w.images : (w.img ? [w.img] : []);
    currentIndex = 0;

    // text
    lbTitle.textContent = w.title || "";
    lbSub.textContent = w.sub || "";

    // 描述列點（bullets 優先，其次才用 description）
    lbDesc.innerHTML = "";

    if (w.bullets && w.bullets.length){
      w.bullets.forEach(t => {
        const li = document.createElement("li");
        li.textContent = t;
        lbDesc.appendChild(li);
      });
      lbDesc.style.display = "block";
    } else {
      const desc = (w.description || "").trim();
      if (desc){
        // 兼容舊資料：用換行切成列點
        desc.split(/\n+/).forEach(t => {
          const li = document.createElement("li");
          li.textContent = t.trim();
          if (li.textContent) lbDesc.appendChild(li);
        });
        lbDesc.style.display = "block";
      } else {
        lbDesc.style.display = "none";
      }
    }

    // downloads
    lbDlList.innerHTML = "";
    const downloads = w.downloads || [];
    if (downloads.length === 0) {
      lbDlList.innerHTML = `<span class="muted">目前沒有附加檔案</span>`;
    } else {
      downloads.forEach(d => {
        const a = document.createElement("a");
        a.className = "lb-dl-btn";
        a.href = d.url;
        a.download = "";
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = d.label || "下載檔案";
        lbDlList.appendChild(a);
      });
    }

    // open + show first
    lb.classList.add("open");
    lb.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    show(0);
  }

  function close(){
    lb.classList.remove("open");
    lb.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    currentImages = [];
    currentIndex = 0;
  }

  // click card -> open
  document.addEventListener("click", (e) => {
    const work = e.target.closest?.(".work");
    if (work && work.dataset.index){
      openAt(Number(work.dataset.index));
    }
  });

  // nav buttons
  lbPrev?.addEventListener("click", (e) => { e.stopPropagation(); show(currentIndex - 1); });
  lbNext?.addEventListener("click", (e) => { e.stopPropagation(); show(currentIndex + 1); });

  // close
  closeBtn.addEventListener("click", close);
  lb.addEventListener("click", (e) => { if (e.target === lb) close(); });

  // keyboard
  document.addEventListener("keydown", (e) => {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(currentIndex - 1);
    if (e.key === "ArrowRight") show(currentIndex + 1);
  });

  // swipe (mobile)
  let startX = 0, startY = 0, active = false;
  lbStage?.addEventListener("touchstart", (e) => {
    if (!lb.classList.contains("open")) return;
    const t = e.touches[0];
    startX = t.clientX; startY = t.clientY;
    active = true;
  }, { passive:true });

  lbStage?.addEventListener("touchmove", (e) => {
    if (!active) return;
    const t = e.touches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    // if mostly horizontal, prevent scroll bounce
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
      // noop (passive true can't preventDefault)
    }
  }, { passive:true });

  lbStage?.addEventListener("touchend", (e) => {
    if (!active) return;
    active = false;
    const t = e.changedTouches[0];
    const dx = t.clientX - startX;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) show(currentIndex + 1);
    else show(currentIndex - 1);
  });

  return { openAt, close };
}


function setupMailto(defaultEmail){
  const form = el("mailForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const name = fd.get("name");
    const email = fd.get("email");
    const message = fd.get("message");

    const subject = encodeURIComponent(`[Portfolio] ${name} 想聯絡你`);
    const body = encodeURIComponent(`姓名：${name}\nEmail：${email}\n\n訊息：\n${message}\n`);
    const mailto = `mailto:${defaultEmail}?subject=${subject}&body=${body}`;
    window.location.href = mailto;
  });
}

function escapeHtml(s){
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

(async function init(){
  try{
    const data = await loadSiteData();

    // brand
    setText("brandBadge", data.brand?.badge);
    setText("brandTitle", data.brand?.title);
    setText("brandSub", data.brand?.sub);

    // hero
    setText("heroKicker", data.hero?.kicker);
    setText("heroName", data.hero?.name);
    setText("heroIntro", data.hero?.intro);
    setAttr("ctaCv", "href", data.hero?.cvUrl || "assets/BensonLu_CV.pdf");
    renderChips(data.hero?.chips);

    // about
    setText("aboutDesc", data.about?.desc);
    setText("aboutTitle", data.about?.title);
    setText("aboutText", data.about?.text);
    setAttr("aboutPhoto", "src", data.about?.photoUrl || "assets/me.jpg");
    renderBullets("aboutBullets", data.about?.bullets);
    renderQuickLinks(data.about?.quickLinks);

    // portfolio
    setText("portfolioDesc", data.portfolio?.desc);
    renderGallery(data.portfolio?.items);

    // resume
    setText("resumeDesc", data.resume?.desc);
    renderTimeline(data.resume?.items);

    // skills
    setText("skillsDesc", data.skills?.desc);
    renderSkillCards(data.skills?.cards);

    // contact
    setText("contactDesc", data.contact?.desc);
    setText("contactText", data.contact?.text);
    renderContactList(data.contact?.list);

    // footer
    const year = new Date().getFullYear();
    setText("year", year);
    const ft = (data.footer || "© {year} Benson Lu. All rights reserved.").replace("{year}", String(year));
    setText("footerText", ft);

    // lightbox
    setupLightbox(data.portfolio?.items || []);

    // mailto
    const emailItem = (data.contact?.list || []).find(x => (x.label || "").toLowerCase() === "email");
    setupMailto(emailItem?.value || "you@example.com");
  }catch(err){
    console.error(err);
    alert("載入資料失敗：請確認 data/site.json 存在且可被讀取。");
  }
})();
