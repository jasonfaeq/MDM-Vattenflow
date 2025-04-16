# MDM - Vatenflow

MDM - Vatenflow is a web application for Master Data Management request processing at Vattenfall Wind BU. The platform allows Controllers to submit validated requests and track their status, while providing the MDM Team with an admin interface for management and processing.

## Features

- **User Authentication**: Email/password authentication with role-based access control
- **Multi-step Request Forms**: Submit various types of MDM requests (WBS, PC, CC, Modify, Lock, Unlock)
- **Bulk WBS Creation**: Create multiple WBS elements in a single request
- **Request Tracking**: Real-time status updates and comment threads
- **Admin Dashboard**: Comprehensive management interface for MDM team members
- **Export Functionality**: Export request data for reporting or further processing

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React, TypeScript
- **UI**: Shadcn/ui, Tailwind CSS
- **Backend/DB**: Firebase (Firestore for database, Firebase Authentication)
- **State Management**: React Context API (for auth) and local state
- **Form Management**: react-hook-form with zod for validation

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/mdm-vatenflow.git
   cd mdm-vatenflow
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Set up Firebase:

   - Create a new Firebase project in the [Firebase Console](https://console.firebase.google.com/)
   - Enable Firestore Database and Authentication (with Email/Password provider)
   - Copy your Firebase config settings
   - Create a `.env.local` file based on `.env.local.example` and add your Firebase config:
     ```
     NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
     NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
     ```

4. Run the development server:

   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Setting Up User Roles

For development, manually create users in the Firebase Authentication panel, then add a corresponding document in the `users` collection with the following structure:

```javascript
{
  uid: "user-id-from-firebase-auth",
  email: "user@example.com",
  displayName: "User Name",
  role: "Controller" // or "MDM" for admin access
}
```

## Project Structure

- `/app` - Next.js pages using the App Router
  - `/(app)` - Authenticated controller routes
  - `/(auth)` - Authentication routes
  - `/admin` - MDM admin routes
- `/components` - React components
  - `/ui` - Shadcn/ui components
  - `/forms` - Form components for different request types
  - `/layout` - Layout components like Header
- `/lib` - Utility functions and Firebase config
  - `/firebase` - Firebase initialization
- `/types` - TypeScript type definitions

## License

This project is private and proprietary to Vattenfall Wind BU.
