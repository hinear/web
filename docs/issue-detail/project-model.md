# Project Model

## 목적

제품의 최상위 경계를 `workspace`가 아니라 `project`로 단순화한다.

각 프로젝트는 개인용 또는 팀용일 수 있으며, 프로젝트별로 접근 가능한 사람을 다르게 설정할 수 있다.

## 핵심 개념

### Project

프로젝트는 최상위 컨테이너다.

- `personal`
  - 개인 프로젝트
  - 기본적으로 생성자만 접근
- `team`
  - 팀 프로젝트
  - 초대한 멤버들이 함께 사용

### Issue

- 모든 이슈는 반드시 하나의 프로젝트에 속한다
- 이슈는 프로젝트 권한을 상속한다

### ProjectMember

- 프로젝트 접근 권한은 멤버십으로 정의한다
- 추천 역할:
  - `owner`
  - `member`

## 권한 원칙

- 프로젝트 멤버만 프로젝트에 접근할 수 있다
- `member`는 기본 이슈 작업이 가능하다
- `owner`는 최종 관리 권한을 가진다
- `owner`만 멤버 초대와 제거를 할 수 있다
- 초기 버전은 `owner`와 `member`만 지원한다

## identifier 규칙

- 표시용 번호는 프로젝트별로 발급한다
- 형식은 `PROJECTKEY-n`
- 예:
  - `WEB-1`
  - `WEB-2`
  - `APP-1`

## 추천 데이터 모델

### projects

- `id`
- `key`
- `name`
- `type`
- `issueSeq`
- `createdBy`
- `createdAt`
- `updatedAt`

### project_members

- `projectId`
- `userId`
- `role`
- `createdAt`

### issues

- `id`
- `projectId`
- `identifier`
- `title`
- `status`
- `priority`
- `assigneeId`
- `description`
- `createdAt`
- `updatedAt`

## 장점

- 개념이 단순하다
- 개인 프로젝트와 팀 프로젝트를 함께 운영하기 쉽다
- 권한 모델이 직관적이다
- Supabase RLS 작성이 쉬워진다

## 관련 문서

- [overview](/Users/choiho/zerone/hinear/docs/issue-detail/overview.md)
- [contracts](/Users/choiho/zerone/hinear/docs/issue-detail/contracts.md)
- [implementation-plan](/Users/choiho/zerone/hinear/docs/issue-detail/implementation-plan.md)
