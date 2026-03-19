# Description Feature Spec

## 목적

사용자가 이슈의 컨텍스트와 실행 조건을 기록하고 갱신할 수 있게 한다.

## 요구사항

- 설명은 empty state와 non-empty state를 모두 지원한다.
- 설명은 인라인 또는 에디터 방식으로 수정 가능하다.
- 저장 성공 시 최신 설명이 반영된다.
- 저장 실패 시 마지막 저장값으로 롤백한다.
- 설명 변경 성공 시 activity log에 남는다.

## UX 원칙

- 설명이 비어 있어도 사용자는 바로 작성할 수 있어야 한다.
- 긴 설명도 읽고 수정하기 쉬워야 한다.

## 테스트 포인트

- empty description placeholder가 보인다
- description을 수정하고 저장할 수 있다
- 저장 실패 시 롤백된다
- description 변경 activity log가 표시된다
