# Supabase Schema

## 목적

현재 문서로 정의된 `project -> issue` 도메인을 실제 Supabase Postgres 스키마로 내릴 때의 초기 기준을 정리한다.

실행 가능한 SQL 초안은 [supabase/migrations/0001_initial_project_issue_schema.sql](/Users/choiho/zerone/hinear/supabase/migrations/0001_initial_project_issue_schema.sql)에 있다.

## 설계 원칙

- 최상위 경계는 `project`
- 권한은 `project_members`로 제어
- 역할은 `owner`, `member`만 사용
- 이슈 번호는 프로젝트별 증가값으로 발급
- activity log는 before/after 추적이 가능해야 함
- 알림 대상 계산의 source of truth도 Supabase가 가짐

## 테이블

### projects

핵심 필드:

- `id`
- `key`
- `name`
- `type`
- `issue_seq`
- `created_by`
- `created_at`
- `updated_at`

규칙:

- `key`는 대문자 영숫자만 허용
- `key`는 전역 유일
- `issue_seq`는 프로젝트별 다음 이슈 번호의 기준이 된다

### project_members

핵심 필드:

- `project_id`
- `user_id`
- `role`
- `created_at`

규칙:

- `(project_id, user_id)` 복합 PK
- 프로젝트당 `owner`는 한 명만 허용
- 프로젝트 접근 권한의 실제 기준 테이블

### project_invitations

핵심 필드:

- `project_id`
- `email`
- `role`
- `invited_by`
- `status`
- `token`
- `expires_at`

규칙:

- 초기 버전의 역할은 항상 `member`
- pending 상태의 초대는 같은 이메일 기준 중복되지 않게 관리

### issues

핵심 필드:

- `id`
- `project_id`
- `issue_number`
- `identifier`
- `title`
- `status`
- `priority`
- `assignee_id`
- `description`
- `created_by`
- `updated_by`
- `created_at`
- `updated_at`

규칙:

- 이슈는 반드시 하나의 프로젝트에 속함
- `issue_number`와 `identifier`는 프로젝트 단위로 유일
- 상태는 `Triage`, `Backlog`, `Todo`, `In Progress`, `Done`
- 우선순위는 `No Priority`, `Low`, `Medium`, `High`, `Urgent`

### comments

핵심 필드:

- `issue_id`
- `project_id`
- `author_id`
- `body`
- `created_at`

규칙:

- 공백만 있는 comment는 저장 불가

### activity_logs

핵심 필드:

- `issue_id`
- `project_id`
- `actor_id`
- `type`
- `field`
- `from_value`
- `to_value`
- `summary`
- `created_at`

규칙:

- status, priority, assignee 같은 상태성 변경은 `from_value`, `to_value`를 구조적으로 남김
- labels와 description도 필요 시 요약 + 구조값으로 함께 남길 수 있음

## identifier 발급

identifier는 앱에서 임의 문자열을 생성하지 않고, DB에서 프로젝트별 시퀀스를 증가시켜 발급한다.

방식:

1. `issues` insert 직전 trigger 실행
2. 해당 프로젝트의 `issue_seq` 증가
3. 증가값을 `issue_number`로 저장
4. `{PROJECTKEY}-{issue_number}`로 `identifier` 생성

예:

- `WEB-1`
- `WEB-2`
- `OPS-14`

## RLS 방향

초기 정책 방향:

- `projects`
  - 멤버만 조회
  - 생성자는 본인 프로젝트 생성 가능
  - owner만 수정 가능
- `project_members`
  - 멤버만 조회
  - owner만 초대/제거 가능
- `issues`, `comments`, `activity_logs`
  - 프로젝트 멤버만 조회/작성 가능

중요한 점:

- `issues`의 identifier 발급 trigger는 프로젝트의 `issue_seq`를 갱신하므로 security definer 함수로 처리한다
- 앱 권한의 기준은 `auth.uid()`와 `project_members`다

## 현재 포함 범위

- 프로젝트
- 멤버십
- 초대
- 이슈
- 코멘트
- 활동 로그

## 현재 제외 범위

- notification token 저장
- reminder 스케줄 테이블
- 멘션 전용 테이블
- board/list view 전용 read model

## 관련 문서

- [project-model](/Users/choiho/zerone/hinear/docs/issue-detail/project-model.md)
- [contracts](/Users/choiho/zerone/hinear/docs/issue-detail/contracts.md)
- [pwa-firebase-notifications](/Users/choiho/zerone/hinear/docs/issue-detail/pwa-firebase-notifications.md)
