const WINDOW_DATA = typeof windowData === "undefined" ? [] : windowData;
if (!Array.isArray(WINDOW_DATA) || WINDOW_DATA.length === 0) {
  const root = document.querySelector(".app-shell");
  if (root) {
    root.innerHTML = "<p style='padding:20px;color:#a8bad3'>未检测到数据文件 data-full.js。</p>";
  }
  throw new Error("windowData is missing.");
}

const state = {
  age: 30,
  query: "",
  category: "all",
  status: "all",
  sort: "priority",
  lockOnly: false,
};

const CATEGORY_META = {
  health: { label: "生理健康", icon: "体" },
  career: { label: "学业职业", icon: "职" },
  finance: { label: "财富资产", icon: "财" },
  relation: { label: "亲密家庭", icon: "家" },
  spirit: { label: "精神成长", icon: "心" },
  risk: { label: "风险兜底", icon: "护" },
};

const STATUS_META = {
  gold: { label: "现在做", cls: "gold" },
  warning: { label: "快关闭", cls: "warn" },
  risk: { label: "高代价补救", cls: "risk" },
  early: { label: "提前布局", cls: "early" },
  close: { label: "已关闭", cls: "close" },
};

const els = {
  ageValue: document.getElementById("ageValue"),
  lifeStage: document.getElementById("lifeStage"),
  ageSlider: document.getElementById("ageSlider"),
  ageChips: document.querySelectorAll(".age-chip"),
  searchInput: document.getElementById("searchInput"),
  categorySelect: document.getElementById("categorySelect"),
  statusSelect: document.getElementById("statusSelect"),
  sortSelect: document.getElementById("sortSelect"),
  lockOnly: document.getElementById("lockOnly"),
  resetBtn: document.getElementById("resetBtn"),
  kpiGrid: document.getElementById("kpiGrid"),
  focusList: document.getElementById("focusList"),
  denseList: document.getElementById("denseList"),
  dimensionGrid: document.getElementById("dimensionGrid"),
  resultStat: document.getElementById("resultStat"),
  detailPanel: document.getElementById("detailPanel"),
  detailClose: document.getElementById("detailClose"),
  detailContent: document.getElementById("detailContent"),
};

function clampText(value, maxLength) {
  if (!value) return "";
  const v = String(value);
  return v.length <= maxLength ? v : `${v.slice(0, maxLength)}...`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getLifeStage(age) {
  if (age < 6) return "幼儿期";
  if (age < 12) return "童年期";
  if (age < 18) return "青春期";
  if (age < 25) return "学生期";
  if (age < 35) return "起步期";
  if (age < 45) return "成长期";
  if (age < 55) return "稳态期";
  if (age < 65) return "跃迁前夜";
  return "成熟期";
}

function getWindowStatus(item, age) {
  if (age < item.earlyRiskEnd) return "early";
  if (age >= item.goldStart && age <= item.goldEnd) return "gold";
  if (age > item.goldEnd && age <= item.lateRiskEnd) return "warning";
  if (age > item.lateRiskEnd && age <= item.closeAge) return "risk";
  return "close";
}

function getStatusReason(item, age) {
  const status = getWindowStatus(item, age);
  if (status === "gold") {
    return "现在执行最有价值，建议先做最小可交付动作。";
  }
  if (status === "warning") {
    return `临近关闭，距离 ${item.closeAge} 岁仅余 ${Math.max(item.closeAge - age, 0)} 年。`;
  }
  if (status === "risk") {
    return "已过黄金期，后续修复成本高，注意先控制边界后再投入。";
  }
  if (status === "early") {
    return `未到黄金期，距离启动窗口开始还有 ${Math.max(item.goldStart - age, 0)} 年。`;
  }
  return "已基本封闭，建议调整资源去向其他窗口。";
}

function getUrgencyScore(item, age) {
  const status = getWindowStatus(item, age);
  const statusBase = status === "gold" ? 400 : status === "warning" ? 320 : status === "risk" ? 270 : status === "early" ? 180 : 90;
  const closeGap = Math.max(item.closeAge - age, 0);
  return statusBase + item.lockForce - closeGap * 0.9 + (item.goldEnd - item.goldStart);
}

function getFilteredData() {
  return WINDOW_DATA.filter((item) => {
    const status = getWindowStatus(item, state.age);
    const text = `${item.title} ${item.desc} ${item.categoryName} ${item.source} ${item.actionList.join(" ")}`.toLowerCase();
    const matchesQuery = !state.query || text.includes(state.query);
    const matchesCategory = state.category === "all" || item.category === state.category;
    const matchesStatus =
      state.status === "all" || status === state.status || (state.status === "warning" && status === "risk");
    const matchesLock = !state.lockOnly || item.lockForce >= 80;
    return matchesQuery && matchesCategory && matchesStatus && matchesLock;
  });
}

function sortItems(items) {
  const result = [...items];
  if (state.sort === "close") {
    return result.sort((a, b) => a.closeAge - b.closeAge || getUrgencyScore(b, state.age) - getUrgencyScore(a, state.age));
  }
  if (state.sort === "lock") {
    return result.sort((a, b) => b.lockForce - a.lockForce || a.closeAge - b.closeAge);
  }
  if (state.sort === "category") {
    return result.sort((a, b) => a.category.localeCompare(b.category) || getUrgencyScore(b, state.age) - getUrgencyScore(a, state.age));
  }
  return result.sort((a, b) => getUrgencyScore(b, state.age) - getUrgencyScore(a, state.age));
}

function computeCounts(items) {
  const groups = { all: items.length, gold: 0, warning: 0, risk: 0, early: 0, close: 0 };
  items.forEach((item) => {
    const status = getWindowStatus(item, state.age);
    groups[status] += 1;
  });
  groups.warning = groups.warning + groups.risk;
  return groups;
}

function makeBadge(status) {
  const meta = STATUS_META[status];
  return `<span class="badge ${meta.cls}">${meta.label}</span>`;
}

function renderKpi(items) {
  const stats = computeCounts(getFilteredData());
  const focus = items.filter((item) => getWindowStatus(item, state.age) === "gold").length;
  const lockHeavy = items.filter((item) => item.lockForce >= 80).length;
  const urgent = items.filter((item) => {
    const status = getWindowStatus(item, state.age);
    return status === "warning" || status === "risk";
  }).length;

  const cards = [
    { title: "筛选结果", value: String(items.length), note: "命中窗口" },
    { title: "现在做", value: String(stats.gold), note: "优先执行" },
    { title: "快关闭", value: String(urgent), note: "即将收口" },
    { title: "高锁死", value: String(lockHeavy), note: "锁定成本高" },
    { title: "黄金待发", value: String(focus), note: "可快速增益" },
  ];

  els.kpiGrid.innerHTML = cards
    .map(
      (card) => `
      <article class="kpi-item">
        <h3>${escapeHtml(card.title)}</h3>
        <strong>${escapeHtml(card.value)}</strong>
        <p>${escapeHtml(card.note)}</p>
      </article>
    `
    )
    .join("");
}

function renderFocus(items) {
  const focusItems = [...items].sort((a, b) => getUrgencyScore(b, state.age) - getUrgencyScore(a, state.age)).slice(0, 4);
  if (!focusItems.length) {
    els.focusList.innerHTML = `<p class="empty-state">暂无可展示的高优先窗口。</p>`;
    return;
  }

  els.focusList.innerHTML = focusItems
    .map((item) => {
      const status = getWindowStatus(item, state.age);
      const meta = CATEGORY_META[item.category] || {};
      return `
        <article class="focus-item">
          ${makeBadge(status)}
          <h3>${escapeHtml(item.title)}</h3>
          <p class="focus-meta">
            <span>${escapeHtml(meta.icon || "•")} ${escapeHtml(meta.label || item.categoryName || "未分类")}</span>
            <span>锁死 ${item.lockForce}%</span>
            <span>${item.goldStart}-${item.goldEnd}岁</span>
          </p>
          <p>${escapeHtml(clampText(item.desc, 48))}</p>
          <button class="open-btn" type="button" data-open="${item.id}">查看动作与代价</button>
        </article>
      `;
    })
    .join("");
}

function renderDense(items) {
  if (!items.length) {
    els.denseList.innerHTML = `<p class="empty-state">筛选后无结果，尝试放宽年龄、关键词或移除高锁死限制。</p>`;
    return;
  }

  els.denseList.innerHTML = items
    .map((item) => {
      const status = getWindowStatus(item, state.age);
      const meta = CATEGORY_META[item.category] || {};
      const categoryLabel = `${meta.icon || "•"} ${meta.label || item.categoryName || "未分类"}`;
      const reason = getStatusReason(item, state.age);
      return `
        <article class="dense-row">
          <div class="dense-row-head">
            ${makeBadge(status)}
            <span class="chip">${escapeHtml(categoryLabel)}</span>
            <span class="chip">锁死 ${item.lockForce}%</span>
          </div>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(clampText(item.desc, 84))}</p>
          <div class="dense-meta">
            <span class="chip">黄金期 ${item.goldStart}-${item.goldEnd}岁</span>
            <span class="chip">关闭 ${item.closeAge}岁</span>
            <span class="chip">状态 ${STATUS_META[status].label}</span>
          </div>
          <p class="detail-note">${escapeHtml(reason)}</p>
          <div class="row-actions">
            <button class="open-btn" type="button" data-open="${item.id}">展开详情</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderDimension() {
  const nodes = Object.entries(CATEGORY_META).map(([key, meta]) => {
    const items = WINDOW_DATA.filter((item) => item.category === key);
    const active = items.filter((item) => ["gold", "warning", "risk"].includes(getWindowStatus(item, state.age))).length;
    const close = items.filter((item) => getWindowStatus(item, state.age) === "close").length;
    const total = items.length || 1;
    const pressure = Math.round((active / total) * 100);
    return { meta, key, items: items.length, active, close, pressure };
  });

  els.dimensionGrid.innerHTML = nodes
    .sort((a, b) => b.pressure - a.pressure || b.active - a.active)
    .map(
      (node) => `
      <article class="dimension-item">
        <div class="dimension-top">
          <p class="dimension-name">${escapeHtml(node.meta.icon)} ${escapeHtml(node.meta.label)}</p>
          <p class="dimension-rate">${node.active}/${node.items} 活动</p>
        </div>
        <div class="dimension-bar"><span style="width:${node.pressure}%"></span></div>
        <p class="dimension-rate">已闭窗 ${node.close} 项</p>
      </article>
    `
    )
    .join("");
}

function openDetail(id) {
  const item = WINDOW_DATA.find((d) => d.id === id);
  if (!item) return;
  const status = getWindowStatus(item, state.age);
  const category = CATEGORY_META[item.category];
  const early = Math.max(item.earlyRiskEnd, 0);
  const warn = Math.max(item.goldEnd - item.goldStart, 0);
  const risk = Math.max(item.lateRiskEnd - item.goldEnd, 0);
  const close = Math.max(item.closeAge - item.lateRiskEnd, 0);
  const total = early + warn + risk + close || 1;
  const p1 = Math.max((early / total) * 100, 6);
  const p2 = Math.max((warn / total) * 100, 6);
  const p3 = Math.max((risk / total) * 100, 6);
  const p4 = Math.max((close / total) * 100, 6);

  els.detailContent.innerHTML = `
    <div>
      <div>${makeBadge(status)} <span class="badge ${status === "gold" ? "gold" : status === "warning" ? "warn" : status === "risk" ? "risk" : status === "early" ? "early" : "close"}">${escapeHtml(category.label)}</span></div>
      <h2 class="detail-title">${escapeHtml(item.title)}</h2>
      <p class="detail-copy">${escapeHtml(item.desc)}</p>
      <div class="detail-grid">
        <div class="detail-grid-item">
          <h4>黄金期</h4>
          <p>${item.goldStart}-${item.goldEnd}岁</p>
        </div>
        <div class="detail-grid-item">
          <h4>风险上限</h4>
          <p>${item.closeAge}岁</p>
        </div>
        <div class="detail-grid-item">
          <h4>锁死指数</h4>
          <p>${item.lockForce}%</p>
        </div>
        <div class="detail-grid-item">
          <h4>维度</h4>
          <p>${escapeHtml(category.label)}</p>
        </div>
      </div>
      <div class="timeline" role="img" aria-label="时间演进分布">
        <span class="t1" style="width:${p1.toFixed(2)}%"></span>
        <span class="t2" style="width:${p2.toFixed(2)}%"></span>
        <span class="t3" style="width:${p3.toFixed(2)}%"></span>
        <span class="t4" style="width:${p4.toFixed(2)}%"></span>
      </div>
      <div class="detail-grid">
        <div class="detail-grid-item">
          <h4>提前风险</h4>
          <p>${item.earlyCost}: ${escapeHtml(item.earlyCostDesc)}</p>
        </div>
        <div class="detail-grid-item">
          <h4>延后风险</h4>
          <p>${item.lateCost}: ${escapeHtml(item.lateCostDesc)}</p>
        </div>
      </div>
      <div class="detail-actions">
        <h4>行动清单</h4>
        <ol>
          ${item.actionList.map((action) => `<li>${escapeHtml(action)}</li>`).join("")}
        </ol>
      </div>
      <p class="detail-note">依据：${escapeHtml(item.source)}</p>
    </div>
  `;
  els.detailPanel.classList.add("is-open");
  els.detailPanel.setAttribute("aria-hidden", "false");
}

function closeDetail() {
  els.detailPanel.classList.remove("is-open");
  els.detailPanel.setAttribute("aria-hidden", "true");
}

function render() {
  const filtered = sortItems(getFilteredData());
  const grouped = computeCounts(filtered);
  els.ageValue.textContent = state.age;
  els.lifeStage.textContent = getLifeStage(state.age);
  els.ageSlider.value = String(state.age);
  els.searchInput.value = state.query;
  els.categorySelect.value = state.category;
  els.statusSelect.value = state.status;
  els.sortSelect.value = state.sort;
  els.lockOnly.checked = state.lockOnly;

  els.ageChips.forEach((item) => {
    item.classList.toggle("is-active", Number(item.dataset.age) === state.age);
  });

  renderKpi(filtered);
  renderFocus(filtered);
  renderDense(filtered);
  renderDimension();
  els.resultStat.textContent = `共 ${grouped.all} 项 | 现在做 ${grouped.gold} 项 | 已关闭 ${grouped.close} 项`;
}

function bindEvents() {
  els.ageSlider.addEventListener("input", (event) => {
    state.age = Number(event.target.value);
    render();
  });

  els.ageChips.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.age = Number(btn.dataset.age);
      render();
    });
  });

  els.searchInput.addEventListener("input", (event) => {
    state.query = event.target.value.trim().toLowerCase();
    render();
  });

  els.categorySelect.addEventListener("change", (event) => {
    state.category = event.target.value;
    render();
  });

  els.statusSelect.addEventListener("change", (event) => {
    state.status = event.target.value;
    render();
  });

  els.sortSelect.addEventListener("change", (event) => {
    state.sort = event.target.value;
    render();
  });

  els.lockOnly.addEventListener("change", (event) => {
    state.lockOnly = event.target.checked;
    render();
  });

  els.resetBtn.addEventListener("click", () => {
    state.age = 30;
    state.query = "";
    state.category = "all";
    state.status = "all";
    state.sort = "priority";
    state.lockOnly = false;
    render();
  });

  [els.focusList, els.denseList].forEach((root) => {
    root.addEventListener("click", (event) => {
      const id = Number(event.target && event.target.getAttribute ? event.target.getAttribute("data-open") : null);
      if (!id) return;
      openDetail(id);
    });
  });

  els.detailClose.addEventListener("click", closeDetail);
  els.detailPanel.addEventListener("click", (event) => {
    if (event.target === els.detailPanel) closeDetail();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeDetail();
  });
}

function init() {
  bindEvents();
  render();
}

init();
