// 人生时间窗口导航系统 - 重新设计，围绕核心关注点

let currentAge = 30;
let currentView = 'gold';
let networkSim = null;

const ageSlider = document.getElementById('ageSlider');
const ageDisplay = document.getElementById('ageDisplay');
const modalMask = document.getElementById('modalMask');
const modalContent = document.getElementById('modalContent');
const goldCards = document.getElementById('goldCards');
const warningCards = document.getElementById('warningCards');
const earlyCards = document.getElementById('earlyCards');
const closeCards = document.getElementById('closeCards');
const goldCount = document.getElementById('goldCount');
const warningCount = document.getElementById('warningCount');
const earlyCount = document.getElementById('earlyCount');
const closeCount = document.getElementById('closeCount');
const radarGrid = document.getElementById('radarGrid');

function getWindowStatus(w, age) {
  if (age < w.earlyRiskEnd) return { status: 'early', label: '即将开启', color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-400', border: 'border-purple-400' };
  if (age >= w.goldStart && age <= w.goldEnd) return { status: 'gold', label: '黄金期', color: 'bg-sky-100 text-sky-700', dot: 'bg-sky-500', border: 'border-sky-500' };
  if (age > w.goldEnd && age <= w.lateRiskEnd) return { status: 'warning', label: '即将关闭', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', border: 'border-amber-500' };
  if (age > w.lateRiskEnd && age <= w.closeAge) return { status: 'risk', label: '高代价补救', color: 'bg-red-100 text-red-700', dot: 'bg-red-500', border: 'border-red-500' };
  return { status: 'close', label: '已关闭', color: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400', border: 'border-gray-300' };
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

function renderCard(w) {
  const s = getWindowStatus(w, currentAge);
  const catIcons = { health: '❤️', career: '💼', finance: '💰', relation: '💕', spirit: '🧠', risk: '🛡️' };
  const catLabels = { health: '健康', career: '职业', finance: '财富', relation: '家庭', spirit: '成长', risk: '风险' };

  let html = '';
  html += '<div class="bg-white rounded-xl p-4 shadow-sm hover:shadow-md cursor-pointer border-l-4 ' + s.border + ' transition-all" data-id="' + w.id + '">';
  html += '<div class="flex items-center justify-between mb-3">';
  html += '<div class="flex items-center gap-2">';
  html += '<span class="text-xl">' + (catIcons[w.category] || '📋') + '</span>';
  html += '<span class="px-2 py-0.5 rounded text-xs font-medium ' + s.color + '">' + s.label + '</span>';
  html += '</div>';
  html += '<span class="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">' + w.goldStart + '-' + w.goldEnd + '岁</span>';
  html += '</div>';
  html += '<h3 class="text-base font-semibold text-gray-800 mb-2 truncate">' + w.title + '</h3>';
  html += '<p class="text-sm text-gray-500 line-clamp-2">' + w.desc + '</p>';
  html += '</div>';
  return html;
}

function renderAllCards() {
  const gold = windowData.filter(function(w) {
    const s = getWindowStatus(w, currentAge);
    return s.status === 'gold';
  }).sort(function(a, b) { return b.lockForce - a.lockForce; });

  const warning = windowData.filter(function(w) {
    const s = getWindowStatus(w, currentAge);
    return s.status === 'warning' || s.status === 'risk';
  }).sort(function(a, b) { return b.lockForce - a.lockForce; });

  const early = windowData.filter(function(w) {
    const s = getWindowStatus(w, currentAge);
    return s.status === 'early';
  }).sort(function(a, b) { return a.goldStart - b.goldStart; });

  const close = windowData.filter(function(w) {
    const s = getWindowStatus(w, currentAge);
    return s.status === 'close';
  }).sort(function(a, b) { return b.lockForce - a.lockForce; });

  goldCards.innerHTML = gold.map(renderCard).join('');
  warningCards.innerHTML = warning.map(renderCard).join('');
  earlyCards.innerHTML = early.map(renderCard).join('');
  closeCards.innerHTML = close.map(renderCard).join('');

  goldCount.textContent = '(' + gold.length + '个)';
  warningCount.textContent = '(' + warning.length + '个)';
  earlyCount.textContent = '(' + early.length + '个)';
  closeCount.textContent = '(' + close.length + '个)';

  document.querySelectorAll('[data-id]').forEach(function(el) {
    el.addEventListener('click', function() { openModal(el.dataset.id); });
  });
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
      const s = getWindowStatus(w, currentAge);
      if (s.status === 'gold' || s.status === 'close') done++;
    });
    const pct = Math.round((done / ws.length) * 100) || 0;
    const total = ws.length;

    html += '<div class="text-center">';
    html += '<div class="h-14 flex items-end justify-center mb-1">';
    html += '<div class="w-4 bg-sky-500 rounded-t transition-all" style="height:' + pct + '%"></div>';
    html += '</div>';
    html += '<div class="text-lg font-bold text-sky-600">' + pct + '%</div>';
    html += '<div class="text-xs text-gray-500">' + d.name + '</div>';
    html += '<div class="text-[10px] text-gray-400">' + done + '/' + total + '</div>';
    html += '</div>';
  });
  radarGrid.innerHTML = html;
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

  const catIcons = { health: '❤️', career: '💼', finance: '💰', relation: '💕', spirit: '🧠', risk: '🛡️' };
  const catLabels = { health: '健康', career: '职业', finance: '财富', relation: '家庭', spirit: '成长', risk: '风险' };

  let html = '';
  html += '<div class="flex justify-between items-center p-5 border-b border-gray-100">';
  html += '<div class="flex-1">';
  html += '<div class="flex items-center gap-3 mb-2">';
  html += '<span class="text-3xl">' + (catIcons[w.category] || '📋') + '</span>';
  html += '<span class="px-3 py-1.5 rounded-lg text-sm font-medium ' + s.color + '">' + s.label + '</span>';
  html += '<span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">' + catLabels[w.category] + '</span>';
  html += '</div>';
  html += '<h2 class="text-xl font-bold text-gray-800">' + w.title + '</h2>';
  html += '</div>';
  html += '<button class="text-3xl text-gray-400 hover:text-gray-600 close-btn">×</button>';
  html += '</div>';

  html += '<div class="tabs tabs-boxed px-5 pt-4">';
  html += '<a class="tab tab-active text-sm" data-tab="overview">概览</a>';
  html += '<a class="tab text-sm" data-tab="actions">行动建议</a>';
  html += '</div>';

  html += '<div class="flex-1 overflow-y-auto">';

  html += '<div class="modal-section p-5" data-section="overview">';
  if (advice) {
    html += '<div class="mb-5 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg text-sm text-green-800">' + advice + '</div>';
  }
  html += '<div class="mb-5 p-4 bg-gray-50 rounded-xl">';
  html += '<h4 class="text-sm font-semibold text-gray-800 mb-3">时间窗口周期</h4>';
  html += '<div class="h-10 bg-gray-200 rounded-lg relative mb-4">';
  html += '<div class="absolute top-1/2 -translate-y-1/2 h-5 bg-sky-500 rounded-lg" style="left:' + goldLeft + '%;width:' + goldWidth + '%"></div>';
  html += '<div class="absolute top-0 w-0.5 h-10 bg-red-500" style="left:' + currentLeft + '%"></div>';
  html += '</div>';
  html += '<div class="grid grid-cols-3 gap-3 text-center">';
  html += '<div class="bg-white p-3 rounded-lg"><div class="text-sm text-gray-500 mb-1">开启</div><div class="text-lg font-bold text-gray-800">' + w.goldStart + '岁</div></div>';
  html += '<div class="bg-white p-3 rounded-lg"><div class="text-sm text-gray-500 mb-1">黄金期</div><div class="text-lg font-bold text-sky-600">' + w.goldStart + '-' + w.goldEnd + '岁</div></div>';
  html += '<div class="bg-white p-3 rounded-lg"><div class="text-sm text-gray-500 mb-1">关闭</div><div class="text-lg font-bold text-gray-800">' + w.closeAge + '岁</div></div>';
  html += '</div>';
  html += '</div>';

  html += '<div class="grid grid-cols-2 gap-4 mb-5">';
  html += '<div class="p-4 bg-yellow-50 rounded-xl border border-yellow-200">';
  html += '<h5 class="text-sm font-medium text-gray-700 mb-2">提前代价</h5>';
  html += '<div class="text-3xl font-bold text-yellow-600 mb-1">' + costLabel(w.earlyCost) + '</div>';
  html += '<div class="text-sm text-gray-600">' + w.earlyCostDesc + '</div>';
  html += '</div>';
  html += '<div class="p-4 bg-red-50 rounded-xl border border-red-200">';
  html += '<h5 class="text-sm font-medium text-gray-700 mb-2">滞后代价</h5>';
  html += '<div class="text-3xl font-bold text-red-600 mb-1">' + costLabel(w.lateCost) + '</div>';
  html += '<div class="text-sm text-gray-600">' + w.lateCostDesc + '</div>';
  html += '</div>';
  html += '</div>';

  html += '<div class="grid grid-cols-3 gap-4 mb-5">';
  html += '<div class="p-4 bg-sky-50 rounded-xl text-center border border-sky-200">';
  html += '<div class="text-4xl font-bold text-sky-600 mb-1">' + w.lockForce + '%</div>';
  html += '<div class="text-sm text-gray-500">锁死强制力</div>';
  html += '</div>';
  html += '<div class="p-4 bg-purple-50 rounded-xl text-center border border-purple-200">';
  html += '<div class="text-xl font-bold text-purple-600 mb-1">' + catLabels[w.category] + '</div>';
  html += '<div class="text-sm text-gray-500">所属维度</div>';
  html += '</div>';
  html += '<div class="p-4 bg-white rounded-xl border border-gray-200">';
  html += '<h5 class="text-sm font-medium text-gray-700 mb-2">关键数据</h5>';
  html += '<div class="text-sm text-gray-600 space-y-1">';
  html += '<div>禁忌期: 0-' + w.earlyRiskEnd + '岁</div>';
  html += '<div>黄金期: ' + w.goldStart + '-' + w.goldEnd + '岁</div>';
  html += '<div>补救期: ' + w.goldEnd + '-' + w.lateRiskEnd + '岁</div>';
  html += '<div>关闭: ' + w.closeAge + '岁后</div>';
  html += '</div>';
  html += '</div>';
  html += '</div>';

  html += '<div class="p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm">';
  html += '<div class="font-semibold text-gray-800 mb-1">📚 科学依据</div>';
  html += '<div class="text-gray-600">' + w.source + '</div>';
  html += '</div>';

  html += '</div>';

  html += '<div class="modal-section hidden p-5" data-section="actions">';
  html += '<h4 class="text-sm font-semibold text-gray-800 mb-4">📋 行动建议</h4>';
  html += '<ul class="space-y-3">';
  w.actionList.forEach(function(a) {
    html += '<li class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg text-sm">';
    html += '<span class="text-green-500 font-bold text-lg">✓</span>';
    html += '<span class="flex-1">' + a + '</span>';
    html += '</li>';
  });
  html += '</ul>';
  if (advice) {
    html += '<div class="mt-5 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-lg text-sm text-amber-800">' + advice + '</div>';
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
  renderAllCards();
  renderRadar();
}

function initApp() {
  console.log('initApp() called');
  console.log('DOM elements check:');
  console.log('ageSlider:', ageSlider);
  console.log('ageDisplay:', ageDisplay);
  console.log('goldCards:', goldCards);
  console.log('warningCards:', warningCards);
  console.log('earlyCards:', earlyCards);
  console.log('windowData:', typeof windowData, windowData ? windowData.length : 'undefined');

  if (!ageSlider) {
    console.error('ageSlider not found!');
    return;
  }

  ageSlider.addEventListener('input', function(e) {
    currentAge = parseInt(e.target.value);
    ageDisplay.textContent = currentAge;
    updateAll();
  });

  document.querySelectorAll('.quick-jump').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.quick-jump').forEach(function(b) { b.classList.remove('active', 'btn-primary'); b.classList.add('btn-ghost'); });
      btn.classList.add('active', 'btn-primary');
      btn.classList.remove('btn-ghost');
      currentAge = parseInt(btn.dataset.age);
      ageSlider.value = currentAge;
      ageDisplay.textContent = currentAge;
      updateAll();
    });
  });

  document.querySelectorAll('.status-filter-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const status = btn.dataset.status;
      currentView = status;
      document.querySelectorAll('.status-filter-btn').forEach(function(b) {
        b.classList.remove('ring-2', 'ring-offset-1', 'ring-sky-300');
      });
      btn.classList.add('ring-2', 'ring-offset-1', 'ring-sky-300');
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
    { icon: '📊', title: '三大核心分区', desc: '黄金期(该做的事)、即将关闭(紧急)、即将开启(规划)，点击卡片查看详情' }
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
