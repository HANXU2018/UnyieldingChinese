// 人生时间窗口导航系统 - 主应用逻辑

// 全局变量
let currentAge = 30;
let currentFilter = "all";
let currentStatusFilter = "all";

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

// 获取人生阶段
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
    { key: 'health', name: '生理健康', icon: '❤️' },
    { key: 'career', name: '学业职业', icon: '💼' },
    { key: 'finance', name: '财富资产', icon: '💰' },
    { key: 'relation', name: '亲密家庭', icon: '💕' },
    { key: 'spirit', name: '精神成长', icon: '🧠' },
    { key: 'risk', name: '风险兜底', icon: '🛡️' }
  ];

  let html = '';
  dimensions.forEach(dim => {
    const windows = windowData.filter(w => w.category === dim.key);
    let completed = 0;
    windows.forEach(w => {
      const status = getWindowStatus(w, currentAge);
      if (status.status === 'gold' || status.status === 'close') {
        completed++;
      }
    });
    const percent = Math.round((completed / windows.length) * 100) || 0;

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

// 渲染全景时间轴
function renderTimeline() {
  const containerWidth = timelineTrack.offsetWidth || 300;
  const totalAge = 80;
  const pixelPerAge = containerWidth / totalAge;

  let html = '';
  windowData.forEach(item => {
    const status = getWindowStatus(item, currentAge);
    const left = (item.goldStart * pixelPerAge);
    const width = ((item.goldEnd - item.goldStart) * pixelPerAge);
    const top = Math.random() * 30 + 10;

    const bgColors = {
      gold: 'rgba(14, 165, 233, 0.15)',
      warning: 'rgba(245, 158, 11, 0.15)',
      early: 'rgba(234, 179, 8, 0.15)',
      risk: 'rgba(239, 68, 68, 0.15)'
    };

    const borderColors = {
      gold: '#0ea5e9',
      warning: '#f59e0b',
      early: '#eab308',
      risk: '#ef4444'
    };

    html += '<div class="timeline-window ' + status.status + '"';
    html += ' style="left: ' + left + 'px; width: ' + width + 'px; top: ' + top + 'px; background: ' + bgColors[status.status] + '; border-color: ' + borderColors[status.status] + ';"';
    html += ' data-id="' + item.id + '"';
    html += ' title="' + item.title + '">';
    html += '</div>';
  });

  timelineTrack.innerHTML = html;

  // 更新游标位置
  const cursorPos = (currentAge / totalAge) * 100;
  timelineCursor.style.left = cursorPos + '%';

  // 绑定时间轴窗口点击事件
  document.querySelectorAll('.timeline-window').forEach(window => {
    window.addEventListener('click', () => {
      const id = window.dataset.id;
      openModal(id);
    });
  });
}

// 渲染卡片网格
function renderCards() {
  let filteredData = windowData;

  // 维度筛选
  if (currentFilter !== "all") {
    filteredData = filteredData.filter((item) => item.category === currentFilter);
  }

  // 状态筛选
  if (currentStatusFilter !== "all") {
    filteredData = filteredData.filter(item => {
      const status = getWindowStatus(item, currentAge);
      if (currentStatusFilter === 'warning') {
        return status.status === 'warning' || status.status === 'risk';
      }
      return status.status === currentStatusFilter;
    });
  }

  const statusOrder = { gold: 1, warning: 2, early: 3, risk: 4, close: 5 };
  filteredData = [...filteredData].sort((a, b) => {
    const sa = getWindowStatus(a, currentAge).status;
    const sb = getWindowStatus(b, currentAge).status;
    return (statusOrder[sa] || 9) - (statusOrder[sb] || 9);
  });

  // 统计状态数量
  let goldCount = 0, warningCount = 0, earlyCount = 0, closeCount = 0;
  windowData.forEach((item) => {
    const status = getWindowStatus(item, currentAge);
    if (status.status === "gold") goldCount++;
    if (status.status === "warning" || status.status === "risk") warningCount++;
    if (status.status === "early") earlyCount++;
    if (status.status === "close") closeCount++;
  });

  // 更新统计数据
  goldNum.textContent = goldCount;
  warningNum.textContent = warningCount;
  earlyNum.textContent = earlyCount;
  closeNum.textContent = closeCount;

  // 生成卡片HTML
  let cardHtml = "";
  filteredData.forEach((item) => {
    const status = getWindowStatus(item, currentAge);
    const categoryIcons = {
      health: '❤️',
      career: '💼',
      finance: '💰',
      relation: '💕',
      spirit: '🧠',
      risk: '🛡️'
    };

    const borderColors = {
      gold: 'border-sky-500',
      warning: 'border-amber-500',
      early: 'border-yellow-500',
      risk: 'border-red-500',
      close: 'border-gray-400'
    };

    const statusColors = {
      gold: 'bg-sky-100 text-sky-600',
      warning: 'bg-amber-100 text-amber-600',
      early: 'bg-yellow-100 text-yellow-600',
      risk: 'bg-red-100 text-red-600',
      close: 'bg-gray-100 text-gray-600'
    };

    cardHtml += '<div class="window-card bg-white rounded-xl p-5 shadow-lg hover:shadow-2xl cursor-pointer border-2 ' + borderColors[status.status] + '" data-id="' + item.id + '">';
    cardHtml += '<div class="flex justify-between items-start mb-3">';
    cardHtml += '<span class="card-status px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ' + statusColors[status.status] + '">' + status.label + '</span>';
    cardHtml += '<span class="text-xl">' + (categoryIcons[item.category] || '📋') + '</span>';
    cardHtml += '</div>';
    cardHtml += '<h3 class="font-semibold mb-2 text-gray-800 text-base leading-tight">' + item.title + '</h3>';
    cardHtml += '<p class="text-sm text-gray-600 mb-3 flex-grow line-clamp-2">' + item.desc + '</p>';
    cardHtml += '<div class="flex justify-between items-center pt-3 border-t border-gray-100">';
    cardHtml += '<div class="flex gap-4 text-xs text-gray-500">';
    cardHtml += '<div class="flex items-center gap-1">';
    cardHtml += '<span class="text-base">🔒</span>';
    cardHtml += '<span class="font-semibold text-gray-800">' + item.lockForce + '%</span>';
    cardHtml += '</div>';
    cardHtml += '<div class="flex items-center gap-1">';
    cardHtml += '<span class="text-base">⚠️</span>';
    cardHtml += '<span class="font-semibold text-gray-800">' + costLabel(item.lateCost) + '</span>';
    cardHtml += '</div>';
    cardHtml += '</div>';
    cardHtml += '<div class="text-xs text-sky-500 font-semibold">查看详情 →</div>';
    cardHtml += '</div>';
    cardHtml += '</div>';
  });
  cardGrid.innerHTML = cardHtml;

  // 绑定卡片点击事件
  document.querySelectorAll(".window-card").forEach((card) => {
    card.addEventListener("click", () => {
      const id = card.dataset.id;
      openModal(id);
    });
  });
}

// 打开详情弹窗
function openModal(id) {
  const windowItem = windowData.find((item) => item.id == id);
  if (!windowItem) return;

  const status = getWindowStatus(windowItem, currentAge);

  const totalAge = Math.max(windowItem.closeAge + 5, 80);
  const goldLeft = (windowItem.goldStart / totalAge) * 100;
  const goldWidth = ((windowItem.goldEnd - windowItem.goldStart) / totalAge) * 100;
  const currentLeft = (currentAge / totalAge) * 100;

  let actionHtml = "";
  windowItem.actionList.forEach((action) => {
    actionHtml += '<li>' + action + '</li>';
  });

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

  // 构建弹窗HTML
  let modalHtml = '';
  modalHtml += '<div class="flex justify-between items-start p-6 border-b border-gray-100">';
  modalHtml += '<div class="flex-1 pr-3">';
  modalHtml += '<span class="px-3 py-1 rounded-lg text-xs font-semibold mb-2 inline-block ' + statusColors[status.status] + '">' + status.label + '</span>';
  modalHtml += '<h2 class="text-xl font-semibold mb-1 leading-tight">' + windowItem.title + '</h2>';
  modalHtml += '</div>';
  modalHtml += '<button class="text-3xl text-gray-400 hover:text-gray-600 transition-colors close-btn leading-none">×</button>';
  modalHtml += '</div>';

  modalHtml += '<div class="tabs tabs-boxed">';
  modalHtml += '<a class="tab tab-active" data-tab="overview">概览</a>';
  modalHtml += '<a class="tab" data-tab="details">详情</a>';
  modalHtml += '<a class="tab" data-tab="actions">行动</a>';
  modalHtml += '</div>';

  modalHtml += '<div class="p-6 overflow-y-auto flex-1 modal-content-body">';

  // 概览部分
  modalHtml += '<div class="modal-section" data-section="overview">';
  if (currentAdvice) {
    modalHtml += '<div class="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">';
    modalHtml += currentAdvice;
    modalHtml += '</div>';
  }

  modalHtml += '<div class="mb-6 p-5 bg-gray-50 rounded-xl">';
  modalHtml += '<h4 class="font-semibold mb-4 text-gray-800">时间窗口周期</h4>';
  modalHtml += '<div class="relative h-12 bg-gray-200 rounded-lg mb-4">';
  modalHtml += '<div class="absolute top-1/2 -translate-y-1/2 h-5 bg-gradient-to-r from-sky-500 to-sky-400 rounded-lg" style="left: ' + goldLeft + '%; width: ' + goldWidth + '%"></div>';
  modalHtml += '<div class="absolute top-1/2 -translate-y-1/2 w-0.5 h-8 bg-sky-500" style="left: ' + currentLeft + '%"></div>';
  modalHtml += '</div>';
  modalHtml += '<div class="grid grid-cols-3 gap-4 text-xs text-gray-600">';
  modalHtml += '<div class="text-center p-3 bg-white rounded-lg">';
  modalHtml += '<div class="mb-1">开启</div>';
  modalHtml += '<div class="font-semibold text-gray-800">' + windowItem.goldStart + '岁</div>';
  modalHtml += '</div>';
  modalHtml += '<div class="text-center p-3 bg-white rounded-lg">';
  modalHtml += '<div class="mb-1">黄金期</div>';
  modalHtml += '<div class="font-semibold text-gray-800">' + windowItem.goldStart + '-' + windowItem.goldEnd + '岁</div>';
  modalHtml += '</div>';
  modalHtml += '<div class="text-center p-3 bg-white rounded-lg">';
  modalHtml += '<div class="mb-1">关闭</div>';
  modalHtml += '<div class="font-semibold text-gray-800">' + windowItem.closeAge + '岁</div>';
  modalHtml += '</div>';
  modalHtml += '</div>';
  modalHtml += '</div>';

  modalHtml += '<div class="mb-6">';
  modalHtml += '<h4 class="font-semibold mb-4 text-gray-800">代价评估</h4>';
  modalHtml += '<div class="grid grid-cols-2 gap-4">';
  modalHtml += '<div class="p-4 bg-gray-50 rounded-xl">';
  modalHtml += '<h5 class="font-medium mb-2 text-gray-700">提前代价</h5>';
  modalHtml += '<div class="text-2xl font-bold mb-1 text-yellow-500">' + costLabel(windowItem.earlyCost) + '</div>';
  modalHtml += '<p class="text-sm text-gray-600">' + windowItem.earlyCostDesc + '</p>';
  modalHtml += '</div>';
  modalHtml += '<div class="p-4 bg-gray-50 rounded-xl">';
  modalHtml += '<h5 class="font-medium mb-2 text-gray-700">滞后代价</h5>';
  modalHtml += '<div class="text-2xl font-bold mb-1 text-red-500">' + costLabel(windowItem.lateCost) + '</div>';
  modalHtml += '<p class="text-sm text-gray-600">' + windowItem.lateCostDesc + '</p>';
  modalHtml += '</div>';
  modalHtml += '</div>';

  modalHtml += '<div class="p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">';
  modalHtml += '<h4 class="font-semibold mb-1">📚 科学依据</h4>';
  modalHtml += windowItem.source;
  modalHtml += '</div>';
  modalHtml += '</div>';

  // 详情部分
  modalHtml += '<div class="modal-section hidden" data-section="details">';
  modalHtml += '<div class="p-5 bg-gray-50 rounded-xl mb-6">';
  modalHtml += '<h4 class="font-semibold mb-3 text-gray-800">' + windowItem.title + '</h4>';
  modalHtml += '<p class="text-base text-gray-600 leading-relaxed">' + windowItem.desc + '</p>';
  modalHtml += '</div>';

  modalHtml += '<div class="grid grid-cols-2 gap-4 mb-6">';
  modalHtml += '<div class="p-4 bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl text-center">';
  modalHtml += '<div class="text-3xl font-bold text-sky-600">' + windowItem.lockForce + '%</div>';
  modalHtml += '<div class="text-sm text-gray-600 mt-1">锁死强制力</div>';
  modalHtml += '</div>';
  modalHtml += '<div class="p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl text-center">';
  modalHtml += '<div class="text-2xl font-bold text-amber-600">' + windowItem.categoryName + '</div>';
  modalHtml += '<div class="text-sm text-gray-600 mt-1">所属维度</div>';
  modalHtml += '</div>';
  modalHtml += '</div>';

  modalHtml += '<div>';
  modalHtml += '<h4 class="font-semibold mb-4 text-gray-800">关键数据</h4>';
  modalHtml += '<ul class="space-y-2 text-sm text-gray-600">';
  modalHtml += '<li class="flex items-start gap-2"><span class="text-sky-500">•</span> 绝对禁忌提前期：0-' + windowItem.earlyRiskEnd + '岁</li>';
  modalHtml += '<li class="flex items-start gap-2"><span class="text-sky-500">•</span> 提前高代价期：' + windowItem.earlyRiskEnd + '-' + windowItem.goldStart + '岁</li>';
  modalHtml += '<li class="flex items-start gap-2"><span class="text-sky-500">•</span> 黄金执行期：' + windowItem.goldStart + '-' + windowItem.goldEnd + '岁</li>';
  modalHtml += '<li class="flex items-start gap-2"><span class="text-sky-500">•</span> 滞后高代价期：' + windowItem.goldEnd + '-' + windowItem.lateRiskEnd + '岁</li>';
  modalHtml += '<li class="flex items-start gap-2"><span class="text-sky-500">•</span> 绝对不可逆关闭期：' + windowItem.closeAge + '岁后</li>';
  modalHtml += '</ul>';
  modalHtml += '</div>';
  modalHtml += '</div>';

  // 行动部分
  modalHtml += '<div class="modal-section hidden" data-section="actions">';
  modalHtml += '<div class="mb-6">';
  modalHtml += '<h4 class="font-semibold mb-4 text-gray-800">📋 行动建议</h4>';
  modalHtml += '<ul class="space-y-3">';
  windowItem.actionList.forEach((action) => {
    modalHtml += '<li class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">';
    modalHtml += '<span class="text-green-500 font-bold text-lg">✓</span>';
    modalHtml += '<span class="flex-1 text-base text-gray-700">' + action + '</span>';
    modalHtml += '</li>';
  });
  modalHtml += '</ul>';
  modalHtml += '</div>';

  if (currentAdvice) {
    modalHtml += '<div class="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-lg">';
    modalHtml += currentAdvice;
    modalHtml += '</div>';
  }
  modalHtml += '</div>';
  modalHtml += '</div>';

  modalContent.innerHTML = modalHtml;
  modalMask.classList.remove("hidden");
  modalMask.classList.add("flex");

  // 绑定标签页事件
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('tab-active'));
      document.querySelectorAll('.modal-section').forEach(s => s.classList.add('hidden'));
      tab.classList.add('tab-active');
      document.querySelector('[data-section="' + tab.dataset.tab + '"]').classList.remove('hidden');
    });
  });

  // 绑定关闭按钮事件
  document.querySelector('.close-btn').addEventListener("click", closeModal);
}

// 关闭弹窗
function closeModal() {
  modalMask.classList.remove("flex");
  modalMask.classList.add("hidden");
}

// 点击弹窗遮罩关闭
modalMask.addEventListener("click", (e) => {
  if (e.target === modalMask) {
    closeModal();
  }
});

// 统一更新函数
function updateAll() {
  renderRadar();
  renderTimeline();
  renderCards();
  renderNetwork();
}

// 初始化应用（数据加载后调用）
function initApp() {
  // 滑块事件绑定
  ageSlider.addEventListener("input", (e) => {
    currentAge = parseInt(e.target.value);
    ageDisplay.textContent = currentAge;
    updateAll();
  });

  // 快捷跳转事件
  document.querySelectorAll('.quick-jump').forEach(jump => {
    jump.addEventListener('click', () => {
      document.querySelectorAll('.quick-jump').forEach(j => { j.classList.remove('active', 'btn-primary'); j.classList.add('btn-ghost'); });
      jump.classList.add('active', 'btn-primary');
      jump.classList.remove('btn-ghost');
      currentAge = parseInt(jump.dataset.age);
      ageSlider.value = currentAge;
      ageDisplay.textContent = currentAge;
      updateAll();
    });
  });

  // 筛选按钮事件绑定
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const filterType = btn.dataset.filter;
      const statusType = btn.dataset.status;

      if (filterType) {
        document.querySelectorAll('.filter-btn[data-filter]').forEach(b => {
          b.classList.remove('btn-primary');
          b.classList.add('btn-ghost');
        });
        btn.classList.remove('btn-ghost');
        btn.classList.add('btn-primary');
        currentFilter = filterType;
      } else if (statusType) {
        document.querySelectorAll('.filter-btn[data-status]').forEach(b => {
          b.classList.remove('btn-primary');
          b.classList.add('btn-outline');
        });
        if (currentStatusFilter === statusType) {
          currentStatusFilter = 'all';
        } else {
          btn.classList.remove('btn-outline');
          btn.classList.add('btn-primary');
          currentStatusFilter = statusType;
        }
      }

      renderCards();
    });
  });

  // 初始化渲染
  updateAll();
  initOnboarding();

  console.log('🚀 人生时间窗口导航系统已启动');
}

// 数据已通过 script 标签加载，直接初始化
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
    dots.forEach((d, i) => d.classList.toggle('bg-sky-500', i === step));
    dots.forEach((d, i) => d.classList.toggle('bg-gray-200', i !== step));
    nextBtn.textContent = step === steps.length - 1 ? '开始使用' : '下一步';
  }
  nextBtn.addEventListener('click', () => { if (step < steps.length - 1) { step++; update(); } else { close(); } });
  skipBtn.addEventListener('click', close);
}

// 渲染网状图
function renderNetwork() {
  const svg = document.getElementById('networkGraph');
  if (!svg) return;
  const W = svg.clientWidth || 800;
  const H = 420;

  const nodeColors = { gold: '#0ea5e9', warning: '#f59e0b', early: '#eab308', risk: '#ef4444', close: '#9ca3af' };
  const catColors = { health: '#f43f5e', career: '#8b5cf6', finance: '#10b981', relation: '#ec4899', spirit: '#6366f1', risk: '#f97316' };

  const nodes = windowData.map(w => {
    const s = getWindowStatus(w, currentAge);
    return { id: w.id, title: w.title, category: w.category, status: s.status, r: Math.max(6, Math.min(18, w.lockForce / 6)) };
  });

  // edges: same category
  const edges = [];
  for (let i = 0; i < windowData.length; i++) {
    for (let j = i + 1; j < windowData.length; j++) {
      if (windowData[i].category === windowData[j].category) {
        edges.push({ source: windowData[i].id, target: windowData[j].id });
      }
    }
  }

  d3.select(svg).selectAll('*').remove();
  const s = d3.select(svg).attr('viewBox', '0 0 ' + W + ' ' + H);

  const sim = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(edges).id(d => d.id).distance(60).strength(0.3))
    .force('charge', d3.forceManyBody().strength(-80))
    .force('center', d3.forceCenter(W / 2, H / 2))
    .force('collision', d3.forceCollide(d => d.r + 4));

  const link = s.append('g').selectAll('line').data(edges).enter().append('line')
    .attr('stroke', '#e5e7eb').attr('stroke-width', 1).attr('opacity', 0.6);

  const node = s.append('g').selectAll('circle').data(nodes).enter().append('circle')
    .attr('r', d => d.r)
    .attr('fill', d => nodeColors[d.status] || '#9ca3af')
    .attr('stroke', d => catColors[d.category] || '#ccc')
    .attr('stroke-width', 2)
    .attr('cursor', 'pointer')
    .on('click', (e, d) => openModal(d.id))
    .on('mouseover', function(e, d) {
      d3.select(this).attr('r', d.r + 3);
      tooltip.style('opacity', 1).html(d.title).style('left', (e.offsetX + 10) + 'px').style('top', (e.offsetY - 20) + 'px');
    })
    .on('mouseout', function(e, d) {
      d3.select(this).attr('r', d.r);
      tooltip.style('opacity', 0);
    })
    .call(d3.drag()
      .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
      .on('end', (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }));

  const tooltip = d3.select(svg.parentElement).append('div')
    .style('position', 'absolute').style('background', 'rgba(0,0,0,0.75)').style('color', '#fff')
    .style('padding', '4px 8px').style('border-radius', '6px').style('font-size', '12px')
    .style('pointer-events', 'none').style('opacity', 0).style('z-index', 10);

  sim.on('tick', () => {
    link.attr('x1', d => d.source.x).attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
    node.attr('cx', d => Math.max(d.r, Math.min(W - d.r, d.x)))
        .attr('cy', d => Math.max(d.r, Math.min(H - d.r, d.y)));
  });
}
