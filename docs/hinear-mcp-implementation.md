# Hinear MCP Implementation Status

## Summary

이 문서는 현재 Hinear MCP의 실제 구현 상태와 로컬 사용 방법을 정리한다.

PRD와 설계 방향은 [hinear-mcp.md](/home/choiho/zerone/hinear/docs/hinear-mcp.md)에 있고, 이 문서는 "무엇이 이미 구현되었는지", "어떻게 실행하는지", "어디까지 검증했는지"를 기록한다.

현재 기준 Hinear MCP는 로컬 `stdio` MCP 서버로 동작하며, 핵심 6개 tool이 실제 Hinear 데이터 경로에 연결되어 있다.

## Current Status

상태:

- Hinear MCP workspace 추가 완료
- 로컬 `stdio` MCP 서버 실행 가능
- 핵심 6개 tool 연결 완료
- 로컬 로그인 헬퍼 추가 완료
- `.mcp.json` 로컬 서버 등록 완료
- stdio client 기반 smoke test 완료

현재 구현된 핵심 tool:

- `list_projects`
- `search_issues`
- `get_issue_detail`
- `create_issue`
- `update_issue_status`
- `add_comment`
- `hinear_mcp_status`

## Repository Layout

현재 MCP 코드는 이 저장소 안의 workspace 패키지로 들어가 있다.

```text
hinear/
├─ docs/
│  ├─ hinear-mcp.md
│  └─ hinear-mcp-implementation.md
├─ mcp/
│  └─ hinear/
│     ├─ package.json
│     ├─ tsconfig.json
│     ├─ README.md
│     ├─ scripts/
│     │  ├─ login.ts
│     │  ├─ run.ts
│     │  └─ shared.ts
│     └─ src/
│        ├─ index.ts
│        ├─ server.ts
│        ├─ adapters/
│        ├─ lib/
│        ├─ schemas/
│        └─ tools/
├─ package.json
├─ pnpm-workspace.yaml
└─ .mcp.json
```

## Workspace and Runtime Wiring

다음 항목을 추가했다.

- 루트 workspace 연결:
  [pnpm-workspace.yaml](/home/choiho/zerone/hinear/pnpm-workspace.yaml)
- 루트 MCP 실행 스크립트:
  [package.json](/home/choiho/zerone/hinear/package.json)
- 루트 타입체크에서 MCP workspace 분리:
  [tsconfig.json](/home/choiho/zerone/hinear/tsconfig.json)
- 로컬 MCP 등록:
  [.mcp.json](/home/choiho/zerone/hinear/.mcp.json)

루트에서 사용하는 주요 명령:

```bash
pnpm mcp:hinear
pnpm mcp:hinear:typecheck
pnpm mcp:hinear:login
```

## MCP Package Structure

### Entry points

- server bootstrap:
  [index.ts](/home/choiho/zerone/hinear/mcp/hinear/src/index.ts)
- tool registration:
  [server.ts](/home/choiho/zerone/hinear/mcp/hinear/src/server.ts)

### Tool definitions

- [list-projects.ts](/home/choiho/zerone/hinear/mcp/hinear/src/tools/list-projects.ts)
- [search-issues.ts](/home/choiho/zerone/hinear/mcp/hinear/src/tools/search-issues.ts)
- [get-issue-detail.ts](/home/choiho/zerone/hinear/mcp/hinear/src/tools/get-issue-detail.ts)
- [create-issue.ts](/home/choiho/zerone/hinear/mcp/hinear/src/tools/create-issue.ts)
- [update-issue-status.ts](/home/choiho/zerone/hinear/mcp/hinear/src/tools/update-issue-status.ts)
- [add-comment.ts](/home/choiho/zerone/hinear/mcp/hinear/src/tools/add-comment.ts)

### Adapters

실제 Hinear 로직과 Supabase 경로를 연결하는 계층:

- [projects.ts](/home/choiho/zerone/hinear/mcp/hinear/src/adapters/projects.ts)
- [issues.ts](/home/choiho/zerone/hinear/mcp/hinear/src/adapters/issues.ts)
- [comments.ts](/home/choiho/zerone/hinear/mcp/hinear/src/adapters/comments.ts)

### Shared runtime helpers

- auth/session:
  [auth.ts](/home/choiho/zerone/hinear/mcp/hinear/src/lib/auth.ts)
- env loading:
  [env.ts](/home/choiho/zerone/hinear/mcp/hinear/src/lib/env.ts)
- Supabase clients:
  [supabase.ts](/home/choiho/zerone/hinear/mcp/hinear/src/lib/supabase.ts)
- Hinear status/priority mapping:
  [hinear-mappers.ts](/home/choiho/zerone/hinear/mcp/hinear/src/lib/hinear-mappers.ts)
- text content helper:
  [content.ts](/home/choiho/zerone/hinear/mcp/hinear/src/lib/content.ts)

## Implemented Tool Behavior

### `list_projects`

구현 위치:

- [projects.ts](/home/choiho/zerone/hinear/mcp/hinear/src/adapters/projects.ts)

현재 동작:

- 현재 actor를 세션 또는 access token으로 식별
- `project_members -> projects` 경로로 접근 가능한 프로젝트 조회
- role, key, name, type, created/updated 시각을 compact shape로 반환

인증 방식:

- `HINEAR_MCP_ACCESS_TOKEN` 우선
- 없으면 `HINEAR_MCP_USER_ID`

### `search_issues`

구현 위치:

- [issues.ts](/home/choiho/zerone/hinear/mcp/hinear/src/adapters/issues.ts)

현재 동작:

- 프로젝트 접근 권한 확인
- query, status, priority, assignee, label, due date 필터 적용
- Hinear 내부 상태값과 MCP 외부 enum 간 매핑 수행
- assignee profile과 label 정보를 함께 반환

### `get_issue_detail`

구현 위치:

- [issues.ts](/home/choiho/zerone/hinear/mcp/hinear/src/adapters/issues.ts)

현재 동작:

- issue 조회 후 project access 검사
- 가능하면 service-role client로 상세 데이터 조회
- labels, recent comments, recent activity, assignee/createdBy/updatedBy profile 보강
- 기본적으로 recent N items 중심 응답

### `create_issue`

구현 위치:

- [issues.ts](/home/choiho/zerone/hinear/mcp/hinear/src/adapters/issues.ts)

현재 동작:

- 프로젝트 접근 권한 확인
- title/description 정리
- MCP enum -> Hinear enum 변환
- issue 생성
- label이 있으면 생성 또는 resolve 후 `issue_labels` 연결
- `issue.created` activity log 추가

### `update_issue_status`

구현 위치:

- [issues.ts](/home/choiho/zerone/hinear/mcp/hinear/src/adapters/issues.ts)

현재 동작:

- issue 조회
- project access 확인
- 현재 version 기준 상태 변경
- `issue.status.updated` activity log 추가
- `comment_on_change`가 있으면 댓글 추가

주의:

- 현재 구현은 issue의 현재 version을 읽고 mutation을 수행한다.
- MCP 입력 schema에는 version을 따로 받지 않고, adapter 내부에서 최신 row를 읽는 형태다.

### `add_comment`

구현 위치:

- [comments.ts](/home/choiho/zerone/hinear/mcp/hinear/src/adapters/comments.ts)

현재 동작:

- issue 조회
- project membership 확인
- comment body sanitize
- optional reply/thread metadata 처리
- comment 생성
- `issue.comment.created` activity log 추가

## Authentication and Local Login Flow

초기 구현에서는 실제 사용자 입장에서 JWT를 직접 환경 변수로 넣는 방식이 번거롭기 때문에, 로컬 로그인 헬퍼를 추가했다.

관련 파일:

- [login.ts](/home/choiho/zerone/hinear/mcp/hinear/scripts/login.ts)
- [run.ts](/home/choiho/zerone/hinear/mcp/hinear/scripts/run.ts)
- [shared.ts](/home/choiho/zerone/hinear/mcp/hinear/scripts/shared.ts)

동작 방식:

1. `pnpm mcp:hinear:login` 실행
2. 필요한 값을 프롬프트로 입력
3. 값이 `mcp/hinear/.env.local`에 저장
4. `pnpm mcp:hinear` 실행 시 `run.ts`가 그 파일을 읽어 MCP 서버를 띄움

추가 편의 기능:

- 루트 `.env.local`이 있으면 Supabase 관련 기본값을 자동으로 재사용
- `--email <email>`로 `profiles.email_normalized` 기준 `HINEAR_MCP_USER_ID` 해석 가능
- `--non-interactive`로 스크립트 실행 가능

필요한 값:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `HINEAR_MCP_ACCESS_TOKEN` or `HINEAR_MCP_USER_ID`
- `APP_ORIGIN`

권장:

- `HINEAR_MCP_ACCESS_TOKEN` 사용

이유:

- 실제 로그인된 사용자 기준으로 actor를 식별할 수 있음
- project access 검사와 자연스럽게 연결됨

## Local MCP Registration

로컬 MCP 클라이언트용 설정은 다음 파일에 들어가 있다.

- [.mcp.json](/home/choiho/zerone/hinear/.mcp.json)

현재 구조:

- `hinear`: local stdio MCP
- `supabase`: remote Supabase MCP

`hinear` 서버는 다음 명령으로 실행된다.

```json
{
  "command": "pnpm",
  "args": ["--dir", "/home/choiho/zerone/hinear", "mcp:hinear"]
}
```

## How To Run

최초 1회:

```bash
pnpm install
pnpm mcp:hinear:login
pnpm mcp:hinear:smoke
```

write smoke:

```bash
pnpm mcp:hinear:smoke --write
```

실행:

```bash
pnpm mcp:hinear
```

타입체크:

```bash
pnpm typecheck
pnpm --filter @hinear/mcp typecheck
```

## Validation Performed

현재까지 확인한 항목:

- 루트 `pnpm typecheck` 통과
- MCP 패키지 `pnpm --filter @hinear/mcp typecheck` 통과
- stdio transport로 실제 MCP client 연결 성공
- `listTools` 결과에서 7개 tool 확인
- `hinear_mcp_status` 실제 호출 성공
- `pnpm mcp:hinear:smoke` 스크립트 추가
- `pnpm mcp:hinear:smoke --write` 로 core write flow 검증
- GitHub Actions CI에 MCP read smoke job 추가 (optional, secrets-gated)

실제 확인 결과:

- read smoke: `list_projects`, `search_issues` 통과
- write smoke: `create_issue`, `get_issue_detail`, `update_issue_status`, `add_comment` 통과
- 원격 Supabase에 `add_comment_thread_support` 마이그레이션 적용 완료

확인된 tool 목록:

- `list_projects`
- `search_issues`
- `get_issue_detail`
- `create_issue`
- `update_issue_status`
- `add_comment`
- `hinear_mcp_status`

## Commit History

이번 MCP 작업 관련 주요 커밋:

- `f50a3af` `Add local Hinear MCP workspace`
- `955f27d` `Ignore nested workspace node_modules`
- `48d82f3` `Update Hinear MCP status tool`

## Known Gaps

아직 남아 있는 작업:

- 실제 user auth token 발급 UX 개선
- write smoke를 위한 별도 test project / cleanup 전략 정리
- label tools 2차 구현
- batch update tools 2차 구현
- member tools 3차 구현
- GitHub branch / template / notification tools 확장

## Notes

- `mcp/hinear/node_modules`는 workspace 설치로 로컬에 생길 수 있지만, git에는 커밋되지 않도록 `.gitignore`를 조정했다.
- 현재 status tool은 auth/env가 없는 상태에서도 MCP 서버 자체가 정상 실행되는지 확인하는 데 사용한다.
- 실제 tool 사용은 auth/env가 설정된 뒤에 의미 있는 데이터 응답을 돌려준다.
- CI의 `MCP Smoke` job은 read smoke만 실행한다. write smoke는 실제 데이터를 변경하므로 로컬 수동 검증 전용으로 유지한다.
- CI에서 `MCP Smoke`는 필수 병합 체크가 아니며, 시크릿이 없으면 의도적으로 skip된다.

## CI Setup

GitHub Actions에서 MCP smoke를 활성화하려면 아래 값이 필요하다.

- repository secret `NEXT_PUBLIC_SUPABASE_URL`
- repository secret `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- repository secret `SUPABASE_SERVICE_ROLE_KEY`
- repository secret `HINEAR_MCP_EMAIL`
- repository variable `APP_ORIGIN` (optional)

의미:

- `HINEAR_MCP_EMAIL`은 `public.profiles`에 실제로 존재하는 이메일이어야 한다.
- CI는 이 이메일을 기준으로 `pnpm mcp:hinear:login --email ... --non-interactive`를 실행해 `HINEAR_MCP_USER_ID`를 해석한다.
- 필수 secret 중 하나라도 빠져 있으면 `MCP Smoke` job은 skip된다.
- 이 skip은 정상 동작이며, 포크/외부 기여 환경에서 실패 대신 예측 가능한 비차단 신호를 제공하기 위한 설계다.
- 실패 시에는 디버깅을 위해 생성된 `mcp/hinear/.env.local`의 key 이름만 출력한다.

## Recommended Next Steps

다음 우선순위는 아래 순서를 추천한다.

1. 실제 MCP 클라이언트에서 `list_projects`와 `search_issues` 호출
2. `HINEAR_MCP_ACCESS_TOKEN` 발급/저장 UX 개선
3. smoke test를 CI로 연결
4. 2차 tool 추가
