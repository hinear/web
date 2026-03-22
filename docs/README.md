# Docs

이 디렉터리는 `issue detail` 기능의 제품 문서와 개발 문서를 정리한다.

현재 범위는 Linear 스타일의 이슈 상세 페이지 한 화면에 집중하며, 기술 방향은 `Next.js + PWA + Supabase + Firebase FCM 웹 알림`이다.

현재 `.pen` 기준 데스크탑 베이스라인은 아래와 같다.

- MVP 1의 주 화면은 독립 `Issue Detail / Full page` route
- `Issue Detail / Drawer`는 같은 detail model을 공유하는 compact exploration
- `Issue List Page`와 `Project Dashboard`는 탐색 화면이며 MVP 기준 route는 아니다
- `Create Issue`는 지원 흐름이며, desktop/tablet에서는 생성 후 기본 오픈이 drawer다

현재 브레이크포인트 기준은 아래와 같다.

- Desktop `>= 1280px`
  - full page detail 우선
- Tablet `768px - 1279px`
  - board에서 issue를 탭하면 compact drawer 우선
  - create 성공 후에도 compact drawer를 먼저 열고 필요시 full page로 이동
  - full metadata / full history / long-form editing은 full page로 이동
- Mobile `< 768px`
  - issue tap 시 full page detail 우선
  - create 성공 후 full page detail 우선

현재 앱에 구현된 최소 흐름은 아래와 같다.

- `/projects/new`
- `/projects/[projectId]`
- `/projects/[projectId]/issues/[issueId]`

주의:

- 현재 app request path는 request-bound Supabase client + authenticated user context를 기준으로 동작한다
- `/auth`, `/auth/confirm`, `proxy.ts`까지 추가돼서 auth bootstrap은 들어갔다
- 로컬에서 쓰기 동작을 확인하려면 실제 Supabase auth 세션이 필요하다

## 문서 목록

- `session-handoff.md`
  - 다음 세션에서 바로 이어가기 위한 현재 상태와 다음 작업
- `todo.md`
  - 현재 남은 작업, 위험요소, 다음 구현 체크리스트
- `ui-primitives.md`
  - `pen` 기반 토큰 등록, primitive 구현 상태, Storybook 확인 경로
- `issue-detail/overview.md`
  - 기능 범위, 목표, 화면 구성, 핵심 요구사항
- `issue-detail/triage-workflow.md`
  - `Triage` 중심 워크플로우와 상태 전이 원칙
- `issue-detail/tdd-plan.md`
  - 테스트 전략, 레이어별 책임, 첫 구현 순서
- `issue-detail/contracts.md`
  - 도메인 타입과 저장소 계약 설명
- `issue-detail/implementation-plan.md`
  - 전체 구현 단계, 마일스톤, MVP 기준
- `issue-detail/pwa-firebase-notifications.md`
  - PWA, Supabase, Firebase FCM, 알림 처리 구조와 제약
- `issue-detail/project-model.md`
  - 프로젝트 중심 도메인 구조와 권한 모델
- `issue-detail/invitations.md`
  - 프로젝트 초대 흐름과 owner/member 권한 규칙
- `issue-detail/invitations-ui.md`
  - 초대 목록, 재발송, 취소, 수락 화면 기준
- `issue-detail/profiles-schema.md`
  - 작성자/멤버 표시용 profile 테이블 초안과 RLS 방향
- `issue-detail/members.md`
  - 프로젝트 멤버 목록, 역할 표시, 제거 규칙
- `issue-detail/project-settings.md`
  - 프로젝트 이름, key, type, 위험한 설정 변경 기준
- `issue-detail/supabase-schema.md`
  - 초기 Supabase Postgres 테이블, trigger, RLS 방향
- `issue-detail/roadmap.md`
  - MVP 단계별 기능 묶음과 구현 우선순위
- `issue-detail/features/README.md`
  - 피처별 세부 스펙 인덱스
- `issue-detail/optimistic-locking.md`
  - 낙관적 잠금(Optimistic Locking) 구현 가이드, 데이터 무결성 보장, 충돌 해결 방법

## 구현 기준 원본

아래 파일들은 구현과 테스트의 기준이 되는 원본 스펙이다.

- `../specs/issue-detail.md`
- `../specs/issue-detail.states.md`
- `../specs/issue-detail.contract.ts`
- `../specs/issue-detail.test-plan.md`
