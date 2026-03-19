# Issue Detail Overview

## 목표

Linear 스타일의 이슈 상세 페이지를 구현해서, 프로젝트 이슈를 한 화면에서 생성 이후 처리 완료까지 관리할 수 있게 한다.

초기 버전은 전체 이슈 관리 제품을 만들지 않는다. 우선 `issue detail` 화면 하나에 집중한다.

앱은 `Next.js` 기반으로 구현하고, 설치 가능한 `PWA`로 제공한다. 데이터와 인증은 `Supabase`를 사용하고, 웹 푸시 알림은 `Firebase Cloud Messaging`만 사용한다.

시스템의 최상위 경계는 `workspace`가 아니라 `project`다. 각 프로젝트는 개인용 또는 팀용으로 운영될 수 있다.

## 왜 이 범위로 시작하는가

- TDD로 다루기 좋은 단일 경계다.
- 상태 변경과 입력 편집이 많아 도메인 테스트 가치가 높다.
- 나중에 리스트, 필터, 보드 뷰를 추가해도 상세 화면은 그대로 재사용된다.

## 핵심 범위

- 이슈 제목 수정
- 상태 변경 `Triage / Backlog / Todo / In Progress / Done`
- 우선순위 변경
- 담당자 변경
- 라벨 추가 및 삭제
- 설명 편집
- 코멘트 작성
- 활동 로그 표시

## 제외 범위

- 이슈 리스트
- 프로젝트 대시보드
- 팀 전환
- 단축키 복제
- 실시간 협업
- 서브태스크, 링크드 이슈, 사이클

## 사용자 결과

사용자는 이슈 상세 페이지에 들어가서 아래 흐름을 끝낼 수 있어야 한다.

1. 이슈 내용을 정리한다.
2. 우선순위와 담당자를 정한다.
3. 라벨과 설명을 보강한다.
4. 상태를 `Triage`에서 다음 단계로 넘긴다.
5. 코멘트와 활동 로그로 변경 이력을 확인한다.

프로젝트 단위로 접근 가능한 사람을 다르게 설정할 수 있어야 하며, 개인 프로젝트와 팀 프로젝트를 같은 제품 안에서 운영할 수 있어야 한다.

## 화면 구성

### 상단

- 이슈 식별자
- 제목
- 상태
- 우선순위
- 담당자
- 라벨

### 본문

- 설명 편집 영역
- 코멘트 스레드

### 보조 영역

- 활동 로그
- 생성일, 수정일 같은 메타데이터

## 기본 UX 원칙

- 신규 이슈 기본 상태는 `Triage`
- 필드 저장 실패 시 마지막 저장값으로 롤백
- 설명과 코멘트가 비어 있어도 페이지는 usable 해야 함
- 모든 성공적인 변경은 activity log에 남아야 함
- 설치 가능한 PWA 경험을 제공한다
- 알림 권한 요청은 반드시 사용자 액션 이후에만 수행한다

## 기술 방향

- 앱 프레임워크: `Next.js`
- 앱 형태: `PWA`
- 데이터 저장: `Supabase Postgres`
- 인증: `Supabase Auth`
- 서버 작업: `Supabase Edge Functions`
- 예약 작업: `Supabase Cron`
- 푸시/알림: `Firebase Cloud Messaging`

## 도메인 경계

- `Project`
  - 최상위 경계
  - `personal` 또는 `team`
- `Issue`
  - 반드시 하나의 프로젝트에 속함
- `ProjectMember`
  - 프로젝트 접근 권한과 역할을 가짐

## 관련 스펙

- [원본 스펙](/Users/choiho/zerone/hinear/specs/issue-detail.md)
- [상태 모델](/Users/choiho/zerone/hinear/specs/issue-detail.states.md)
- [구현 계획](/Users/choiho/zerone/hinear/docs/issue-detail/implementation-plan.md)
- [PWA/Firebase 알림 설계](/Users/choiho/zerone/hinear/docs/issue-detail/pwa-firebase-notifications.md)
