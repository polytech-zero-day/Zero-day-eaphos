document.addEventListener('DOMContentLoaded', () => {
    const qaButton = document.getElementById('qa-button');
    const qaModal = document.getElementById('qa-modal');
    const qaIframe = document.getElementById('qa-iframe');
    const closeBtn = document.querySelector('.close-btn');

    // Q&A 버튼 클릭 시 모달 오픈
    qaButton.addEventListener('click', () => {
        const formUrl = 'https://forms.office.com/r/z4nQpL05h6';
        // const formUrl = 'https://forms.gle/VT7fyWVBx94A3BCU6';

        qaIframe.src = formUrl;
        qaModal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // 배경 스크롤 방지
    });

    // 닫기 버튼 클릭 시 모달 종료
    closeBtn.addEventListener('click', () => {
        qaModal.style.display = 'none';
        qaIframe.src = ''; // iframe 초기화
        document.body.style.overflow = 'auto'; // 스크롤 복구
    });

    // 배경 클릭 시 모달 종료
    window.addEventListener('click', (event) => {
        if (event.target === qaModal) {
            qaModal.style.display = 'none';
            qaIframe.src = '';
            document.body.style.overflow = 'auto';
        }
    });
});
