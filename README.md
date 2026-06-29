# Zero-day-eaphos — 이에이포스(EA PHOS) 홈페이지 개선

> 폴리텍 일경험 프로젝트 — 주식회사 이에이포스 웹사이트 개선 + 연구데이터 시각화

폐배터리(이차전지) 재활용 희유금속 추출제·정제 솔루션 전문 기업 **이에이포스**의 홈페이지를
**빌드 스텝 없는 순수 정적 사이트(HTML·CSS·JS)** 구조 그대로 개선했습니다. nginx에 파일을 그대로 복사해 서빙합니다.

---

## 핵심 성과

> **초기 로딩 자산 134MB → 약 5.8MB (96%↓)** · **Google Lighthouse 4개 항목 만점 (100·100·100·100)**

| Lighthouse | Before | After |
|---|---|---|
| Performance | 64 | **100** |
| Accessibility | 96 | **100** |
| Best Practices | 100 | **100** |
| SEO | 100 | **100** |
| FCP / LCP / CLS | 3.0s / 3.4s / 0.495 | **0.8s / 1.5s / 0** |

| 자산 | Before | After |
|---|---|---|
| 메인 / 모바일 영상 | 66MB / 65MB | **2.8MB / 3.0MB** (무음·faststart, 화면 폭별 1개만 로드) |
| 콘텐츠 이미지 | 각 ~800KB (40~52MP) | **각 ~150KB** (WebP) |
| **전송량 합계** | **약 134MB** | **약 5.8MB** |

---

## 주요 개선

**성능**
- 영상 재인코딩(H.264 CRF28·무음·faststart) + 단일 `<video>`에 `matchMedia`로 해당 영상만 동적 주입 → 숨은 영상 67MB 낭비 제거
- 이미지 WebP 적정 해상도 리사이즈, 웹폰트 비차단 로드(렌더 블로킹 제거)
- 영상·이미지 종횡비 예약으로 **CLS 0** → Lighthouse 만점

**콘텐츠 · 디자인**
- **회사 소개·연락처**, **전략 소재 분야 카드**, **수상·언론보도** 섹션 신규(텍스트 콘텐츠 사실상 0 → 충실)
- 첫 방문자 동선을 고려해 **회사 소개를 최상단**에 배치, 섹션 배경 교차로 구분
- 디자인 토큰(`:root`) 도입, 네온민트 → **브랜드 스틸블루** 통일, 히어로 태그라인·스크롤 진입 효과·맨 위로 버튼

**접근성**
- 시맨틱 구조(`<main>`/`<h1>`/`aria`)·이미지 `alt`, 모달 표준 대응(`role="dialog"`·ESC·포커스 트랩/복원)
- `prefers-reduced-motion`·`:focus-visible`·한글 줄바꿈(`word-break: keep-all`)

**연구데이터 시각화**
- 자체 실험 데이터(2024.11~2025.03)를 Python(`pandas`·`openpyxl`)으로 분석 → 홈은 **"데이터 기반 R&D" 소개 패널**, 상세는 **데이터 모달**(공정 제어 안정성 · 회차별 투입량 · 실제 수율)
- 실측값만 사용(내부 코드명 비노출). 실제 수율 기록이 적어 **예측 모델 대신 신뢰 가능한 분석만** 반영 — 데이터가 쌓이면 `dashboard-data.json` 교체만으로 확장
- Chart.js는 로컬 벤더링 + 모달 첫 오픈 시 지연 로드(초기 성능 보존)

**SEO · 버그**
- `og:image`(신규)·`twitter:card`·`theme-color`·`robots.txt`·`sitemap.xml`·Organization JSON-LD
- 문의 모달 `iframe`이 페이지를 자기 자신으로 재로딩하던 버그 제거

---

## 페이지 구성

1. 히어로 영상 + 태그라인
2. **회사 소개 · 연락처** (사업 소개 · 핵심 제품 · 전화/이메일/주소)
3. 전략 소재 분야 (금속 · 희토류 카드)
4. 수상 · 언론보도
5. 데이터 기반 R&D (소개 패널 → "살펴보기"로 데이터 모달)
6. 문의하기 → 푸터

## 기술 스택

- 순수 **HTML / CSS / JavaScript** — 프레임워크 · 번들러 · 빌드 없음
- 외부 의존성: 웹폰트(Google Fonts), Chart.js(로컬 벤더링). 그 외는 브라우저 내장 API
- 작업 도구: `ffmpeg`(영상), `Pillow`(WebP), `pandas`·`openpyxl`(데이터 분석)

## 디렉터리 구조

```
.
├── index.html
├── style.css
├── script.js
├── robots.txt · sitemap.xml · fav.ico
├── docs/발표자료.md            # 발표/문서 (배포 제외)
└── assets/
    ├── video.mp4, video2.mp4       # 영상(데스크탑/모바일)
    ├── poster*.webp                # 영상 포스터(reduced-motion 대체)
    ├── meta.webp                   # 공유 미리보기(og:image)
    ├── footer.webp                 # 푸터 로고
    ├── chart.min.js                # Chart.js (로컬 벤더링)
    └── dashboard-data.json         # 대시보드 데이터(교체만으로 갱신)
```

## 배포 (Cyberduck → nginx)

1. 루트 파일과 `assets/`를 nginx `/var/www/html`에 업로드 — 빌드 불필요, 파일 그대로 서빙.
2. ⚠️ `assets/_original/`(원본 백업)·`assets/272 데이터/`(원본 실험 데이터)는 **업로드·커밋 제외**(`.gitignore`).

## 향후

- 수율 **예측 모델** — 실측 기반 분석은 완료, 수율 기록이 더 쌓이면 상관·회귀로 확장(`dashboard-data.json` 교체).
- 회사 **연혁 타임라인** 섹션, 국·영문(다국어), 자체 문의 백엔드(현재 MS Forms).
- 서버: HTTPS(certbot), nginx `gzip`·정적 캐시 헤더.

---

📑 발표용 정리는 [`docs/발표자료.md`](docs/발표자료.md) 참고.
