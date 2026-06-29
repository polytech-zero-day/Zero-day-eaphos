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

            // 샘플 데이터 안내
            const note = document.getElementById('dashboard-note');
            if (note && d.meta && d.meta.isSample) {
                note.textContent = '※ ' + (d.meta.note || '샘플(예시) 데이터입니다.');
                note.hidden = false;
            }
            const setTitle = (id, t) => { const e = document.getElementById(id); if (e && t) e.textContent = t; };

            // 1) 추출 효율 추세 (line)
            const trend = d.extractionTrend;
            if (trend) {
                setTitle('chart-trend-title', trend.title);
                new Chart(document.getElementById('chart-trend'), {
                    type: 'line',
                    data: {
                        labels: trend.labels,
                        datasets: trend.series.map((s, i) => ({
                            label: s.label,
                            data: s.data,
                            borderColor: palette[i % palette.length],
                            backgroundColor: palette[i % palette.length],
                            tension: 0.35,
                            borderWidth: 2,
                            pointRadius: 2
                        }))
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { position: 'bottom' } },
                        scales: { y: { grid, ticks: { callback: (v) => v + (trend.unit || '') } }, x: { grid } }
                    }
                });
            }

            // 2) 회수 금속 구성비 (doughnut)
            const comp = d.metalComposition;
            if (comp) {
                setTitle('chart-composition-title', comp.title);
                new Chart(document.getElementById('chart-composition'), {
                    type: 'doughnut',
                    data: { labels: comp.labels, datasets: [{ data: comp.data, backgroundColor: palette, borderColor: '#12161a', borderWidth: 2 }] },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
                });
            }

            // 3) 용매별 회수율 (bar)
            const solv = d.solventRecovery;
            if (solv) {
                setTitle('chart-solvent-title', solv.title);
                new Chart(document.getElementById('chart-solvent'), {
                    type: 'bar',
                    data: { labels: solv.labels, datasets: [{ label: '회수율(' + (solv.unit || '%') + ')', data: solv.data, backgroundColor: palette[0], borderRadius: 6 }] },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { y: { grid, ticks: { callback: (v) => v + (solv.unit || '') } }, x: { grid } }
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
