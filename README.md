# Inventory Management System

A comprehensive full-stack inventory management system built with React, Node.js, Express, and MongoDB.

## Features

✅ **Authentication & Authorization**
- JWT-based authentication with secure cookie storage
- Role-based access control (Admin/Staff)
- Password hashing with bcrypt
- Session management with proper cookie configuration

✅ **Product Inventory Management**
- Complete CRUD operations for products
- Optional expiry date tracking
- Multiple unit types (pieces, kg)
- Real-time stock level monitoring
- Low-stock and out-of-stock alerts

✅ **Stock Movement Tracking**
- Detailed stock-out records with timestamps
- Staff attribution for all inventory changes
- Real-time dashboard updates
- Historical tracking of all inventory movements

✅ **Supplier Management**
- Supplier catalog with contact information
- Product-supplier relationships
- Supplier performance tracking

✅ **Obsolete Product Management**
- Mark products as obsolete when expired
- Restore functionality for mistakenly marked items
- Days-obsolete tracking
- Dedicated obsolete products dashboard

## Technology Stack

### Frontend
- React with Hooks
- Material UI for responsive components
- Axios for API calls
- React Router for navigation

### Backend
- Node.js with Express framework
- MongoDB with Mongoose ODM
- JWT for authentication
- Bcrypt for password hashing
- CORS for cross-origin requests

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB

### Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/YOUR-USERNAME/inventory-management-system.git
cd inventory-management-system
