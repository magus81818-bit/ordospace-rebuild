/* ============================================================
   [이 파일은] 문서/변경 관리 화면 — 이슈 목록과 변경 요청 목록을 관리.
                admin 전용. 이슈 등록·상태 변경·코멘트 추가를 처리합니다.
   [언제 실행] 라우터가 #admin-docs 해시를 만나면 호출.
   [주요 등장인물]
     - switchChTab          : 이슈/변경요청 탭 전환
     - renderIssueList / selectIssue : 이슈 목록 + 상세
     - renderChangeList / selectChange : 변경 요청 목록 + 상세
   [연결] ← hash-router.js
   [다음 읽을 파일] app/qa/runtime-qa.js (검증 스크립트)
   [수정할 때 주의] 시연용 정적 데이터. lifecycle 서비스와 무관.
   ============================================================ */
const chListPane = document.getElementById('changesListPane');
const chDetailPane = document.getElementById('changesDetailPane');
const chDetailBody = document.getElementById('changesDetailBody');
const issueBar = document.getElementById('issueActionBar');
const changeBar = document.getElementById('changeActionBar');

function switchChTab(tab){
  window._chTab = tab;
  const l1 = document.getElementById('chTabIssue'), l2 = document.getElementById('chTabChange');
  const isIssue = tab === 'issue';
  l1.classList.toggle('tab-active', isIssue); l2.classList.toggle('tab-active', !isIssue);
  l1.classList.toggle('border-brand-primary', isIssue); l1.classList.toggle('text-tx-primary', isIssue);
  l1.classList.toggle('border-transparent', !isIssue); l1.classList.toggle('text-tx-tertiary', !isIssue);
  l2.classList.toggle('border-brand-primary', !isIssue); l2.classList.toggle('text-tx-primary', !isIssue);
  l2.classList.toggle('border-transparent', isIssue); l2.classList.toggle('text-tx-tertiary', isIssue);
  document.getElementById('issueList').classList.toggle('hidden', !isIssue);
  document.getElementById('changeList').classList.toggle('hidden', isIssue);
  // 기본 상세 렌더
  selectChange(isIssue ? 'IS-0089' : 'CH-0124', window.matchMedia('(min-width:1024px)').matches);
}
document.querySelectorAll('[data-ch-tab]').forEach(b => b.addEventListener('click', () => switchChTab(b.dataset.chTab)));

function selectChange(id, autoOpenDetail){
  const d = CHANGE_DATA[id]; if (!d) return;
  document.querySelectorAll('.change-item').forEach(b => {
    if (b.getAttribute('data-change-item') === id) b.classList.add('border-brand-primary','bg-bg-secondary');
    else b.classList.remove('border-brand-primary','bg-bg-secondary');
  });
  document.getElementById('changesMobileTitle').textContent = `#${id}`;

  const isChange = d.kind === 'change';
  issueBar.classList.toggle('hidden', isChange);
  changeBar.classList.toggle('hidden', !isChange);

  chDetailBody.innerHTML = `
    <header class="mb-5">
      <div class="flex flex-wrap items-center gap-2 mb-2">
        <span class="text-[11px] font-semibold text-tx-tertiary tabular">#${id}</span>
        ${badge(isChange ? '변경 요청' : '이슈', isChange ? 'warn' : 'pend')}
        ${badge(d.severity, d.severityTone)}
        <a href="#project" class="text-[12px] text-tx-secondary hover:text-tx-primary">${d.project}</a>
      </div>
      <h1 class="text-[22px] lg:text-[28px] font-semibold leading-tight">${d.title}</h1>
      <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-[12px] text-tx-secondary">
        <span>요청자 · <span class="text-tx-primary font-medium">${d.requester}</span></span>
        <span>담당 · ${d.assignee}</span>
        <span>등록일 · ${d.createdAt}</span>
        <span>상태 · ${badge(d.status, d.statusTone)}</span>
      </div>
    </header>

    ${isChange ? `
    <section class="bg-white border border-bd-default rounded-xl p-5 shadow-subtle mb-4">
      <h3 class="text-[14px] font-semibold mb-2">변경 이유</h3>
      <p class="text-[14px] text-tx-primary leading-relaxed">${d.reason}</p>
      <h3 class="text-[14px] font-semibold mt-4 mb-2">제안 내용</h3>
      <p class="text-[14px] text-tx-primary leading-relaxed">${d.proposal}</p>
    </section>
    <section class="rounded-xl p-5 mb-4 bg-st-pendbg border border-st-pendbd">
      <h3 class="text-[14px] font-semibold mb-3">영향 분석</h3>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div class="p-3 rounded-lg border border-st-pendbd bg-white">
          <div class="text-[11px] text-tx-secondary">일정 영향</div>
          <div class="text-[18px] font-semibold tabular mt-0.5">${d.impact.schedule}</div>
        </div>
        <div class="p-3 rounded-lg border border-st-pendbd bg-white">
          <div class="text-[11px] text-tx-secondary">비용 영향</div>
          <div class="text-[18px] font-semibold tabular mt-0.5">${d.impact.cost}</div>
        </div>
        <div class="p-3 rounded-lg border border-st-pendbd bg-white">
          <div class="text-[11px] text-tx-secondary">품질 영향</div>
          <div class="mt-1">${badge(d.impact.quality, d.impact.quality==='상향'?'ok':(d.impact.quality==='하향'?'crit':'rej'))}</div>
        </div>
        <div class="p-3 rounded-lg border border-st-pendbd bg-white col-span-2 lg:col-span-1">
          <div class="text-[11px] text-tx-secondary">의존성</div>
          <div class="text-[12px] text-tx-primary mt-1 leading-snug">${d.impact.deps.map(x=>`· ${x}`).join('<br>')}</div>
        </div>
      </div>
    </section>
    ` : `
    <section class="bg-white border border-bd-default rounded-xl p-5 shadow-subtle mb-4">
      <h3 class="text-[14px] font-semibold mb-2">재현 조건</h3>
      <p class="text-[14px] text-tx-primary leading-relaxed">${d.repro}</p>
      <h3 class="text-[14px] font-semibold mt-4 mb-2">영향 범위</h3>
      <p class="text-[14px] text-tx-primary leading-relaxed">${d.impact}</p>
    </section>
    `}

    <section class="bg-white border border-bd-default rounded-xl shadow-subtle mb-4">
      <div class="px-5 py-3 border-b border-bd-default text-[13px] font-semibold">첨부 파일</div>
      ${d.attachments.length ? `
        <ul class="divide-y divide-bd-default">
          ${d.attachments.map(a=>`
            <li class="flex items-center gap-3 px-5 py-3">
              <i data-lucide="paperclip" class="w-4 h-4 text-tx-secondary"></i>
              <div class="flex-1 min-w-0">
                <div class="text-[13px] font-medium truncate">${a.name}</div>
                <div class="text-[11px] text-tx-tertiary">${a.size}</div>
              </div>
              <i data-lucide="download" class="w-4 h-4 text-tx-tertiary"></i>
            </li>`).join('')}
        </ul>` : `<div class="px-5 py-4 text-[13px] text-tx-tertiary">첨부 파일 없음</div>`}
    </section>

    <section class="bg-white border border-bd-default rounded-xl shadow-subtle mb-4">
      <div class="px-5 py-3 border-b border-bd-default text-[13px] font-semibold">댓글 · ${d.comments.length}</div>
      <ul class="divide-y divide-bd-default">
        ${d.comments.length ? d.comments.map(c=>`
          <li class="p-4 flex items-start gap-3">
            <div class="w-8 h-8 rounded-full bg-bg-tertiary border border-bd-default flex items-center justify-center text-[12px] font-semibold shrink-0">${c.who[0]}</div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 text-[12px] text-tx-tertiary"><span class="font-semibold text-tx-primary">${c.who}</span><span>· ${c.at}</span></div>
              <p class="text-[14px] text-tx-primary leading-relaxed mt-1">${c.body}</p>
            </div>
          </li>`).join('') : `<li class="px-5 py-4 text-[13px] text-tx-tertiary">아직 댓글이 없습니다.</li>`}
      </ul>
      <div class="p-4 border-t border-bd-default">
        <textarea rows="3" placeholder="댓글을 입력하세요" class="w-full px-3 py-2.5 text-[14px] bg-bg-secondary border border-bd-default rounded-lg focus:outline-none focus:bg-white focus:border-brand-primary resize-none"></textarea>
        <div class="flex items-center justify-between mt-2">
          <button class="h-9 px-3 text-[12px] rounded-md hover:bg-bg-secondary inline-flex items-center gap-1.5"><i data-lucide="paperclip" class="w-4 h-4"></i>첨부</button>
          <button class="h-9 px-4 rounded-md bg-brand-primary text-white text-[12px] font-semibold hover:bg-brand-hover">댓글</button>
        </div>
      </div>
    </section>

    <section>
      <h3 class="text-[15px] font-semibold mb-3">상태 변경 히스토리</h3>
      <div class="bg-white border border-bd-default rounded-xl shadow-subtle">
        <ol class="p-4 space-y-3">
          ${d.history.map(h=>`
            <li class="flex gap-3">
              <div class="w-2 h-2 rounded-full bg-brand-primary mt-1.5 shrink-0"></div>
              <div>
                <div class="text-[11px] text-tx-tertiary">${h.at} · ${h.who}</div>
                <div class="text-[13px] text-tx-primary">${h.text}</div>
              </div>
            </li>`).join('')}
        </ol>
      </div>
    </section>
  `;

  if (autoOpenDetail || !window.matchMedia('(min-width:1024px)').matches) {
    chListPane.classList.add('hidden');
    chListPane.classList.remove('lg:block');
    chDetailPane.classList.remove('hidden');
  }
  refreshIcons();
  chDetailPane.scrollTo?.({top:0, behavior:'instant'});
}

document.querySelectorAll('.change-item').forEach(b => {
  b.addEventListener('click', () => selectChange(b.getAttribute('data-change-item'), true));
});
document.getElementById('changesDetailBack')?.addEventListener('click', () => {
  chDetailPane.classList.add('hidden');
  chListPane.classList.remove('hidden');
  chListPane.classList.add('lg:block');
});

/* ============================================================
   [R3] 문서 · 산출물 허브
   ============================================================ */


const docListViewEl = document.getElementById('docListView');
const docGridViewEl = document.getElementById('docGridView');
const docDetailPane = document.getElementById('docDetailPane');
const docDetailBody = document.getElementById('docDetailBody');
const docListPaneEl = document.getElementById('docListPane');

function selectDoc(id, autoOpenDetail){
  const d = DOC_DATA[id]; if (!d) return;
  document.querySelectorAll('.doc-item').forEach(b => {
    if (b.getAttribute('data-doc-item') === id) b.classList.add('bg-bg-secondary');
    else b.classList.remove('bg-bg-secondary');
  });
  document.getElementById('docMobileTitle').textContent = d.name;

  docDetailBody.innerHTML = `
    <!-- 프리뷰 -->
    <section class="bg-white border border-bd-default rounded-xl shadow-subtle mb-4 overflow-hidden">
      <div class="preview-ph h-48 flex items-center justify-center border-b border-bd-default">
        <span class="text-[11px] font-bold px-2.5 py-1 rounded ${d.cls} border">${d.type}</span>
      </div>
      <div class="flex items-center gap-2 p-3">
        <button class="h-9 px-3 rounded-md bg-brand-primary text-white text-[12px] font-semibold hover:bg-brand-hover inline-flex items-center gap-1.5"><i data-lucide="download" class="w-3.5 h-3.5"></i>다운로드</button>
        <button class="h-9 px-3 rounded-md border border-bd-default text-[12px] font-semibold hover:bg-bg-secondary inline-flex items-center gap-1.5"><i data-lucide="share-2" class="w-3.5 h-3.5"></i>공유</button>
        <button class="h-9 px-3 rounded-md border border-bd-default text-[12px] font-semibold hover:bg-bg-secondary inline-flex items-center gap-1.5"><i data-lucide="message-square" class="w-3.5 h-3.5"></i>코멘트</button>
      </div>
    </section>

    <!-- 메타 -->
    <section class="bg-white border border-bd-default rounded-xl shadow-subtle mb-4 p-5">
      <div class="flex items-start justify-between gap-2 mb-2">
        <h2 class="text-[17px] font-semibold leading-snug">${d.name}</h2>
        ${badge(d.status, d.statusTone)}
      </div>
      <div class="text-[12px] text-tx-secondary grid grid-cols-2 gap-y-1.5 mt-3">
        <span>현재 버전</span><span class="text-tx-primary font-medium tabular">${d.ver}</span>
        <span>유형</span><span class="text-tx-primary font-medium">${d.type}</span>
        <span>크기</span><span class="text-tx-primary font-medium">${d.size}</span>
        <span>업로드자</span><span class="text-tx-primary font-medium">${d.uploader}</span>
        <span>업로드일</span><span class="text-tx-primary font-medium">${d.uploadedAt}</span>
        <span>프로젝트</span><a href="#project" class="text-brand-primary font-medium hover:underline">${d.project}</a>
        <span>단계</span><span class="text-tx-primary font-medium">${d.milestone}</span>
      </div>
    </section>

    <!-- 버전 히스토리 -->
    <section class="mb-4">
      <h3 class="text-[14px] font-semibold mb-3">버전 히스토리</h3>
      <div class="bg-white border border-bd-default rounded-xl shadow-subtle">
        <ol class="divide-y divide-bd-default">
          ${d.versions.map((v,i)=>`
            <li class="p-4">
              <div class="flex items-center gap-2">
                <span class="text-[13px] font-semibold tabular">${v.v}</span>
                ${i===0 ? '<span class="text-[10px] font-semibold text-tx-tertiary">(현재)</span>' : ''}
                ${badge(v.status, v.statusTone)}
              </div>
              <div class="text-[11px] text-tx-tertiary mt-1">${v.by} · ${v.at}</div>
              ${v.note ? `<div class="text-[12px] text-tx-secondary mt-1">"${v.note}"</div>` : ''}
              ${i!==0 ? `<div class="flex items-center gap-2 mt-2">
                <button class="h-7 px-2 text-[11px] rounded border border-bd-default hover:bg-bg-secondary">이전과 비교</button>
                <button class="h-7 px-2 text-[11px] rounded border border-bd-default hover:bg-bg-secondary inline-flex items-center gap-1"><i data-lucide="download" class="w-3 h-3"></i>다운로드</button>
              </div>` : ''}
            </li>`).join('')}
        </ol>
      </div>
    </section>

    <!-- 연결된 항목 -->
    <section>
      <h3 class="text-[14px] font-semibold mb-3">연결된 항목</h3>
      <div class="bg-white border border-bd-default rounded-xl shadow-subtle">
        ${d.linked.length ? `<ul class="divide-y divide-bd-default">
          ${d.linked.map(l=>`
            <li><a href="${l.href}" class="flex items-center gap-3 px-5 py-3 hover:bg-bg-secondary">
              <i data-lucide="${l.kind==='approval'?'file-check-2':l.kind==='change'?'git-pull-request':'file-text'}" class="w-4 h-4 text-tx-secondary"></i>
              <div class="flex-1 min-w-0"><div class="text-[13px] font-medium truncate">${l.name}</div></div>
              <i data-lucide="external-link" class="w-4 h-4 text-tx-tertiary"></i>
            </a></li>`).join('')}
        </ul>` : `<div class="px-5 py-4 text-[13px] text-tx-tertiary">연결된 항목이 없습니다.</div>`}
      </div>
    </section>
  `;

  if (autoOpenDetail || !window.matchMedia('(min-width:1024px)').matches) {
    // 모바일에서는 상세 전체 화면
    if (!window.matchMedia('(min-width:1024px)').matches) {
      docListPaneEl.classList.add('hidden');
    }
    docDetailPane.classList.remove('hidden');
  }
  refreshIcons();
}

document.querySelectorAll('.doc-item').forEach(b => {
  b.addEventListener('click', () => selectDoc(b.getAttribute('data-doc-item'), true));
});
document.getElementById('docDetailBack')?.addEventListener('click', () => {
  docDetailPane.classList.add('hidden');
  docListPaneEl.classList.remove('hidden');
});

// 문서 뷰 토글
document.getElementById('docViewList')?.addEventListener('click', () => {
  docListViewEl.classList.remove('hidden');
  docGridViewEl.classList.add('hidden');
  docGridViewEl.classList.remove('grid');
  document.getElementById('docViewList').classList.add('bg-white','shadow-subtle','active');
  document.getElementById('docViewList').classList.remove('text-tx-secondary');
  document.getElementById('docViewGrid').classList.remove('bg-white','shadow-subtle','active');
  document.getElementById('docViewGrid').classList.add('text-tx-secondary');
});
document.getElementById('docViewGrid')?.addEventListener('click', () => {
  docListViewEl.classList.add('hidden');
  docGridViewEl.classList.remove('hidden');
  docGridViewEl.classList.add('grid');
  document.getElementById('docViewGrid').classList.add('bg-white','shadow-subtle','active');
  document.getElementById('docViewGrid').classList.remove('text-tx-secondary');
  document.getElementById('docViewList').classList.remove('bg-white','shadow-subtle','active');
  document.getElementById('docViewList').classList.add('text-tx-secondary');
});

/* ============================================================
   [R3] 알림 · 마이페이지 탭
   ============================================================ */
function switchProfTab(which){
  const isNotif = which === 'notif';
  document.getElementById('profPanelNotif')?.classList.toggle('hidden', !isNotif);
  document.getElementById('profPanelMy')?.classList.toggle('hidden', isNotif);
  const t1 = document.getElementById('profTabNotif'), t2 = document.getElementById('profTabMy');
  t1?.classList.toggle('tab-active', isNotif);
  t1?.classList.toggle('border-brand-primary', isNotif); t1?.classList.toggle('text-tx-primary', isNotif);
  t1?.classList.toggle('border-transparent', !isNotif); t1?.classList.toggle('text-tx-tertiary', !isNotif);
  t2?.classList.toggle('tab-active', !isNotif);
  t2?.classList.toggle('border-brand-primary', !isNotif); t2?.classList.toggle('text-tx-primary', !isNotif);
  t2?.classList.toggle('border-transparent', isNotif); t2?.classList.toggle('text-tx-tertiary', isNotif);
}
document.querySelectorAll('[data-prof-tab]').forEach(b => b.addEventListener('click', () => switchProfTab(b.dataset.profTab)));

function applyProfileEntryTab(){
  const tab = window._pendingProfileTab || (window._goMy ? 'my' : null);
  window._pendingProfileTab = null;
  window._goMy = false;
  if (tab === 'my' || tab === 'notif') {
    switchProfTab(tab);
  }
}

document.addEventListener('click', (e) => {
  const entry = e.target.closest('[data-profile-tab]');
  if (!entry) return;
  const tab = entry.getAttribute('data-profile-tab');
  if (tab !== 'notif' && tab !== 'my') return;
  window._pendingProfileTab = tab;
  const current = (location.hash || '').replace('#','').split('?')[0];
  if (current === 'profile') {
    applyProfileEntryTab();
  }
});

