# Backend Product Requirements Document (PRD)

## Overview
This document outlines the backend requirements for supporting the Choice Talent frontend application. The backend will provide secure, scalable APIs for user authentication, password management, and user dashboard features.

---

## 1. User Authentication & Authorization

### 1.1. Registration
- **Endpoint:** `POST /api/auth/register`
- **Request:** `{ email, password, name }`
- **Response:** `201 Created` with user info (no password)
- **Validations:** Unique email, strong password

### 1.2. Login
- **Endpoint:** `POST /api/auth/login`
- **Request:** `{ email, password }`
- **Response:** `200 OK` with JWT or session token
- **Validations:** Correct credentials

### 1.3. Logout
- **Endpoint:** `POST /api/auth/logout`
- **Request:** Auth token (header/cookie)
- **Response:** `204 No Content`

### 1.4. Auth Middleware
- Protects all endpoints except register, login, forgot/reset password
- Verifies JWT/session, attaches user to request

---

## 2. Password Management

### 2.1. Forgot Password
- **Endpoint:** `POST /api/auth/forgot-password`
- **Request:** `{ email }`
- **Response:** `200 OK` (always, for security)
- **Action:** Sends password reset email with token

### 2.2. Reset Password
- **Endpoint:** `POST /api/auth/reset-password`
- **Request:** `{ token, newPassword }`
- **Response:** `200 OK` (on success)
- **Validations:** Token validity, strong password

### 2.3. Change Password (Authenticated)
- **Endpoint:** `POST /api/user/change-password`
- **Request:** `{ oldPassword, newPassword }`
- **Response:** `200 OK` (on success)
- **Validations:** Old password correct, strong new password

---

## 3. User Dashboard

### 3.1. Get User Profile
- **Endpoint:** `GET /api/user/profile`
- **Request:** Auth token
- **Response:** User info (id, email, name, etc.)

### 3.2. Update User Profile
- **Endpoint:** `PUT /api/user/profile`
- **Request:** `{ name, ... }` (editable fields)
- **Response:** Updated user info

---

## 4. Data Models

### 4.1. User
- `id`: UUID
- `email`: string (unique)
- `passwordHash`: string
- `name`: string
- `createdAt`, `updatedAt`: timestamps
- `passwordResetToken`, `passwordResetExpires`: for reset flow

---

## 5. Security & Validation
- Passwords hashed (bcrypt or argon2)
- JWT or secure session tokens
- Rate limiting on auth endpoints
- Input validation (email, password strength)
- Secure error messages (no user enumeration)

---

## 6. Non-Functional Requirements
- RESTful API, JSON responses
- Well-documented endpoints (OpenAPI/Swagger)
- Unit & integration tests
- Logging & error monitoring
- Environment config for secrets

---

## 7. Future Considerations
- Social login (Google, etc.)
- Admin panel
- User roles/permissions
- Audit logs 