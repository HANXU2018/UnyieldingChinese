// 人生时间窗口导航系统 - 主应用逻辑

let currentAge = 30;
let currentFilter = 'all';
let currentStatusFilter = 'all';

const ageSlider = document.getElementById('ageSlider');
const ageDisplay = document.getElementById('ageDisplay');
const cardGrid = document.getElementById('cardGrid');
const modalMask = document.getElementById('modalMask');
const modalContent = document.getElementById('modalContent');
const goldNum = document.getElementById('goldNum');
const warningNum = document.getElementById('warningNum');
const closeNum = document.getElementById('closeNum');
const earlyNum = document.getElementById('earlyNum');
const radarGrid = document.getElementById('radarGrid');
const timelineTable = document.getElementById('timelineTable');
const lifeStage = document.getElementById('lifeStage');

function getWindowStatus(w, age) {
  if (age < w.earlyRiskEnd) return { status: 'early', label: '提前', color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' };
  if (age >= w.goldStart && age <= w.goldEnd) return { status: 'gold', label: '黄金', color: 'bg-sky-100 text-sky-700', dot: 'bg-sky-500' };
  if (age > w.goldEnd && age <= w.lateRiskEnd) return { status: 'warning', label: '预警', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' };
  if (age > w.lateRiskEnd && age <= w.closeAge) return { status: 'risk', label: '补救', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' };
  return { status: 'close', label: '关闭', color: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400' };
}

function costLabel(level) {
  const map = { Low: '低', Medium: '中', High: '高', Extreme: '极高' };
  return map[level] || level;
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

function renderRadar() {
  const dims = [
    { key: 'health', name: '健康', icon: '❤️' },
    { key: 'career', name: '职业', icon: '💼' },
    { key: 'finance', name: '财富', icon: '💰' },
    { key: 'relation', name: '家庭', icon: '💕' },
    { key: 'spirit', name: '成长', icon: '🧠' },
    { key: 'risk', name: '风险', icon: '🛡️' }
  ];
  let html = '';
  dims.forEach(function(d) {
    const ws = windowData.filter(function(w) { return w.category === d.key; });
    let done = 0;
    ws.forEach(function(w) {
      const s = getWindowStatus(w, currentAge).status;
      if (s === 'gold' || s === 'close') done++;
    });
    const pct = Math.round((done / ws.length) * 100) || 0;
    html += '<div class="text-center">';
    html += '<div class="h-12 flex items-end justify-center mb-1">';
    html += '<div class="w-3 bg-sky-500 rounded-t transition-all" style="height:' + pct + '%"></div>';
    html += '</div>';
    html += '<div class="text-xs font-bold text-sky-600">' + pct + '%</div>';
    html += '<div class="text-[10px] text-gray-400">' + d.name + '</div>';
    html += '</div>';
  });
  radarGrid.innerHTML = html;
  lifeStage.textContent = getLifeStage(currentAge);
}

function renderTimeline() {
  let html = '';
  const totalAge = 80;
  const markers = [0, 20, 40, 60, 80];

  const catLabels = { health: '健康', career: '职业', finance: '财富', relation: '家庭', spirit: '成长', risk: '风险' };
  const catColors = { health: 'bg-rose-50 text-rose-600', career: 'bg-violet-50 text-violet-600', finance: 'bg-emerald-50 text-emerald-600', relation: 'bg-pink-50 text-pink-600', spirit: 'bg-indigo-50 text-indigo-600', risk: 'bg-orange-50 text-orange-600' };

  let data = windowData;

  if (currentFilter !== 'all') {
    data = data.filter(function(w) { return w.category === currentFilter; });
  }

  const statusOrder = { gold: 1, warning: 2, early: 3, risk: 4, close: 5 };

  data = data.slice().sort(function(a, b) {
    const sa = getWindowStatus(a, currentAge).status;
    const sb = getWindowStatus(b, currentAge).status;
    const oa = (statusOrder[sa] || 9);
    const ob = (statusOrder[sb] || 9);
    if (oa !== ob) return oa - ob;
    return a.goldStart - b.goldStart;
  });

  data.forEach(function(w) {
    const s = getWindowStatus(w, currentAge);

    let barHtml = '';
    markers.forEach(function(m, i) {
      const isStart = m >= w.goldStart && m <= w.goldEnd;
      barHtml += '<td class="border-r border-gray-100 py-1 px-1 text-center">';
      if (isStart) barHtml += '<div class="w-2 h-2 mx-auto rounded-full ' + s.dot + '"></div>';
      barHtml += '</td>';
    });

    html += '<tr class="border-b border-gray-50 hover:bg-sky-50 cursor-pointer" data-id="' + w.id + '">';
    html += '<td class="py-2 px-2 text-left w-32">';
    html += '<div class="truncate max-w-[120px]" title="' + w.title + '">' + w.title + '</div>';
    html += '</td>';
    html += '<td class="py-2 px-1 text-center">';
    html += '<span class="px-1.5 py-0.5 rounded text-[10px] font-medium ' + (catColors[w.category] || 'bg-gray-100 text-gray-600') + '">' + (catLabels[w.category] || '其他') + '</span>';
    html += '</td>';
    html += barHtml;
    html += '<td class="py-2 px-2 text-center">';
    html += '<span class="px-2 py-1 rounded text-xs font-medium ' + s.color + '">' + s.label + '</span>';
    html += '</td>';
    html += '</tr>';
  });
  timelineTable.innerHTML = html;

  document.querySelectorAll('#timelineTable tr').forEach(function(tr) {
    tr.addEventListener('click', function() { openModal(tr.dataset.id); });
  });
}

function renderCards() {
  let data = windowData;

  if (currentFilter !== 'all') {
    data = data.filter(function(w) { return w.category === currentFilter; });
  }
  if (currentStatusFilter !== 'all') {
    data = data.filter(function(w) {
      const s = getWindowStatus(w, currentAge);
      if (currentStatusFilter === 'warning') return s.status === 'warning' || s.status === 'risk';
      return s.status === currentStatusFilter;
    });
  }

  const order = { gold: 1, warning: 2, early: 3, risk: 4, close: 5 };
  data = data.slice().sort(function(a, b) {
    return (order[getWindowStatus(a, currentAge).status] || 9) - (order[getWindowStatus(b, currentAge).status] || 9);
  });

  let gc = 0, wc = 0, ec = 0, cc = 0;
  windowData.forEach(function(w) {
    const s = getWindowStatus(w, currentAge).status;
    if (s === 'gold') gc++;
    else if (s === 'warning' || s === 'risk') wc++;
    else if (s === 'early') ec++;
    else if (s === 'close') cc++;
  });
  goldNum.textContent = gc;
  warningNum.textContent = wc;
  earlyNum.textContent = ec;
  closeNum.textContent = cc;

  const icons = { health: '❤️', career: '💼', finance: '💰', relation: '💕', spirit: '🧠', risk: '🛡️' };
  const borders = { gold: 'border-sky-400', warning: 'border-amber-400', early: 'border-yellow-400', risk: 'border-red-400', close: 'border-gray-300' };

  let html = '';
  data.forEach(function(w) {
    const s = getWindowStatus(w, currentAge);
    html += '<div class="bg-white rounded-lg p-3 shadow-sm hover:shadow-md cursor-pointer border-l-4 ' + borders[s.status] + ' transition-shadow" data-id="' + w.id + '">';
    html += '<div class="flex items-center gap-2 mb-2">';
    html += '<span class="text-lg">' + (icons[w.category] || '📋') + '</span>';
    html += '<span class="px-2 py-0.5 rounded text-[10px] font-medium ' + s.color + '">' + s.label + '</span>';
    html += '</div>';
    html += '<div class="text-xs font-medium text-gray-800 truncate mb-1" title="' + w.title + '">' + w.title + '</div>';
    html += '<div class="text-[10px] text-gray-500 line-clamp-2 mb-2">' + w.desc + '</div>';
    html += '<div class="flex justify-between items-center text-[10px] text-gray-400">';
    html += '<span>🔒' + w.lockForce + '%</span>';
    html += '<span>⚠️' + costLabel(w.lateCost) + '</span>';
    html += '</div>';
    html += '</div>';
  });
  cardGrid.innerHTML = html;

  document.querySelectorAll('#cardGrid > div').forEach(function(card) {
    card.addEventListener('click', function() { openModal(card.dataset.id); });
  });
}

function openModal(id) {
  const w = windowData.find(function(x) { return x.id == id; });
  if (!w) return;

  const s = getWindowStatus(w, currentAge);
  const totalAge = Math.max(w.closeAge + 5, 80);
  const goldLeft = (w.goldStart / totalAge * 100).toFixed(1);
  const goldWidth = ((w.goldEnd - w.goldStart) / totalAge * 100).toFixed(1);
  const currentLeft = (currentAge / totalAge * 100).toFixed(1);

  const advice = {
    gold: '当前处于黄金执行期，现在行动ROI最高，优先投入资源。',
    warning: '窗口即将关闭，剩余时间有限，尽快启动补救行动。',
    risk: '已进入高代价补救期，行动成本上升，但仍有机会，不要放弃。',
    early: '尚未到最优执行期，提前行动有代价，建议先了解、做准备，不要盲目投入。',
    close: '窗口已关闭，此项基本不可逆，接受现状，聚焦仍开放的窗口。'
  }[s.status] || '';

  const icons = { health: '❤️', career: '💼', finance: '💰', relation: '💕', spirit: '🧠', risk: '🛡️' };

  let html = '';
  html += '<div class="flex justify-between items-center p-4 border-b border-gray-100">';
  html += '<div class="flex-1">';
  html += '<div class="flex items-center gap-2 mb-1">';
  html += '<span class="text-2xl">' + (icons[w.category] || '📋') + '</span>';
  html += '<span class="px-2 py-1 rounded text-xs font-medium ' + s.color + '">' + s.label + '</span>';
  html += '</div>';
  html += '<h2 class="text-lg font-bold text-gray-800">' + w.title + '</h2>';
  html += '</div>';
  html += '<button class="text-2xl text-gray-400 hover:text-gray-600 close-btn">×</button>';
  html += '</div>';

  html += '<div class="tabs tabs-boxed px-4 pt-3">';
  html += '<a class="tab tab-active text-sm" data-tab="overview">概览</a>';
  html += '<a class="tab text-sm" data-tab="actions">行动建议</a>';
  html += '</div>';

  html += '<div class="flex-1 overflow-y-auto">';

  html += '<div class="modal-section p-4" data-section="overview">';
  if (advice) {
    html += '<div class="mb-4 p-3 bg-green-50 border-l-4 border-green-500 rounded text-sm text-green-800">' + advice + '</div>';
  }
  html += '<div class="mb-4 p-3 bg-gray-50 rounded-lg">';
  html += '<h4 class="text-sm font-semibold text-gray-800 mb-2">时间窗口</h4>';
  html += '<div class="h-8 bg-gray-200 rounded relative mb-3">';
  html += '<div class="absolute top-1/2 -translate-y-1/2 h-4 bg-sky-500 rounded" style="left:' + goldLeft + '%;width:' + goldWidth + '%"></div>';
  html += '<div class="absolute top-0 w-0.5 h-8 bg-red-500" style="left:' + currentLeft + '%"></div>';
  html += '</div>';
  html += '<div class="grid grid-cols-3 gap-2 text-xs text-center">';
  html += '<div class="bg-white p-2 rounded"><div class="text-gray-500">开启</div><div class="font-bold">' + w.goldStart + '岁</div></div>';
  html += '<div class="bg-white p-2 rounded"><div class="text-gray-500">黄金期</div><div class="font-bold">' + w.goldStart + '-' + w.goldEnd + '岁</div></div>';
  html += '<div class="bg-white p-2 rounded"><div class="text-gray-500">关闭</div><div class="font-bold">' + w.closeAge + '岁</div></div>';
  html += '</div>';
  html += '</div>';

  html += '<div class="grid grid-cols-2 gap-3 mb-4">';
  html += '<div class="p-3 bg-yellow-50 rounded-lg border border-yellow-200">';
  html += '<h5 class="text-xs font-medium text-gray-700 mb-1">提前代价</h5>';
  html += '<div class="text-xl font-bold text-yellow-600">' + costLabel(w.earlyCost) + '</div>';
  html += '<div class="text-xs text-gray-500">' + w.earlyCostDesc + '</div>';
  html += '</div>';
  html += '<div class="p-3 bg-red-50 rounded-lg border border-red-200">';
  html += '<h5 class="text-xs font-medium text-gray-700 mb-1">滞后代价</h5>';
  html += '<div class="text-xl font-bold text-red-600">' + costLabel(w.lateCost) + '</div>';
  html += '<div class="text-xs text-gray-500">' + w.lateCostDesc + '</div>';
  html += '</div>';
  html += '</div>';

  html += '<div class="grid grid-cols-3 gap-3 mb-4">';
  html += '<div class="p-3 bg-sky-50 rounded-lg text-center border border-sky-200">';
  html += '<div class="text-2xl font-bold text-sky-600">' + w.lockForce + '%</div>';
  html += '<div class="text-xs text-gray-500 mt-1">锁死强制力</div>';
  html += '</div>';
  html += '<div class="p-3 bg-purple-50 rounded-lg text-center border border-purple-200">';
  html += '<div class="text-lg font-bold text-purple-600">' + w.categoryName + '</div>';
  html += '<div class="text-xs text-gray-500 mt-1">维度</div>';
  html += '</div>';
  html += '<div class="p-3 bg-white rounded-lg">';
  html += '<h5 class="text-xs font-medium text-gray-700 mb-2">关键数据</h5>';
  html += '<div class="text-xs text-gray-600 space-y-1">';
  html += '<div>禁忌期: 0-' + w.earlyRiskEnd + '岁</div>';
  html += '<div>黄金期: ' + w.goldStart + '-' + w.goldEnd + '岁</div>';
  html += '<div>补救期: ' + w.goldEnd + '-' + w.lateRiskEnd + '岁</div>';
  html += '<div>关闭: ' + w.closeAge + '岁后</div>';
  html += '</div>';
  html += '</div>';
  html += '</div>';

  html += '<div class="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm">';
  html += '<div class="font-semibold text-gray-800 mb-1">📚 科学依据</div>';
  html += '<div class="text-gray-600">' + w.source + '</div>';
  html += '</div>';

  html += '</div>';

  html += '<div class="modal-section hidden p-4" data-section="actions">';
  html += '<h4 class="text-sm font-semibold text-gray-800 mb-3">📋 行动建议</h4>';
  html += '<ul class="space-y-2">';
  w.actionList.forEach(function(a) {
    html += '<li class="flex items-start gap-2 p-2 bg-gray-50 rounded text-sm">';
    html += '<span class="text-green-500 font-bold">✓</span>';
    html += '<span>' + a + '</span>';
    html += '</li>';
  });
  html += '</ul>';
  if (advice) {
    html += '<div class="mt-4 p-3 bg-amber-50 border-l-4 border-amber-500 rounded text-sm text-amber-800">' + advice + '</div>';
  }
  html += '</div>';

  html += '</div>';

  modalContent.innerHTML = html;
  modalMask.classList.remove('hidden');
  modalMask.classList.add('flex');

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

function updateAll() {
  renderRadar();
  renderTimeline();
  renderCards();
}

function initApp() {
  ageSlider.addEventListener('input', function(e) {
    currentAge = parseInt(e.target.value);
    ageDisplay.textContent = currentAge;
    updateAll();
  });

  document.querySelectorAll('.quick-jump').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.quick-jump').forEach(function(b) {
        b.classList.remove('active', 'btn-primary');
        b.classList.add('btn-ghost');
      });
      btn.classList.add('active', 'btn-primary');
      btn.classList.remove('btn-ghost');
      currentAge = parseInt(btn.dataset.age);
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
          b.classList.remove('btn-primary');
          b.classList.add('btn-ghost');
        });
        btn.classList.remove('btn-ghost');
        btn.classList.add('btn-primary');
        currentFilter = filterType;
      } else if (statusType) {
        document.querySelectorAll('.filter-btn[data-status]').forEach(function(b) {
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

  updateAll();
  initOnboarding();
  console.log('人生时间窗口导航系统已启动');
}

document.addEventListener('DOMContentLoaded', initApp);

function initOnboarding() {
  const steps = [
    { icon: '👋', title: '欢迎使用人生时间窗口', desc: '40个关键人生窗口，帮你找到每件事的最优时机' },
    { icon: '🎚️', title: '顶部年龄滑块', desc: '滑块固定在顶部，随时拖动查看不同年龄的窗口状态' },
    { icon: '📊', title: '查看表格和卡片', desc: '时间轴表格和卡片列表，点击查看详情和行动建议' }
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
  nextBtn.addEventListener('click', function() {
    if (step < steps.length - 1) { step++; update(); } else { close(); }
  });
  skipBtn.addEventListener('click', close);
}
