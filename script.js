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
            // 움직임 최소화 선호: 영상 로드/재생하지 않고 포스터만 표시
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
     * 2) 문의 모달 (접근성: ESC 닫기 / 포커스 트랩 / 트리거 포커스 복원)
     * ------------------------------------------------------------- */
    const qaButton = document.getElementById('qa-button');
    const qaModal = document.getElementById('qa-modal');
    const qaIframe = document.getElementById('qa-iframe');
    const closeBtn = qaModal ? qaModal.querySelector('.close-btn') : null;
    const scrollTopBtn = document.getElementById('scroll-top-btn');
    const FORM_URL = 'https://forms.office.com/r/z4nQpL05h6';

    let lastFocused = null;

    const getFocusable = () =>
        qaModal.querySelectorAll('button, [href], iframe, input, select, textarea, [tabindex]:not([tabindex="-1"])');

    const openModal = () => {
        lastFocused = document.activeElement;
        qaIframe.src = FORM_URL;
        qaModal.hidden = false;
        qaModal.classList.add('is-open');
        document.body.style.overflow = 'hidden';
        // 포커스를 모달 내부(닫기 버튼)로 이동
        if (closeBtn) closeBtn.focus();
        document.addEventListener('keydown', onKeydown);
    };

    const closeModal = () => {
        qaModal.classList.remove('is-open');
        qaModal.hidden = true;
        qaIframe.src = '';
        document.body.style.overflow = '';
        document.removeEventListener('keydown', onKeydown);
        // 트리거 버튼으로 포커스 복원
        if (lastFocused) lastFocused.focus();
    };

    const onKeydown = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            return;
        }
        // 포커스 트랩
        if (e.key === 'Tab') {
            const focusables = Array.from(getFocusable());
            if (focusables.length === 0) return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    };

    if (qaButton && qaModal) {
        qaButton.addEventListener('click', openModal);
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        // 배경(오버레이) 클릭 시 닫기
        qaModal.addEventListener('click', (event) => {
            if (event.target === qaModal) closeModal();
        });
    }

    /* ---------------------------------------------------------------
     * 3) 스크롤 진입 애니메이션 (IntersectionObserver, 라이브러리 無)
     *    - prefers-reduced-motion 사용자에겐 즉시 표시
     * ------------------------------------------------------------- */
    const revealEls = document.querySelectorAll('[data-reveal]');
    if (reduceMotion || !('IntersectionObserver' in window)) {
        revealEls.forEach((el) => el.classList.add('is-visible'));
    } else {
        const io = new IntersectionObserver((entries, obs) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });
        revealEls.forEach((el) => io.observe(el));
    }

    /* ---------------------------------------------------------------
     * 4) 연구데이터 분석 대시보드
     *    - 초기 로딩 가볍게: 대시보드가 화면에 가까워질 때 Chart.js 지연 로드
     *    - 데이터는 assets/dashboard-data.json (실데이터 수신 시 이 파일만 교체)
     * ------------------------------------------------------------- */
    const dashboard = document.querySelector('.dashboard-section');
    if (dashboard) {
        const palette = ['#2b7aa8', '#54b0d6', '#1d5c80', '#8fd0e8', '#9aa7b0'];

        const loadScript = (src) => new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = src;
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
        });

        const renderDashboard = (d) => {
            Chart.defaults.color = '#9aa7b0';
            Chart.defaults.font.family = "'Inter', sans-serif";
            const grid = { color: 'rgba(255,255,255,.08)' };

            // 데이터 출처 안내
            const note = document.getElementById('dashboard-note');
            if (note && d.meta && d.meta.note) {
                note.textContent = '※ ' + d.meta.note;
                note.hidden = false;
            }
            const setTitle = (id, t) => { const e = document.getElementById(id); if (e && t) e.textContent = t; };

            // 1) 공정 제어 프로파일 (시간별 도징량 + 내부온도, 이중 축)
            const prof = d.profile;
            if (prof) {
                setTitle('chart-trend-title', prof.title);
                new Chart(document.getElementById('chart-trend'), {
                    type: 'line',
                    data: {
                        labels: prof.labels,
                        datasets: [
                            { label: '펌프 도징량 (ml/min)', data: prof.dosing, yAxisID: 'y',
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

            // 2) 차수별 평균 도징량 (bar)
            const dbr = d.dosingByRun;
            if (dbr) {
                setTitle('chart-composition-title', dbr.title);
                new Chart(document.getElementById('chart-composition'), {
                    type: 'bar',
                    data: { labels: dbr.labels, datasets: [{ label: '평균 도징량(' + (dbr.unit || '') + ')', data: dbr.data, backgroundColor: palette[0], borderRadius: 6 }] },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { y: { grid, ticks: { callback: (v) => v + ' ' + (dbr.unit || '') } }, x: { grid } }
                    }
                });
            }

            // 3) 차수별 실제 수율 (bar)
            const ybr = d.yieldByRun;
            if (ybr) {
                setTitle('chart-solvent-title', ybr.title);
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
            try {
                await loadScript('assets/chart.min.js');
                const res = await fetch('assets/dashboard-data.json', { cache: 'no-cache' });
                renderDashboard(await res.json());
            } catch (e) {
                const note = document.getElementById('dashboard-note');
                if (note) { note.textContent = '대시보드 데이터를 불러오지 못했습니다.'; note.hidden = false; }
            }
        };

        if ('IntersectionObserver' in window) {
            const dio = new IntersectionObserver((entries, obs) => {
                if (entries.some((en) => en.isIntersecting)) { obs.disconnect(); initDashboard(); }
            }, { rootMargin: '200px' });
            dio.observe(dashboard);
        } else {
            initDashboard();
        }
    }

    /* ---------------------------------------------------------------
     * 5) 맨 위로 이동 버튼
     * ------------------------------------------------------------- */
    if (scrollTopBtn) {
        const syncScrollTopButton = () => {
            scrollTopBtn.classList.toggle('is-visible', window.scrollY > 360);
        };

        window.addEventListener('scroll', syncScrollTopButton, { passive: true });
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
        });
        syncScrollTopButton();
    }
});
