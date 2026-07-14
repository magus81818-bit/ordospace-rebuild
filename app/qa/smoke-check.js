#!/usr/bin/env node
/* ============================================================
   [이 파일은] 스모크 테스트 — 실제 Chrome 브라우저를 띄워서 모든 화면이 뜨는지 확인.
                Chrome DevTools Protocol(CDP)을 사용하며 외부 패키지 없이 동작합니다.
   [언제 실행] npm run smoke (구조적 리팩터 전후에 반드시)
   [검증 항목]
     - 각 라우트(landing, auth, dashboard, project, approvals, admin-…, worker-…)로
       이동했을 때 화면 DOM 요소가 존재하고 내용이 채워지는가
   [작동 원리] Chrome을 headless로 실행 → CDP로 해시 이동 → DOM 쿼리 → 결과 판정.
   [수정할 때 주의] ROUTES 배열이 실제 라우트와 일치해야 함.
                    Chrome 경로가 OS마다 다르므로 자동 탐색 로직이 내장됨.
   ============================================================ */

const childProcess = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_URL = pathToFileURL(path.join(PROJECT_ROOT, 'index.html')).href;
const READY_TIMEOUT_MS = 20000;
const ROUTE_TIMEOUT_MS = 8000;

const ROUTES = [
  {
    name: 'landing',
    role: 'client',
    hash: 'landing',
    screenId: 'screen-landing',
    renderTarget: '#screen-landing [data-landing-header]',
  },
  {
    name: 'auth',
    role: 'client',
    hash: 'auth',
    screenId: 'screen-auth',
    renderTarget: '#authLoginForm',
  },
  {
    name: 'client dashboard',
    role: 'client',
    hash: 'dashboard',
    screenId: 'screen-dashboard',
    renderTarget: '#clientDashboardKpis',
  },
  {
    name: 'client project',
    role: 'client',
    hash: 'project',
    screenId: 'screen-project',
    renderTarget: '#clientProjectStepProgress',
  },
  {
    name: 'client approvals',
    role: 'client',
    hash: 'approvals',
    screenId: 'screen-approvals',
    renderTarget: '#clientApprovalDetail',
  },
  {
    name: 'admin home',
    role: 'admin',
    hash: 'admin-home',
    screenId: 'screen-admin-home',
    renderTarget: '#adminHomeKpis',
  },
  {
    name: 'admin cards',
    role: 'admin',
    hash: 'admin-cards',
    screenId: 'screen-admin-cards',
    renderTarget: '#adminCardDetail',
  },
  {
    name: 'admin projects',
    role: 'admin',
    hash: 'admin-projects',
    screenId: 'screen-admin-projects',
    renderTarget: '#adminProjectDetail',
  },
  {
    name: 'admin team',
    role: 'admin',
    hash: 'admin-team',
    screenId: 'screen-admin-team',
    renderTarget: '#adminTeamHeatmapKpis',
  },
  {
    name: 'admin audit',
    role: 'admin',
    hash: 'admin-audit',
    screenId: 'screen-admin-audit',
    renderTarget: '#auditTimeline',
  },
  {
    name: 'worker home',
    role: 'worker',
    hash: 'worker-home',
    screenId: 'screen-worker-home',
    renderTarget: '#workerHomeKpis',
  },
  {
    name: 'worker cards',
    role: 'worker',
    hash: 'worker-cards',
    screenId: 'screen-worker-cards',
    renderTarget: '#workerCardDetail',
  },
];

function parseArgs(argv) {
  const args = {
    url: DEFAULT_URL,
    chrome: '',
    keepOpen: false,
    lifecycleQa: false,
    runtimeQa: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--url') {
      args.url = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === '--chrome') {
      args.chrome = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === '--keep-open') {
      args.keepOpen = true;
      continue;
    }
    if (arg === '--runtime-qa') {
      args.runtimeQa = true;
      continue;
    }
    if (arg === '--lifecycle-qa') {
      args.lifecycleQa = true;
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!/^https?:\/\//.test(args.url) && !/^file:\/\//.test(args.url)) {
    throw new Error('--url must be an http(s) or file URL.');
  }

  return args;
}

function printHelp() {
  console.log([
    'ORDOSPACE smoke check',
    '',
    'Usage:',
    '  node app/qa/smoke-check.js',
    '  node app/qa/smoke-check.js --url https://ordospace-sprint5.vercel.app/',
    '',
    'Options:',
    '  --url <url>       Local file:// URL or deployed https:// URL.',
    '  --chrome <path>   Explicit Chrome/Edge executable path.',
    '  --keep-open       Leave the browser open for manual inspection.',
    '  --runtime-qa      Also run window.ORDO_QA.run() after route checks.',
    '  --lifecycle-qa    Also mutate a ModuleCard, reload, and verify persistence.',
  ].join('\n'));
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fileExists(filePath) {
  return !!filePath && fs.existsSync(filePath);
}

function findBrowser(explicitPath) {
  const candidates = [
    explicitPath,
    process.env.CHROME_PATH,
    process.env.EDGE_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/microsoft-edge',
  ].filter(Boolean);

  const found = candidates.find(fileExists);
  if (!found) {
    throw new Error('Chrome or Edge executable was not found. Pass --chrome <path>.');
  }
  return found;
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
  });
}

function httpJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method: options.method || 'GET' }, res => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => {
        body += chunk;
      });
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}: ${body.slice(0, 200)}`));
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    });
    req.once('error', reject);
    req.end();
  });
}

async function waitForBrowser(port) {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      await httpJson(`http://127.0.0.1:${port}/json/version`);
      return;
    } catch (error) {
      lastError = error;
      await sleep(200);
    }
  }
  throw new Error(`Browser debugging endpoint did not open: ${lastError?.message || 'timeout'}`);
}

async function waitForPageTarget(port) {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const list = await httpJson(`http://127.0.0.1:${port}/json/list`);
    const page = list.find(target => target.type === 'page' && target.webSocketDebuggerUrl);
    if (page) return page;
    await sleep(200);
  }
  throw new Error('No debuggable page target found.');
}

function launchBrowser(browserPath, port, userDataDir, targetUrl) {
  const args = [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    '--headless=new',
    '--disable-gpu',
    '--disable-background-networking',
    '--disable-default-apps',
    '--disable-extensions',
    '--disable-features=Translate,BackForwardCache',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1440,1200',
    targetUrl,
  ];

  return childProcess.spawn(browserPath, args, {
    stdio: ['ignore', 'ignore', 'pipe'],
    windowsHide: true,
  });
}

async function stopBrowser(browser, keepOpen) {
  if (keepOpen || !browser || browser.killed) return;
  browser.kill();
  await new Promise(resolve => {
    const timer = setTimeout(resolve, 2500);
    browser.once('exit', () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

async function removeTempDir(tempDir) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
      return;
    } catch (error) {
      await sleep(250);
    }
  }
}

class CdpSocket {
  constructor(wsUrl) {
    const parsed = new URL(wsUrl);
    this.host = parsed.hostname;
    this.port = Number(parsed.port);
    this.path = `${parsed.pathname}${parsed.search}`;
    this.nextId = 1;
    this.pending = new Map();
    this.handlers = new Map();
    this.buffer = Buffer.alloc(0);
    this.handshake = Buffer.alloc(0);
    this.connected = false;
    this.socket = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      const key = crypto.randomBytes(16).toString('base64');
      const headers = [
        `GET ${this.path} HTTP/1.1`,
        `Host: ${this.host}:${this.port}`,
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Key: ${key}`,
        'Sec-WebSocket-Version: 13',
        '',
        '',
      ].join('\r\n');

      this.socket = net.createConnection({ host: this.host, port: this.port }, () => {
        this.socket.write(headers);
      });

      this.socket.once('error', reject);
      this.socket.on('data', chunk => {
        if (!this.connected) {
          this.handshake = Buffer.concat([this.handshake, chunk]);
          const marker = this.handshake.indexOf('\r\n\r\n');
          if (marker === -1) return;
          const head = this.handshake.slice(0, marker).toString('utf8');
          if (!/^HTTP\/1\.1 101/.test(head)) {
            reject(new Error(`WebSocket handshake failed: ${head.split('\r\n')[0]}`));
            return;
          }
          this.connected = true;
          this.socket.removeListener('error', reject);
          resolve();
          const rest = this.handshake.slice(marker + 4);
          this.handshake = Buffer.alloc(0);
          if (rest.length) this._receive(rest);
          return;
        }
        this._receive(chunk);
      });

      this.socket.on('close', () => {
        for (const pending of this.pending.values()) {
          pending.reject(new Error('CDP socket closed.'));
        }
        this.pending.clear();
      });
    });
  }

  on(method, handler) {
    if (!this.handlers.has(method)) this.handlers.set(method, []);
    this.handlers.get(method).push(handler);
  }

  send(method, params = {}) {
    const id = this.nextId;
    this.nextId += 1;
    const payload = JSON.stringify({ id, method, params });
    this._sendFrame(0x1, Buffer.from(payload));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }

  close() {
    if (this.socket && !this.socket.destroyed) {
      this._sendFrame(0x8, Buffer.alloc(0));
      this.socket.end();
    }
  }

  _receive(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    while (this.buffer.length >= 2) {
      const first = this.buffer[0];
      const second = this.buffer[1];
      const opcode = first & 0x0f;
      const masked = (second & 0x80) !== 0;
      let length = second & 0x7f;
      let offset = 2;

      if (length === 126) {
        if (this.buffer.length < 4) return;
        length = this.buffer.readUInt16BE(2);
        offset = 4;
      } else if (length === 127) {
        if (this.buffer.length < 10) return;
        length = Number(this.buffer.readBigUInt64BE(2));
        offset = 10;
      }

      let mask = null;
      if (masked) {
        if (this.buffer.length < offset + 4) return;
        mask = this.buffer.slice(offset, offset + 4);
        offset += 4;
      }

      if (this.buffer.length < offset + length) return;
      let payload = this.buffer.slice(offset, offset + length);
      this.buffer = this.buffer.slice(offset + length);

      if (masked && mask) {
        payload = Buffer.from(payload.map((byte, index) => byte ^ mask[index % 4]));
      }

      if (opcode === 0x8) {
        this.socket.end();
        return;
      }
      if (opcode === 0x9) {
        this._sendFrame(0xA, payload);
        continue;
      }
      if (opcode !== 0x1) continue;

      let message;
      try {
        message = JSON.parse(payload.toString('utf8'));
      } catch (error) {
        continue;
      }

      if (message.id && this.pending.has(message.id)) {
        const pending = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(JSON.stringify(message.error)));
        else pending.resolve(message.result || {});
        continue;
      }

      if (message.method && this.handlers.has(message.method)) {
        for (const handler of this.handlers.get(message.method)) {
          handler(message.params || {});
        }
      }
    }
  }

  _sendFrame(opcode, payload) {
    const length = payload.length;
    let header;
    if (length < 126) {
      header = Buffer.alloc(2);
      header[0] = 0x80 | opcode;
      header[1] = 0x80 | length;
    } else if (length < 65536) {
      header = Buffer.alloc(4);
      header[0] = 0x80 | opcode;
      header[1] = 0x80 | 126;
      header.writeUInt16BE(length, 2);
    } else {
      header = Buffer.alloc(10);
      header[0] = 0x80 | opcode;
      header[1] = 0x80 | 127;
      header.writeBigUInt64BE(BigInt(length), 2);
    }

    const mask = crypto.randomBytes(4);
    const maskedPayload = Buffer.alloc(length);
    for (let index = 0; index < length; index += 1) {
      maskedPayload[index] = payload[index] ^ mask[index % 4];
    }
    this.socket.write(Buffer.concat([header, mask, maskedPayload]));
  }
}

async function evaluate(cdp, expression) {
  const response = await cdp.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
  });
  if (response.exceptionDetails) {
    const text = response.exceptionDetails.text || 'Runtime evaluation failed';
    throw new Error(text);
  }
  return response.result?.value;
}

async function waitUntil(label, fn, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      const value = await fn();
      if (value) return value;
    } catch (error) {
      lastError = error;
    }
    await sleep(250);
  }
  throw new Error(`${label} timed out${lastError ? `: ${lastError.message}` : ''}`);
}

function isIgnoredLogEntry(entry) {
  const text = [entry.url, entry.text, entry.source].filter(Boolean).join(' ');
  return /favicon/i.test(text) && /(404|not found|ERR_FILE_NOT_FOUND|Failed to load resource)/i.test(text);
}

function formatException(params) {
  const details = params.exceptionDetails || {};
  const exception = details.exception || {};
  return [
    details.text || exception.description || exception.value || 'Runtime exception',
    details.url ? `at ${details.url}:${details.lineNumber || 0}:${details.columnNumber || 0}` : '',
  ].filter(Boolean).join(' ');
}

async function runRouteCheck(cdp, route) {
  const script = `
    (async () => {
      const route = ${JSON.stringify(route)};
      if (window.ORDO_SESSION_SERVICE && typeof window.ORDO_SESSION_SERVICE.setActiveRole === 'function') {
        window.ORDO_SESSION_SERVICE.setActiveRole(route.role);
      } else {
        window.ORDO_ROLE = route.role;
      }
      const targetHash = '#' + route.hash;
      if (typeof window.navigate === 'function') {
        window.navigate(targetHash);
      } else {
        window.location.hash = targetHash;
      }
      await new Promise(resolve => setTimeout(resolve, 350));
      const screen = document.getElementById(route.screenId);
      const target = document.querySelector(route.renderTarget);
      const style = screen ? window.getComputedStyle(screen) : null;
      const rect = screen ? screen.getBoundingClientRect() : null;
      const active = !!screen &&
        screen.classList.contains('active') &&
        !screen.classList.contains('hidden') &&
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        rect.width > 0 &&
        rect.height > 0;
      const targetText = target
        ? String(target.innerText || target.textContent || target.value || target.getAttribute('placeholder') || '').trim()
        : '';
      return {
        name: route.name,
        hash: window.location.hash,
        role: window.ORDO_ROLE,
        screenId: route.screenId,
        renderTarget: route.renderTarget,
        screenFound: !!screen,
        active,
        targetFound: !!target,
        targetTextLength: targetText.length,
        targetTextSample: targetText.slice(0, 80),
        bodyClass: document.body.className,
      };
    })()
  `;

  const result = await evaluate(cdp, script);
  const ok = result.active && result.targetFound && result.targetTextLength > 0;
  return {
    ...result,
    ok,
    reason: ok ? '' : [
      result.active ? '' : 'screen is not active/visible',
      result.targetFound ? '' : 'render target missing',
      result.targetTextLength > 0 ? '' : 'render target is empty',
    ].filter(Boolean).join('; '),
  };
}

async function runRuntimeQaCheck(cdp) {
  const script = `
    (() => {
      const qa = window.ORDO_QA;
      if (!qa || typeof qa.run !== 'function') {
        return { available: false, ok: false, passed: 0, total: 0, failures: ['window.ORDO_QA.run missing'] };
      }
      const results = qa.run();
      const failures = results
        .filter(result => !result.pass)
        .map(result => result.label + ': ' + (result.detail || 'FAIL'));
      return {
        available: true,
        ok: failures.length === 0,
        passed: results.filter(result => result.pass).length,
        total: results.length,
        failures,
      };
    })()
  `;
  return evaluate(cdp, script);
}

async function runLifecyclePersistenceCheck(cdp) {
  const marker = `persistence-qa-${Date.now()}`;
  const mutate = await evaluate(cdp, `
    (() => {
      const service = window.ORDO_MODULE_CARD_LIFECYCLE;
      if (!service) return { ok: false, reason: 'window.ORDO_MODULE_CARD_LIFECYCLE missing' };
      window.localStorage.removeItem(service.STORAGE_KEY);
      const card = window.ORDO_MODULE_CARDS.find(item => item.id === 'mc-005');
      if (!card) return { ok: false, reason: 'mc-005 missing' };
      card.status = 'in_progress';
      card.assignedTo = 'worker-001';
      card.qcChecklist = Array.isArray(card.qcChecklist) && card.qcChecklist.length
        ? card.qcChecklist
        : [{ label: 'Persistence QA', passed: false }];
      card.qcChecklist.forEach((_, index) => service.updateQc(card, index, true));
      service.addWorkLog(card, ${JSON.stringify(marker)}, 'worker-001');
      const submitted = service.submitWorkerReview(card, 'worker-001', 'Persistence QA review request');
      service.persist();
      const stored = JSON.parse(window.localStorage.getItem(service.STORAGE_KEY) || '{}');
      return {
        ok: submitted.status === 'review' && Array.isArray(stored.cards),
        reason: '',
        marker: ${JSON.stringify(marker)},
        statusBeforeReload: submitted.status,
        storedCardsBeforeReload: Array.isArray(stored.cards) ? stored.cards.length : 0
      };
    })()
  `);

  if (!mutate.ok) return mutate;

  await cdp.send('Page.reload', { ignoreCache: true });
  await waitUntil('document readiness after lifecycle reload', async () => {
    const readyState = await evaluate(cdp, 'document.readyState');
    return readyState === 'interactive' || readyState === 'complete';
  }, READY_TIMEOUT_MS);
  await waitUntil('lifecycle service after reload', async () => {
    return !!(await evaluate(cdp, '!!window.ORDO_MODULE_CARD_LIFECYCLE && Array.isArray(window.ORDO_MODULE_CARDS)'));
  }, READY_TIMEOUT_MS);

  return evaluate(cdp, `
    (() => {
      const service = window.ORDO_MODULE_CARD_LIFECYCLE;
      const card = window.ORDO_MODULE_CARDS.find(item => item.id === 'mc-005');
      const marker = ${JSON.stringify(marker)};
      const stored = JSON.parse(window.localStorage.getItem(service.STORAGE_KEY) || '{}');
      const markerFound = !!card && (card.workLogs || []).some(log => log.text === marker);
      const ok = !!card &&
        card.status === 'review' &&
        markerFound &&
        Array.isArray(stored.cards) &&
        stored.cards.some(item => item.id === 'mc-005' && item.status === 'review');
      return {
        ok,
        reason: ok ? '' : 'ModuleCard mutation did not survive reload',
        marker,
        statusAfterReload: card ? card.status : null,
        markerFound,
        storageInfo: service.storageInfo()
      };
    })()
  `);
}

async function runSmoke(args) {
  const browserPath = findBrowser(args.chrome);
  const port = await getFreePort();
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ordospace-smoke-'));
  const browser = launchBrowser(browserPath, port, userDataDir, args.url);
  const stderr = [];
  browser.stderr.on('data', chunk => {
    stderr.push(String(chunk));
  });

  let cdp = null;
  try {
    await waitForBrowser(port);
    const target = await waitForPageTarget(port);
    cdp = new CdpSocket(target.webSocketDebuggerUrl);
    await cdp.connect();

    const runtimeExceptions = [];
    const logErrors = [];

    cdp.on('Runtime.exceptionThrown', params => {
      runtimeExceptions.push(formatException(params));
    });
    cdp.on('Log.entryAdded', params => {
      const entry = params.entry || {};
      if (entry.level === 'error' && !isIgnoredLogEntry(entry)) {
        logErrors.push(entry.text || entry.url || JSON.stringify(entry));
      }
    });

    await cdp.send('Runtime.enable');
    await cdp.send('Log.enable');
    await cdp.send('Page.enable');
    await cdp.send('Page.navigate', { url: args.url });

    await waitUntil('document readiness', async () => {
      const readyState = await evaluate(cdp, 'document.readyState');
      return readyState === 'interactive' || readyState === 'complete';
    }, READY_TIMEOUT_MS);

    await waitUntil('ORDOSPACE runtime readiness', async () => {
      return !!(await evaluate(cdp, `
        typeof window.navigate === 'function' &&
        !!document.getElementById('screen-landing') &&
        !!window.ORDO_SESSION_SERVICE
      `));
    }, READY_TIMEOUT_MS);

    const checks = [];
    for (const route of ROUTES) {
      const check = await waitUntil(`route ${route.name}`, async () => {
        const value = await runRouteCheck(cdp, route);
        return value.ok ? value : false;
      }, ROUTE_TIMEOUT_MS).catch(async error => {
        const value = await runRouteCheck(cdp, route).catch(() => null);
        return value || {
          name: route.name,
          ok: false,
          reason: error.message,
        };
      });
      checks.push(check);
    }

    let runtimeQa = null;
    if (args.runtimeQa) {
      runtimeQa = await waitUntil('ORDO_QA.run', async () => {
        const value = await runRuntimeQaCheck(cdp);
        return value.available ? value : false;
      }, ROUTE_TIMEOUT_MS).catch(error => ({
        available: false,
        ok: false,
        passed: 0,
        total: 0,
        failures: [error.message],
      }));
    }

    let lifecycleQa = null;
    if (args.lifecycleQa) {
      lifecycleQa = await waitUntil('ModuleCard lifecycle persistence QA', async () => {
        const value = await runLifecyclePersistenceCheck(cdp);
        return value.ok ? value : false;
      }, ROUTE_TIMEOUT_MS).catch(error => ({
        ok: false,
        reason: error.message,
      }));
    }

    const failures = [
      ...checks.filter(check => !check.ok).map(check => `${check.name}: ${check.reason}`),
      ...(runtimeQa && !runtimeQa.ok ? runtimeQa.failures.map(message => `runtime QA: ${message}`) : []),
      ...(lifecycleQa && !lifecycleQa.ok ? [`lifecycle QA: ${lifecycleQa.reason}`] : []),
      ...runtimeExceptions.map(message => `runtime exception: ${message}`),
      ...logErrors.map(message => `console error: ${message}`),
    ];

    const summary = {
      ok: failures.length === 0,
      url: args.url,
      browser: browserPath,
      checkedAt: new Date().toISOString(),
      routes: checks,
      runtimeQa,
      lifecycleQa,
      runtimeExceptions,
      logErrors,
      failures,
    };

    console.log(JSON.stringify(summary, null, 2));
    if (summary.ok) {
      console.log(`Smoke check passed: ${checks.length} routes${runtimeQa ? `, runtime QA ${runtimeQa.passed}/${runtimeQa.total}` : ''}${lifecycleQa ? ', lifecycle persistence QA' : ''}.`);
      return 0;
    }
    console.error(`Smoke check failed: ${failures.length} issue(s).`);
    return 1;
  } finally {
    if (cdp) cdp.close();
    if (!args.keepOpen) {
      await stopBrowser(browser, args.keepOpen);
      await removeTempDir(userDataDir);
    }
  }
}

(async () => {
  try {
    const exitCode = await runSmoke(parseArgs(process.argv.slice(2)));
    process.exitCode = exitCode;
  } catch (error) {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  }
})();
