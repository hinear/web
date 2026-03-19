# Priority Feature Spec

## 목적

사용자가 이슈의 중요도를 빠르게 지정해서 triage와 처리 순서를 정할 수 있게 한다.

## 우선순위 집합

- `No Priority`
- `Low`
- `Medium`
- `High`
- `Urgent`

## 요구사항

- 우선순위는 상세 페이지에서 변경 가능하다.
- 우선순위가 없을 경우 `No Priority`로 표시한다.
- 우선순위 변경 성공 시 activity log에 남는다.
- 저장 실패 시 이전 우선순위로 롤백한다.

## 테스트 포인트

- 기본 우선순위가 렌더링된다
- 우선순위를 변경할 수 있다
- 저장 실패 시 롤백된다
- priority 변경 activity log가 표시된다
