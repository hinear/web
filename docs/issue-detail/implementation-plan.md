# Implementation Plan

## 목표

`issue detail` 한 화면으로 프로젝트 이슈를 운영 가능한 수준까지 올린다.

현재 데스크탑 구현 기준은 `Issue Detail / Full page` route다. `Issue Detail / Drawer`는 같은 detail model을 공유하는 compact exploration으로 취급한다.

현재 브레이크포인트별 구현 기준은 아래와 같다.

- Desktop
  - full page detail 우선
- Tablet
  - board-linked compact drawer 우선
  - full history / metadata / long-form editing은 full page로 이관
- Mobile
  - compact full-page detail 우선
  - create success도 full page detail로 귀결

제품 형태는 설치 가능한 `PWA`이며, 데이터와 인증은 `Supabase`, 웹 푸시는 `Firebase Cloud Messaging`을 사용한다.

도메인 최상위 경계는 `workspace`가 아니라 `project`다.

## 기술 선택

- 프론트엔드: `Next.js`
- 앱 형태: `PWA`
- 인증: `Supabase Auth`
- 데이터베이스: `Supabase Postgres`
- 서버 로직: `Supabase Edge Functions`
- 예약 작업: `Supabase Cron`
- 푸시 알림: `Firebase Cloud Messaging`

## 전체 단계

### 1. 스펙 확정

- 기능 범위 고정
- 상태 집합 고정
- acceptance criteria 확정
- `project -> issue` 구조 확정
- 프로젝트 권한 모델 확정

산출물:

- [overview](/Users/choiho/zerone/hinear/docs/issue-detail/overview.md)
- [triage-workflow](/Users/choiho/zerone/hinear/docs/issue-detail/triage-workflow.md)
- [contracts](/Users/choiho/zerone/hinear/docs/issue-detail/contracts.md)

### 2. 프로젝트 초기화

- `Next.js` 앱 생성
- TypeScript 설정
- 테스트 러너 설정
- PWA 기본 구조 설정

완료 조건:

- 앱이 실행된다
- manifest가 연결된다
- service worker 등록 경로가 정리된다

### 3. Supabase 연결

- Supabase 프로젝트 생성
- Auth 초기화
- Postgres 스키마 설계
- Edge Functions 초기화
- Cron 경로 설계
- FCM 연동 준비

완료 조건:

- 로컬에서 Supabase 개발 환경 또는 원격 프로젝트 연결이 가능하다
- 인증, 데이터 읽기/쓰기, 함수 호출 경로가 분리되어 있다
- 프로젝트별 권한 경계를 데이터 모델에 반영할 수 있다

### 4. 프로젝트 모델 구현

- `projects`
- `project_members`
- 프로젝트 역할 모델
- `owner/member` 권한 규칙
- 프로젝트별 issue sequence
- identifier 발급 규칙

완료 조건:

- 개인 프로젝트와 팀 프로젝트를 모두 만들 수 있다
- 프로젝트 멤버십으로 접근 권한을 판정할 수 있다
- `PROJECTKEY-n` 형식의 identifier를 발급할 수 있다
- owner만 초대/제거 가능한 권한 규칙이 정리된다

### 5. 도메인 구현

- `Issue`
- `Comment`
- `ActivityLogEntry`
- `IssueRepository`
- validation 규칙
- activity log before/after 구조

완료 조건:

- `Triage` 기본 상태가 코드와 테스트에서 보장된다
- status 변경 이력이 `from/to` 값으로 추적된다

### 6. 핵심 issue detail UI 구현

- full page detail route를 기준 화면으로 고정
- 제목 수정
- 상태 변경
- 우선순위 변경
- 담당자 변경
- 라벨 추가/삭제
- 설명 편집
- 코멘트 작성
- 활동 로그 표시
- metadata 표시
- failure / rollback memo와 에러 안내 위치 확정
- create issue 성공 후 full page route 진입
- breakpoint별 정보 밀도와 route model 정리

완료 조건:

- 한 화면에서 triage와 실행 전환이 가능하다
- 데스크탑 full page에서 `main column + right column` 구조가 성립한다
- full page가 detail source of truth로 동작한다
- drawer exploration이 존재하더라도 full page보다 많은 정보를 책임지지 않는다
- tablet drawer와 mobile full-page 흐름이 문서와 디자인에서 일치한다

현재 구현 메모:

- 최소 앱 플로우는 이미 연결됨
  - `/projects/new`
  - `/projects/[projectId]`
  - `/projects/[projectId]/issues/[issueId]`
- 현재는 full-page issue detail shell 중심으로만 구현되어 있음
- actor 식별은 임시로 `HINEAR_ACTOR_ID` env를 사용함
- auth/session wiring 이후 이 임시 경계는 제거해야 함

### 7. 알림 구현

- 알림 permission 요청 버튼
- FCM 토큰 발급 및 저장
- service worker에서 background notification 처리
- 알림 클릭 시 issue detail 이동
- Supabase 사용자와 FCM 토큰 연결

완료 조건:

- 사용자가 명시적으로 허용하면 푸시를 받을 수 있다
- 알림 클릭 시 관련 issue page로 이동한다

### 8. 리마인더/알람 구현

- due date 또는 reminder 시각 저장
- Supabase Cron 또는 예약 함수에서 전송 대상 조회
- Edge Function에서 FCM 전송

완료 조건:

- 예정된 시각에 대상 사용자에게 웹 알림이 전송된다

### 9. 운영 안정화

- loading, error, empty 상태 점검
- 알림 실패 처리
- 권한 및 보안 규칙 검토
- 기본 접근성 점검

## MVP 범위

- PWA 설치 가능
- Supabase 로그인 가능
- 개인 프로젝트 생성 가능
- 팀 프로젝트 생성 가능
- 프로젝트별 멤버 접근 제어 가능
- issue detail CRUD 가능
- desktop full-page issue detail route
- 코멘트 가능
- activity log 가능
- metadata 표시 가능
- `Triage` 기본 상태 가능
- 알림 opt-in 가능
- 이슈 변경 또는 리마인더 푸시 가능

## 비MVP

- 실시간 동시 편집
- 고급 검색
- 보드 뷰
- board-first drawer workflow
- 오프라인 동기화 충돌 해결
- 네이티브 앱 수준의 알림 제어

## 추천 구현 순서

1. `Next.js` 앱 초기화
2. 테스트 환경
3. PWA 기본 설정
4. Supabase Auth/Postgres
5. 프로젝트/멤버/identifier 모델
6. mock repository 기반 full-page issue detail
7. Supabase repository 전환
8. breakpoint별 surface 정리
9. compact drawer exploration
10. FCM 토큰 저장 및 알림 opt-in
11. Supabase Edge Function 기반 알람 전송
12. E2E 정리

## 첫 스프린트 목표

- 앱 기동
- personal/team project 모델 스캐폴드
- `Issue Detail / Full page` 화면 스캐폴드
- mock data 기반 제목, 상태, 설명, 코멘트
- `Triage -> Todo` 동작
- 기본 activity log
- metadata 우측 컬럼
- desktop / tablet / mobile route rule 정리

현재 상태:

- 이 스프린트의 최소 목표는 앱 라우트 수준에서 달성됨
- 다만 실제 편집 컨트롤과 auth-bound persistence는 아직 후속 작업임

## 두 번째 스프린트 목표

- 프로젝트 권한 모델
- identifier 발급
- Supabase Auth
- Supabase 저장
- assignee, labels, priority
- create issue -> full page detail route 연결
- tablet drawer -> open full page 연결
- notification permission + FCM token 등록

## 세 번째 스프린트 목표

- board-linked compact drawer exploration
- mobile detail / create polish
- reminder 데이터 모델
- Supabase Cron
- background notification
- 알림 클릭 이동
