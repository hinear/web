# UI Primitives

현재 UI 컴포넌트는 `pen/components.pen`과 `pen/Hinear.pen`에 등록된 토큰과 구조를 기준으로 맞추고 있다.

## 원칙

- 전역 스타일은 `src/app/globals.css`의 `@theme` 토큰 중심으로 유지한다.
- 수기 클래스나 `:root` 별칭은 가능한 한 추가하지 않는다.
- `pen`의 기본 상태를 먼저 맞춘 뒤 hover, focus, disabled를 보정한다.
- 구조가 다른 항목은 억지로 하나로 합치지 않고 atomic 단계에 맞게 분리한다.
- Storybook 스토리를 같은 컴포넌트 폴더에 같이 둔다.

## 토큰 소스

- `pen/components.pen`
- `pen/Hinear.pen`
- 등록 위치: [src/app/globals.css](/Users/choiho/zerone/hinear/src/app/globals.css)

현재 `globals.css`에는 `pen`에서 온 토큰과 최소 `body` 스타일만 남아 있다.

## Atomic Structure

물리 경로는 아래 세 계층으로 나눈다.

- `src/components/atoms`
- `src/components/molecules`
- `src/components/organisms`

## Atoms

- `Button`
  - 기준 노드: `cmpBtnPrimary`, `cmpBtnSecondary`
  - 파일: [src/components/atoms/Button/Button.tsx](/Users/choiho/zerone/hinear/src/components/atoms/Button/Button.tsx)
- `Chip`
  - 기준 노드: `cmpChipNeutral`, `cmpChipAccent`, `cmpChipOutline`, `cmpChipDanger`, `wbZNN`, `995lk`
  - 파일: [src/components/atoms/Chip/Chip.tsx](/Users/choiho/zerone/hinear/src/components/atoms/Chip/Chip.tsx)
- `CountBadge`
  - 기준 노드: `995lk`
  - 용도: 고정 원형 count badge
  - 파일: [src/components/atoms/CountBadge/CountBadge.tsx](/Users/choiho/zerone/hinear/src/components/atoms/CountBadge/CountBadge.tsx)
- `Field`
  - 기준 노드: `cmpFieldInput`
  - 파일: [src/components/atoms/Field/Field.tsx](/Users/choiho/zerone/hinear/src/components/atoms/Field/Field.tsx)
- `Select`
  - 기준 노드: `cmpFieldSelect`
  - 파일: [src/components/atoms/Select/Select.tsx](/Users/choiho/zerone/hinear/src/components/atoms/Select/Select.tsx)
- `Avatar`
  - 기준 노드: `T0CIx`
  - 동작: `src`가 있으면 이미지, 없으면 `name` 또는 `fallback`에서 두 글자 이니셜 표시
  - 파일: [src/components/atoms/Avatar/Avatar.tsx](/Users/choiho/zerone/hinear/src/components/atoms/Avatar/Avatar.tsx)

## Molecules

- `SidebarItem`
  - 기준 노드: `cmpNavItemDefault`, `cmpNavItemActive`, `cmpProjectItemDefault`, `cmpProjectItemActive`
  - 내장 variant: `issues`, `triage`, `active`, `backlog`, `roadmap`
  - 파일: [src/components/molecules/SidebarItem/SidebarItem.tsx](/Users/choiho/zerone/hinear/src/components/molecules/SidebarItem/SidebarItem.tsx)
- `HeaderAction`
  - 기준 노드: `cmpHeaderActionPrimary`, `cmpHeaderActionBoard`, `cmpHeaderActionFilter`
  - 파일: [src/components/molecules/HeaderAction/HeaderAction.tsx](/Users/choiho/zerone/hinear/src/components/molecules/HeaderAction/HeaderAction.tsx)
- `HeaderSearchField`
  - 기준 노드: `cmpHeaderActionSearch`
  - 파일: [src/components/molecules/HeaderAction/HeaderAction.tsx](/Users/choiho/zerone/hinear/src/components/molecules/HeaderAction/HeaderAction.tsx)
- `BoardAddCard`
  - 기준 노드: `cmpBoardCardAdd`
  - 파일: [src/components/molecules/BoardAddCard/BoardAddCard.tsx](/Users/choiho/zerone/hinear/src/components/molecules/BoardAddCard/BoardAddCard.tsx)
- `BoardColumnHeader`
  - 기준 노드: `nOl4X`
  - 구성: column title + `CountBadge`
  - 파일: [src/components/molecules/BoardColumnHeader/BoardColumnHeader.tsx](/Users/choiho/zerone/hinear/src/components/molecules/BoardColumnHeader/BoardColumnHeader.tsx)
- `MobileIssueListAppBar`
  - 기준 노드: `cmpMobileAppBarIssueList`
  - 파일: [src/components/molecules/MobileIssueListAppBar/MobileIssueListAppBar.tsx](/Users/choiho/zerone/hinear/src/components/molecules/MobileIssueListAppBar/MobileIssueListAppBar.tsx)
- `ProjectSelect`
  - 기준 노드: `PGTKk`
  - 관련 구조: `ProjectSwitcher`, `OpenDashboardLink`
  - 파일: [src/components/molecules/ProjectSelect/ProjectSelect.tsx](/Users/choiho/zerone/hinear/src/components/molecules/ProjectSelect/ProjectSelect.tsx)

## Organisms

- `BoardIssueCard`
  - 기준 노드: `cmpBoardCardIssue`
  - 파일: [src/components/organisms/BoardIssueCard/BoardIssueCard.tsx](/Users/choiho/zerone/hinear/src/components/organisms/BoardIssueCard/BoardIssueCard.tsx)
- `SidebarDesktop`
  - 기준 노드: `1YjGD` (`Sidebar/Desktop`)
  - 조합 구조: `ProjectSwitcher`, `OpenDashboardLink`, `SidebarItem`
  - 파일: [src/components/organisms/SidebarDesktop/SidebarDesktop.tsx](/Users/choiho/zerone/hinear/src/components/organisms/SidebarDesktop/SidebarDesktop.tsx)
- `LinearDashboardHeader`
  - 기준 노드: `cmpHeaderLinearDashboard`
  - 파일: [src/components/organisms/LinearDashboardHeader/LinearDashboardHeader.tsx](/Users/choiho/zerone/hinear/src/components/organisms/LinearDashboardHeader/LinearDashboardHeader.tsx)
- `MobileIssueSections`
  - 기준 노드: `cmpMobileSectionsIssueList`
  - 파일: [src/components/organisms/MobileIssueSections/MobileIssueSections.tsx](/Users/choiho/zerone/hinear/src/components/organisms/MobileIssueSections/MobileIssueSections.tsx)
- `DrawerIssueDetailPanel`
  - 기준 노드: `cmpDrawerIssueDetailPanel`
  - 파일: [src/components/organisms/DrawerIssueDetailPanel/DrawerIssueDetailPanel.tsx](/Users/choiho/zerone/hinear/src/components/organisms/DrawerIssueDetailPanel/DrawerIssueDetailPanel.tsx)
- `CreateIssueTabletModal`
  - 기준 노드: `cmpModalCreateIssueTablet`
  - 파일: [src/components/organisms/CreateIssueTabletModal/CreateIssueTabletModal.tsx](/Users/choiho/zerone/hinear/src/components/organisms/CreateIssueTabletModal/CreateIssueTabletModal.tsx)
- `AuthForm`
  - 기준 노드: `sz3qW`, `cmpAuthFormTablet`, `cmpAuthFormMobile`
  - variant: `desktop`, `tablet`, `mobile`
  - 파일: [src/components/organisms/AuthForm/AuthForm.tsx](/Users/choiho/zerone/hinear/src/components/organisms/AuthForm/AuthForm.tsx)
- `IssueDetailStateVariations`
  - 기준 노드: `7woAV`
  - 용도: full-page issue detail loading / error / not-found / empty / saving reference set
  - 파일: [src/components/organisms/IssueDetailStateVariations/IssueDetailStateVariations.tsx](/Users/choiho/zerone/hinear/src/components/organisms/IssueDetailStateVariations/IssueDetailStateVariations.tsx)
- `CreateProjectSection`
  - 기준 노드: `vr16n`
  - 파일: [src/components/organisms/CreateProjectSection/CreateProjectSection.tsx](/Users/choiho/zerone/hinear/src/components/organisms/CreateProjectSection/CreateProjectSection.tsx)
- `ProjectOperationsSection`
  - 기준 노드: `eoJuy`
  - 파일: [src/components/organisms/ProjectOperationsSection/ProjectOperationsSection.tsx](/Users/choiho/zerone/hinear/src/components/organisms/ProjectOperationsSection/ProjectOperationsSection.tsx)

## 실제 적용 상태

실제 앱 화면에 연결된 항목:

- `LinearDashboardHeader`
- `MobileIssueListAppBar`
- `MobileIssueSections`
- `BoardColumnHeader`
- `CountBadge`
- drag/drop hover and overlay states in [src/features/issues/components/KanbanBoard.tsx](/Users/choiho/zerone/hinear/src/features/issues/components/KanbanBoard.tsx), [src/features/issues/components/KanbanColumn.tsx](/Users/choiho/zerone/hinear/src/features/issues/components/KanbanColumn.tsx), [src/features/issues/components/IssueCard.tsx](/Users/choiho/zerone/hinear/src/features/issues/components/IssueCard.tsx)

Storybook / reference 단계 항목:

- `DrawerIssueDetailPanel`
- `CreateIssueTabletModal`
- `AuthForm`
- `IssueDetailStateVariations`
- `CreateProjectSection`
- `ProjectOperationsSection`

## Storybook

- 설정: [.storybook/main.ts](/Users/choiho/zerone/hinear/.storybook/main.ts), [.storybook/preview.ts](/Users/choiho/zerone/hinear/.storybook/preview.ts)
- 실행: `pnpm storybook`
- 빌드 확인: `pnpm build-storybook`

대표 스토리 파일:

- [src/components/atoms/Button/Button.stories.tsx](/Users/choiho/zerone/hinear/src/components/atoms/Button/Button.stories.tsx)
- [src/components/atoms/Chip/Chip.stories.tsx](/Users/choiho/zerone/hinear/src/components/atoms/Chip/Chip.stories.tsx)
- [src/components/atoms/Field/Field.stories.tsx](/Users/choiho/zerone/hinear/src/components/atoms/Field/Field.stories.tsx)
- [src/components/atoms/Select/Select.stories.tsx](/Users/choiho/zerone/hinear/src/components/atoms/Select/Select.stories.tsx)
- [src/components/atoms/Avatar/Avatar.stories.tsx](/Users/choiho/zerone/hinear/src/components/atoms/Avatar/Avatar.stories.tsx)
- [src/components/atoms/CountBadge/CountBadge.stories.tsx](/Users/choiho/zerone/hinear/src/components/atoms/CountBadge/CountBadge.stories.tsx)
- [src/components/molecules/SidebarItem/SidebarItem.stories.tsx](/Users/choiho/zerone/hinear/src/components/molecules/SidebarItem/SidebarItem.stories.tsx)
- [src/components/molecules/ProjectSelect/ProjectSelect.stories.tsx](/Users/choiho/zerone/hinear/src/components/molecules/ProjectSelect/ProjectSelect.stories.tsx)
- [src/components/molecules/HeaderAction/HeaderAction.stories.tsx](/Users/choiho/zerone/hinear/src/components/molecules/HeaderAction/HeaderAction.stories.tsx)
- [src/components/molecules/BoardAddCard/BoardAddCard.stories.tsx](/Users/choiho/zerone/hinear/src/components/molecules/BoardAddCard/BoardAddCard.stories.tsx)
- [src/components/molecules/BoardColumnHeader/BoardColumnHeader.stories.tsx](/Users/choiho/zerone/hinear/src/components/molecules/BoardColumnHeader/BoardColumnHeader.stories.tsx)
- [src/components/molecules/MobileIssueListAppBar/MobileIssueListAppBar.stories.tsx](/Users/choiho/zerone/hinear/src/components/molecules/MobileIssueListAppBar/MobileIssueListAppBar.stories.tsx)
- [src/components/organisms/BoardIssueCard/BoardIssueCard.stories.tsx](/Users/choiho/zerone/hinear/src/components/organisms/BoardIssueCard/BoardIssueCard.stories.tsx)
- [src/components/organisms/SidebarDesktop/SidebarDesktop.stories.tsx](/Users/choiho/zerone/hinear/src/components/organisms/SidebarDesktop/SidebarDesktop.stories.tsx)
- [src/components/organisms/LinearDashboardHeader/LinearDashboardHeader.stories.tsx](/Users/choiho/zerone/hinear/src/components/organisms/LinearDashboardHeader/LinearDashboardHeader.stories.tsx)
- [src/components/organisms/MobileIssueSections/MobileIssueSections.stories.tsx](/Users/choiho/zerone/hinear/src/components/organisms/MobileIssueSections/MobileIssueSections.stories.tsx)
- [src/components/organisms/DrawerIssueDetailPanel/DrawerIssueDetailPanel.stories.tsx](/Users/choiho/zerone/hinear/src/components/organisms/DrawerIssueDetailPanel/DrawerIssueDetailPanel.stories.tsx)
- [src/components/organisms/CreateIssueTabletModal/CreateIssueTabletModal.stories.tsx](/Users/choiho/zerone/hinear/src/components/organisms/CreateIssueTabletModal/CreateIssueTabletModal.stories.tsx)
- [src/components/organisms/AuthForm/AuthForm.stories.tsx](/Users/choiho/zerone/hinear/src/components/organisms/AuthForm/AuthForm.stories.tsx)
- [src/components/organisms/IssueDetailStateVariations/IssueDetailStateVariations.stories.tsx](/Users/choiho/zerone/hinear/src/components/organisms/IssueDetailStateVariations/IssueDetailStateVariations.stories.tsx)
- [src/components/organisms/CreateProjectSection/CreateProjectSection.stories.tsx](/Users/choiho/zerone/hinear/src/components/organisms/CreateProjectSection/CreateProjectSection.stories.tsx)
- [src/components/organisms/ProjectOperationsSection/ProjectOperationsSection.stories.tsx](/Users/choiho/zerone/hinear/src/components/organisms/ProjectOperationsSection/ProjectOperationsSection.stories.tsx)

## 현재 주의사항

- 일부 컴포넌트는 `pen`의 기본 상태만 먼저 맞춘 상태라 hover, pressed, focus, disabled 값이 아직 덜 맞춰진 부분이 있다.
- board는 현재 `column drop` 구조까지만 반영되어 있어서 카드 간 정확한 reorder/insertion 애니메이션까지 하려면 `sortable` 구조로 한 번 더 가야 한다.
- 앱 화면에는 예전 커스텀 클래스 의존이 남아 있을 수 있어서, atomic 컴포넌트를 실제 화면에 붙이면서 치환 작업이 필요하다.
- `ProjectSwitcher`와 `HeaderSearchField`처럼 구조가 분리된 항목은 다시 단일 컴포넌트로 합치지 않는 것이 좋다.

## 다음 작업 추천

- issue board와 project workspace에 atomic 컴포넌트 실제 치환
- create project / operations / issue detail reference set 중 실제 라우트에 들어갈 화면을 선별해 연결
- `pen` 기준 hover, focus, disabled 상태 추가
- drawer, modal, card 단위 조합 컴포넌트 확장
- reference story 정리와 테스트 co-location 추가
