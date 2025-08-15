# React Frontend Refactoring Plan

## Overview
This document outlines the refactoring strategy for the MedCor AI React frontend application to improve maintainability, scalability, and multi-tenancy support.

## Current Structure Issues
1. **Large monolithic components** - Some components exceed 150KB
2. **Mixed concerns** - Business logic mixed with UI components
3. **Inconsistent file organization** - No clear feature-based structure
4. **Missing multi-tenant configuration** - No centralized tenant management
5. **Poor type safety** - Inconsistent TypeScript usage

## New Architecture

### Folder Structure
```
src/
├── components/         # Reusable UI components
│   ├── common/        # Generic components (LoadingSpinner, ErrorMessage)
│   ├── ui/            # Shadcn UI components
│   └── widgets/       # Complex reusable widgets
├── features/          # Feature-based modules
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   ├── dashboard/
│   │   ├── admin/
│   │   ├── doctor/
│   │   ├── patient/
│   │   └── superadmin/
│   ├── appointments/
│   ├── chat/
│   ├── medical-records/
│   └── payments/
├── hooks/             # Global custom hooks
├── services/          # API services and external integrations
├── store/             # State management (if needed)
├── tenants/           # Tenant configurations
├── types/             # Global TypeScript types
├── utils/             # Helper functions
├── constants/         # App-wide constants
└── styles/            # Global styles and themes
```

## Refactoring Steps

### Phase 1: Foundation (COMPLETED ✓)
- [x] Create new folder structure
- [x] Set up TypeScript types
- [x] Create tenant configuration system
- [x] Implement common utilities and constants
- [x] Create reusable UI components

### Phase 2: Feature Modularization (IN PROGRESS)
- [x] Extract authentication into feature module
- [ ] Break down large dashboard components
- [ ] Modularize appointment system
- [ ] Refactor chat components
- [ ] Organize medical records features

### Phase 3: Smart vs Dumb Components
- [ ] Identify container components (handle logic)
- [ ] Create presentational components (UI only)
- [ ] Extract business logic to services
- [ ] Implement proper data flow

### Phase 4: Multi-Tenancy Enhancement
- [x] Create TenantContext provider
- [ ] Implement theme switching
- [ ] Add tenant-specific asset loading
- [ ] Create tenant configuration UI

### Phase 5: Code Quality
- [ ] Add proper error boundaries
- [ ] Implement consistent naming conventions
- [ ] Add comprehensive TypeScript types
- [ ] Create unit tests for critical components

## Component Breakdown Strategy

### Large Components to Refactor
1. **admin-dashboard.tsx (156KB)**
   - Split into: Header, Sidebar, Analytics, UserManagement, Settings
   - Extract API calls to services
   - Create reusable data tables

2. **PatientDashboardNew.tsx (56KB)**
   - Split into: PatientInfo, AppointmentList, MedicalHistory, Prescriptions
   - Create separate feature modules

3. **DoctorDashboardEnhanced.tsx (49KB)**
   - Split into: DoctorSchedule, PatientQueue, ConsultationPanel
   - Extract common medical components

## Naming Conventions
- **Components**: PascalCase (`UserProfile.tsx`)
- **Hooks**: camelCase with 'use' prefix (`useAuth.ts`)
- **Services**: camelCase with suffix (`authService.ts`)
- **Types**: PascalCase (`User.ts`)
- **Utils**: camelCase (`formatDate.ts`)
- **Constants**: UPPER_SNAKE_CASE (`API_ENDPOINTS.ts`)

## Import Optimization
- Use barrel exports (index.ts) for clean imports
- Implement path aliases (@components, @features, @utils)
- Group imports: React, External, Internal

## State Management Strategy
- Local state for component-specific data
- Context for cross-cutting concerns (auth, tenant)
- React Query for server state
- Consider Redux/Zustand for complex app state

## Performance Considerations
- Implement code splitting by route
- Lazy load heavy components
- Use React.memo for expensive renders
- Optimize bundle size with tree shaking

## Testing Strategy
- Unit tests for utilities and services
- Component tests for critical UI
- Integration tests for workflows
- E2E tests for critical paths

## Migration Path
1. Start with new features using new structure
2. Gradually refactor existing components
3. Maintain backward compatibility
4. Update imports progressively
5. Document changes in changelog