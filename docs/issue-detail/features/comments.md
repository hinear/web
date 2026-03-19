# Comments Feature Spec

## 목적

사용자가 이슈에 대한 논의와 업데이트를 코멘트로 남길 수 있게 한다.

## 요구사항

- 사용자는 새 코멘트를 작성할 수 있다.
- 빈 문자열 또는 공백만 있는 코멘트는 허용하지 않는다.
- 성공한 코멘트는 코멘트 스레드에 표시된다.
- 코멘트 생성 성공 시 activity log에 남는다.

## UX 원칙

- 코멘트가 없을 때도 첫 코멘트를 쉽게 작성할 수 있어야 한다.
- 최신 코멘트가 명확히 보이도록 정렬 정책을 일관되게 유지한다.
- full page에서는 코멘트 스레드와 입력 영역을 함께 보여준다.
- compact drawer에서는 recent comment와 빠른 입력을 우선 노출하고, 긴 스레드는 full page로 넘길 수 있다.
- mobile full page에서는 코멘트 읽기와 첫 입력이 카드 스택 안에서 자연스럽게 이어져야 한다.

## 브레이크포인트 기준

### Desktop `>= 1280px`

- full page에서 코멘트 스레드와 입력 영역을 함께 유지한다.
- 긴 스레드도 detail 흐름 안에서 읽을 수 있어야 한다.

### Tablet `768px - 1279px`

- drawer에서는 recent comment와 빠른 입력을 먼저 보여준다.
- 전체 스레드 탐색이 길어질 경우 full page로 넘어가는 경로를 둔다.

### Mobile `< 768px`

- full page card stack에서 최근 코멘트와 입력 영역을 직접 보여준다.
- mobile에서는 댓글 작성 시작 장벽이 낮아야 한다.

## 테스트 포인트

- empty comments state가 보인다
- 코멘트를 작성할 수 있다
- 빈 코멘트는 제출할 수 없다
- 성공한 코멘트가 목록에 나타난다
- comment 생성 activity log가 표시된다
- tablet drawer에서 `open full page` 없이도 빠른 댓글 입력이 가능하다
- mobile full page에서 comments card와 입력 placeholder가 보인다
