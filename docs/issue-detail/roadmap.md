# Roadmap

## 목적

현재 문서로 정의된 기능을 구현 우선순위 기준으로 묶는다.

핵심 전략은 먼저 혼자 쓸 수 있는 제품을 만들고, 그 다음 팀 협업과 알림을 얹는 것이다.

## MVP 1차

목표:

혼자 바로 사용할 수 있는 최소 제품을 완성한다.

포함 기능:

- 개인 프로젝트 생성
- 프로젝트별 이슈 관리
- 프로젝트별 identifier 발급
  - `PROJECTKEY-n`
- 이슈 제목 수정
- 상태 변경
  - `Triage`
  - `Backlog`
  - `Todo`
  - `In Progress`
  - `Done`
- 우선순위 변경
- 설명 편집
- 코멘트 작성
- 활동 로그 표시
- 활동 로그의 `actor`, `field`, `from`, `to`, `createdAt`, `summary`
- 신규 이슈 기본 상태 `Triage`
- `Triage -> Backlog`
- `Triage -> Todo`
- PWA 설치 가능

완료 기준:

- 개인 프로젝트 하나로 실제 이슈를 생성하고 관리할 수 있다
- 상태 변경과 설명/코멘트 흐름이 문제없이 동작한다
- activity log로 변경 이력을 읽을 수 있다

## MVP 2차

목표:

팀과 함께 사용할 수 있는 협업 구조를 완성한다.

포함 기능:

- 팀 프로젝트 생성
- `owner/member` 권한
- 프로젝트 초대
- 초대 수락
- 프로젝트 멤버 접근 제어
- 담당자 변경
- 라벨 추가/삭제
- 멤버가 이슈를 조회/수정/코멘트할 수 있음
- 제거된 멤버 접근 차단

완료 기준:

- owner가 팀 프로젝트를 만들고 멤버를 초대할 수 있다
- 멤버는 해당 프로젝트 안에서 이슈를 함께 관리할 수 있다
- 프로젝트 외부 사용자는 접근할 수 없다

## MVP 3차

목표:

알림을 붙여서 실사용 운영 편의성을 높인다.

포함 기능:

- 웹 푸시 opt-in
- FCM token 저장
- background notification
- notification click 시 issue detail 이동
- 상태 변경 이벤트 알림
- assignee 지정 알림
- reminder 알람
- 프로젝트 접근 권한 있는 사용자만 알림 대상 포함

완료 기준:

- 사용자가 알림을 허용하면 관련 이슈 알림을 받을 수 있다
- 알림 클릭 시 해당 이슈 화면으로 이동한다
- reminder 시각에 알림이 전송된다

## 나중 기능

- 보드 뷰
- 고급 검색
- 필터와 정렬 고도화
- 실시간 동시 편집
- 오프라인 충돌 해결
- 멘션 시스템 고도화
- 세분화된 권한
- 프로젝트 템플릿
- 대시보드와 리포트
- 네이티브 앱 수준 알림 제어

## 추천 순서

1. 개인 프로젝트 + issue detail
2. activity log 완성
3. 팀 프로젝트 + 초대
4. assignee + labels
5. 웹 푸시
6. reminder

## 관련 문서

- [overview](/Users/choiho/zerone/hinear/docs/issue-detail/overview.md)
- [implementation-plan](/Users/choiho/zerone/hinear/docs/issue-detail/implementation-plan.md)
- [project-model](/Users/choiho/zerone/hinear/docs/issue-detail/project-model.md)
- [invitations](/Users/choiho/zerone/hinear/docs/issue-detail/invitations.md)
