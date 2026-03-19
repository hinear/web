# Assignee Feature Spec

## 목적

사용자가 이슈의 담당자를 지정하거나 해제해서 책임 주체를 명확히 할 수 있게 한다.

## 요구사항

- 담당자는 없음, 지정, 변경, 해제 상태를 지원한다.
- assignee picker에서 후보 사용자를 선택할 수 있다.
- 담당자 변경 성공 시 activity log에 남는다.
- 저장 실패 시 이전 assignee로 롤백한다.

## UX 원칙

- 담당자가 없는 상태를 분명히 표시한다.
- 현재 assignee를 빠르게 식별할 수 있어야 한다.

## 테스트 포인트

- assignee가 없을 때 empty state가 보인다
- 사용자를 assignee로 지정할 수 있다
- assignee를 다른 사용자로 변경할 수 있다
- assignee를 제거할 수 있다
- 실패 시 롤백된다
- assignee 변경 activity log가 표시된다
