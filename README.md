# ReLoop — Intelligent Recommerce Platform

ReLoop is a full-stack recommerce marketplace designed to make buying and selling pre-loved products easier through intelligent search, visual product discovery, AI-assisted listing creation, personalized interactions, and real-time communication.

## 🚀 Features

### 🛍️ Marketplace
- Browse product listings
- Product categories
- Product details
- Product condition
- Seller information
- Price and location
- Responsive product grid

### 🔎 Intelligent Search
- Keyword search
- Natural-language search
- Search autocomplete
- Brand filtering
- Category filtering
- Condition filtering
- Price filtering
- Color and size filtering
- Sorting
- Infinite scrolling

### ❤️ Wishlist
- Add/remove products from wishlist
- Persistent wishlist
- Wishlist-based price-drop notifications

### 🔔 Notifications
- Real-time price-drop notifications
- Unread notification count
- Mark notifications as read
- Mark all notifications as read
- Notification dropdown

### 💬 Real-Time Chat
- Buyer-seller conversations
- Real-time messaging using Socket.IO
- Typing indicators
- Online/offline presence
- Unread message counts
- Read status
- Mobile-friendly chat interface

### ⭐ Ratings & Reviews
- Product reviews
- Star ratings
- Average rating calculation
- Review count
- Seller rating information

### 👤 Seller Dashboard
- View personal listings
- Create listings
- Edit listings
- Delete listings
- Mark products as sold
- Listing performance
- Views and likes
- Sales statistics

### 🖼️ Visual Product Search

Users can upload a product image and find visually similar products from the marketplace.

The feature uses a local CLIP-based image feature extractor to calculate image embeddings and compare visual similarity between the uploaded image and marketplace products.

### 🤖 AI Listing Studio

AI Listing Studio helps sellers create product listings from an uploaded image.

It can generate or suggest:

- Product title
- Description
- Category
- Condition
- Brand
- Size
- Color
- Suggested resale price

The AI analysis is integrated into the listing creation workflow.

### 🔐 Authentication
- User registration
- Login
- JWT authentication
- Protected API routes
- User profiles
- Seller profiles

### ☁️ Image Uploads
- Product image uploads
- Cloudinary integration
- Image previews
- Drag-and-drop upload
- Multiple product images

---

## 🧠 Technology Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- Zustand
- TanStack Query
- Socket.IO Client
- Lucide React
- React Hot Toast
- CSS

### Backend

- Node.js
- Express.js
- TypeScript
- MongoDB
- Mongoose
- JWT
- bcrypt
- Socket.IO

### AI / Intelligent Features

- Hugging Face Transformers.js
- CLIP image embeddings
- OpenAI-compatible AI listing analysis integration
- Natural-language search parsing
- Image similarity search

### Cloud Services

- MongoDB Atlas
- Cloudinary
- Vercel / Render deployment compatible

---

## 📁 Project Structure

```text
reloop/
│
├── public/
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── utils/
│   │   ├── app.ts
│   │   ├── server.ts
│   │   └── socket.ts
│   │
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── src/
│   ├── assets/
│   ├── components/
│   ├── features/
│   ├── hooks/
│   ├── layouts/
│   ├── pages/
│   ├── services/
│   ├── store/
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   └── main.tsx
│
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
└── vite.config.ts