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
});
