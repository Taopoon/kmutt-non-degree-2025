(function(){
  const profileBtn = document.getElementById('btnProfile');
  const dropdown = document.getElementById('profileDropdown');
  
  // simple page switcher
  document.querySelectorAll('.nav-item').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.getAttribute('data-page');
      document.querySelectorAll('.nav-item').forEach(l=>l.classList.remove('active'));
      link.classList.add('active');
      // toggle sections
      const showDashboard = page === 'dashboard';
      document.getElementById('dashboard').style.display = showDashboard ? 'grid' : 'none';
      const history = document.getElementById('history');
      if (history) {
        const showHistory = page === 'history';
        history.style.display = showHistory ? 'block' : 'none';
        if (showHistory) {
          setHistoryDefaults();
          plotHistory();
        }
      }
    });
  });

  const pumpImg = document.getElementById('pumpImage');

  // Simple role toggle to demo admin-only item
  let isAdmin = true;
  document.querySelectorAll('.admin-only').forEach(el => { el.style.display = isAdmin ? 'flex' : 'none'; });

  profileBtn?.addEventListener('click', () => {
    const isOpen = dropdown.classList.contains('open');
    dropdown.classList.toggle('open', !isOpen);
    profileBtn.setAttribute('aria-expanded', String(!isOpen));
  });
  window.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target) && !profileBtn.contains(e.target)) {
      dropdown.classList.remove('open');
      profileBtn.setAttribute('aria-expanded', 'false');
    }
  });

  // Simulated live data source
  const state = {
    status: 'STOP',
    vavg: 0,
    iavg: 0,
    power: 0,
    totalPower: 0,
    flow: 0,
    speed: 0,
    vibration: 0,
    runHour: 0,
    totalFlow: 0,
    V1: 0, V2: 0, V3: 0,
    I1: 0, I2: 0, I3: 0,
    U1Temp: 0, V1Temp: 0, W1Temp: 0,
    U2Temp: 0, V2Temp: 0, W2Temp: 0,
    BearingFrontTemp: 0, BearingBackTemp: 0, ThrustBearingTemp: 0
  };

  function randomBetween(min, max) { return Math.random() * (max - min) + min; }

  function updatePumpStateVisual() {
    const root = document.body;
    root.classList.remove('pump-state-run','pump-state-stop','pump-state-fault');
    const key = state.status === 'RUN' ? 'run' : state.status === 'FAULT' ? 'fault' : 'stop';
    root.classList.add(`pump-state-${key}`);
    // status pill removed; status value displays under image

    // swap image by status
    if (pumpImg) {
      if (state.status === 'RUN') pumpImg.src = 'assets/img/pump-run.png';
      else if (state.status === 'FAULT') pumpImg.src = 'assets/img/pump-fault.png';
      else pumpImg.src = 'assets/img/pump-stop.png';
      pumpImg.alt = `Submersible Pump (${state.status})`;
    }
  }

  function renderDataValues() {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('valStatus', state.status);
    set('valVavg', state.vavg.toFixed(0));
    set('valIavg', state.iavg.toFixed(1));
    set('valPower', state.power.toFixed(2));
    set('valTotalPower', state.totalPower.toFixed(1));
    set('valFlow', state.flow.toFixed(1));
    set('valSpeed', state.speed.toFixed(0));
    set('valVibration', state.vibration.toFixed(2));
    set('valRunHour', state.runHour.toFixed(1));
    set('valTotalFlow', state.totalFlow.toFixed(1));
    set('kpiTotalFlow', `${state.totalFlow.toFixed(0)} m³`);
    set('kpiTotalPower', `${state.totalPower.toFixed(0)} kWh`);
    set('kpiRunHour', `${state.runHour.toFixed(1)} hr`);
    set('valU1Temp', state.U1Temp.toFixed(1));
    set('valV1Temp', state.V1Temp.toFixed(1));
    set('valW1Temp', state.W1Temp.toFixed(1));
    set('valU2Temp', state.U2Temp.toFixed(1));
    set('valV2Temp', state.V2Temp.toFixed(1));
    set('valW2Temp', state.W2Temp.toFixed(1));
    set('valBearingFrontTemp', state.BearingFrontTemp.toFixed(1));
    set('valBearingBackTemp', state.BearingBackTemp.toFixed(1));
    set('valThrustBearingTemp', state.ThrustBearingTemp.toFixed(1));
  }

  // Gauges
  function drawGauge(canvas, value, min, max, color) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const cx = w/2, cy = h/2, r = Math.min(w,h)/2 - 12;
    ctx.clearRect(0,0,w,h);

    // outer ring
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI, 2*Math.PI);
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#e5e7eb';
    ctx.stroke();

    // pointer arc
    const pct = Math.max(0, Math.min(1, (value - min)/(max - min)));
    const end = Math.PI + pct * Math.PI;
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI, end);
    ctx.strokeStyle = color;
    ctx.stroke();

    // ticks
    ctx.save();
    ctx.translate(cx, cy);
    for (let i=0;i<=10;i++){
      const a = Math.PI + i * (Math.PI/10);
      const x1 = Math.cos(a) * (r - 2);
      const y1 = Math.sin(a) * (r - 2);
      const x2 = Math.cos(a) * (r - 10);
      const y2 = Math.sin(a) * (r - 10);
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2);
      ctx.lineWidth = 2; ctx.strokeStyle = '#cbd5e1'; ctx.stroke();
    }
    ctx.restore();

    // value text
    ctx.fillStyle = '#111827';
    ctx.font = '600 18px Inter, system-ui, -apple-system';
    ctx.textAlign = 'center';
    ctx.fillText(value.toFixed(0), cx, cy + 24);
  }

  const gauges = {
    V1: document.getElementById('gaugeV1'),
    V2: document.getElementById('gaugeV2'),
    V3: document.getElementById('gaugeV3'),
    I1: document.getElementById('gaugeI1'),
    I2: document.getElementById('gaugeI2'),
    I3: document.getElementById('gaugeI3'),
  };

  // Charts
  const charts = {};
  function createChart(canvasId, label, color){
    const ctx = document.getElementById(canvasId).getContext('2d');
    const gradient = ctx.createLinearGradient(0,0,0,200);
    gradient.addColorStop(0, color + 'cc');
    gradient.addColorStop(1, color + '10');
    return new Chart(ctx, {
      type: 'line',
      data: { labels: [], datasets: [{ label, data: [], borderColor: color, backgroundColor: gradient, tension: 0.25, fill: true, borderWidth: 2, pointRadius: 0 }] },
      options: {
        animation: false,
        responsive: true,
        scales: {
          x: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#6b7280', maxRotation: 0 } },
          y: { grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { color: '#6b7280' } }
        },
        plugins: { legend: { display: false } },
        interaction: { mode: 'nearest', intersect: false }
      }
    });
  }

  charts.power = createChart('chartPower', 'Power', '#2563eb');
  charts.vavg  = createChart('chartVavg', 'Vavg', '#16a34a');
  charts.iavg  = createChart('chartIavg', 'Iavg', '#f59e0b');
  charts.flow  = createChart('chartFlow', 'Flow', '#ef4444');
  // history chart instance
  let historyChart;

  function toInputLocal(dt){
    const pad = (n)=> String(n).padStart(2,'0');
    return `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
  }

  function setHistoryDefaults(){
    const metricEl = document.getElementById('historyMetric');
    const startEl = document.getElementById('historyStart');
    const endEl = document.getElementById('historyEnd');
    if (metricEl) metricEl.value = 'power';
    const end = new Date();
    const start = new Date(end.getTime() - 24*60*60*1000);
    if (startEl) startEl.value = toInputLocal(start);
    if (endEl) endEl.value = toInputLocal(end);
  }

  function pushChart(chart, val){
    const now = new Date();
    const ts = now.toLocaleTimeString([], {hour12:false, hour:'2-digit', minute:'2-digit', second:'2-digit'});
    const data = chart.data.datasets[0].data;
    chart.data.labels.push(ts);
    data.push(val);
    if (data.length > 30) { chart.data.labels.shift(); data.shift(); }
    chart.update();
  }

  // Map
  function initMap(){
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;
    // Bangkok, Thailand coordinates
    const lat = 13.7563, lon = 100.5018;
    const map = L.map('map', { zoomControl: true }).setView([lat, lon], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);
    const marker = L.marker([lat, lon]).addTo(map);
    marker.bindPopup('Pump #1 — Bangkok, TH');
  }
  initMap();

  // Historical page logic: generate pseudo historical data from in-memory samples
  const ringBuffer = [];
  function recordSample(){
    const t = Date.now();
    ringBuffer.push({
      t,
      power: state.power,
      vavg: state.vavg,
      iavg: state.iavg,
      flow: state.flow,
      U1Temp: state.U1Temp, V1Temp: state.V1Temp, W1Temp: state.W1Temp,
      U2Temp: state.U2Temp, V2Temp: state.V2Temp, W2Temp: state.W2Temp,
      BearingFrontTemp: state.BearingFrontTemp, BearingBackTemp: state.BearingBackTemp, ThrustBearingTemp: state.ThrustBearingTemp
    });
    if (ringBuffer.length > 3600) ringBuffer.shift(); // keep up to ~10h at 10s/sample
  }

  function formatTime(ts){
    const d = new Date(ts);
    return d.toLocaleString();
  }

  function plotHistory(){
    const metric = document.getElementById('historyMetric').value;
    const startVal = document.getElementById('historyStart').value;
    const endVal = document.getElementById('historyEnd').value;
    const startTs = startVal ? new Date(startVal).getTime() : Date.now() - 24*3600_000; // default last 24h
    const endTs = endVal ? new Date(endVal).getTime() : Date.now();
    const points = ringBuffer.filter(p => p.t >= startTs && p.t <= endTs);
    const labels = points.map(p => formatTime(p.t));
    const values = points.map(p => p[metric]);

    const ctxEl = document.getElementById('historyChart');
    if (!ctxEl) return;
    const ctx = ctxEl.getContext('2d');
    if (!historyChart){
      historyChart = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets: [{ data: values, borderColor: '#2563eb', backgroundColor: '#2563eb22', tension: 0.25, fill: true, pointRadius: 0 }] },
        options: { responsive: true, animation: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#6b7280' } }, y: { ticks: { color: '#6b7280' } } } }
      });
    } else {
      historyChart.data.labels = labels;
      historyChart.data.datasets[0].data = values;
      historyChart.update();
    }
  }

  function exportHistoryCsv(){
    const metric = document.getElementById('historyMetric').value;
    const startVal = document.getElementById('historyStart').value;
    const endVal = document.getElementById('historyEnd').value;
    const startTs = startVal ? new Date(startVal).getTime() : Date.now() - 3600_000;
    const endTs = endVal ? new Date(endVal).getTime() : Date.now();
    const points = ringBuffer.filter(p => p.t >= startTs && p.t <= endTs);
    let csv = 'timestamp,'+metric+'\n';
    for (const p of points){
      csv += `${new Date(p.t).toISOString()},${p[metric]}\n`;
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `history_${metric}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // hook controls
  const btnRefresh = document.getElementById('historyRefresh');
  const btnExport = document.getElementById('historyExport');
  btnRefresh?.addEventListener('click', plotHistory);
  btnExport?.addEventListener('click', exportHistoryCsv);

  // initialize defaults (in case history becomes the first page shown somewhere)
  setHistoryDefaults();

  // Simulate live ticks
  function tick(){
    // choose status
    const r = Math.random();
    if (r < 0.80) state.status = 'RUN'; else if (r < 0.95) state.status = 'STOP'; else state.status = 'FAULT';

    // update measurements
    state.V1 = randomBetween(380, 420); state.V2 = randomBetween(380, 420); state.V3 = randomBetween(380, 420);
    state.I1 = randomBetween(20, 60); state.I2 = randomBetween(20, 60); state.I3 = randomBetween(20, 60);
    state.vavg = (state.V1 + state.V2 + state.V3) / 3;
    state.iavg = (state.I1 + state.I2 + state.I3) / 3;
    state.power = (state.vavg * state.iavg * Math.sqrt(3) * 0.85) / 1000; // kW approx
    state.flow = state.status === 'RUN' ? randomBetween(80, 120) : 0;
    state.speed = state.status === 'RUN' ? randomBetween(2800, 3000) : 0;
    state.vibration = state.status === 'RUN' ? randomBetween(0.1, 2.0) : randomBetween(0.0, 0.3);
    state.runHour += state.status === 'RUN' ? 1/360 : 0; // per 10s tick
    state.totalPower += state.power / 360; // kWh per 10s
    state.totalFlow += state.flow / 360; // m3 per 10s

    // temperatures (°C)
    const baseMotor = state.status === 'RUN' ? 55 : 30;
    const variance = state.status === 'RUN' ? 12 : 4;
    state.U1Temp = randomBetween(baseMotor-2, baseMotor+variance);
    state.V1Temp = randomBetween(baseMotor-2, baseMotor+variance);
    state.W1Temp = randomBetween(baseMotor-2, baseMotor+variance);
    state.U2Temp = randomBetween(baseMotor-2, baseMotor+variance);
    state.V2Temp = randomBetween(baseMotor-2, baseMotor+variance);
    state.W2Temp = randomBetween(baseMotor-2, baseMotor+variance);
    state.BearingFrontTemp = randomBetween(baseMotor-5, baseMotor+10);
    state.BearingBackTemp = randomBetween(baseMotor-6, baseMotor+9);
    state.ThrustBearingTemp = randomBetween(baseMotor-4, baseMotor+12);

    // visuals
    updatePumpStateVisual();
    renderDataValues();

    // gauges
    drawGauge(gauges.V1, state.V1, 300, 480, '#2563eb');
    drawGauge(gauges.V2, state.V2, 300, 480, '#2563eb');
    drawGauge(gauges.V3, state.V3, 300, 480, '#2563eb');
    drawGauge(gauges.I1, state.I1, 0, 100, '#16a34a');
    drawGauge(gauges.I2, state.I2, 0, 100, '#16a34a');
    drawGauge(gauges.I3, state.I3, 0, 100, '#16a34a');

    // charts
    pushChart(charts.power, state.power);
    pushChart(charts.vavg, state.vavg);
    pushChart(charts.iavg, state.iavg);
    pushChart(charts.flow, state.flow);
  }

  // initial
  updatePumpStateVisual();
  renderDataValues();
  tick();
  setInterval(tick, 10000);
  // record samples for history every tick, also after initial tick
  setInterval(recordSample, 10000);
  recordSample();
})();


