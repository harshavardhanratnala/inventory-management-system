# Project Structure

## Frontend (client/)

client/
├── public/
│ ├── index.html
│ └── favicon.ico
├── src/
│ ├── context/
│ │ └── AuthContext.js
│ ├── hooks/
│ │ └── useRole.js
│ ├── pages/
│ │ ├── HomePage.js
│ │ ├── LoginPage.js
│ │ ├── RegisterPage.js
│ │ ├── ProductPage.js
│ │ ├── SupplierPage.js
│ │ ├── StockOutPage.js
│ │ ├── ObsoletePage.js
│ │ └── ProfilePage.js
│ ├── services/
│ │ └── api.js
│ ├── App.js
│ └── index.js

## Backend (server/)

server/
├── config/
│ └── db.js
├── models/
│ ├── User.js
│ ├── Product.js
│ ├── Supplier.js
│ └── Stockout.js
├── routes/
│ ├── auth.js
│ ├── products.js
│ ├── suppliers.js
│ └── stockout.js
├── middleware/
│ └── auth.js
├── .env
└── server.js