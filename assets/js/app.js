// 人生时间窗口导航系统 - 主应用逻辑

// 全局变量
let currentAge = 30;
let currentFilter = "all";
let currentStatusFilter = "all";
let networkSim = null;

// DOM 元素
const ageSlider = document.getElementById("ageSlider");
const ageDisplay = document.getElementById("ageDisplay");
const cardGrid = document.getElementById("cardGrid");
const modalMask = document.getElementById("modalMask");
const modalContent = document.getElementById("modalContent");
const goldNum = document.getElementById("goldNum");
const warningNum = document.getElementById("warningNum");
const closeNum = document.getElementById("closeNum");
const earlyNum = document.getElementById("earlyNum");
const radarGrid = document.getElementById("radarGrid");
const timelineTrack = document.getElementById("timelineTrack");
const timelineCursor = document.getElementById("timelineCursor");
const lifeStage = document.getElementById("lifeStage");

// 计算窗口状态
function getWindowStatus(windowItem, age) {
  const { earlyRiskEnd, goldStart, goldEnd, lateRiskEnd, closeAge } = windowItem;
  if (age < earlyRiskEnd) {
    return { status: "early", label: "提前高风险", className: "status-early" };
  } else if (age >= goldStart && age <= goldEnd) {
    return { status: "gold", label: "黄金执行期", className: "status-gold" };
  } else if (age > goldEnd && age <= lateRiskEnd) {
    return { status: "warning", label: "即将关闭", className: "status-warning" };
  } else if (age > lateRiskEnd && age <= closeAge) {
    return { status: "risk", label: "高价补救", className: "status-warning" };
  } else {
    return { status: "close", label: "已关闭", className: "status-close" };
  }
}

function costLabel(level) {
  const labels = { Low: '低', Medium: '中', High: '高', Extreme: '极高' };
  return labels[level] || level;
}

function getLifeStage(age) {
  if (age < 6) return '幼儿期';
  if (age < 12) return '童年期';
  if (age < 18) return '青春期';
  if (age < 22) return '学生期';
  if (age < 28) return '职场新人期';
  if (age < 35) return '成家立业期';
  if (age < 45) return '中年稳定期';
  if (age < 55) return '中年转型期';
  if (age < 65) return '退休预备期';
  return '退休期';
}

// 渲染维度雷达图
function renderRadar() {
  const dimensions = [
    { key: 'health', name: '生理健康' },
    { key: 'career', name: '学业职业' },
    { key: 'finance', name: '财富资产' },
    { key: 'relation', name: '亲密家庭' },
    { key: 'spirit', name: '精神成长' },
    { key: 'risk', name: '风险兜底' }
  ];

  let html = '';
  dimensions.forEach(function(dim) {
    const windows = windowData.filter(function(w) { return w.category === dim.key; });
    let completed = 0;
    windows.forEach(function(w) {
      const status = getWindowStatus(w, currentAge);
      if (status.status === 'gold' || status.status === 'close') completed++;
    });
    const percent = windows.length ? Math.round((completed / windows.length) * 100) : 0;
    html += '<div class="text-center">';
    html += '<div class="h-20 flex items-end justify-center mb-2">';
    html += '<div class="w-5 bg-gradient-to-t from-sky-500 to-sky-400 rounded-t-lg transition-all duration-300" style="height: ' + percent + '%"></div>';
    html += '</div>';
    html += '<div class="text-sm font-semibold text-sky-500">' + percent + '%</div>';
    html += '<div class="text-xs text-gray-500">' + dim.name + '</div>';
    html += '</div>';
  });

  radarGrid.innerHTML = html;
  lifeStage.textContent = '人生阶段：' + getLifeStage(currentAge);
}

// 渲染全景时间轴 - 使用百分比定位，避免 offsetWidth=0 问题
function renderTimeline() {
  const totalAge = 80;
  const bgColors = {
    gold: 'rgba(14, 165, 233, 0.15)',
    warning: 'rgba(245, 158, 11, 0.15)',
    early: 'rgba(234, 179, 8, 0.15)',
    risk: 'rgba(239, 68, 68, 0.15)',
    close: 'rgba(156, 163, 175, 0.15)'
  };
  const borderColors = {
    gold: '#0ea5e9',
    warning: '#f59e0b',
    early: '#eab308',
    risk: '#ef4444',
    close: '#9ca3af'
  };

  let html = '';
  windowData.forEach(function(item) {
    const status = getWindowStatus(item, currentAge);
    const left = (item.goldStart / totalAge * 100).toFixed(2);
    const width = Math.max(0.5, ((item.goldEnd - item.goldStart) / totalAge * 100)).toFixed(2);
    const bg = bgColors[status.status] || bgColors.close;
    const bc = borderColors[status.status] || borderColors.close;
    html += '<div class="timeline-window ' + status.status + '"';
    html += ' style="position:absolute; height:100%; min-width:4px;';
    html += ' left:' + left + '%; width:' + width + '%;';
    html += ' top:0; background:' + bg + '; border:1px solid ' + bc + '; border-radius:3px; cursor:pointer;"';
    html += ' data-id="' + item.id + '"';
    html += ' title="' + item.title + '">';
    html += '</div>';
  });

  timelineTrack.innerHTML = html;
  timelineCursor.style.left = (currentAge / totalAge * 100).toFixed(2) + '%';

  document.querySelectorAll('.timeline-window').forEach(function(el) {
    el.addEventListener('click', function() { openModal(el.dataset.id); });
  });
}

// 渲染卡片网格
function renderCards() {
  let filteredData = windowData;
  if (currentFilter !== "all") {
    filteredData = filteredData.filter(function(item) { return item.category === currentFilter; });
  }
  if (currentStatusFilter !== "all") {
    filteredData = filteredData.filter(function(item) {
      const status = getWindowStatus(item, currentAge);
      if (currentStatusFilter === 'warning') return status.status === 'warning' || status.status === 'risk';
      return status.status === currentStatusFilter;
    });
  }

  const statusOrder = { gold: 1, warning: 2, early: 3, risk: 4, close: 5 };
  filteredData = filteredData.slice().sort(function(a, b) {
    return (statusOrder[getWindowStatus(a, currentAge).status] || 9) - (statusOrder[getWindowStatus(b, currentAge).status] || 9);
  });

  let goldCount = 0, warningCount = 0, earlyCount = 0, closeCount = 0;
  windowData.forEach(function(item) {
    const s = getWindowStatus(item, currentAge).status;
    if (s === 'gold') goldCount++;
    else if (s === 'warning' || s === 'risk') warningCount++;
    else if (s === 'early') earlyCount++;
    else if (s === 'close') closeCount++;
  });
  goldNum.textContent = goldCount;
  warningNum.textContent = warningCount;
  earlyNum.textContent = earlyCount;
  closeNum.textContent = closeCount;

  const categoryIcons = { health: '❤️', career: '💼', finance: '💰', relation: '💕', spirit: '🧠', risk: '🛡️' };
  const borderColors = { gold: 'border-sky-500', warning: 'border-amber-500', early: 'border-yellow-500', risk: 'border-red-500', close: 'border-gray-400' };
  const statusColors = { gold: 'bg-sky-100 text-sky-600', warning: 'bg-amber-100 text-amber-600', early: 'bg-yellow-100 text-yellow-600', risk: 'bg-red-100 text-red-600', close: 'bg-gray-100 text-gray-600' };

  let html = '';
  filteredData.forEach(function(item) {
    const status = getWindowStatus(item, currentAge);
    html += '<div class="window-card bg-white rounded-xl p-5 shadow-lg hover:shadow-2xl cursor-pointer border-2 ' + borderColors[status.status] + '" data-id="' + item.id + '">';
    html += '<div class="flex justify-between items-start mb-3">';
    html += '<span class="card-status px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ' + statusColors[status.status] + '">' + status.label + '</span>';
    html += '<span class="text-xl">' + (categoryIcons[item.category] || '📋') + '</span>';
    html += '</div>';
    html += '<h3 class="font-semibold mb-2 text-gray-800 text-base leading-tight">' + item.title + '</h3>';
    html += '<p class="text-sm text-gray-600 mb-3 flex-grow line-clamp-2">' + item.desc + '</p>';
    html += '<div class="flex justify-between items-center pt-3 border-t border-gray-100">';
    html += '<div class="flex gap-4 text-xs text-gray-500">';
    html += '<div class="flex items-center gap-1"><span class="text-base">🔒</span><span class="font-semibold text-gray-800">' + item.lockForce + '%</span></div>';
    html += '<div class="flex items-center gap-1"><span class="text-base">⚠️</span><span class="font-semibold text-gray-800">' + costLabel(item.lateCost) + '</span></div>';
    html += '</div>';
    html += '<div class="text-xs text-sky-500 font-semibold">查看详情 →</div>';
    html += '</div>';
    html += '</div>';
  });
  cardGrid.innerHTML = html;

  document.querySelectorAll('.window-card').forEach(function(card) {
    card.addEventListener('click', function() { openModal(card.dataset.id); });
  });
}

// 打开详情弹窗
function openModal(id) {
  const windowItem = windowData.find(function(item) { return item.id == id; });
  if (!windowItem) return;

  const status = getWindowStatus(windowItem, currentAge);
  const totalAge = Math.max(windowItem.closeAge + 5, 80);
  const goldLeft = (windowItem.goldStart / totalAge * 100).toFixed(2);
  const goldWidth = ((windowItem.goldEnd - windowItem.goldStart) / totalAge * 100).toFixed(2);
  const currentLeft = (currentAge / totalAge * 100).toFixed(2);

  const adviceMap = {
    gold: '✅ 当前处于黄金执行期，现在行动ROI最高，优先投入资源。',
    warning: '⚠️ 窗口即将关闭，剩余时间有限，尽快启动补救行动。',
    risk: '🔶 已进入高代价补救期，行动成本上升，但仍有机会，不要放弃。',
    early: '💡 尚未到最优执行期，提前行动有代价，建议先了解、做准备，不要盲目投入。',
    close: '🔴 窗口已关闭，此项基本不可逆，接受现状，聚焦仍开放的窗口。'
  };
  const currentAdvice = adviceMap[status.status] || '';

  const statusColors = {
    gold: 'bg-sky-100 text-sky-600',
    warning: 'bg-amber-100 text-amber-600',
    early: 'bg-yellow-100 text-yellow-600',
    risk: 'bg-red-100 text-red-600',
    close: 'bg-gray-100 text-gray-600'
  };

  let html = '';

  // Header
  html += '<div class="flex justify-between items-start p-6 border-b border-gray-100">';
  html += '<div class="flex-1 pr-3">';
  html += '<span class="px-3 py-1 rounded-lg text-xs font-semibold mb-2 inline-block ' + statusColors[status.status] + '">' + status.label + '</span>';
  html += '<h2 class="text-xl font-semibold mb-1 leading-tight">' + windowItem.title + '</h2>';
  html += '</div>';
  html += '<button class="text-3xl text-gray-400 hover:text-gray-600 transition-colors close-btn leading-none">×</button>';
  html += '</div>';

  // Tabs
  html += '<div class="tabs tabs-boxed">';
  html += '<a class="tab tab-active" data-tab="overview">概览</a>';
  html += '<a class="tab" data-tab="details">详情</a>';
  html += '<a class="tab" data-tab="actions">行动</a>';
  html += '</div>';

  // Body wrapper
  html += '<div class="modal-content-body p-6 overflow-y-auto flex-1">';

  // ── Overview section ──────────────────────────────────────────
  html += '<div class="modal-section" data-section="overview">';

  if (currentAdvice) {
    html += '<div class="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">' + currentAdvice + '</div>';
  }

  html += '<div class="mb-6 p-5 bg-gray-50 rounded-xl">';
  html += '<h4 class="font-semibold mb-4 text-gray-800">时间窗口周期</h4>';
  html += '<div class="relative h-12 bg-gray-200 rounded-lg mb-4">';
  html += '<div class="absolute top-1/2 -translate-y-1/2 h-5 bg-gradient-to-r from-sky-500 to-sky-400 rounded-lg" style="left:' + goldLeft + '%;width:' + goldWidth + '%"></div>';
  html += '<div class="absolute top-1/2 -translate-y-1/2 w-0.5 h-8 bg-sky-500" style="left:' + currentLeft + '%"></div>';
  html += '</div>';
  html += '<div class="grid grid-cols-3 gap-4 text-xs text-gray-600">';
  html += '<div class="text-center p-3 bg-white rounded-lg"><div class="mb-1">开启</div><div class="font-semibold text-gray-800">' + windowItem.goldStart + '岁</div></div>';
  html += '<div class="text-center p-3 bg-white rounded-lg"><div class="mb-1">黄金期</div><div class="font-semibold text-gray-800">' + windowItem.goldStart + '-' + windowItem.goldEnd + '岁</div></div>';
  html += '<div class="text-center p-3 bg-white rounded-lg"><div class="mb-1">关闭</div><div class="font-semibold text-gray-800">' + windowItem.closeAge + '岁</div></div>';
  html += '</div>';
  html += '</div>';

  html += '<div class="mb-6">';
  html += '<h4 class="font-semibold mb-4 text-gray-800">代价评估</h4>';
  html += '<div class="grid grid-cols-2 gap-4">';
  html += '<div class="p-4 bg-gray-50 rounded-xl"><h5 class="font-medium mb-2 text-gray-700">提前代价</h5>';
  html += '<div class="text-2xl font-bold mb-1 text-yellow-500">' + costLabel(windowItem.earlyCost) + '</div>';
  html += '<p class="text-sm text-gray-600">' + windowItem.earlyCostDesc + '</p></div>';
  html += '<div class="p-4 bg-gray-50 rounded-xl"><h5 class="font-medium mb-2 text-gray-700">滞后代价</h5>';
  html += '<div class="text-2xl font-bold mb-1 text-red-500">' + costLabel(windowItem.lateCost) + '</div>';
  html += '<p class="text-sm text-gray-600">' + windowItem.lateCostDesc + '</p></div>';
  html += '</div>';
  html += '</div>';

  html += '<div class="p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">';
  html += '<h4 class="font-semibold mb-1">📚 科学依据</h4>' + windowItem.source;
  html += '</div>';

  html += '</div>';
  // ── /Overview section ─────────────────────────────────────────

  // ── Details section ───────────────────────────────────────────
  html += '<div class="modal-section hidden" data-section="details">';

  html += '<div class="p-5 bg-gray-50 rounded-xl mb-6">';
  html += '<h4 class="font-semibold mb-3 text-gray-800">' + windowItem.title + '</h4>';
  html += '<p class="text-base text-gray-600 leading-relaxed">' + windowItem.desc + '</p>';
  html += '</div>';

  html += '<div class="grid grid-cols-2 gap-4 mb-6">';
  html += '<div class="p-4 bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl text-center">';
  html += '<div class="text-3xl font-bold text-sky-600">' + windowItem.lockForce + '%</div>';
  html += '<div class="text-sm text-gray-600 mt-1">锁死强制力</div></div>';
  html += '<div class="p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl text-center">';
  html += '<div class="text-2xl font-bold text-amber-600">' + windowItem.categoryName + '</div>';
  html += '<div class="text-sm text-gray-600 mt-1">所属维度</div></div>';
  html += '</div>';

  html += '<div><h4 class="font-semibold mb-4 text-gray-800">关键数据</h4>';
  html += '<ul class="space-y-2 text-sm text-gray-600">';
  html += '<li class="flex items-start gap-2"><span class="text-sky-500">•</span> 绝对禁忌提前期：0-' + windowItem.earlyRiskEnd + '岁</li>';
  html += '<li class="flex items-start gap-2"><span class="text-sky-500">•</span> 提前高代价期：' + windowItem.earlyRiskEnd + '-' + windowItem.goldStart + '岁</li>';
  html += '<li class="flex items-start gap-2"><span class="text-sky-500">•</span> 黄金执行期：' + windowItem.goldStart + '-' + windowItem.goldEnd + '岁</li>';
  html += '<li class="flex items-start gap-2"><span class="text-sky-500">•</span> 滞后高代价期：' + windowItem.goldEnd + '-' + windowItem.lateRiskEnd + '岁</li>';
  html += '<li class="flex items-start gap-2"><span class="text-sky-500">•</span> 绝对不可逆关闭期：' + windowItem.closeAge + '岁后</li>';
  html += '</ul></div>';

  html += '</div>';
  // ── /Details section ──────────────────────────────────────────

  // ── Actions section ───────────────────────────────────────────
  html += '<div class="modal-section hidden" data-section="actions">';

  html += '<div class="mb-6"><h4 class="font-semibold mb-4 text-gray-800">📋 行动建议</h4>';
  html += '<ul class="space-y-3">';
  windowItem.actionList.forEach(function(action) {
    html += '<li class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">';
    html += '<span class="text-green-500 font-bold text-lg">✓</span>';
    html += '<span class="flex-1 text-base text-gray-700">' + action + '</span>';
    html += '</li>';
  });
  html += '</ul></div>';

  if (currentAdvice) {
    html += '<div class="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-lg">' + currentAdvice + '</div>';
  }

  html += '</div>';
  // ── /Actions section ──────────────────────────────────────────

  html += '</div>'; // close modal-content-body

  modalContent.innerHTML = html;
  modalMask.classList.remove('hidden');
  modalMask.classList.add('flex');

  // Tab switching
  document.querySelectorAll('.tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('tab-active'); });
      document.querySelectorAll('.modal-section').forEach(function(s) { s.classList.add('hidden'); });
      tab.classList.add('tab-active');
      document.querySelector('[data-section="' + tab.dataset.tab + '"]').classList.remove('hidden');
    });
  });

  document.querySelector('.close-btn').addEventListener('click', closeModal);
}

function closeModal() {
  modalMask.classList.remove('flex');
  modalMask.classList.add('hidden');
}

modalMask.addEventListener('click', function(e) {
  if (e.target === modalMask) closeModal();
});

// 渲染网状图
function renderNetwork() {
  const svg = document.getElementById('networkGraph');
  if (!svg) return;

  // Stop previous simulation to avoid memory leaks
  if (networkSim) { networkSim.stop(); networkSim = null; }

  // Remove old tooltip
  d3.select(svg.parentElement).selectAll('.network-tooltip').remove();

  // Use getBoundingClientRect for reliable width; SVG has no intrinsic clientWidth
  const W = svg.getBoundingClientRect().width || svg.parentElement.clientWidth || 800;
  const H = 420;

  const nodeColors = { gold: '#0ea5e9', warning: '#f59e0b', early: '#eab308', risk: '#ef4444', close: '#9ca3af' };
  const catColors = { health: '#f43f5e', career: '#8b5cf6', finance: '#10b981', relation: '#ec4899', spirit: '#6366f1', risk: '#f97316' };

  const nodes = windowData.map(function(w) {
    const s = getWindowStatus(w, currentAge);
    return { id: w.id, title: w.title, category: w.category, status: s.status, r: Math.max(6, Math.min(18, w.lockForce / 6)) };
  });

  const edges = [];
  for (let i = 0; i < windowData.length; i++) {
    for (let j = i + 1; j < windowData.length; j++) {
      if (windowData[i].category === windowData[j].category) {
        edges.push({ source: windowData[i].id, target: windowData[j].id });
      }
    }
  }

  d3.select(svg).selectAll('*').remove();
  d3.select(svg).attr('viewBox', '0 0 ' + W + ' ' + H).attr('preserveAspectRatio', 'xMidYMid meet');

  // Make parent relative for tooltip positioning
  svg.parentElement.style.position = 'relative';

  const tooltip = d3.select(svg.parentElement).append('div')
    .attr('class', 'network-tooltip')
    .style('position', 'absolute')
    .style('background', 'rgba(0,0,0,0.75)')
    .style('color', '#fff')
    .style('padding', '4px 8px')
    .style('border-radius', '6px')
    .style('font-size', '12px')
    .style('pointer-events', 'none')
    .style('opacity', 0)
    .style('z-index', 10);

  const root = d3.select(svg);

  const link = root.append('g').selectAll('line').data(edges).enter().append('line')
    .attr('stroke', '#e5e7eb').attr('stroke-width', 1).attr('opacity', 0.6);

  const nodeG = root.append('g').selectAll('g').data(nodes).enter().append('g')
    .attr('cursor', 'pointer')
    .on('click', function(e, d) { openModal(d.id); })
    .on('mouseover', function(e, d) {
      d3.select(this).select('circle').attr('r', d.r + 3);
      tooltip.style('opacity', 1).html(d.title)
        .style('left', (e.offsetX + 12) + 'px')
        .style('top', (e.offsetY - 24) + 'px');
    })
    .on('mouseout', function(e, d) {
      d3.select(this).select('circle').attr('r', d.r);
      tooltip.style('opacity', 0);
    })
    .call(d3.drag()
      .on('start', function(e, d) { if (!e.active) networkSim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on('drag', function(e, d) { d.fx = e.x; d.fy = e.y; })
      .on('end', function(e, d) { if (!e.active) networkSim.alphaTarget(0); d.fx = null; d.fy = null; }));

  nodeG.append('circle')
    .attr('r', function(d) { return d.r; })
    .attr('fill', function(d) { return nodeColors[d.status] || '#9ca3af'; })
    .attr('stroke', function(d) { return catColors[d.category] || '#ccc'; })
    .attr('stroke-width', 2);

  nodeG.append('text')
    .text(function(d) { return d.title.slice(0, 4); })
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'central')
    .attr('font-size', '8px')
    .attr('fill', '#fff')
    .attr('pointer-events', 'none');

  networkSim = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(edges).id(function(d) { return d.id; }).distance(60).strength(0.3))
    .force('charge', d3.forceManyBody().strength(-80))
    .force('center', d3.forceCenter(W / 2, H / 2))
    .force('collision', d3.forceCollide(function(d) { return d.r + 4; }))
    .on('tick', function() {
      link
        .attr('x1', function(d) { return d.source.x; })
        .attr('y1', function(d) { return d.source.y; })
        .attr('x2', function(d) { return d.target.x; })
        .attr('y2', function(d) { return d.target.y; });
      nodeG.attr('transform', function(d) {
        d.x = Math.max(d.r, Math.min(W - d.r, d.x));
        d.y = Math.max(d.r, Math.min(H - d.r, d.y));
        return 'translate(' + d.x + ',' + d.y + ')';
      });
    });
}

// 统一更新
function updateAll() {
  renderRadar();
  renderTimeline();
  renderCards();
  renderNetwork();
}

// 初始化
function initApp() {
  ageSlider.addEventListener('input', function(e) {
    currentAge = parseInt(e.target.value);
    ageDisplay.textContent = currentAge;
    updateAll();
  });

  document.querySelectorAll('.quick-jump').forEach(function(jump) {
    jump.addEventListener('click', function() {
      document.querySelectorAll('.quick-jump').forEach(function(j) {
        j.classList.remove('active', 'btn-primary');
        j.classList.add('btn-ghost');
      });
      jump.classList.add('active', 'btn-primary');
      jump.classList.remove('btn-ghost');
      currentAge = parseInt(jump.dataset.age);
      ageSlider.value = currentAge;
      ageDisplay.textContent = currentAge;
      updateAll();
    });
  });

  document.querySelectorAll('.filter-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const filterType = btn.dataset.filter;
      const statusType = btn.dataset.status;
      if (filterType) {
        document.querySelectorAll('.filter-btn[data-filter]').forEach(function(b) {
          b.classList.remove('btn-primary'); b.classList.add('btn-ghost');
        });
        btn.classList.remove('btn-ghost'); btn.classList.add('btn-primary');
        currentFilter = filterType;
      } else if (statusType) {
        document.querySelectorAll('.filter-btn[data-status]').forEach(function(b) {
          b.classList.remove('btn-primary'); b.classList.add('btn-outline');
        });
        if (currentStatusFilter === statusType) {
          currentStatusFilter = 'all';
        } else {
          btn.classList.remove('btn-outline'); btn.classList.add('btn-primary');
          currentStatusFilter = statusType;
        }
      }
      renderCards();
    });
  });

  updateAll();
  initOnboarding();
  console.log('人生时间窗口导航系统已启动');
}

document.addEventListener('DOMContentLoaded', initApp);

// 新手引导
function initOnboarding() {
  const steps = [
    { icon: '👋', title: '欢迎使用人生时间窗口', desc: '40个关键人生窗口，帮你找到每件事的最优时机' },
    { icon: '🎯', title: '拖动年龄滑块', desc: '调节观测年龄，实时查看不同阶段的窗口状态变化' },
    { icon: '🕸️', title: '网状图 & 卡片', desc: '点击节点或卡片查看详情，了解每个窗口的行动建议' }
  ];
  let step = 0;
  const mask = document.getElementById('onboardingMask');
  const icon = document.getElementById('onboardingIcon');
  const title = document.getElementById('onboardingTitle');
  const desc = document.getElementById('onboardingDesc');
  const dots = document.querySelectorAll('.onboarding-dot');
  const nextBtn = document.getElementById('onboardingNext');
  const skipBtn = document.getElementById('onboardingSkip');

  function close() { mask.classList.add('hidden'); }
  function update() {
    icon.textContent = steps[step].icon;
    title.textContent = steps[step].title;
    desc.textContent = steps[step].desc;
    dots.forEach(function(d, i) {
      d.classList.toggle('bg-sky-500', i === step);
      d.classList.toggle('bg-gray-200', i !== step);
    });
    nextBtn.textContent = step === steps.length - 1 ? '开始使用' : '下一步';
  }
  nextBtn.addEventListener('click', function() { if (step < steps.length - 1) { step++; update(); } else { close(); } });
  skipBtn.addEventListener('click', close);
}
