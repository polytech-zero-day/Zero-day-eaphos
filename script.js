document.addEventListener('DOMContentLoaded', () => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------------------------------------------------------------
     * 1) 히어로 영상: 화면 폭에 맞는 영상 1개만 다운로드
     *    - prefers-reduced-motion 사용자에겐 영상 대신 포스터 정지컷 노출
     * ------------------------------------------------------------- */
    const heroVideo = document.getElementById('hero-video');
    if (heroVideo) {
        heroVideo.poster = isMobile ? 'assets/poster_mobile.webp' : 'assets/poster.webp';
        if (reduceMotion) {
            heroVideo.removeAttribute('autoplay');
        } else {
            const source = document.createElement('source');
            source.src = isMobile ? 'assets/video2.mp4' : 'assets/video.mp4';
            source.type = 'video/mp4';
            heroVideo.appendChild(source);
            heroVideo.load();
        }
    }

    /* ---------------------------------------------------------------
     * 2) 범용 모달 헬퍼 (ESC 닫기 / 포커스 트랩 / 트리거 포커스 복원)
     * ------------------------------------------------------------- */
    const setupModal = (modal, { onOpen, onClose } = {}) => {
        if (!modal) return null;
        let lastFocused = null;
        const focusables = () => modal.querySelectorAll('button, [href], iframe, input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const onKeydown = (e) => {
            if (e.key === 'Escape') { close(); return; }
            if (e.key === 'Tab') {
                const f = Array.from(focusables());
                if (!f.length) return;
                const first = f[0], last = f[f.length - 1];
                if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
                else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
            }
        };
        const open = () => {
            lastFocused = document.activeElement;
            modal.hidden = false;
            modal.classList.add('is-open');
            document.body.style.overflow = 'hidden';
            const f = focusables();
            if (f.length) f[0].focus();
            document.addEventListener('keydown', onKeydown);
            if (onOpen) onOpen();
        };
        const close = () => {
            modal.classList.remove('is-open');
            modal.hidden = true;
            document.body.style.overflow = '';
            document.removeEventListener('keydown', onKeydown);
            if (onClose) onClose();
            if (lastFocused) lastFocused.focus();
        };
        modal.querySelectorAll('.close-btn, [data-close]').forEach((el) => el.addEventListener('click', close));
        modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
        return { open, close };
    };

    /* 2a) 문의 모달 (폼 iframe) */
    const qaModal = document.getElementById('qa-modal');
    const qaIframe = document.getElementById('qa-iframe');
    const FORM_URL = 'https://forms.office.com/r/z4nQpL05h6';
    const qa = setupModal(qaModal, {
        onOpen: () => { if (qaIframe) qaIframe.src = FORM_URL; },
        onClose: () => { if (qaIframe) qaIframe.src = ''; }
    });
    const qaButton = document.getElementById('qa-button');
    if (qaButton && qa) qaButton.addEventListener('click', qa.open);

    /* ---------------------------------------------------------------
     * 3) 스크롤 진입 애니메이션 (IntersectionObserver, 라이브러리 無)
     * ------------------------------------------------------------- */
    const revealEls = document.querySelectorAll('[data-reveal]');
    if (reduceMotion || !('IntersectionObserver' in window)) {
        revealEls.forEach((el) => el.classList.add('is-visible'));
    } else {
        const io = new IntersectionObserver((entries, obs) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) { entry.target.classList.add('is-visible'); obs.unobserve(entry.target); }
            });
        }, { threshold: 0.15 });
        revealEls.forEach((el) => io.observe(el));
    }

    /* ---------------------------------------------------------------
     * 4) 연구개발 데이터 모달 (버튼 클릭 시 열림 → 첫 오픈에 Chart.js 지연 로드)
     *    - 데이터: assets/dashboard-data.json (추가 데이터 시 이 파일만 교체)
     * ------------------------------------------------------------- */
    const dashButton = document.getElementById('dash-button');
    const dashModal = document.getElementById('dash-modal');
    if (dashButton && dashModal) {
        const palette = ['#2b7aa8', '#54b0d6', '#1d5c80', '#8fd0e8', '#9aa7b0'];
        let rendered = false;

        const loadScript = (src) => new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = src; s.onload = resolve; s.onerror = reject;
            document.head.appendChild(s);
        });

        const setText = (id, t) => { const e = document.getElementById(id); if (e && t) { e.textContent = t; e.hidden = false; } };

        const renderDashboard = (d) => {
            Chart.defaults.color = '#9aa7b0';
            Chart.defaults.font.family = "'Inter', sans-serif";
            const grid = { color: 'rgba(255,255,255,.08)' };

            if (d.meta && d.meta.note) setText('dashboard-note', '※ ' + d.meta.note);

            // 1) 공정 제어 안정성 (시간별 투입량 + 내부온도, 이중 축)
            const prof = d.profile;
            if (prof) {
                setText('chart-trend-title', prof.title);
                setText('chart-trend-cap', prof.caption);
                new Chart(document.getElementById('chart-trend'), {
                    type: 'line',
                    data: {
                        labels: prof.labels,
                        datasets: [
                            { label: '원료 투입량 (ml/min)', data: prof.dosing, yAxisID: 'y',
                              borderColor: palette[0], backgroundColor: palette[0], tension: 0.3, borderWidth: 2, pointRadius: 0 },
                            { label: '내부온도 (℃)', data: prof.temp, yAxisID: 'y1',
                              borderColor: palette[3], backgroundColor: palette[3], tension: 0.3, borderWidth: 2, pointRadius: 0, borderDash: [4, 3] }
                        ]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        interaction: { mode: 'index', intersect: false },
                        plugins: { legend: { position: 'bottom' } },
                        scales: {
                            x: { grid, title: { display: true, text: '경과 시간 (min)' } },
                            y: { position: 'left', grid, title: { display: true, text: 'ml/min' } },
                            y1: { position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: '℃' } }
                        }
                    }
                });
            }

            // 2) 실험 회차별 평균 투입량 (bar)
            const dbr = d.dosingByRun;
            if (dbr) {
                setText('chart-composition-title', dbr.title);
                setText('chart-composition-cap', dbr.caption);
                new Chart(document.getElementById('chart-composition'), {
                    type: 'bar',
                    data: { labels: dbr.labels, datasets: [{ label: '평균 투입량(' + (dbr.unit || '') + ')', data: dbr.data, backgroundColor: palette[0], borderRadius: 6 }] },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { y: { grid, ticks: { callback: (v) => v + ' ' + (dbr.unit || '') } }, x: { grid } }
                    }
                });
            }

            // 3) 실제 수율 (bar)
            const ybr = d.yieldByRun;
            if (ybr) {
                setText('chart-solvent-title', ybr.title);
                setText('chart-solvent-cap', ybr.caption);
                new Chart(document.getElementById('chart-solvent'), {
                    type: 'bar',
                    data: { labels: ybr.labels, datasets: [{ label: '실제 수율(' + (ybr.unit || '%') + ')', data: ybr.data, backgroundColor: palette[1], borderRadius: 6 }] },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { y: { grid, ticks: { callback: (v) => v + (ybr.unit || '') } }, x: { grid } }
                    }
                });
            }
        };

        const initDashboard = async () => {
            if (rendered) return;
            rendered = true;
            try {
                if (typeof window.Chart === 'undefined') await loadScript('assets/chart.min.js');
                const res = await fetch('assets/dashboard-data.json', { cache: 'no-cache' });
                renderDashboard(await res.json());
            } catch (e) {
                rendered = false;
                setText('dashboard-note', '데이터를 불러오지 못했습니다.');
            }
        };

        const dash = setupModal(dashModal, { onOpen: initDashboard });
        dashButton.addEventListener('click', dash.open);
    }

    /* ---------------------------------------------------------------
     * 5) 맨 위로 이동 버튼
     * ------------------------------------------------------------- */
    const scrollTopBtn = document.getElementById('scroll-top-btn');
    if (scrollTopBtn) {
        const sync = () => scrollTopBtn.classList.toggle('is-visible', window.scrollY > 360);
        window.addEventListener('scroll', sync, { passive: true });
        scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));
        sync();
    }
});
