# Project Invitations

## 목적

`team` 프로젝트에 멤버를 초대해서 함께 이슈를 관리할 수 있게 한다.

초기 버전에서는 초대 이후 참여한 사용자의 역할은 항상 `member`다.

## 권한 원칙

- `owner`만 초대할 수 있다
- `owner`만 멤버를 제거할 수 있다
- `member`는 초대하거나 제거할 수 없다

## 적용 범위

- `team` 프로젝트: 초대 가능
- `personal` 프로젝트: 기본적으로 초대 사용 안 함

## 초대 흐름

1. owner가 이메일로 초대한다.
2. 초대 레코드를 생성한다.
3. 상대가 로그인 또는 가입한다.
4. 초대를 수락한다.
5. `project_members`에 `member` 역할로 추가한다.
6. 초대 상태를 `accepted`로 변경한다.

## 데이터 모델 초안

### project_invitations

- `id`
- `projectId`
- `email`
- `role`
- `invitedBy`
- `status`
- `token`
- `expiresAt`
- `createdAt`

## 규칙

- 역할은 초기 버전에서 항상 `member`
- 이미 멤버인 사용자는 초대할 수 없다
- 이미 pending 상태의 초대가 있으면 재발송 또는 갱신 처리
- 만료된 초대는 수락할 수 없다
- 초대 수락 시 프로젝트 접근 권한이 생긴다

## 테스트 포인트

- owner만 초대를 생성할 수 있다
- member는 초대를 생성할 수 없다
- 초대 수락 시 project_members에 추가된다
- 이미 멤버인 사용자는 초대할 수 없다
- 만료된 초대는 수락되지 않는다

## 관련 문서

- [project-model](/Users/choiho/zerone/hinear/docs/issue-detail/project-model.md)
- [implementation-plan](/Users/choiho/zerone/hinear/docs/issue-detail/implementation-plan.md)
