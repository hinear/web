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
- desktop full page에서는 설명의 읽기/편집/실패 메모를 함께 다룰 수 있어야 한다.
- tablet drawer에서는 설명을 compact preview와 짧은 편집 상태로 먼저 보여주고, 긴 편집은 full page로 넘길 수 있다.
- mobile full page에서는 설명을 카드 스택 안에서 자연스럽게 읽고 수정할 수 있어야 한다.

## 브레이크포인트 기준

### Desktop `>= 1280px`

- 설명은 full page main column에 배치한다.
- markdown toolbar, empty state, editor state를 같은 흐름 안에서 다룬다.
- 긴 본문은 full page 기준으로 읽기 쉬워야 한다.

### Tablet `768px - 1279px`

- drawer에서는 설명의 핵심 preview와 짧은 편집 상태를 우선 노출한다.
- 설명이 길어지거나 편집이 길어질수록 `Open full page`로 전환할 수 있어야 한다.

### Mobile `< 768px`

- 설명은 full page card stack 안에서 직접 읽고 수정한다.
- mobile에서는 보조 정보보다 설명과 코멘트 흐름이 끊기지 않는 것이 우선이다.

## 테스트 포인트

- empty description placeholder가 보인다
- description을 수정하고 저장할 수 있다
- 저장 실패 시 롤백된다
- description 변경 activity log가 표시된다
- tablet drawer에서 긴 설명 편집을 full page로 넘길 수 있다
- mobile full page에서 설명 카드가 자연스럽게 렌더링된다
