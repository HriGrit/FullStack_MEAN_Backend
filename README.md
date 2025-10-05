# Healthcare Management System - Backend API

A comprehensive RESTful API for a healthcare management system built with Node.js, Express.js, and MongoDB. This system provides secure authentication, role-based access control, and complete appointment management functionality for patients, doctors, and administrators.

## Tech Stack

### Core Technologies
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling

### Security & Authentication
- **JWT (JSON Web Tokens)** - Stateless authentication
- **bcrypt** - Password hashing and encryption
- **Cookie Parser** - HTTP-only cookie management

### Development Tools
- **Nodemon** - Development server with auto-restart
- **Zod** - Schema validation and type safety
- **CORS** - Cross-Origin Resource Sharing
- **dotenv** - Environment variable management

## Authentication System

### JWT-Based Authentication
The system implements a **stateless JWT authentication** approach with the following features:

- **Access Tokens**: Valid for 2 hours, stored in HTTP-only cookies
- **Refresh Tokens**: Valid for 7 days, used to generate new access tokens
- **Role-Based Access Control (RBAC)**: Three user roles - `PATIENT`, `DOCTOR`, `ADMIN`
- **Secure Cookie Storage**: Tokens are stored in HTTP-only cookies to prevent XSS attacks

### User Roles & Permissions
- **PATIENT**: Can book/cancel appointments, view departments and doctors
- **DOCTOR**: Can view appointments, manage availability, access analytics
- **ADMIN**: Full system access including user management, department management, and analytics

## API Endpoints

### Base URL
```
http://localhost:1313/api/v1
```

### Authentication Routes (`/api/v1`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/signup` | User registration | Public |
| POST | `/signin` | User login | Public |
| POST | `/refresh` | Refresh access token | Public |
| POST | `/logout` | User logout | Authenticated |

### Admin Routes (`/api/v1/admin`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/dashboard` | Admin dashboard data | Admin |
| GET | `/analytics` | System analytics | Admin, Doctor |
| POST | `/departments` | Create new department | Admin |
| PUT | `/departments/:id` | Update department | Admin |
| DELETE | `/departments/:id` | Delete department | Admin |
| POST | `/doctors` | Create new doctor profile | Admin |
| PUT | `/doctors/:doctorId` | Update doctor profile | Admin |
| DELETE | `/doctors/:doctorId` | Delete doctor profile | Admin |

### Patient Routes (`/api/v1/patient`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/departments` | Get all departments | All Roles |
| GET | `/` | Get all patients | Doctor, Admin |
| GET | `/find/:id` | Get patient by ID | Doctor, Admin |
| GET | `/appointment` | Get patient appointments | Patient |

### Doctor Routes (`/api/v1/doctors`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/available` | Get available doctors | All Roles |
| GET | `/find/:id` | Get doctor by ID | All Roles |
| GET | `/` | Filter doctors by department/specialization | All Roles |
| GET | `/appointment` | Get doctor's appointments | Doctor |

### Appointment Routes (`/api/v1/appointments`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/slots/:doctor_id` | Get available time slots for a doctor | Authenticated |
| GET | `/:id` | Get appointment by ID | Authenticated |
| POST | `/book` | Book new appointment | Patient |
| DELETE | `/:appointment_id` | Cancel appointment | Patient |

## Database Schema

### User Model
```javascript
{
  name: String (required, max: 50),
  email: String (required, unique, validated),
  password: String (required, hashed),
  phone: String (max: 15),
  role: String (enum: ['PATIENT', 'DOCTOR', 'ADMIN'], default: 'PATIENT')
}
```

### Doctor Model
```javascript
{
  userId: ObjectId (ref: 'User', required),
  deptId: ObjectId (ref: 'Department'),
  specialization: String (max: 100),
  availability: String (default: 'MON-FRI 10am-6pm'),
  availableSlots: [Number] (default: [20, 20, 20, 20, 20, 20, 20])
}
```

### Appointment Model
```javascript
{
  patientId: ObjectId (ref: 'User', required),
  doctorId: ObjectId (ref: 'Doctor', required),
  date: String (YYYY-MM-DD format, required),
  slot: Number (0-7, required),
  status: String (enum: ['BOOKED', 'CANCELLED'], default: 'BOOKED'),
  cancelledAt: Date (default: null)
}
```

### Department Model
```javascript
{
  name: String (required, unique, max: 50)
}
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

### Environment Variables
Create a `.env` file in the root directory:

```env
PORT=1313
MONGODB_KEY=mongodb://localhost:27017/healthcare_db
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
FRONTEND_URL=http://localhost:5173
```

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd FullStack_MEAN_Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development server**
   ```bash
   npm run server
   ```

5. **Verify installation**
   ```bash
   curl http://localhost:1313/
   # Expected response: {"status":"working"}
   ```

## Features

### Current Features

**User Authentication & Authorization**
- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Secure password hashing with bcrypt
- HTTP-only cookie storage

**User Management**
- Patient, Doctor, and Admin registration
- User profile management
- Secure login/logout functionality

**Doctor Management**
- Doctor profile creation and management
- Department assignment
- Specialization tracking
- Basic availability management

**Department Management**
- CRUD operations for departments
- Department-based doctor filtering

**Appointment System**
- Appointment booking and cancellation
- Time slot management (8 slots per day)
- Appointment status tracking
- Patient and doctor appointment views

**Security Features**
- CORS configuration for multiple origins
- Input validation with Zod
- Secure token handling
- Protected routes with middleware

## Future Development Roadmap

### Phase 1: Enhanced Appointment System

**Modular Appointment System**
- Recurring appointment scheduling
- Appointment types (consultation, follow-up, emergency)
- Multi-slot booking for complex procedures
- Appointment reminders and notifications

### Phase 2: Dynamic Doctor Availability

**Flexible Time Management**
- Dynamic availability settings per doctor
- Custom working hours and days
- Break time management
- Holiday and vacation scheduling
- Real-time availability updates

### Phase 3: Advanced Features

**Analytics & Reporting**
- Patient flow analytics
- Doctor performance metrics
- Revenue tracking
- Appointment success rates

**Communication System**
- In-app messaging between patients and doctors
- Appointment confirmation notifications
- SMS/Email integration
- Prescription sharing

### Phase 4: Scalability & Performance

**System Improvements**
- Redis caching for frequently accessed data
- Database optimization and indexing
- API rate limiting
- Microservices architecture

**Mobile & Web Integration**
- Mobile-responsive design
- Progressive Web App (PWA) features
- Offline functionality
- Push notifications

### Phase 5: Advanced Healthcare Features

**Clinical Management**
- Electronic Health Records (EHR)
- Prescription management
- Medical history tracking
- Lab report integration

**AI-Powered Features**
- Smart appointment scheduling
- Patient priority scoring
- Predictive analytics for no-shows
- Automated follow-up suggestions

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Team

- **Backend Development**: Full-stack MEAN stack implementation
- **Database Design**: MongoDB schema optimization
- **Security Implementation**: JWT authentication and authorization

## Support

For support and questions, please open an issue in the repository or contact the development team.

---

**Built for modern healthcare management**