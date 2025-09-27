---
trigger: manual
---

# UI Rules (Next.js + Tailwind v4 + shadcn 기반)

## Base
- 앱 공통 UI는 shadcn(ui) 컴포넌트만 사용한다.
- 오버레이/포커스/트랩/단축키 등 접근성 로직은 Radix(shadcn 기본)를 기준으로 통일한다.

## Extensions (허용된 라이브러리)
- Table: TanStack Table (+ Virtual)
- Chart: Recharts
- Command Palette: cmdk
- Date/Calendar: react-day-picker
- Carousel: Embla
- Rich Text: Tiptap
- Upload: UploadThing (대체: Uppy)
- Tour: Driver.js (강제 클릭/폼 자동화 금지)
- Motion: Framer Motion + Magic UI (핵심 섹션 한정)

## Theme
- 색/간격/라운드/모션은 `:root` CSS 변수로 선언하고 Tailwind `@theme`로 매핑한다.
- Primary/Accent/Success/Warning/Danger 컬러 대비는 WCAG AA 이상을 유지한다.
- 한 화면(뷰)에서 그라데이션 계열은 1종만 허용한다.

## Accessibility (필수 통과)
- 키보드 내비: Tab → Shift+Tab → Escape → Arrow 완주 확인.
- focus-visible 테두리 2px 이상, 대비 AA.
- 아이콘 버튼 `aria-label` 필수. 폼 오류 `aria-describedby` 연결.
- `prefers-reduced-motion: reduce`에서 모든 모션 비활성.

## Performance (필수 통과)
- 차트/에디터/맵/캐러셀/투어는 dynamic import로 지연 로딩.
- 200개↑ 리스트는 가상화(TanStack Virtual).
- 첫 진입 JS ≤ 180KB(gzip) 목표. 초과 시 분리 계획 제시.
- 이미지 `next/image` 필수, 폰트 최대 2종, `swap/optional` 적용.

## Review Checklist
- [ ] shadcn 컴포넌트만으로 가능했는지 검토했는가?
- [ ] 외부 라이브러리 도입 시 UI는 shadcn로 감쌌는가?
- [ ] 컬러/토큰을 직접 값으로 쓰지 않고 변수로 참조했는가?
- [ ] 대비/포커스/레이블/모션 감소 모드를 통과하는가?
- [ ] 차트/에디터/맵을 지연 로딩했는가?
- [ ] 긴 목록에 가상화를 적용했는가?
