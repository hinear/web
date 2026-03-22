# Profiles Schema

## 목적

`auth.users`의 최소 식별 정보만으로는 issue detail, comments, members, invitations 화면에서 사람이 읽을 수 있는 작성자 정보를 안정적으로 보여주기 어렵다. 이 문서는 앱 레벨의 `profiles` 테이블을 추가할 때 필요한 최소 스키마와 운영 규칙을 정리한다.

## 왜 필요한가

- issue detail에서 `createdBy`, `updatedBy`, comment `authorId`를 그대로 노출하면 사람이 읽기 어렵다
- project members / invitations / activity log에 표시할 이름, 아바타, 이메일 정규화 정보가 필요하다
- 향후 assignee picker, mention, notification 대상 계산에도 공통 source of truth가 필요하다

## 설계 원칙

- 인증의 source of truth는 계속 `auth.users`다
- 앱 표시 정보만 `public.profiles`에 둔다
- `profiles.id = auth.users.id` 1:1 관계를 유지한다
- 읽기 빈도가 높으므로 issue detail / comments / members가 바로 join 가능한 형태를 유지한다
- 이름 없는 신규 유저도 문제없이 진입할 수 있도록 nullable + fallback 규칙을 둔다

## 테이블 초안

### profiles

핵심 필드:

- `id uuid primary key`
- `email text not null`
- `email_normalized text generated or write-normalized`
- `display_name text null`
- `avatar_url text null`
- `handle text null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

규칙:

- `id`는 `auth.users.id`를 참조한다
- `email_normalized`는 lower-case canonical value를 저장한다
- `display_name`이 비어 있으면 UI는 `email` local-part 또는 `"Unknown user"`로 fallback 한다
- `handle`은 나중에 mention/search가 필요할 때만 unique 제약을 올린다. 초기 버전은 nullable로 둔다

## 권장 인덱스

- `profiles_email_normalized_idx` on `email_normalized`
- `profiles_display_name_idx` on `display_name`

초기에는 unique index를 `email_normalized`에 둘 수 있지만, auth 공급자별 이메일 변경 흐름을 고려하면 `id` 기반 join이 더 중요하다. 이메일 unique는 auth 쪽과 중복 관리가 될 수 있으니 운영 정책을 정한 뒤 결정한다.

## 생성/동기화 전략

권장 순서:

1. 회원 가입 또는 첫 magic-link 로그인 직후 `profiles` upsert
2. 서버에서 `auth.users`를 읽은 뒤 `id`, `email`을 기준으로 `profiles` 보정
3. 사용자가 이름/아바타를 수정하면 `profiles`만 업데이트

트리거를 바로 두는 것도 가능하지만, 현재 앱은 auth callback과 request-bound server path가 이미 있으므로 첫 단계는 앱 레벨 upsert가 더 단순하다.

## RLS 방향

- 본인은 자신의 profile을 조회/수정 가능
- 같은 프로젝트 멤버는 서로의 profile을 조회 가능
- project invitation lookup은 owner만 초대 대상 이메일과 연결된 profile을 확인할 수 있으면 충분하다

초기 정책 제안:

- `select`: 본인 또는 같은 프로젝트 멤버
- `insert`: 본인만 자신의 row 생성
- `update`: 본인만 자신의 row 수정
- `delete`: 앱에서는 사용하지 않음

## 현재 도메인과의 연결

첫 연결 대상:

- `project_members.user_id -> profiles.id`
- `issues.created_by`, `issues.updated_by`, `issues.assignee_id -> profiles.id`
- `comments.author_id -> profiles.id`
- `activity_logs.actor_id -> profiles.id`

이 단계가 되면 다음 UI 개선이 가능하다:

- issue detail 작성자/수정자 이름 노출
- comment author 이름 + avatar
- project workspace 멤버 목록 실데이터 치환
- invitation accept / pending invitation에서 초대자 이름 안정화

## 마이그레이션 초안

```sql
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  email_normalized text not null,
  display_name text,
  avatar_url text,
  handle text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_email_normalized_idx
  on public.profiles (email_normalized);

create index profiles_display_name_idx
  on public.profiles (display_name);
```

## 이후 작업 추천

- `src/features/projects/types.ts`와 issue detail read model에 `ProfileSummary` 타입 추가
- server auth path에서 authenticated user 기준 `profiles` upsert helper 추가
- members / comments / activity log read model에 profile join 적용
