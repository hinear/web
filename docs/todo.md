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

## Current State

- 원격 Supabase 프로젝트 URL: `https://pmyrrckkiomjwjqntymr.supabase.co`
- 적용된 마이그레이션
  - `initial_project_issue_schema`
  - `schema_lint_fixes`
- security advisor 경고는 현재 없음
- performance advisor에는 `unused_index` 정보만 남아 있음
  - 아직 데이터와 실제 쿼리 트래픽이 없어서 정상적으로 볼 수 있는 상태

## Important Notes

- 현재 저장소 구현은 서버 전용 `service role` 클라이언트를 기본값으로 사용한다.
- 이 구현은 개발 진행용으로는 빠르지만, 앱 요청을 그대로 service role로 처리하면 RLS를 우회한다.
- 실제 기능 연결 시에는 세션 기반 서버 클라이언트 또는 요청 단위 access token 기반 클라이언트로 옮겨야 한다.
- `browser-client.ts`는 추가했지만, 아직 인증 세션/쿠키 연동은 하지 않았다.
- 현재 server action은 임시 actor source로 `HINEAR_ACTOR_ID` env를 사용한다.
- 이 값은 로컬 개발용 임시 경계이며, 실제 앱 인증 경로로 대체되어야 한다.
- `.env.local`에는 최소한 아래 값이 필요하다.
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `HINEAR_ACTOR_ID`

## Next TODO

### 1. Supabase auth/session wiring

- [ ] Next.js 서버 환경에서 사용자 세션을 읽는 방식 결정
- [ ] 서버 컴포넌트 / 서버 액션 / 라우트 핸들러 중 어디서 저장소를 호출할지 정리
- [ ] service-role 기본 사용을 줄이고, 사용자 세션 기반 클라이언트로 전환
- [ ] 필요한 경우 service-role은 관리자성 작업으로만 제한
- [ ] `HINEAR_ACTOR_ID` 임시 actor fallback 제거

### 2. Repository integration

- [x] 저장소 팩토리 또는 DI 진입점 추가
- [x] 프로젝트 생성 흐름에서 `createProjectWithOwner`와 `SupabaseProjectsRepository` 연결
- [x] 이슈 생성 흐름에서 `createIssueDraft`와 `SupabaseIssuesRepository` 연결
- [ ] 저장소 단위 테스트 또는 integration-style 테스트 추가
- [ ] `getIssueById`에 comment / activity join 전략 정리

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
  - [x] useIssues 훅 (MSW API 호출)
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
- [ ] project workspace 화면에 primitive 실제 치환
- [x] project workspace board header에 `cmpHeaderLinearDashboard` 적용
- [ ] create project 화면에 primitive 실제 치환
- [ ] create issue 화면에 primitive 실제 치환
- [x] mobile board 섹션 / app bar 적용
- [x] Create Issue Modal 컴포넌트 reference 구현
- [x] auth form reference 구현
- [x] issue detail state variation reference 구현
- [x] create project / project operations section reference 구현
- [ ] mutation 실패 UI
- [ ] not-found / empty / loading polish
- [ ] issue detail 실제 편집 컨트롤 연결

### 4. Data access hardening

- [ ] repository 에러 타입 정리
- [ ] **낙관적 잠금 (Optimistic Locking) 구현** - 버전 관리로 충돌 방지
  - [ ] `issues` 테이블에 `version` 컬럼 추가 (마이그레이션 0003)
  - [ ] `Issue` 타입에 `version` 필드 추가
  - [ ] `UpdateIssueInput` 타입 정의
  - [ ] `ConflictError` 타입 정의
  - [ ] `SupabaseIssuesRepository.updateIssue` 메서드 구현
  - [ ] 충돌 다이얼로그 UI 컴포넌트 구현
  - [ ] 단위 테스트: 버전 일치/불일치 시나리오
  - [ ] 통합 테스트: 동시 편집 시나리오
  - 자세한 내용은 [optimistic-locking.md](/Users/choiho/zerone/hinear/docs/issue-detail/optimistic-locking.md) 참조
- [ ] 중복 key / 중복 invitation / 권한 실패 케이스 메시지 정리
- [ ] activity log 추가 시점과 정책 정리
- [ ] invitation token 생성 규칙과 만료 정책 검토
- [ ] labels / profiles / issue_labels 후속 스키마 설계
- [ ] board를 `sortable` 구조로 올려 카드 간 정확한 reorder / insertion animation 지원

## Key Files

- [docs/session-handoff.md](/Users/choiho/zerone/hinear/docs/session-handoff.md)
- [docs/ui-primitives.md](/Users/choiho/zerone/hinear/docs/ui-primitives.md) - pen 기반 primitive 구현 상태와 Storybook 기준
- [docs/issue-detail/optimistic-locking.md](/Users/choiho/zerone/hinear/docs/issue-detail/optimistic-locking.md) - 낙관적 잠금 구현 가이드
- [src/lib/supabase/env.ts](/Users/choiho/zerone/hinear/src/lib/supabase/env.ts)
- [src/lib/supabase/browser-client.ts](/Users/choiho/zerone/hinear/src/lib/supabase/browser-client.ts)
- [src/lib/supabase/server-client.ts](/Users/choiho/zerone/hinear/src/lib/supabase/server-client.ts)
- [src/lib/supabase/types.ts](/Users/choiho/zerone/hinear/src/lib/supabase/types.ts)
- [src/features/projects/repositories/supabase-projects-repository.ts](/Users/choiho/zerone/hinear/src/features/projects/repositories/supabase-projects-repository.ts)
- [src/features/issues/repositories/supabase-issues-repository.ts](/Users/choiho/zerone/hinear/src/features/issues/repositories/supabase-issues-repository.ts)
- [src/features/projects/actions/create-project-action.ts](/Users/choiho/zerone/hinear/src/features/projects/actions/create-project-action.ts)
- [src/features/issues/actions/create-issue-action.ts](/Users/choiho/zerone/hinear/src/features/issues/actions/create-issue-action.ts)
- [src/app/projects/new/page.tsx](/Users/choiho/zerone/hinear/src/app/projects/new/page.tsx)
- [src/app/projects/[projectId]/page.tsx](/Users/choiho/zerone/hinear/src/app/projects/[projectId]/page.tsx)
- [src/app/projects/[projectId]/issues/[issueId]/page.tsx](/Users/choiho/zerone/hinear/src/app/projects/[projectId]/issues/[issueId]/page.tsx)
- [supabase/migrations/0001_initial_project_issue_schema.sql](/Users/choiho/zerone/hinear/supabase/migrations/0001_initial_project_issue_schema.sql)
- [supabase/migrations/0002_schema_lint_fixes.sql](/Users/choiho/zerone/hinear/supabase/migrations/0002_schema_lint_fixes.sql)
- [supabase/migrations/0003_add_version_for_optimistic_locking.sql](/Users/choiho/zerone/hinear/supabase/migrations/0003_add_version_for_optimistic_locking.sql) (추가 예정)

## Suggested Prompt

```text
Continue from docs/session-handoff.md and docs/todo.md on branch main. Keep the current project -> issue -> detail flow working, replace service-role-first repository usage with session-aware server wiring, and remove the temporary HINEAR_ACTOR_ID actor fallback.
```
