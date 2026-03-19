# Contracts

## 목적

이 문서는 `issue detail` 기능에서 사용할 핵심 도메인 타입과 저장소 계약을 설명한다.

실제 타입 정의는 [specs/issue-detail.contract.ts](/Users/choiho/zerone/hinear/specs/issue-detail.contract.ts)에 있다.

상위 도메인 구조는 `project -> issue`를 기준으로 한다.

SQL 스키마 초안은 [supabase/migrations/0001_initial_project_issue_schema.sql](/Users/choiho/zerone/hinear/supabase/migrations/0001_initial_project_issue_schema.sql)와 [supabase-schema](/Users/choiho/zerone/hinear/docs/issue-detail/supabase-schema.md)에 정리되어 있다.

## 상위 도메인

### Project

프로젝트는 제품의 최상위 경계다.

추천 필드:

- `id`
- `key`
- `name`
- `type` (`personal` | `team`)
- `issueSeq`
- `createdBy`
- `createdAt`
- `updatedAt`

### ProjectMember

프로젝트 접근과 권한은 프로젝트 멤버십으로 관리한다.

추천 필드:

- `projectId`
- `userId`
- `role` (`owner` | `member`)
- `createdAt`

## 핵심 타입

### IssueStatus

허용 상태:

- `Triage`
- `Backlog`
- `Todo`
- `In Progress`
- `Done`

### IssuePriority

허용 우선순위:

- `No Priority`
- `Low`
- `Medium`
- `High`
- `Urgent`

### Issue

주요 필드:

- `id`
- `identifier`
- `projectId`
- `title`
- `status`
- `priority`
- `assignee`
- `labels`
- `description`
- `comments`
- `activityLog`
- `createdAt`
- `updatedAt`

### Comment

- `id`
- `body`
- `author`
- `createdAt`

### ActivityLogEntry

- `id`
- `type`
- `actor`
- `field`
- `from`
- `to`
- `createdAt`
- `summary`

## 저장소 계약

### `getIssueById(issueId)`

- 이슈를 조회한다.
- 없으면 `null`을 반환한다.
- 조회 전에 사용자의 프로젝트 접근 권한이 검증되어야 한다.

### `updateIssue(input)`

- 제목, 상태, 우선순위, 담당자, 라벨, 설명을 수정한다.
- 저장 후 최신 `Issue`를 반환한다.
- 프로젝트 권한이 없는 사용자는 수정할 수 없다.

### `createComment(input)`

- 코멘트를 생성한다.
- 성공 시 생성된 `Comment`를 반환한다.
- 프로젝트 접근 권한이 없는 사용자는 작성할 수 없다.

## 도메인 규칙

- 신규 이슈 기본 상태는 `Triage`
- 제목은 공백만으로 저장할 수 없다
- 코멘트는 공백만으로 저장할 수 없다
- 모든 이슈는 반드시 하나의 프로젝트에 속한다
- 표시용 이슈 번호는 프로젝트 단위로 발급한다
- 프로젝트 권한 역할은 `owner`와 `member`만 지원한다
- 멤버 초대와 제거는 `owner`만 할 수 있다
- 변경 이벤트는 가능하면 before/after 값을 activity log에 구조적으로 저장한다

## 식별자 규칙

- 내부 PK는 별도 `uuid`를 사용한다
- 화면 표시용 identifier는 `PROJECTKEY-n` 형식을 사용한다
- 예: `WEB-1`, `WEB-2`, `OPS-12`
- 번호는 프로젝트별로 증가한다
- 삭제 여부와 무관하게 번호는 재사용하지 않는다

## activity log 규칙

권장 필드:

- `id`
- `issueId`
- `actorId`
- `type`
- `field`
- `from`
- `to`
- `summary`
- `createdAt`

status, priority, assignee 같은 상태성 필드는 `from/to`를 명시적으로 저장하는 편이 좋다.

예:

- `type = issue.status.updated`
- `field = status`
- `from = Todo`
- `to = In Progress`

## 구현 메모

- 첫 버전은 mock repository로 시작해도 충분하다.
- 이후 API나 DB를 붙여도 계약은 유지하는 편이 좋다.
- UI는 이 계약만 의존하게 만들어야 테스트하기 쉽다.
