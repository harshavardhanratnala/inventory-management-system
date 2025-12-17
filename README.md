# Inventory Management System

A comprehensive full-stack inventory management system built with React, Node.js, Express and MongoDB

## Features

**Authentication & Authorization**
- JWT-based authentication with secure cookie storage
- Role-based access control (Admin/Staff)
- Password hashing with bcrypt
- Session management with proper cookie configuration

**Product Inventory Management**
- Complete CRUD operations for products
- Optional expiry date tracking
- Multiple unit types (pieces, kg)
- Real-time stock level monitoring
- Low-stock and out-of-stock alerts

**Stock Movement Tracking**
- Detailed stock-out records with timestamps
- Staff attribution for all inventory changes
- Real-time dashboard updates
- Historical tracking of all inventory movements

**Supplier Management**
- Supplier catalog with contact information
- Product-supplier relationships
- Supplier performance tracking

**Obsolete Product Management**
- Mark products as obsolete when expired
- Restore functionality for mistakenly marked items
- Days-obsolete tracking
- Dedicated obsolete products dashboard

## Technology Stack

### Frontend
- React with Hooks
- Material UI with Mongoose ODM
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
git clone https://github.com//YOUR-USERNAME/inventory-management-system.git
cd inventory-management-system
```
2. Install dependencies:
```bash
# For backend
cd server
npm install

# For frontend
cd ../client
npm install
```
3. Set up environmental variables:
```bash
# Create .env file in server directory
touch server/.env (In macOS/Linux)


# Add these variables:
JWT_SECRET_KEY=your_strong_secret_key_here
DB_URI=mongodb://localhost:27017/inventory_db
PORT=5000
NODE_ENV=development
```
4. Start the application
```bash
# Start backend
cd server
npm start

# In another terminal, start frontend
cd ../client
npm start
```
## Usage

1. Register a new account (admin or staff)
2. Log in with your credentials
3. Use the dashboard to manage inventory, suppliers, and stock movements
4. Track obsolete products and restore them when needed

## Screenshots

## Licence

This project is licensed under the MIT Licence.