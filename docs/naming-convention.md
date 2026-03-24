# Hinear 파일 네이밍 컨벤션

## 기본 원칙

**명확하게 역할을 나타내는 순서**: `[기능/도메인] + [역할/타입] + [구체적용도]`

이 컨벤션은 프로젝트 전체에서 일관성을 유지하고, 파일명만으로도 파일의 역할을 명확하게 알 수 있도록 합니다.

## 파일 타입별 네이밍 규칙

### 1. 화면/컴포넌트 (`-screen.tsx`, `.tsx`)

```
[기능] + [역할] + screen
```

**예시**:
- `issue-drawer-screen.tsx` - 이슈 드로어 화면
- `project-workspace-screen.tsx` - 프로젝트 워크스페이스 화면
- `issue-detail-full-page-screen.tsx` - 이슈 상세 전체 페이지 화면
- `kanban-board-view.tsx` - 칸반 보드 뷰

**규칙**:
- 화면 단위 컴포넌트는 `-screen.tsx` 접미사 사용
- 뷰 컴포넌트는 `-view.tsx` 접미사 사용
- 역할이 명확할 때는 접미사 생략 가능 (예: `IssueCard.tsx`)

### 2. 로더/데이터 로딩 (`-loader.ts`)

```
[기능] + [역할] + loader
```

**예시**:
- `issue-detail-loader.ts` - 이슈 상세 로더
- `project-workspace-loader.ts` - 프로젝트 워크스페이스 로더

**규칙**:
- 서버 컴포넌트에서 데이터를 로드하는 함수는 `-loader.ts`
- `load`로 시작하지 않고 명사형 사용

### 3. 유틸리티/헬퍼 (`-utils.ts`, `-helper.ts`)

```
[기능] + [역할] + utils
```

**예시**:
- `drawer-utils.ts` - 드로어 유틸리티
- `route-utils.ts` - 라우트 유틸리티
- `date-utils.ts` - 날짜 유틸리티

**규칙**:
- 순수 함수들을 모아둔 유틸리티는 `-utils.ts`
- 특정 기능을 돕는 헬퍼는 `-helper.ts`
- 복합적인 기능을 가진 경우 `-lib.ts` 사용도 가능

### 4. 라우트/경로 (`-routes.ts`, `-paths.ts`)

```
[도메인] + routes
```

**예시**:
- `project-routes.ts` - 프로젝트 라우트
- `issue-routes.ts` - 이슈 라우트

**규칙**:
- 라우트 경로 상수들을 모아둔 파일
- `-paths.ts`보다 `-routes.ts`가 더 명확함

### 5. 레포지토리 (`*-repository.ts`)

```
[기술] + [기능] + repository
```

**예시**:
- `supabase-issues-repository.ts` - Supabase 이슈 레포지토리
- `server-projects-repository.ts` - 서버 프로젝트 레포지토리

**규칙**:
- 데이터 액세스 레이어는 `-repository.ts` 접미사
- 기술명 (Supabase, server 등)을 접두어로 사용하여 구분

### 6. 액션/서버 액션 (`*-action.ts`)

```
[동사] + [대상] + action
```

**예시**:
- `create-issue-action.ts` - 이슈 생성 액션
- `update-issue-action.ts` - 이슈 업데이트 액션

**규칙**:
- Next.js 서버 액션은 `-action.ts` 접미사
- 동사-목적어 형태 사용

### 7. 타입/계약 (`types.ts`, `contracts.ts`)

```
[도메인] + types/contracts
```

**예시**:
- `issue-types.ts` - 이슈 타입 정의
- `issue-contracts.ts` - 이슈 계약/인터페이스

**규칙**:
- 도메인 모델 타입은 `-types.ts`
- API 계약/인터페이스는 `-contracts.ts`

## 네이밍 예시

### 좋은 예시 ✅

```
issue-drawer-screen.tsx          // 명확한 역할
issue-detail-loader.ts           // 명사형, 로드 역할 명확
project-routes.ts                // 도메인 + routes
drawer-utils.ts                  // 유틸리티 명확
```

### 피해야 할 예시 ❌

```
issue-detail-drawer-screen.tsx   // detail와 drawer 중복
load-issue-detail.ts             // 동사-명사 혼합
paths.ts                         // 너무 일반적
helper.ts                        // 역할 불명확
```

## 변경 전후 예시

| 변경 전 | 변경 후 | 이유 |
|---------|---------|------|
| `issue-detail-drawer-screen.tsx` | `issue-drawer-screen.tsx` | 중복 제거 |
| `load-issue-detail.ts` | `issue-detail-loader.ts` | 명사형, 역할 명확 |
| `paths.ts` | `project-routes.ts` | 도메인 명시 |
| `board-drawer-wrapper.tsx` | `board-drawer-wrapper.tsx` | 이미 좋음 |

## 참고 사항

1. **일관성**: 같은 역할의 파일들은 항상 같은 접미사를 사용
2. **명확성**: 파일명만 보고도 파일의 역할을 알 수 있어야 함
3. **간결성**: 불필요한 단어는 제거하고 핵심 역할만 표현
4. **확장성**: 새로운 기능 추가 시 같은 패턴 적용 가능

## 적용 범위

- `src/features/` 디렉토리 내의 모든 파일
- 컴포넌트, 유틸리티, 로더, 레포지토리 등
- 서버 액션, 라우트 핸들러

이 컨벤션은 프로젝트의 일관성과 가독성을 높이기 위해 만들어졌습니다.
