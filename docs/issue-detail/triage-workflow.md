# Triage Workflow

## 목적

`Triage`는 새로 들어온 이슈를 실행 가능한 작업으로 정리하는 첫 상태다.

초기 구현에서는 별도 페이지나 복잡한 모드가 아니라, `issue detail` 안의 기본 상태로 다룬다.

## 상태 집합

- `Triage`
- `Backlog`
- `Todo`
- `In Progress`
- `Done`

## 기본 규칙

- 새 이슈는 항상 `Triage`로 시작한다.
- `Triage`에서는 제목, 우선순위, 담당자, 라벨, 설명을 정리한다.
- 정리가 끝나면 `Backlog` 또는 `Todo`로 넘긴다.
- 모든 상태 변경은 activity log에 남는다.

## 권장 전이

- `Triage -> Backlog`
- `Triage -> Todo`
- `Backlog -> Todo`
- `Todo -> In Progress`
- `In Progress -> Done`

초기 버전에서는 역방향 전이를 엄격히 막지 않는다. 제품 운영 정책이 정해지면 그때 제한을 추가한다.

## Triage에서 확인할 항목

- 제목이 명확한가
- 우선순위가 정해졌는가
- 담당자가 필요한가
- 라벨이 충분한가
- 설명만 읽고도 작업을 시작할 수 있는가
- 바로 할 일인지, backlog로 보낼 일인지 결정되었는가

## 활동 로그 예시

- `Issue created in Triage`
- `Status changed from Triage to Backlog`
- `Priority changed from No Priority to High`
- `Assignee changed from none to Choi`
- `Label added: frontend`
- `Description updated`

## 구현 메모

- `Triage`는 도메인 기본값이므로 생성 함수에서 보장한다.
- 컴포넌트 테스트에서는 `Triage` 옵션이 기본 렌더링에 포함되어야 한다.
- E2E에서는 최소 한 번 `Triage -> Todo` 또는 `Triage -> Backlog`를 검증한다.

## 관련 스펙

- [상태 모델](/Users/choiho/zerone/hinear/specs/issue-detail.states.md)
- [계약 타입](/Users/choiho/zerone/hinear/specs/issue-detail.contract.ts)
