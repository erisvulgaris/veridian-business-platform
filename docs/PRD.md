# Veridian — Product Requirements Document (PRD)
## Business Discovery Platform + Free ERP + Admin Panels

**Version:** 2.0  
**Date:** 2025  
**Status:** Production

---

## 1. Executive Summary

Veridian is a map-first, search-intelligent, verified business discovery platform with a **free ERP** for business owners and a **super admin panel** for platform administrators. The platform monetizes via **premium listings only** — free listings remain free forever.

### Core Value Propositions
1. **For consumers**: Discover verified businesses, products, and services on an intelligent map
2. **For business owners**: Free ERP + business profile management + enquiry/review/message management
3. **For platform admins**: Full control over businesses, users, content moderation, verification, and billing

---

## 2. User Roles & Permissions

### 2.1 Role Hierarchy

| Role | Scope | Key Abilities |
|------|-------|---------------|
| **Super Admin** | Platform-wide | Manage everything: businesses, users, verification, billing, content moderation, analytics, settings |
| **Admin** | Platform-wide | Review moderation, business approval, user management (no billing/settings) |
| **Moderator** | Content only | Review/approve reviews, enquiries, messages; no user management |
| **Business Owner** | Own business(es) | Full ERP access, manage profile/products/services/enquiries/reviews/messages/analytics |
| **Staff Member** | Assigned business | Limited ERP access (inventory, orders) as configured by owner |
| **Customer** | Public | Browse, search, review, message, save businesses |

### 2.2 Permission Matrix

| Action | Super Admin | Admin | Moderator | Owner | Staff | Customer |
|--------|:-----------:|:-----:|:---------:|:-----:|:-----:|:--------:|
| Approve/reject businesses | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Verify businesses | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage users | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Moderate reviews | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage billing | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Platform settings | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View platform analytics | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage own business | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| ERP access | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Manage staff | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Browse businesses | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Write reviews | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Message businesses | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 3. Store Owner Dashboard (Free ERP)

### 3.1 Overview

The store owner dashboard is the **free ERP** — every business owner gets full access at no cost.

### 3.2 ERP Modules

#### 3.2.1 Inventory Management
- Product catalog: Full CRUD (create, read, update, delete)
- Stock tracking: Real-time stock levels with low-stock alerts
- Stock adjustments: Add/remove stock with reason codes
- Categories: Organize products

#### 3.2.2 Sales & Orders
- Order list with status workflow (new → confirmed → shipped → delivered)
- Create manual orders
- Order fulfillment tracking

#### 3.2.3 Invoices
- Invoice list with payment status (draft/sent/paid/overdue)
- Create invoices
- Payment tracking

#### 3.2.4 Customers (CRM)
- Customer database with order history
- Contact management
- Communication tracking

#### 3.2.5 Expenses
- Expense tracking with categories
- Receipt upload
- Monthly summaries

#### 3.2.6 Employees / Staff
- Staff management with roles
- Permission control
- Activity tracking

#### 3.2.7 Analytics
- Revenue charts
- Order trends
- Product performance
- Profile views from public directory

### 3.3 Premium Listing (Paid)
- **Free**: Basic listing + full ERP (forever)
- **Premium (₹999/mo)**: Featured placement, priority search, premium badge
- **Enterprise (₹4999/mo)**: All premium + multi-location + API access

---

## 4. Super Admin Panel

### 4.1 Modules

#### 4.1.1 Dashboard Overview
- Platform metrics: businesses, users, reviews, revenue
- Growth charts
- Recent activity feed
- System health

#### 4.1.2 Business Management
- List all businesses with filters
- Approve/reject new submissions
- Verify (upgrade verification level)
- Feature/unfeature
- Suspend/activate
- Edit/delete
- Review claim requests

#### 4.1.3 User Management
- List all users with roles
- Assign roles (admin/moderator/staff)
- Suspend/ban users
- Activity log

#### 4.1.4 Content Moderation
- Review moderation (flag/edit/delete)
- Message moderation
- Handle user reports

#### 4.1.5 Verification & Claims
- Verification queue
- Claim queue
- Document review
- Approve/reject with notes

#### 4.1.6 Billing & Subscriptions
- Revenue overview (MRR, ARR)
- Active subscriptions
- Payment history
- Refund management

#### 4.1.7 Analytics & Reports
- Platform growth
- Business analytics
- Revenue reports
- Export (CSV)

#### 4.1.8 Settings
- Categories management
- Verification configuration
- Feature flags

---

## 5. Technical Architecture

### 5.1 Tech Stack
- Next.js 16 + TypeScript + Tailwind CSS 4 + shadcn/ui
- Prisma ORM (SQLite, swappable to PostgreSQL)
- Zustand + SWR
- z-ai-web-dev-sdk for AI features
- Recharts for charts

### 5.2 Authentication
- Session-based with HTTP-only cookies
- Role-based access control (RBAC)
- API middleware for role verification
- All admin/ERP endpoints require auth

---

## 6. Monetization

| Tier | Price | Features |
|------|-------|----------|
| Free | ₹0 | Listing + full ERP forever |
| Premium | ₹999/mo | Featured + priority + premium badge |
| Enterprise | ₹4999/mo | All premium + multi-location + API |

---

*This PRD is a living document.*
