# TODO

현재 세션 기준으로 남은 작업과 주의사항을 정리한다.

## Done

- [x] Supabase MCP 연결 확인
- [x] 원격 Supabase 프로젝트 URL 확인
- [x] 원격 프로젝트에 초기 스키마 적용
- [x] 원격 프로젝트에 후속 lint fix 마이그레이션 적용
- [x] `@supabase/supabase-js` 추가
- [x] `Biome` 도입 및 pre-commit 자동화 추가
- [x] `src/lib/supabase/` 환경 변수, 타입, 브라우저/서버 클라이언트 추가
- [x] `ProjectsRepository` Supabase 구현 추가
- [x] `IssuesRepository` Supabase 구현 추가
- [x] `biome check .`
- [x] `tsc --noEmit`
- [x] `vitest run`
- [x] `next build`
- [x] 프로젝트 생성 페이지
- [x] 프로젝트 상세 진입 페이지
- [x] 이슈 생성 액션
- [x] 이슈 상세 shell
- [x] `project -> issue -> detail` 최소 플로우 연결
- [x] **테스트 hang 문제 해결 및 browser test 전환** (2026-03-21)
  - `issue-detail-screen.test.tsx` hang 원인 분석 (useTransition + jsdom)
  - async mutation 테스트 2개를 browser Playwright 기반 Vitest 테스트로 이동
  - MSW handler cleanup 패턴 추가
  - browser 환경에서 드러난 `IssueDetailScreen` 기본 배열 prop 무한 업데이트 버그 수정
- [x] **Mutation failure message 정리** (2026-03-21)
  - issue/comment/board update route에 `code + status` 기반 에러 응답 추가
  - 화면에서 raw server message 대신 사용자용 메시지 매핑 사용
  - `AUTH_REQUIRED`, `FORBIDDEN`, `ISSUE_NOT_FOUND`, `INVALID_TITLE`, `INVALID_COMMENT_BODY`, `INVALID_ISSUE_UPDATE`, `VERSION_REQUIRED` 정리
- [x] **Conflict UX 개선** (2026-03-21)
  - ConflictDialog molecule 컴포넌트 추가
  - Button atom 활용한 확인 버튼
  - 버전 정보 비교 UI
  - Storybook stories 추가
- [x] **Project workspace / invitations 실제 데이터 연결** (2026-03-21)
  - `/projects/[projectId]` mock project 제거, 실제 repository read model 연결
  - project workspace primitive 치환 마무리
  - create project duplicate key 사용자 메시지 연결
  - invitation send / resend / revoke / accept 실제 server action + route 연결
  - `profiles` 마이그레이션 초안 및 request-time upsert 연결
  - members / pending invitations / inviter / creator 이름과 avatar를 `profiles` 기반으로 노출
  - `/projects/[projectId]/settings` route 추가
  - workspace access UI를 settings 전용 관리 화면으로 분리
  - project metadata (`name / key / type`) 수정 action 추가
  - `team -> personal` 전환 시 shared access 존재하면 차단하는 danger zone 정책 추가

## Current State

- 원격 Supabase 프로젝트 URL: `https://pmyrrckkiomjwjqntymr.supabase.co`
- `codex mcp login supabase`는 완료됐지만, 현재 세션의 MCP tool은 여전히 `Auth required`를 반환했다
- 적용된 마이그레이션
  - `initial_project_issue_schema`
  - `schema_lint_fixes`
  - `add_issue_labels`
  - `add_version_for_optimistic_locking`
  - `add_profiles` (로컬 마이그레이션 초안 추가, 원격 적용 여부 별도 확인 필요)
- security advisor 경고는 현재 없음
- performance advisor에는 `unused_index` 정보만 남아 있음
  - 아직 데이터와 실제 쿼리 트래픽이 없어서 정상적으로 볼 수 있는 상태
  - fresh session에서 Supabase MCP 읽기 호출 정상 응답과 `0004` 원격 적용까지 확인 완료
  - 실제 브라우저 두 세션으로 optimistic locking concurrent edit 재현까지 확인 완료

## Important Notes

- primary app request path는 이제 request-bound Supabase SSR client를 사용한다.
- `create project`, `create issue`, `issue detail load`는 더 이상 기본 service-role 저장소를 타지 않는다.
- server action actor source도 `HINEAR_ACTOR_ID` env fallback에서 authenticated user lookup으로 전환됐다.
- `/auth` 매직링크 진입, `/auth/confirm` callback, `proxy.ts` refresh 경로가 추가됐다.
- `/projects/new`, `/projects/[projectId]`, `/projects/[projectId]/issues/[issueId]`는 unauthenticated request를 `/auth?next=...`로 보낸다.
- `/invite/[token]`, `/invite/[token]/accept` 경로가 추가되어 invitation accept flow가 실제 token 기반으로 동작한다.
- 따라서 로컬에서 쓰기 동작을 검증하려면 실제 Supabase auth 세션 쿠키가 필요하다.
- local auth automation 시에는 Supabase `action_link`보다 `hashed_token`을 사용한 `/auth/confirm?token_hash=...&type=magiclink` 형식이 현재 앱 callback과 잘 맞는다.
- `.env.local`에는 최소한 아래 값이 필요하다.
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

## Next TODO

### 1. Supabase auth/session wiring

- [x] Next.js 서버 환경에서 사용자 세션을 읽는 방식 결정
- [x] 서버 컴포넌트 / 서버 액션 / 라우트 핸들러 중 어디서 저장소를 호출할지 정리
- [x] service-role 기본 사용을 줄이고, 사용자 세션 기반 클라이언트로 전환
- [x] `HINEAR_ACTOR_ID` 임시 actor fallback 제거
- [x] auth UI / callback / cookie refresh proxy 추가
- [x] 필요한 경우 service-role은 관리자성 작업으로만 제한
  - invitation accept token flow는 service-role 전용 repository 경로를 사용한다.

### 2. Repository integration

- [x] 저장소 팩토리 또는 DI 진입점 추가
- [x] 프로젝트 생성 흐름에서 `createProjectWithOwner`와 `SupabaseProjectsRepository` 연결
- [x] 이슈 생성 흐름에서 `createIssueDraft`와 `SupabaseIssuesRepository` 연결
- [x] 서버 액션 auth-bound actor lookup 테스트 추가
- [x] 저장소 단위 테스트 또는 integration-style 테스트 추가
- [x] `getIssueById`에 comment / activity join 전략 정리
  - `getIssueById`는 issue row + labels까지만 책임진다.
  - comments / activity는 상세 페이지 read model에서 `listCommentsByIssueId`, `listActivityLogByIssueId`를 병렬 호출한다.
  - 이유: write path와 read path를 분리해서 `updateIssue` / board fetch가 불필요한 join 비용을 지지 않게 유지한다.
  - 현재 구현은 [page.tsx](/Users/choiho/zerone/hinear/src/app/projects/[projectId]/issues/[issueId]/page.tsx)에서 이 전략을 사용한다.
- [x] labels persistence용 schema 추가 (`labels`, `issue_labels`)
- [x] create issue -> issue detail 경로에 labels persistence 연결
- [x] board issue path를 Supabase labels와 맞추기

### 3. Minimal UI flow

- [x] 프로젝트 생성 페이지
- [x] 프로젝트 상세 진입 페이지
- [x] 이슈 생성 액션
- [x] 이슈 상세 shell
- [x] **MSW 모킹 인프라 구축 완료** (2025-03-20)
  - [x] msw 패키지 설치
  - [x] 핸들러 및 mock 데이터 정의 (`src/mocks/handlers.ts`)
  - [x] 브라우저/서버 MSW 설정
  - [x] 테스트 환경 MSW 연동
- [x] **칸반 보드 컴포넌트 구현 완료** (2025-03-20)
  - [x] KanbanBoard 메인 컴포넌트
  - [x] KanbanColumn 컬럼 컴포넌트
  - [x] IssueCard 카드 컴포넌트
  - [x] dnd-kit 드래그앤드롭 구현
  - [x] useIssues 훅
  - [x] 프로젝트 페이지에 칸반 보드 통합
- [x] **Primitives 컴포넌트 구현 완료** (2025-03-20)
  - [x] `pen/components.pen`, `pen/Hinear.pen` 토큰을 `globals.css`에 등록
  - [x] 전역 수기 CSS 클래스와 `:root` 별칭 제거
  - [x] Button
  - [x] Chip
  - [x] Field
  - [x] Select
  - [x] SidebarItem
  - [x] ProjectSelect
  - [x] HeaderAction
  - [x] HeaderSearchField
  - [x] BoardAddCard
  - [x] Avatar
  - [x] Storybook 설정 및 primitive stories 추가
  - [x] lucide-react 아이콘 라이브러리 추가
  - [x] clsx + tailwind-merge 유틸리티 추가
- [x] project workspace 화면에 primitive 실제 치환
- [x] project workspace board header에 `cmpHeaderLinearDashboard` 적용
- [x] create project 화면에 primitive 실제 치환
- [x] create issue 화면에 primitive 실제 치환
- [x] mobile board 섹션 / app bar 적용
- [x] Create Issue Modal 컴포넌트 reference 구현
- [x] auth form reference 구현
- [x] auth form 실제 `/auth` 화면 연결
- [x] issue detail state variation reference 구현
- [x] create project / project operations section reference 구현
- [x] mutation 실패 UI (ConflictDialog molecule, session expired notice)
- [x] issue detail mutation failure message mapping 정리
- [x] board fetch / update failure 사용자 메시지 정리
- [x] not-found / empty / loading polish
- [x] issue detail 실제 편집 컨트롤 연결
- [x] unauthenticated route protection + auth notice message

### 4. Data access hardening

- [x] repository 에러 타입 정리
- [ ] **낙관적 잠금 (Optimistic Locking) 구현** - 버전 관리로 충돌 방지
  - [x] `issues` 테이블에 `version` 컬럼 추가 (마이그레이션 0004)
  - [x] `Issue` 타입에 `version` 필드 추가
  - [x] `UpdateIssueInput` 타입 정의
  - [x] `ConflictError` 타입 정의
  - [x] `SupabaseIssuesRepository.updateIssue` 메서드 구현
  - [x] 충돌 notice UI 구현 (ConflictDialog molecule로 리팩토링 완료)
  - [x] 단위 테스트: 버전 일치/불일치 기반 update 경로 검증
  - [x] 수동 통합 검증: 실제 브라우저 두 세션으로 동시 편집 충돌 재현
  - [x] **ConflictDialog molecule 추가** (2026-03-21)
    - `src/components/molecules/ConflictDialog/` 구조
    - Button atom 활용한 확인 버튼
    - 버전 정보 비교 UI (요청한 버전 vs 현재 버전)
    - Storybook stories 추가 (Default, LargeVersionGap)
    - 기존 디자인 토큰 일관성 유지
  - [x] 자동화 테스트: client conflict UI / session-expired 시나리오를 browser Playwright 기반 Vitest 테스트로 안정화
  - 자세한 내용은 [optimistic-locking.md](/Users/choiho/zerone/hinear/docs/issue-detail/optimistic-locking.md) 참조
- [x] 중복 key / 중복 invitation 케이스 메시지 정리
- [x] issue detail / board update / comment 경로의 auth / not-found / forbidden / validation failure 메시지 정리
- [x] board fetch / useIssues 경로의 auth / forbidden / not-found / invalid-update 메시지 정리
- [ ] activity log 추가 시점과 정책 정리
- [x] invitation token 생성 규칙과 만료 정책 검토
  - resend 시 token 재발급 + 만료 7일 연장 경로 구현
- [x] profiles 스키마 설계
  - `0005_add_profiles.sql` 초안 및 request-time upsert 반영
- [x] board를 `sortable` 구조로 올려 카드 간 정확한 reorder / insertion animation 지원
- [x] project settings metadata edit + access 분리
- [x] `team -> personal` 전환 제약 정책 정의

### 5. Finalization

- [ ] 관련 테스트 전체 실행 결과 확정
- [ ] `0005_add_profiles.sql` 원격 적용 여부 최종 확인
- [ ] docs/session-handoff, docs/logs 최신 상태 재정리

## Key Files

- [docs/session-handoff.md](/Users/choiho/zerone/hinear/docs/session-handoff.md)
- [docs/ui-primitives.md](/Users/choiho/zerone/hinear/docs/ui-primitives.md) - pen 기반 primitive 구현 상태와 Storybook 기준
- [docs/issue-detail/optimistic-locking.md](/Users/choiho/zerone/hinear/docs/issue-detail/optimistic-locking.md) - 낙관적 잠금 구현 가이드
- [src/features/issues/components/KanbanBoardView.tsx](/Users/choiho/zerone/hinear/src/features/issues/components/KanbanBoardView.tsx)
- [src/features/issues/hooks/useIssues.ts](/Users/choiho/zerone/hinear/src/features/issues/hooks/useIssues.ts)
- [src/app/internal/projects/[projectId]/issues/route.ts](/Users/choiho/zerone/hinear/src/app/internal/projects/[projectId]/issues/route.ts)
- [src/lib/supabase/env.ts](/Users/choiho/zerone/hinear/src/lib/supabase/env.ts)
- [src/lib/supabase/browser-client.ts](/Users/choiho/zerone/hinear/src/lib/supabase/browser-client.ts)
- [src/lib/supabase/server-client.ts](/Users/choiho/zerone/hinear/src/lib/supabase/server-client.ts)
- [src/lib/supabase/types.ts](/Users/choiho/zerone/hinear/src/lib/supabase/types.ts)
- [src/features/projects/repositories/supabase-projects-repository.ts](/Users/choiho/zerone/hinear/src/features/projects/repositories/supabase-projects-repository.ts)
- [src/features/projects/actions/invite-project-member-action.ts](/Users/choiho/zerone/hinear/src/features/projects/actions/invite-project-member-action.ts)
- [src/features/projects/actions/manage-project-invitation-action.ts](/Users/choiho/zerone/hinear/src/features/projects/actions/manage-project-invitation-action.ts)
- [src/app/invite/[token]/page.tsx](/Users/choiho/zerone/hinear/src/app/invite/[token]/page.tsx)
- [src/app/invite/[token]/accept/route.ts](/Users/choiho/zerone/hinear/src/app/invite/[token]/accept/route.ts)
- [src/lib/supabase/server-auth.ts](/Users/choiho/zerone/hinear/src/lib/supabase/server-auth.ts)
- [supabase/migrations/0005_add_profiles.sql](/Users/choiho/zerone/hinear/supabase/migrations/0005_add_profiles.sql)
- [src/features/issues/repositories/supabase-issues-repository.ts](/Users/choiho/zerone/hinear/src/features/issues/repositories/supabase-issues-repository.ts)
- [src/features/issues/lib/mutation-error-messages.ts](/Users/choiho/zerone/hinear/src/features/issues/lib/mutation-error-messages.ts)
- [src/features/projects/actions/create-project-action.ts](/Users/choiho/zerone/hinear/src/features/projects/actions/create-project-action.ts)
- [src/features/issues/actions/create-issue-action.ts](/Users/choiho/zerone/hinear/src/features/issues/actions/create-issue-action.ts)
- [src/features/issues/components/issue-detail-screen.browser.test.tsx](/Users/choiho/zerone/hinear/src/features/issues/components/issue-detail-screen.browser.test.tsx)
- [src/app/projects/new/page.tsx](/Users/choiho/zerone/hinear/src/app/projects/new/page.tsx)
- [src/app/projects/[projectId]/page.tsx](/Users/choiho/zerone/hinear/src/app/projects/[projectId]/page.tsx)
- [src/app/projects/[projectId]/issues/[issueId]/page.tsx](/Users/choiho/zerone/hinear/src/app/projects/[projectId]/issues/[issueId]/page.tsx)
- [supabase/migrations/0001_initial_project_issue_schema.sql](/Users/choiho/zerone/hinear/supabase/migrations/0001_initial_project_issue_schema.sql)
- [supabase/migrations/0002_schema_lint_fixes.sql](/Users/choiho/zerone/hinear/supabase/migrations/0002_schema_lint_fixes.sql)
- [supabase/migrations/0003_add_issue_labels.sql](/Users/choiho/zerone/hinear/supabase/migrations/0003_add_issue_labels.sql)
- [supabase/migrations/0004_add_version_for_optimistic_locking.sql](/Users/choiho/zerone/hinear/supabase/migrations/0004_add_version_for_optimistic_locking.sql)

## Suggested Prompt

```text
Continue from docs/session-handoff.md and docs/todo.md on branch main. Board fetch/update failure messages are now mapped in useIssues/KanbanBoardView, so continue with not-found/loading/empty polish and repository error typing.
```
