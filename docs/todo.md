# TODO

현재 세션 기준으로 남은 작업과 주의사항을 정리한다.

## Done

- [x] Supabase MCP 연결 확인
- [x] 원격 Supabase 프로젝트 URL 확인
- [x] 원격 프로젝트에 초기 스키마 적용
- [x] 원격 프로젝트에 후속 lint fix 마이그레이션 적용
- [x] `@supabase/supabase-js` 추가
- [x] `src/lib/supabase/` 환경 변수, 타입, 브라우저/서버 클라이언트 추가
- [x] `ProjectsRepository` Supabase 구현 추가
- [x] `IssuesRepository` Supabase 구현 추가
- [x] `eslint`
- [x] `tsc --noEmit`
- [x] `vitest run`

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
- `.env.local`에는 최소한 아래 값이 필요하다.
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

## Next TODO

### 1. Supabase auth/session wiring

- [ ] Next.js 서버 환경에서 사용자 세션을 읽는 방식 결정
- [ ] 서버 컴포넌트 / 서버 액션 / 라우트 핸들러 중 어디서 저장소를 호출할지 정리
- [ ] service-role 기본 사용을 줄이고, 사용자 세션 기반 클라이언트로 전환
- [ ] 필요한 경우 service-role은 관리자성 작업으로만 제한

### 2. Repository integration

- [ ] 저장소 팩토리 또는 DI 진입점 추가
- [ ] 프로젝트 생성 흐름에서 `createProjectWithOwner`와 `SupabaseProjectsRepository` 연결
- [ ] 이슈 생성 흐름에서 `createIssueDraft`와 `SupabaseIssuesRepository` 연결
- [ ] 저장소 단위 테스트 또는 integration-style 테스트 추가

### 3. Minimal UI flow

- [ ] 프로젝트 생성 페이지
- [ ] 프로젝트 상세 진입 페이지
- [ ] 이슈 생성 액션
- [ ] 이슈 상세 shell

### 4. Data access hardening

- [ ] repository 에러 타입 정리
- [ ] 중복 key / 중복 invitation / 권한 실패 케이스 메시지 정리
- [ ] activity log 추가 시점과 정책 정리
- [ ] invitation token 생성 규칙과 만료 정책 검토

## Key Files

- [docs/session-handoff.md](/Users/choiho/zerone/hinear/docs/session-handoff.md)
- [src/lib/supabase/env.ts](/Users/choiho/zerone/hinear/src/lib/supabase/env.ts)
- [src/lib/supabase/browser-client.ts](/Users/choiho/zerone/hinear/src/lib/supabase/browser-client.ts)
- [src/lib/supabase/server-client.ts](/Users/choiho/zerone/hinear/src/lib/supabase/server-client.ts)
- [src/lib/supabase/types.ts](/Users/choiho/zerone/hinear/src/lib/supabase/types.ts)
- [src/features/projects/repositories/supabase-projects-repository.ts](/Users/choiho/zerone/hinear/src/features/projects/repositories/supabase-projects-repository.ts)
- [src/features/issues/repositories/supabase-issues-repository.ts](/Users/choiho/zerone/hinear/src/features/issues/repositories/supabase-issues-repository.ts)
- [supabase/migrations/0001_initial_project_issue_schema.sql](/Users/choiho/zerone/hinear/supabase/migrations/0001_initial_project_issue_schema.sql)
- [supabase/migrations/0002_schema_lint_fixes.sql](/Users/choiho/zerone/hinear/supabase/migrations/0002_schema_lint_fixes.sql)

## Suggested Prompt

```text
Continue from docs/session-handoff.md and docs/todo.md on branch codex/project-membership-issue-schema. Keep the current Supabase schema, replace service-role-first repository usage with session-aware server wiring, and connect the minimal project/issue creation flow.
```
