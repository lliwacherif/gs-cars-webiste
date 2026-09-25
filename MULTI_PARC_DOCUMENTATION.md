# Documentation: Multi-Parc Feature Implementation

This document provides a comprehensive overview of the **Multi-Parc** feature implemented in the Tunisia Car Rental application. It serves as a guide for future developers (and AI assistants) to understand the architectural decisions, code changes, and steps taken to allow a single vehicle to be assigned to multiple parcs simultaneously.

---

## 1. Feature Overview

**Goal:** Enable the admin user to assign the same car to multiple parcs at the same time from the Admin panel.
**UI/UX:** The existing drag-and-drop mechanism was preserved for single assignments. A new toggle button ("Multi-Parc") was added to switch the UI into a checkbox-selection mode. In this mode, admins can select multiple vehicles and use a floating action bar to assign them to multiple target parcs simultaneously.

## 2. Backend Implementation Steps

To support multi-parc assignment without breaking existing public-facing search and reservation logic (which relied on a single `parc` reference), we adopted a backward-compatible approach.

### 2.1. Schema Changes (`backend/src/vehicles/schemas/vehicle.schema.ts`)
- Added a new `parcs` array field to store multiple ObjectIds referencing the `Parc` collection.
- Retained the existing `parc` field as the "primary" parc (which automatically defaults to the first element in the `parcs` array).
```typescript
@Prop({ type: [{ type: Schema.Types.ObjectId, ref: 'Parc' }] })
parcs: Types.ObjectId[];
```

### 2.2. DTO Changes (`backend/src/vehicles/dto/create-vehicle.dto.ts`)
- Added an optional `parcIds` array field to accept multiple parc IDs from the frontend.
```typescript
@ApiProperty({ type: [String], required: false })
@IsOptional()
@IsArray()
@IsMongoId({ each: true })
parcIds?: string[];
```

### 2.3. Service Logic (`backend/src/vehicles/vehicles.service.ts`)
- **`create` & `update` methods:** Modified to handle the new `parcIds` payload. When `parcIds` is provided, it populates the `parcs` array and sets the primary `parc` field to `parcIds[0]` (or `undefined` if empty) to keep both fields synchronized.
- **`assignToMultipleParcs`:** Created a dedicated method to handle bulk parc assignments directly for the new Multi-Parc Admin UI.
- **`findAllAdmin`:** Updated the Mongoose query to `.populate('parcs')` alongside the existing `.populate('parc')` so the frontend has access to all assigned parcs.
- *Note:* A critical fix was made to assign `undefined` instead of `null` when a vehicle has no assigned parcs to satisfy strict TypeScript constraints on the Mongoose Document (`TS2322`).

### 2.4. Controller Endpoint (`backend/src/vehicles/vehicles.controller.ts`)
- Added a new `PATCH /vehicles/:id/parcs` endpoint protected by Admin roles to accept the new assignment payload.

---

## 3. Frontend Implementation Steps

The frontend required a significant UI overhaul of the Admin dashboard's Parcs tab to support bulk selection without losing the intuitive drag-and-drop flow.

### 3.1. API Service (`src/services/vehiclesService.js`)
- Added `assignToParcs(id, parcIds)` to communicate with the new backend `PATCH` endpoint.

### 3.2. State Management (`src/pages/Admin/Admin.jsx`)
Added new React state variables to manage the Multi-Parc mode:
```javascript
const [multiParcMode, setMultiParcMode] = useState(false)
const [selectedVehicles, setSelectedVehicles] = useState(new Set())
const [targetParcs, setTargetParcs] = useState(new Set())
const [applyingMultiParc, setApplyingMultiParc] = useState(false)
```

### 3.3. UI Components & Logic (`src/pages/Admin/Admin.jsx`)
- **Dual-Mode UI:** Wrapped the existing drag-and-drop logic in conditions (`!multiParcMode`) to preserve it.
- **Selection Mode:** When Multi-Parc mode is active, vehicle cards become clickable (checkboxes appear) instead of draggable.
- **Floating Action Bar:** Created a bottom-anchored action bar that appears when vehicles are selected. It contains a checklist of all available parcs, an "Appliquer" button to trigger the API calls, a "Désaffecter" button to clear all parcs from selected vehicles, and a cancel button.
- **Badges:** Added a visual indicator (purple badge) on vehicle cards to show if a vehicle is assigned to multiple parcs (e.g., "2 parcs").
- **Stats:** Updated the header stats bar to include a "Multi-Parc" count (vehicles assigned to >1 parc).

### 3.4. CSS Styling (`src/pages/Admin/Admin.css`)
- Added comprehensive styles for the multi-mode toggle button, selected vehicle card states (gold borders, checkboxes), the floating action bar with backdrop-blur, and animated hint banners.

---

## 4. Server Deployment Guide

To deploy these changes to a production Linux server using Git, PM2, and Vite/React, the following command sequence is used:

```bash
# 1. Pull the latest codebase
cd ~/Tunisia-Car-Rental
git pull origin main

# 2. Build and restart the backend
cd backend
npm install
npm run build
pm2 restart bensalem-car-rental-backend

# 3. Build the frontend (Vite static files)
cd ..
npm install
npm run build
```

*Note: The frontend static files are typically served by an Nginx or Apache server directly from the `dist` folder. No PM2 restart is required for the frontend if it's served statically.*

---

## 5. Developer / AI Notes for Future Maintenance
- **Backward Compatibility:** If developing new features (like public search filters), remember that the `parc` field (single ObjectId) still exists and represents the "Primary" parc. If a query needs to check ALL parcs a vehicle is available in, use the `parcs` array field.
- **JSX Parsing Errors:** During implementation, a leftover `}` from a replaced code block caused a Vite `[PARSE_ERROR]`. When replacing large blocks of React UI code, carefully ensure that conditional wrapper braces `{condition && ( ... )}` are properly closed.
- **TypeScript Strictness:** Mongoose schemas typed with TS will throw errors if you attempt to assign `null` to optional relational fields. Always use `undefined` when clearing a relational field.
