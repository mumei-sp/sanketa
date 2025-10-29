# 🧵 Fabric

## Overview

Fabric is the core platform layer that powers authentication, tenant resolution, and database routing in the multi-tenant School Management System. It acts as the bridge between the Global Database and individual School Databases, ensuring secure, isolated, and scalable access for every user.

## Purpose

Fabric provides a unified access layer that handles:

- **Authentication** - Secure user authentication across all tenants
- **Tenant Resolution** - Intelligent routing to the correct school database
- **Database Routing** - Dynamic connection management for multi-tenant architecture
- **Data Isolation** - Ensuring complete separation between school instances
