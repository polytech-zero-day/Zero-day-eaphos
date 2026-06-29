document.addEventListener('DOMContentLoaded', () => {
    const qaButton = document.getElementById('qa-button');
    const qaModal = document.getElementById('qa-modal');
    const qaIframe = document.getElementById('qa-iframe');
    const closeBtn = document.querySelector('.close-btn');
    const scrollTopBtn = document.getElementById('scroll-top-btn');

    // MS Forms 주소
    const formUrl = 'https://forms.office.com/r/z4nQpL05h6';

    // 1. 모달 제어 및 접근성(A11y) 로직
    const openModal = () => {
        qaIframe.src = formUrl;
        qaModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        closeBtn.focus(); // 스크린 리더 포커스 이동
    };

    const closeModal = () => {
        qaModal.style.display = 'none';
        qaIframe.src = 'about:blank'; // 자가 재로딩 버그 완벽 차단
        document.body.style.overflow = 'auto';
        qaButton.focus(); // 닫은 후 원래 버튼으로 포커스 복귀
    };

    qaButton.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);

    // 배경 클릭 및 ESC 키 닫기 지원
    window.addEventListener('click', (event) => {
        if (event.target === qaModal) closeModal();
    });
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && qaModal.style.display === 'block') {
            closeModal();
        }
    });

    // 2. 스크롤 진입 (Fade-up) 애니메이션 (Intersection Observer)
    const fadeElements = document.querySelectorAll('.fade-up');
    
    // 사용자가 모션 감소 설정을 켜두지 않았을 때만 실행
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (!prefersReducedMotion && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target); // 한 번 보이면 관찰 중단
                }
            });
        }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

        fadeElements.forEach(el => observer.observe(el));
    } else {
        // 옵저버 미지원 혹은 모션 감소 설정 시 바로 보이게 처리
        fadeElements.forEach(el => el.classList.add('visible'));
    }

    // 3. 플로팅 탑 버튼 로직
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }
    });

    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});