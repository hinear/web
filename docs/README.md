# Docs

이 디렉터리는 `issue detail` 기능의 제품 문서와 개발 문서를 정리한다.

현재 범위는 Linear 스타일의 이슈 상세 페이지 한 화면에 집중하며, 기술 방향은 `Next.js + PWA + Supabase + Firebase FCM 웹 알림`이다.

## 문서 목록

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
