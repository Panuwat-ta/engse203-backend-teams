# Task#1: User Management System

## Overview
Implementation of User Management system with login without password.

## Features Implemented
- ✅ Create new users
- ✅ Edit existing users
- ✅ Delete users (soft delete)
- ✅ List users with filtering
- ✅ Login without password (Admin only)
- ✅ Form validation (client + server)

## Setup Instructions

### Prerequisites
- Node.js v18+
- SQLite3
- npm

### Installation
1. Database setup
   - cd database/sqlite
   - sqlite3 wallboard.db < ../scripts/01-create-users-table.sql
   - sqlite3 wallboard.db < ../scripts/02-insert-sample-users.sql

2. cd backend-server
    - npm install
    - npm run dev

3. Frontend
    - cd admin-panel
    - npm install
    - npm start

### API Endpoints
    GET /api/users - Get all users
    POST /api/users - Create user
    PUT /api/users/:id - Update user
    DELETE /api/users/:id - Delete user
    POST /api/auth/login - Login

## test
![](/img/test.png)
![](/img/add-new-users.png)