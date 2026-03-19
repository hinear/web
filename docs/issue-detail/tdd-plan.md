# TDD Plan

## 접근 방식

UI부터 만들지 않는다. 먼저 도메인 규칙과 저장 동작을 테스트로 잠그고, 그 다음 컴포넌트와 E2E를 얹는다.

핵심은 "보이는 것"보다 "행동이 맞는가"를 먼저 고정하는 것이다.

현재 데스크탑 기준에서는 `Issue Detail / Full page`를 1차 테스트 대상 화면으로 본다. `drawer`는 같은 detail model을 공유하는 compact exploration이므로, 초기에 full page 기준 테스트를 먼저 잠근다.

브레이크포인트별 테스트 기준은 아래와 같다.

- Desktop
  - full-page detail route 우선 검증
- Tablet
  - compact drawer -> `open full page` 연결 검증
- Mobile
  - issue tap -> full-page detail
  - create success -> full-page detail

## 테스트 레이어

### 1. 도메인 테스트

책임:

- 기본 상태 보장
- 입력 검증
- 중복 방지
- 활동 로그 정렬 규칙

첫 테스트:

- 새 이슈는 기본 상태가 `Triage`다
- 빈 제목은 저장할 수 없다
- 빈 코멘트는 작성할 수 없다

### 2. 애플리케이션 서비스 테스트

책임:

- `updateIssue`
- `createComment`
- 저장소 호출과 반환 상태 연결

첫 테스트:

- 제목 수정이 저장된다
- 상태 변경이 저장된다
- 코멘트 작성 시 새 코멘트가 추가된다

### 3. 컴포넌트 테스트

책임:

- 로딩 상태
- 필드 편집
- optimistic update와 rollback
- activity log 렌더링
- metadata 렌더링
- breakpoint별 route / layout rule

첫 테스트:

- 제목 인라인 편집 후 저장 성공
- 제목 저장 실패 시 rollback
- `Triage`에서 `Backlog`로 상태 변경
- 코멘트 작성 성공
- full page에서 metadata와 activity log가 함께 렌더링됨
- tablet drawer에서 `open full page` action이 보임
- mobile issue detail이 full-page card stack으로 렌더링됨

### 4. E2E 테스트

책임:

- 실제 사용자 흐름 검증
- 페이지 리로드 이후 데이터 확인

첫 테스트:

1. 이슈 상세 페이지 진입
2. metadata와 activity log 영역 확인
3. 상태를 `Triage`에서 `Todo`로 변경
4. 제목과 설명 수정
5. 코멘트 작성
6. activity log 확인
7. tablet drawer에서 full page 진입 확인
8. mobile create 후 full page detail 진입 확인

## 구현 순서

1. 계약 타입과 mock repository를 정의한다.
2. 도메인 테스트를 먼저 통과시킨다.
3. 서비스 테스트를 추가한다.
4. 최소 UI를 만든다.
5. full page route를 우선 통과시킨다.
6. 컴포넌트 테스트를 통과시킨다.
7. Playwright로 핵심 흐름 하나를 잠근다.

## 추천 스택

- 앱 프레임워크: `Next.js`
- 단위/통합 테스트: `Vitest` 또는 `Jest`
- 컴포넌트 테스트: `React Testing Library`
- E2E: `Playwright`
- 백엔드: `Supabase Auth`, `Supabase Postgres`, `Supabase Edge Functions`
- 예약 작업: `Supabase Cron`
- 알림: `Firebase Cloud Messaging`
- API 목킹: `MSW` 또는 mock repository

## Definition of Done

- `Triage` 기본 상태가 테스트로 보장된다
- 핵심 필드 편집이 테스트로 보장된다
- 실패 시 rollback이 테스트로 보장된다
- activity log가 테스트로 보장된다
- full page detail route가 source of truth로 테스트된다
- 핵심 triage 흐름 E2E 1개 이상이 존재한다

## 관련 스펙

- [테스트 계획 원본](/Users/choiho/zerone/hinear/specs/issue-detail.test-plan.md)
- [PWA/Firebase 알림 설계](/Users/choiho/zerone/hinear/docs/issue-detail/pwa-firebase-notifications.md)
