#!/usr/bin/env node
// React MVP browser smoke
// Drives the React MVP in a real Chrome/Edge instance through Chrome DevTools
// Protocol. No external browser automation package is required.

const childProcess = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const http = require("node:http");
const net = require("node:net");
const os = require("node:os");
const path = require("node:path");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const READY_TIMEOUT_MS = 20000;
const FLOW_TIMEOUT_MS = 12000;

function parseArgs(argv) {
  const args = {
    chrome: "",
    keepOpen: false,
    preview: false,
    url: "",
    vercelBypassSecret: process.env.VERCEL_AUTOMATION_BYPASS_SECRET || "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--url") {
      args.url = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--chrome") {
      args.chrome = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--keep-open") {
      args.keepOpen = true;
      continue;
    }

    if (arg === "--vercel-bypass-secret") {
      args.vercelBypassSecret = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--preview") {
      args.preview = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (args.url && !/^https?:\/\//.test(args.url)) {
    throw new Error("--url must be an http(s) URL.");
  }

  return args;
}

function printHelp() {
  console.log([
    "ORDOSPACE React MVP browser smoke",
    "",
    "Usage:",
    "  node react-mvp/scripts/smoke-browser.cjs",
    "  node react-mvp/scripts/smoke-browser.cjs --preview",
    "  node react-mvp/scripts/smoke-browser.cjs --url http://127.0.0.1:5174/",
    "",
    "Options:",
    "  --url <url>       Existing React MVP URL. If omitted, a temp Vite server is started.",
    "  --chrome <path>   Explicit Chrome/Edge executable path.",
    "  --keep-open       Leave the browser open for manual inspection.",
    "  --preview         Serve the built dist-react artifact with Vite preview.",
    "  --vercel-bypass-secret <secret>",
    "                    Optional Vercel deployment-protection bypass secret.",
  ].join("\n"));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fileExists(filePath) {
  return !!filePath && fs.existsSync(filePath);
}

function findBrowser(explicitPath) {
  const candidates = [
    explicitPath,
    process.env.CHROME_PATH,
    process.env.EDGE_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/microsoft-edge",
  ].filter(Boolean);

  const found = candidates.find(fileExists);

  if (!found) {
    throw new Error("Chrome or Edge executable was not found. Pass --chrome <path>.");
  }

  return found;
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
  });
}

function httpText(url) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}: ${body.slice(0, 160)}`));
          return;
        }
        resolve(body);
      });
    });
    req.once("error", reject);
    req.end();
  });
}

function httpJson(url) {
  return httpText(url).then((body) => JSON.parse(body));
}

async function waitUntil(label, fn, timeoutMs = READY_TIMEOUT_MS) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;

  while (Date.now() < deadline) {
    try {
      const value = await fn();
      if (value) {
        return value;
      }
    } catch (error) {
      lastError = error;
    }
    await sleep(200);
  }

  throw new Error(`${label} timed out${lastError ? `: ${lastError.message}` : ""}`);
}

async function startViteServer({ preview = false } = {}) {
  const port = await getFreePort();
  const viteBin = path.join(PROJECT_ROOT, "node_modules", "vite", "bin", "vite.js");
  const commandArgs = preview
    ? ["preview"]
    : [];
  const server = childProcess.spawn(
    process.execPath,
    [
      viteBin,
      ...commandArgs,
      "--host",
      "127.0.0.1",
      "--port",
      String(port),
      "--strictPort",
    ],
    {
      cwd: PROJECT_ROOT,
      env: {
        ...process.env,
        BROWSER: "none",
      },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    },
  );
  const logs = [];

  server.stdout.on("data", (chunk) => logs.push(String(chunk)));
  server.stderr.on("data", (chunk) => logs.push(String(chunk)));

  await waitUntil(
    preview ? "Vite preview server" : "Vite dev server",
    async () => {
      const body = await httpText(`http://127.0.0.1:${port}/`);
      return body.includes("React MVP");
    },
    READY_TIMEOUT_MS,
  ).catch((error) => {
    throw new Error(`${error.message}\n${logs.join("").slice(-1200)}`);
  });

  return {
    port,
    process: server,
    url: `http://127.0.0.1:${port}/`,
  };
}

async function stopProcess(processHandle) {
  if (!processHandle || processHandle.killed) {
    return;
  }

  processHandle.kill();
  await new Promise((resolve) => {
    const timer = setTimeout(resolve, 2500);
    processHandle.once("exit", () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

function launchBrowser(browserPath, port, userDataDir, targetUrl) {
  const args = [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    "--headless=new",
    "--disable-gpu",
    "--disable-background-networking",
    "--disable-default-apps",
    "--disable-extensions",
    "--disable-features=Translate,BackForwardCache",
    "--no-first-run",
    "--no-default-browser-check",
    "--window-size=1440,1200",
    targetUrl,
  ];

  return childProcess.spawn(browserPath, args, {
    stdio: ["ignore", "ignore", "pipe"],
    windowsHide: true,
  });
}

async function waitForBrowser(port) {
  return waitUntil("Browser debugging endpoint", async () => {
    await httpJson(`http://127.0.0.1:${port}/json/version`);
    return true;
  });
}

async function waitForPageTarget(port) {
  return waitUntil("debuggable page target", async () => {
    const list = await httpJson(`http://127.0.0.1:${port}/json/list`);
    return list.find((target) => target.type === "page" && target.webSocketDebuggerUrl);
  });
}

async function removeTempDir(tempDir) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
      return;
    } catch {
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
      const key = crypto.randomBytes(16).toString("base64");
      const headers = [
        `GET ${this.path} HTTP/1.1`,
        `Host: ${this.host}:${this.port}`,
        "Upgrade: websocket",
        "Connection: Upgrade",
        `Sec-WebSocket-Key: ${key}`,
        "Sec-WebSocket-Version: 13",
        "",
        "",
      ].join("\r\n");

      this.socket = net.createConnection({ host: this.host, port: this.port }, () => {
        this.socket.write(headers);
      });

      this.socket.once("error", reject);
      this.socket.on("data", (chunk) => {
        if (!this.connected) {
          this.handshake = Buffer.concat([this.handshake, chunk]);
          const marker = this.handshake.indexOf("\r\n\r\n");

          if (marker === -1) {
            return;
          }

          const head = this.handshake.slice(0, marker).toString("utf8");

          if (!/^HTTP\/1\.1 101/.test(head)) {
            reject(new Error(`WebSocket handshake failed: ${head.split("\r\n")[0]}`));
            return;
          }

          this.connected = true;
          this.socket.removeListener("error", reject);
          resolve();
          const rest = this.handshake.slice(marker + 4);
          this.handshake = Buffer.alloc(0);

          if (rest.length) {
            this._receive(rest);
          }

          return;
        }

        this._receive(chunk);
      });

      this.socket.on("close", () => {
        for (const pending of this.pending.values()) {
          pending.reject(new Error("CDP socket closed."));
        }
        this.pending.clear();
      });
    });
  }

  on(method, handler) {
    if (!this.handlers.has(method)) {
      this.handlers.set(method, []);
    }
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

      if (opcode !== 0x1) {
        continue;
      }

      let message;

      try {
        message = JSON.parse(payload.toString("utf8"));
      } catch {
        continue;
      }

      if (message.id && this.pending.has(message.id)) {
        const pending = this.pending.get(message.id);
        this.pending.delete(message.id);

        if (message.error) {
          pending.reject(new Error(JSON.stringify(message.error)));
        } else {
          pending.resolve(message.result || {});
        }

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
  const response = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
  });

  if (response.exceptionDetails) {
    const text =
      response.exceptionDetails.exception?.description ||
      response.exceptionDetails.text ||
      "Runtime evaluation failed";
    throw new Error(text);
  }

  return response.result?.value;
}

function isIgnoredLogEntry(entry) {
  const text = [entry.url, entry.text, entry.source].filter(Boolean).join(" ");
  return /favicon/i.test(text) && /(404|not found|ERR_FILE_NOT_FOUND|Failed to load resource)/i.test(text);
}

function formatException(params) {
  const details = params.exceptionDetails || {};
  const exception = details.exception || {};

  return [
    details.text || exception.description || exception.value || "Runtime exception",
    details.url ? `at ${details.url}:${details.lineNumber || 0}:${details.columnNumber || 0}` : "",
  ].filter(Boolean).join(" ");
}

async function waitForReactReady(cdp) {
  try {
    await waitUntil(
      "React MVP readiness",
      async () => {
        return evaluate(cdp, `
          document.readyState !== "loading" &&
          !!document.querySelector(".app-shell") &&
          document.body.innerText.includes("ORDOSPACE")
        `);
      },
      READY_TIMEOUT_MS,
    );
  } catch (error) {
    const diagnostic = await evaluate(cdp, `
      (() => {
        const body = document.body ? document.body.innerText || "" : "";
        return {
          title: document.title || "",
          hasAppShell: !!document.querySelector(".app-shell"),
          hasRoot: !!document.querySelector("#root"),
          hasVercelLogin:
            /Login\\s+[–-]\\s+Vercel/i.test(document.title || "") ||
            (body.includes("Continue with Email") && body.includes("Vercel")),
        };
      })()
    `).catch(() => null);

    if (diagnostic?.hasVercelLogin) {
      throw new Error(
        "React MVP readiness blocked by Vercel Authentication. Set VERCEL_AUTOMATION_BYPASS_SECRET or pass --vercel-bypass-secret to smoke protected preview deployments.",
      );
    }

    throw error;
  }
}

async function applyVercelBypassHeaders(cdp, secret) {
  if (!secret) {
    return false;
  }

  await cdp.send("Network.enable");
  await cdp.send("Network.setExtraHTTPHeaders", {
    headers: {
      "x-vercel-protection-bypass": secret,
      "x-vercel-set-bypass-cookie": "true",
    },
  });
  return true;
}

function getBrowserFlowScript() {
  return `
    (async () => {
      const SESSION_KEY = "ordospace.reactMvp.session.v1";
      const STORE_KEY = "ordospace.reactMvp.moduleCards.v1";
      const createdTitle = "Browser QA checkout handoff";
      const clientRevisionNote = "Please tighten browser QA evidence before launch.";
      const result = {
        ok: true,
        steps: [],
        storage: {},
      };

      const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const bodyText = () => document.body.innerText || "";
      const query = (selector) => document.querySelector(selector);
      const queryAll = (selector) => Array.from(document.querySelectorAll(selector));

      function record(name, detail = "") {
        result.steps.push({ name, ok: true, detail });
      }

      async function step(name, fn) {
        if (!result.ok) return;

        try {
          const detail = await fn();
          record(name, detail || "");
        } catch (error) {
          result.ok = false;
          result.steps.push({ name, ok: false, detail: error.message });
        }
      }

      function must(condition, message) {
        if (!condition) {
          throw new Error(message);
        }
      }

      async function waitFor(label, fn, timeout = ${FLOW_TIMEOUT_MS}) {
        const deadline = Date.now() + timeout;
        let lastError = null;

        while (Date.now() < deadline) {
          try {
            const value = fn();
            if (value) {
              return value;
            }
          } catch (error) {
            lastError = error;
          }

          await delay(120);
        }

        throw new Error(label + " timed out" + (lastError ? ": " + lastError.message : ""));
      }

      async function navigateTo(path) {
        window.location.hash = "#" + path;
        await waitFor("route " + path, () => window.location.hash.includes(path));
        await waitFor("rendered " + path, () => query(".app-shell") && bodyText().includes("ORDOSPACE"));
        await delay(120);
      }

      function buttonByText(text) {
        return queryAll("button, a").find((element) =>
          String(element.textContent || "").trim().includes(text)
        );
      }

      function fieldByLabel(labelText) {
        const field = queryAll(".form-field").find((element) => {
          const label = element.querySelector("span, legend");
          return label && String(label.textContent || "").trim() === labelText;
        });

        return field ? field.querySelector("input, textarea, select") : null;
      }

      function radioByLabel(labelText) {
        const label = queryAll("label").find((element) =>
          String(element.textContent || "").trim().includes(labelText)
        );

        return label ? label.querySelector("input[type='radio']") : null;
      }

      function setValue(element, value) {
        must(element, "Cannot set a missing form field.");
        const prototype = Object.getPrototypeOf(element);
        const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");

        if (descriptor && descriptor.set) {
          descriptor.set.call(element, value);
        } else {
          element.value = value;
        }

        element.dispatchEvent(new Event("input", { bubbles: true }));
        element.dispatchEvent(new Event("change", { bubbles: true }));
      }

      async function clickElement(element, label) {
        must(element, "Missing clickable element: " + label);
        element.click();
        await delay(160);
      }

      async function signIn(userId, role, expectedName) {
        await navigateTo("/auth");
        const radio = query("input[name='seed-user'][value='" + userId + "']");
        await clickElement(radio, "seed account " + userId);
        await clickElement(buttonByText("Sign in as"), "sign in button");
        await waitFor(role + " workspace", () =>
          window.location.hash.includes("/workspace/" + role) &&
          bodyText().includes(expectedName)
        );
      }

      function futureDate(days) {
        const date = new Date();
        date.setDate(date.getDate() + days);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return year + "-" + month + "-" + day;
      }

      function pastDate() {
        const date = new Date();
        date.setDate(date.getDate() - 1);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return year + "-" + month + "-" + day;
      }

      function getStoredState() {
        const rawValue = window.localStorage.getItem(STORE_KEY);
        return rawValue ? JSON.parse(rawValue) : null;
      }

      function getStoredCard(cardId) {
        const state = getStoredState();
        return state ? state.moduleCards.find((card) => card.id === cardId) : null;
      }

      function getStoredCardByTitle(title) {
        const state = getStoredState();
        return state ? state.moduleCards.find((card) => card.title === title) : null;
      }

      window.localStorage.removeItem(SESSION_KEY);
      window.localStorage.removeItem(STORE_KEY);

      await step("admin seed login", async () => {
        await signIn("user-admin-01", "admin", "Hana Lee");
        must(bodyText().includes("Admin workspace"), "Admin workspace text missing.");
        return window.location.hash;
      });

      await step("admin validation feedback", async () => {
        setValue(fieldByLabel("Title"), "No");
        setValue(fieldByLabel("Summary"), "Too short");
        setValue(fieldByLabel("Due date"), pastDate());
        setValue(fieldByLabel("Deliverable"), "x");
        await clickElement(buttonByText("Create and assign"), "admin create submit");
        const feedback = await waitFor("admin validation feedback", () => query(".form-feedback.is-error"));
        const text = feedback.textContent || "";
        must(text.includes("Title must be at least 3 characters."), "Title validation not shown.");
        must(text.includes("Due date cannot be in the past."), "Due date validation not shown.");
        return text.slice(0, 120);
      });

      await step("admin create and assign", async () => {
        setValue(fieldByLabel("Title"), createdTitle);
        setValue(fieldByLabel("Summary"), "Create one browser-smoke card for the full lifecycle flow.");
        setValue(fieldByLabel("Phase"), "QA");
        setValue(fieldByLabel("Priority"), "high");
        setValue(fieldByLabel("Worker"), "user-worker-dev");
        setValue(fieldByLabel("Due date"), futureDate(14));
        setValue(fieldByLabel("Estimate hours"), "7");
        setValue(fieldByLabel("Deliverable"), "Browser QA evidence");
        await clickElement(buttonByText("Create and assign"), "admin create submit");
        await waitFor("admin create success", () => bodyText().includes(createdTitle + " assigned to Joon Choi."));
        await waitFor("created card persisted", () => getStoredCardByTitle(createdTitle));
        return getStoredCardByTitle(createdTitle).id;
      });

      await step("worker seed login", async () => {
        await signIn("user-worker-dev", "worker", "Joon Choi");
        must(bodyText().includes("Worker workspace"), "Worker workspace text missing.");
        must(bodyText().includes(createdTitle), "Created card not visible to assigned worker.");
        return window.location.hash;
      });

      await step("worker no-change validation feedback", async () => {
        await navigateTo("/workspace/worker/cards/card-005");
        must(bodyText().includes("Payment flow wiring"), "Worker detail card missing.");
        await clickElement(buttonByText("Save worker update"), "worker save");
        const feedback = await waitFor("worker validation feedback", () => query(".form-feedback.is-error"));
        must(
          (feedback.textContent || "").includes("Change progress, hours, QC status, or add a note before saving."),
          "Worker no-change validation not shown.",
        );
        return "no-change guard visible";
      });

      await step("worker update to QC ready", async () => {
        setValue(fieldByLabel("Progress"), "100");
        setValue(fieldByLabel("Logged hours"), "20");
        setValue(fieldByLabel("QC status"), "passed");
        setValue(fieldByLabel("Team note"), "Browser QA marks checkout ready.");
        await clickElement(buttonByText("Save worker update"), "worker save");
        await waitFor("worker update success", () =>
          bodyText().includes("Payment flow wiring updated to 100% and QC ready.")
        );
        await waitFor("worker card persisted qc ready", () => getStoredCard("card-005")?.status === "qc_ready");
        return getStoredCard("card-005").status;
      });

      await step("worker submit for admin review", async () => {
        setValue(fieldByLabel("Submission note"), "Ready for admin browser QA review.");
        await clickElement(buttonByText("Submit to admin review"), "worker submit");
        await waitFor("worker submit success", () =>
          bodyText().includes("Payment flow wiring submitted for admin review.")
        );
        await waitFor("worker submit persisted", () => getStoredCard("card-005")?.status === "admin_review");
        return getStoredCard("card-005").status;
      });

      await step("admin send to client review", async () => {
        await signIn("user-admin-01", "admin", "Hana Lee");
        await navigateTo("/workspace/admin/cards/card-005");
        must(bodyText().includes("Payment flow wiring"), "Admin detail card missing.");
        setValue(fieldByLabel("Client note"), "Ready for client browser QA decision.");
        await clickElement(buttonByText("Send to client review"), "admin send");
        await waitFor("admin send success", () =>
          bodyText().includes("Payment flow wiring sent to client review.")
        );
        await waitFor("admin send persisted", () => getStoredCard("card-005")?.status === "client_review");
        return getStoredCard("card-005").status;
      });

      await step("client revision validation feedback", async () => {
        await signIn("user-client-01", "client", "Dohyung Kim");
        await navigateTo("/workspace/client/cards/card-005");
        must(bodyText().includes("Payment flow wiring"), "Client detail card missing.");
        await clickElement(radioByLabel("Request revision"), "request revision radio");
        setValue(fieldByLabel("Revision note"), "   ");
        await clickElement(buttonByText("Request revision"), "request revision");
        const feedback = await waitFor("client revision validation feedback", () => query(".form-feedback.is-error"));
        must(
          (feedback.textContent || "").includes("Revision note is required when requesting a revision."),
          "Client revision validation not shown.",
        );
        return "revision note guard visible";
      });

      await step("client request revision", async () => {
        setValue(fieldByLabel("Revision note"), clientRevisionNote);
        await clickElement(buttonByText("Request revision"), "request revision");
        await waitFor("client revision success", () =>
          bodyText().includes("Payment flow wiring moved to Revision requested.")
        );
        await waitFor("client revision persisted", () => getStoredCard("card-005")?.status === "revision_requested");
        return getStoredCard("card-005").status;
      });

      await step("persisted store summary", async () => {
        const state = getStoredState();
        must(state, "Persisted ModuleCard store missing.");
        const createdCard = getStoredCardByTitle(createdTitle);
        const card005 = getStoredCard("card-005");
        must(createdCard && createdCard.assigneeId === "user-worker-dev", "Created card assignment missing.");
        must(card005 && card005.status === "revision_requested", "Final card status not persisted.");
        must(
          state.activities.some((activity) => activity.cardId === "card-005" && activity.type === "revision_requested"),
          "Revision activity not persisted.",
        );
        must(
          state.comments.some((comment) => comment.cardId === "card-005" && comment.body === clientRevisionNote),
          "Client revision comment not persisted.",
        );
        result.storage = {
          activities: state.activities.length,
          comments: state.comments.length,
          moduleCards: state.moduleCards.length,
        };
        return JSON.stringify(result.storage);
      });

      return result;
    })()
  `;
}

function getPostRefreshScript() {
  return `
    (async () => {
      const SESSION_KEY = "ordospace.reactMvp.session.v1";
      const STORE_KEY = "ordospace.reactMvp.moduleCards.v1";
      const result = {
        ok: true,
        steps: [],
      };

      const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const bodyText = () => document.body.innerText || "";
      const queryAll = (selector) => Array.from(document.querySelectorAll(selector));

      function fail(message) {
        result.ok = false;
        result.steps.push({ name: "failure", ok: false, detail: message });
      }

      function record(name, detail = "") {
        result.steps.push({ name, ok: true, detail });
      }

      async function waitFor(label, fn, timeout = ${FLOW_TIMEOUT_MS}) {
        const deadline = Date.now() + timeout;

        while (Date.now() < deadline) {
          const value = fn();

          if (value) {
            return value;
          }

          await delay(120);
        }

        throw new Error(label + " timed out");
      }

      try {
        await waitFor("post-refresh client detail", () =>
          window.location.hash.includes("/workspace/client/cards/card-005") &&
          bodyText().includes("Payment flow wiring")
        );

        if (!bodyText().includes("Revision requested")) {
          fail("Revision requested status missing after refresh.");
        } else {
          record("refresh keeps client detail state", window.location.hash);
        }

        window.location.hash = "#/workspace/client";
        await waitFor("client workspace after refresh", () =>
          window.location.hash.includes("/workspace/client") &&
          bodyText().includes("Recent lifecycle activity")
        );

        if (!bodyText().includes("Revision requested") || !bodyText().includes("Payment flow wiring")) {
          fail("Client activity review does not show the revision event after refresh.");
        } else {
          record("role activity visible after refresh", "revision event visible");
        }

        const store = JSON.parse(window.localStorage.getItem(STORE_KEY) || "null");

        if (!store || !store.moduleCards.some((card) => card.id === "card-005" && card.status === "revision_requested")) {
          fail("Persisted store missing revision_requested card after refresh.");
        } else {
          record("localStorage persisted after refresh", "card-005 revision_requested");
        }

        const logout = queryAll("button").find((button) =>
          String(button.textContent || "").trim().includes("Log out")
        );

        if (!logout) {
          fail("Log out button missing.");
        } else {
          logout.click();
          await waitFor("logout route", () =>
            window.location.hash.includes("/auth") &&
            !window.localStorage.getItem(SESSION_KEY)
          );
          record("logout clears session", window.location.hash);
        }
      } catch (error) {
        fail(error.message);
      }

      return result;
    })()
  `;
}

async function runSmoke(args) {
  const vite = args.url ? null : await startViteServer({ preview: args.preview });
  const targetUrl = args.url || vite.url;
  const browserPath = findBrowser(args.chrome);
  const browserPort = await getFreePort();
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "ordospace-react-smoke-"));
  const browser = launchBrowser(browserPath, browserPort, userDataDir, targetUrl);
  const stderr = [];
  browser.stderr.on("data", (chunk) => {
    stderr.push(String(chunk));
  });

  let cdp = null;

  try {
    await waitForBrowser(browserPort);
    const target = await waitForPageTarget(browserPort);
    cdp = new CdpSocket(target.webSocketDebuggerUrl);
    await cdp.connect();

    const runtimeExceptions = [];
    const logErrors = [];

    cdp.on("Runtime.exceptionThrown", (params) => {
      runtimeExceptions.push(formatException(params));
    });
    cdp.on("Log.entryAdded", (params) => {
      const entry = params.entry || {};

      if (entry.level === "error" && !isIgnoredLogEntry(entry)) {
        logErrors.push(entry.text || entry.url || JSON.stringify(entry));
      }
    });

    await cdp.send("Runtime.enable");
    await cdp.send("Log.enable");
    await cdp.send("Page.enable");
    const usedVercelBypass = await applyVercelBypassHeaders(cdp, args.vercelBypassSecret);
    await cdp.send("Page.navigate", { url: targetUrl });
    await waitForReactReady(cdp);

    const flow = await evaluate(cdp, getBrowserFlowScript());
    await cdp.send("Page.reload", { ignoreCache: true });
    await waitForReactReady(cdp);
    const postRefresh = await evaluate(cdp, getPostRefreshScript());

    const failures = [
      ...(flow.ok ? [] : flow.steps.filter((step) => !step.ok).map((step) => `${step.name}: ${step.detail}`)),
      ...(postRefresh.ok
        ? []
        : postRefresh.steps.filter((step) => !step.ok).map((step) => `${step.name}: ${step.detail}`)),
      ...runtimeExceptions.map((message) => `runtime exception: ${message}`),
      ...logErrors.map((message) => `console error: ${message}`),
    ];

    const summary = {
      ok: failures.length === 0,
      url: targetUrl,
      browser: browserPath,
      vercelBypass: usedVercelBypass,
      checkedAt: new Date().toISOString(),
      flow,
      postRefresh,
      runtimeExceptions,
      logErrors,
      failures,
    };

    console.log(JSON.stringify(summary, null, 2));

    if (summary.ok) {
      console.log(
        `React MVP browser smoke passed: ${flow.steps.length + postRefresh.steps.length} steps.`,
      );
      return 0;
    }

    console.error(`React MVP browser smoke failed: ${failures.length} issue(s).`);
    return 1;
  } finally {
    if (cdp) cdp.close();

    if (!args.keepOpen) {
      await stopProcess(browser);
      await removeTempDir(userDataDir);
    }

    if (vite) {
      await stopProcess(vite.process);
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
