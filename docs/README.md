# Docs

이 디렉터리는 `issue detail` 기능의 제품 문서와 개발 문서를 정리한다.

현재 범위는 Linear 스타일의 이슈 상세 페이지 한 화면에 집중하며, 기술 방향은 `Next.js + PWA + Supabase + Firebase FCM 웹 알림`이다.

현재 `.pen` 기준 데스크탑 베이스라인은 아래와 같다.

- MVP 1의 주 화면은 독립 `Issue Detail / Full page` route
- `Issue Detail / Drawer`는 같은 detail model을 공유하는 compact exploration
- `Issue List Page`와 `Project Dashboard`는 탐색 화면이며 MVP 기준 route는 아니다
- `Create Issue`는 지원 흐름이며, 생성 후 기본 진입은 full page detail route

현재 브레이크포인트 기준은 아래와 같다.

- Desktop `>= 1280px`
  - full page detail 우선
- Tablet `768px - 1279px`
  - board에서 issue를 탭하면 compact drawer 우선
  - full metadata / full history / long-form editing은 full page로 이동
- Mobile `< 768px`
  - issue tap 시 full page detail 우선
  - create 성공 후 full page detail 우선

## 문서 목록

- `session-handoff.md`
  - 다음 세션에서 바로 이어가기 위한 현재 상태와 다음 작업
- `todo.md`
  - 현재 남은 작업, 위험요소, 다음 구현 체크리스트
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
- `issue-detail/supabase-schema.md`
  - 초기 Supabase Postgres 테이블, trigger, RLS 방향
- `issue-detail/roadmap.md`
  - MVP 단계별 기능 묶음과 구현 우선순위
- `issue-detail/features/README.md`
  - 피처별 세부 스펙 인덱스

## 구현 기준 원본

아래 파일들은 구현과 테스트의 기준이 되는 원본 스펙이다.

- `../specs/issue-detail.md`
- `../specs/issue-detail.states.md`
- `../specs/issue-detail.contract.ts`
- `../specs/issue-detail.test-plan.md`
