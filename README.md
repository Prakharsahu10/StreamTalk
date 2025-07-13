# 🚀 StreamTalk

<div align="center">
  <img src="frontend/public/avatar.png" alt="StreamTalk Logo" width="120" style="border-radius: 20px"/>
  <h3>Real-time chat application with modern features and sleek UI</h3>
</div>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#license">License</a>
</p>

<img src="https://i.imgur.com/Z9n1y5S.jpg" alt="StreamTalk Demo" width="100%" style="border-radius: 8px"/>

## ✨ Features

- **User Authentication** - Secure signup/login with JWT tokens
- **Real-Time Messaging** - Instant message delivery with Socket.IO
- **Profile Management** - Customize your profile with image uploads
- **Online Status** - See when other users are active
- **Message History** - Persistent chat history between sessions
- **Beautiful UI** - Sleek interface with DaisyUI components
- **Mobile Responsive** - Fully responsive design for all devices
- **Theme Customization** - Choose from multiple themes
- **Image Sharing** - Send and receive images in your chats

## 🛠️ Tech Stack

### Frontend

- **React** - UI library
- **Zustand** - State management
- **Socket.IO-Client** - Real-time communication
- **Tailwind CSS** - Utility-first CSS framework
- **DaisyUI** - Component library
- **Axios** - API requests
- **Vite** - Build tool

### Backend

- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Socket.IO** - Real-time communication
- **JWT** - Authentication
- **Cloudinary** - Image storage
- **bcrypt** - Password hashing

## 📦 Installation

1. Clone the repository

```bash
git clone https://github.com/Prakharsahu10/streamtalk.git
cd streamtalk
```

2. Install dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Set up environment variables

```bash
# In backend directory, create .env file
cd ../backend
```

Add the following to your `.env` file:

```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=5001
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
NODE_ENV=development
```

## 🚀 Usage

### Development Mode

1. Start the backend server

```bash
# From the backend directory
npm run dev
```

2. Start the frontend development server

```bash
# From the frontend directory
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

### Seeding Data (Optional)

To seed the database with sample users:

```bash
# From the backend directory
node src/seeds/user.seed.js
```

## 🌐 Deployment

The application is set up for easy deployment to platforms like Heroku, Vercel, or any other hosting service.

```bash
# From root directory
npm run build  # Builds the frontend and prepares the app for production
npm start      # Starts the production server
```

## 🏗️ Architecture

### Directory Structure

```
streamtalk/
├── backend/               # Backend server code
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── lib/           # Utility functions
│   │   ├── middleware/    # Express middleware
│   │   ├── models/        # Mongoose models
│   │   ├── routes/        # API routes
│   │   └── seeds/         # Database seeders
│   └── package.json
├── frontend/              # Frontend React code
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── lib/           # Utility functions
│   │   ├── pages/         # Main page components
│   │   └── store/         # Zustand state management
│   └── package.json
└── package.json           # Root package.json
```

## 📝 License

MIT © [Prakhar Sahu]

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/yourusername">Prakhar Sahu</a>
</p>
