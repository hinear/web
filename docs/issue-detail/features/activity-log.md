# Activity Log Feature Spec

## 목적

사용자가 이슈 변경 이력을 읽고, 누가 무엇을 바꿨는지 빠르게 파악할 수 있게 한다.

## 요구사항

- activity log는 읽기 전용이다.
- 최신 항목이 먼저 보인다.
- 각 로그는 최소한 actor, event type, created time을 포함한다.
- 변경 이벤트는 가능하면 before/after 값을 구조적으로 기록한다.
- 아래 이벤트 타입을 지원한다.
  - issue created
  - title updated
  - status updated
  - priority updated
  - assignee updated
  - labels updated
  - description updated
  - comment created

## UX 원칙

- 각 로그는 actor, summary, time 정보를 포함해야 한다.
- 중요한 상태 전이는 즉시 식별 가능해야 한다.
- full page에서는 metadata 옆에 full activity log를 둔다.
- compact drawer가 존재하면 recent activity만 먼저 보여주고, full history는 full page route로 위임한다.

## 브레이크포인트 기준

### Desktop `>= 1280px`

- full activity log를 metadata 옆 secondary column에 둔다.
- triage와 실행 전환을 하면서도 전체 이력을 바로 읽을 수 있어야 한다.

### Tablet `768px - 1279px`

- drawer에서는 recent activity만 우선 노출한다.
- recent activity는 빠른 스캔용이며, full history는 full page route에서 확인한다.
- metadata도 summary 수준으로만 함께 둔다.

### Mobile `< 768px`

- mobile full page에서는 activity log를 핵심 편집 흐름보다 뒤에 두거나 축약해도 된다.
- mobile에서는 issue 읽기/수정/코멘트 흐름을 방해하지 않는 정보 밀도를 우선한다.

## 저장 규칙

가능하면 각 activity log는 아래 구조를 가진다.

- `actor`
- `type`
- `field`
- `from`
- `to`
- `summary`
- `createdAt`

예:

- `type = issue.status.updated`
- `field = status`
- `from = Todo`
- `to = In Progress`
- `summary = "Choi changed status from Todo to In Progress"`

## 필드별 추적 규칙

### Status

- `from`과 `to`를 반드시 저장한다
- 예:
  - `Todo -> In Progress`
  - `In Progress -> Done`

### Priority

- `from`과 `to`를 저장한다
- 예:
  - `Low -> High`

### Assignee

- `from`과 `to`를 저장한다
- 비어 있는 값은 `null` 또는 `none`으로 표현한다

### Title

- 전체 문자열 변경을 저장할 수 있다
- 긴 문자열은 UI에서 summary만 보여주고 원본 값은 구조화 필드로 유지한다

### Labels

- 단순 summary만 남길 수도 있지만, 가능하면 추가/삭제 라벨을 분리해 저장한다
- 예:
  - `label frontend added`
  - `label urgent removed`

### Description

- 전체 본문을 그대로 모두 보여줄 필요는 없다
- 변경 발생 사실과 actor, time은 반드시 남긴다
- 필요하면 before/after는 저장하되 UI는 요약만 노출한다

### Comment

- 코멘트 생성은 `from` 없이 `to` 또는 summary만으로 기록한다
- 예:
  - `Min added a comment`

## 테스트 포인트

- activity log가 최신순으로 정렬된다
- 지원 이벤트 타입이 모두 렌더링된다
- title/status/priority/assignee/labels/description/comment 변경이 로그에 남는다
- status 변경 시 `from/to`가 기록된다
- `Todo -> In Progress -> Done` 같은 연속 상태 변경도 순서대로 추적된다
- tablet drawer에서는 recent activity만 먼저 보인다
- desktop full page에서는 metadata와 activity log가 함께 보인다
