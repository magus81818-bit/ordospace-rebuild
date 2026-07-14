/* ============================================================
   [이 파일은] 인증(로그인) 화면 — 로그인·비밀번호 찾기·소셜 로그인 진입점.
                실제 세션 생성은 session.service.js가 처리하고,
                이 파일은 폼 전환·유효성 검사·UI 상태만 담당합니다.
   [언제 실행] 앱 최초 진입 시 또는 로그아웃 후 역할 선택 화면에서.
   [주요 등장인물]
     - showAuthView       : login/forgot/reset 뷰 전환
     - handleLoginSubmit  : 폼 제출 → session.service 호출
   [연결] ← app-shell.js (역할 전환 시 auth 호출)
          → session.service.js (세션 생성/삭제)
   [다음 읽을 파일] app/screens/report-center.screen.js
   [수정할 때 주의] 시연용이므로 실제 인증 로직은 없음. 어떤 입력이든 통과합니다.
   ============================================================ */
function refreshAuthIcons(){
  if (window.refreshIcons) window.refreshIcons();
  else if (window.lucide) window.lucide.createIcons();
}
/* ============== [v2.6.1] Auth View State Machine ============== */
const AUTH_VIEWS = ['login', 'forgot', 'forgot-sent', 'reset', 'reset-done'];
let authCurrentView = 'login';
window.authCurrentView = authCurrentView;

function focusAuthView(viewEl) {
  const target = viewEl?.querySelector('input:not([type="hidden"]), button:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])');
  if (!target) return;
  setTimeout(() => {
    const active = document.activeElement;
    if (active && active !== document.body && active !== document.documentElement) return;
    target.focus({ preventScroll: true });
  }, 120);
}

function switchAuthView(next, data = {}) {
  if (!AUTH_VIEWS.includes(next)) return;
  const root = document.getElementById('screen-auth');
  if (!root) return;
  const currentEl = root.querySelector('.auth-view.is-active');
  const nextEl = root.querySelector('[data-auth-view="' + next + '"]');
  if (!nextEl) return;

  if (data.email) {
    const sentEmail = document.getElementById('authSentEmail');
    if (sentEmail) sentEmail.textContent = data.email;
  }

  root.querySelectorAll('.auth-view').forEach(view => {
    if (view === nextEl) {
      view.classList.add('is-active');
      view.classList.remove('is-leaving');
    } else if (view === currentEl) {
      view.classList.remove('is-active');
      view.classList.add('is-leaving');
      setTimeout(() => view.classList.remove('is-leaving'), 220);
    } else {
      view.classList.remove('is-active', 'is-leaving');
    }
  });

  authCurrentView = next;
  window.authCurrentView = authCurrentView;
  focusAuthView(nextEl);
  refreshAuthIcons();
}
window.switchAuthView = switchAuthView;

function hasAuthResetToken() {
  return new URLSearchParams(location.search).has('reset_token') || /reset_token=/.test(location.hash || '');
}
window.syncAuthRoute = function syncAuthRoute() {
  if ((location.hash || '').replace('#','').split('?')[0] !== 'auth') return;
  switchAuthView(hasAuthResetToken() ? 'reset' : 'login');
};

/* Login role resolver and mock session creation moved to app/services/session.service.js */
(function initAuthFlow(){
  const loginForm = document.getElementById('authLoginForm');
  const forgotForm = document.getElementById('authForgotForm');
  const resetForm = document.getElementById('authResetForm');
  const loginEmail = document.getElementById('loginEmail');
  const forgotEmail = document.getElementById('forgotEmail');
  const resetPw = document.getElementById('resetPw');
  const resetPwConfirm = document.getElementById('resetPwConfirm');
  const loginError = document.getElementById('authLoginError');
  const resendBtn = document.getElementById('authResendBtn');
  let forgotEmailValue = '';
  let resendTimer = null;

  const DEV_EMAIL = 'ceo@techcompus.co.kr';
  const syncDevPrefill = () => {
    if (!loginEmail) return;
    const devOn = document.body.classList.contains('dev-mode-on');
    if (devOn && !String(loginEmail.value || '').trim()) {
      loginEmail.value = DEV_EMAIL;
      loginEmail.dataset.devPrefilled = '1';
    }
    if (!devOn && loginEmail.dataset.devPrefilled === '1') {
      loginEmail.value = '';
      delete loginEmail.dataset.devPrefilled;
    }
  };
  loginEmail?.addEventListener('input', () => {
    if (loginEmail.dataset.devPrefilled === '1' && loginEmail.value !== DEV_EMAIL) delete loginEmail.dataset.devPrefilled;
  });
  syncDevPrefill();
  new MutationObserver(syncDevPrefill).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  document.querySelectorAll('[data-auth-go-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      const next = btn.getAttribute('data-auth-go-view');
      if (next === 'forgot' && loginEmail && forgotEmail && loginEmail.value) forgotEmail.value = loginEmail.value;
      switchAuthView(next || 'login');
    });
  });

  document.querySelectorAll('[data-password-toggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.getAttribute('data-password-toggle'));
      if (!input) return;
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.setAttribute('aria-label', show ? '비밀번호 숨기기' : '비밀번호 표시');
      btn.innerHTML = '<i data-lucide="' + (show ? 'eye-off' : 'eye') + '" class="w-4 h-4"></i>';
      refreshAuthIcons();
    });
  });

  function setLoginLoading(on) {
    const submit = document.getElementById('authLoginSubmit');
    const label = submit?.querySelector('[data-auth-login-label]');
    const spinner = submit?.querySelector('[data-auth-login-spinner]');
    const icon = submit?.querySelector('.auth-submit-icon');
    if (submit) submit.disabled = on;
    if (label) label.textContent = on ? '확인 중' : '로그인';
    spinner?.classList.toggle('hidden', !on);
    icon?.classList.toggle('hidden', on);
  }

  loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!loginForm.checkValidity()) {
      loginForm.reportValidity?.();
      return;
    }
    loginError?.classList.add('hidden');
    setLoginLoading(true);
    const email = loginEmail?.value || 'demo@ordo.systems';
    const password = document.getElementById('loginPw')?.value || '';
    const multi = document.getElementById('devMultiRoleToggle')?.checked;
    const svc = window.ORDO_SESSION_SERVICE;

    // 데모(mock) 폴백: 서버가 없거나 file:// 또는 멀티롤 데모일 때의 기존 경로 보존.
    const runMockLogin = () => {
      if (/fail|wrong|invalid/i.test(email)) {
        loginError?.classList.remove('hidden');
        setLoginLoading(false);
        return;
      }
      const resolvedRole = svc.resolveRoleFromAccount(email);
      svc.completeMockLogin(email, resolvedRole, multi);
      setLoginLoading(false);
    };

    // 실인증 가능 조건: 세션서비스에 실로그인 존재 + file:// 아님 + 멀티롤 데모 아님.
    const canReal = !!(svc && svc.completeRealLogin) && location.protocol !== 'file:' && !multi;
    if (!canReal) {
      setTimeout(runMockLogin, 800);
      return;
    }

    svc.completeRealLogin(email, password)
      .then(() => setLoginLoading(false))
      .catch((err) => {
        if (err && err.status === 401) {
          // 자격/권한 실패: 인라인 에러 표시, 세션 미생성 (mock 폴백 금지)
          loginError?.classList.remove('hidden');
          setLoginLoading(false);
        } else {
          // 서버 도달 실패(네트워크/다운): 데모 폴백으로 계속 동작 (동작 보존)
          runMockLogin();
        }
      });
  });

  function startAuthResendCooldown(seconds = 60) {
    if (!resendBtn) return;
    if (resendTimer) clearInterval(resendTimer);
    let remain = seconds;
    resendBtn.disabled = true;
    resendBtn.textContent = remain + '초 후 다시 보내기';
    resendTimer = setInterval(() => {
      remain -= 1;
      if (remain <= 0) {
        clearInterval(resendTimer);
        resendTimer = null;
        resendBtn.disabled = false;
        resendBtn.textContent = '다시 보내기';
      } else {
        resendBtn.textContent = remain + '초 후 다시 보내기';
      }
    }, 1000);
  }
  window.startAuthResendCooldown = startAuthResendCooldown;

  function handleForgotSubmit(e) {
    e?.preventDefault?.();
    if (!forgotForm?.checkValidity()) {
      forgotForm?.reportValidity?.();
      return;
    }
    forgotEmailValue = forgotEmail?.value || 'name@company.com';
    switchAuthView('forgot-sent', { email: forgotEmailValue });
    startAuthResendCooldown(60);
  }
  forgotForm?.addEventListener('submit', handleForgotSubmit);
  document.getElementById('authForgotSubmit')?.addEventListener('click', handleForgotSubmit);

  resendBtn?.addEventListener('click', () => {
    window.ordoToast?.('재설정 링크를 다시 보냈습니다', 'ok');
    startAuthResendCooldown(60);
  });

  document.getElementById('authResetDevBtn')?.addEventListener('click', () => switchAuthView('reset'));
  document.getElementById('authDoneLoginBtn')?.addEventListener('click', () => switchAuthView('login'));

  function setRule(el, pass) {
    el?.classList.toggle('auth-rule-ok', pass);
    el?.classList.toggle('auth-rule-muted', !pass);
  }

  function updateResetValidation() {
    const pw = resetPw?.value || '';
    const confirm = resetPwConfirm?.value || '';
    const passLength = pw.length >= 8;
    const passCombo = /[A-Za-z]/.test(pw) && /\d/.test(pw);
    const match = !!confirm && pw === confirm;
    setRule(document.getElementById('resetRuleLength'), passLength);
    setRule(document.getElementById('resetRuleCombo'), passCombo);
    const feedback = document.getElementById('resetMatchFeedback');
    if (feedback) {
      if (!confirm) {
        feedback.textContent = '비밀번호 확인을 입력하세요.';
        feedback.className = 'mt-2 text-[12px] text-white/35';
      } else if (match) {
        feedback.textContent = '비밀번호가 일치합니다.';
        feedback.className = 'mt-2 text-[12px] text-[#6EE7B7]';
      } else {
        feedback.textContent = '비밀번호가 일치하지 않습니다.';
        feedback.className = 'mt-2 text-[12px] text-[#F87171]';
      }
    }
    return passLength && passCombo && match;
  }
  window.updateAuthResetValidation = updateResetValidation;
  resetPw?.addEventListener('input', updateResetValidation);
  resetPwConfirm?.addEventListener('input', updateResetValidation);

  function handleResetSubmit(e) {
    e?.preventDefault?.();
    if (!updateResetValidation()) return;
    switchAuthView('reset-done');
  }
  resetForm?.addEventListener('submit', handleResetSubmit);
  document.getElementById('authResetSubmit')?.addEventListener('click', handleResetSubmit);

  document.querySelectorAll('[data-social-login]').forEach(btn => {
    btn.addEventListener('click', () => {
      const provider = btn.getAttribute('data-social-login') || 'social';
      const typedEmail = String(loginEmail?.value || '').trim();
      const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(typedEmail)
        ? typedEmail
        : `client@${provider}.demo`;
      const resolvedRole = window.ORDO_SESSION_SERVICE.resolveRoleFromAccount(email);
      const multi = document.getElementById('devMultiRoleToggle')?.checked;
      window.ORDO_SESSION_SERVICE.completeMockLogin(email, resolvedRole, multi);
      window.ordoToast?.(provider === 'naver' ? '네이버 계정으로 로그인했습니다' : 'Google 계정으로 로그인했습니다', 'ok');
    });
  });
  document.querySelectorAll('a[data-coming-soon], a[href="#coming-soon"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      window.ordoToast?.('준비 중입니다', 'warn');
    });
  });

  if (hasAuthResetToken()) switchAuthView('reset');
  window.addEventListener('hashchange', () => {
    const raw = (location.hash || '').replace('#','').split('?')[0];
    if (raw === 'auth') switchAuthView(hasAuthResetToken() ? 'reset' : 'login');
  });
})();
window.ORDO_AUTH_SCREEN = {
  focusAuthView,
  switchAuthView,
  hasAuthResetToken,
  refreshAuthIcons,
  get currentView(){ return authCurrentView; }
};
