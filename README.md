# RevoAI Medical Records Management System

A comprehensive medical records management system built with Node.js and Firebase, designed to streamline healthcare data management with real-time capabilities, robust security, and bilingual support (English/Arabic). The system facilitates secure communication between doctors and patients while ensuring data privacy and compliance with healthcare standards.

## 🌟 Key Features

- **Advanced Authentication System**
  - Multi-provider authentication (Email/Password, Google)
  - Role-based access control (RBAC)
  - Secure session management with JWT
  - Password recovery and email verification

- **🏥 Doctor Portal**
  - Comprehensive profile management
  - Automated license verification system
  - Patient search with privacy controls
  - Medical records access and management
  - Real-time notifications for patient updates
  - Appointment scheduling and management

- **👤 Patient Portal**
  - Secure medical profile management
  - Granular access control for medical data
  - Comprehensive medical history tracking
  - Doctor access permission management
  - Real-time updates for medical records
  - Appointment booking and tracking

- **🔒 Enterprise-Grade Security**
  - Advanced role-based access control
  - Firebase Security Rules implementation
  - Intelligent rate limiting
  - Comprehensive input validation
  - Secure file upload system with validation
  - Data encryption at rest and in transit

- **💻 Technical Excellence**
  - Firebase real-time database integration
  - Microservices-based architecture
  - Comprehensive error handling system
  - Advanced logging and monitoring
  - Extensive test coverage with Jest
  - Code quality tools (ESLint, Prettier)
  - CI/CD pipeline support

## 🚀 Getting Started

### Prerequisites

- Node.js (version >= 14)
- Firebase account and project setup
- npm or yarn package manager
- Git

### Quick Start

1. **Clone and Setup**
   ```bash
   git clone [repository-url]
   cd revoai
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your Firebase credentials and app settings
   ```

3. **Firebase Setup**
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init
   ```

4. **Development**
   ```bash
   npm run dev          # Start development server
   npm test            # Run tests
   npm run lint        # Check code style
   npm run format      # Format code
   ```

## 📁 Project Architecture

```
project-root/
├── config/          # App configuration and constants
├── functions/       # Firebase Cloud Functions
├── middleware/      # Express middleware (auth, validation)
├── public/         # Static assets and client-side files
├── routes/         # API route definitions
├── services/       # Core business logic
├── tests/          # Test suites
└── utils/          # Utility functions and helpers
```

## 📚 API Documentation

### 🏥 Doctor API Endpoints

#### Authentication
- `POST /api/doctors/register/email`
- `POST /api/doctors/register/google`
- `POST /api/doctors/login`
- `GET /api/doctors/profile`

#### Patient Management
- `GET /api/doctors/patients`
- `GET /api/doctors/search-patients`
- `POST /api/doctors/request-access`

### 👤 Patient API Endpoints

#### Authentication
- `POST /api/patients/register/email`
- `POST /api/patients/register/google`
- `POST /api/patients/login`
- `GET /api/patients/profile`

#### Medical Records
- `GET /api/patients/medical-history`
- `PUT /api/patients/medical-data`
- `POST /api/patients/grant-access`

### 🔒 Security Implementation

1. **Authentication Layer**
   - Firebase Authentication
   - JWT token management
   - Session handling

2. **Authorization Layer**
   - Role-based permissions
   - Resource-level access control
   - Data access policies

3. **Data Protection**
   - End-to-end encryption
   - Secure data transmission
   - Privacy controls

## ⚙️ Configuration

### Environment Variables

```env
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_domain
FIREBASE_PROJECT_ID=your_project_id
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

## 🧪 Testing Strategy

- **Unit Tests**: Core business logic
- **Integration Tests**: API endpoints
- **E2E Tests**: User workflows
- **Security Tests**: Vulnerability checks

Run tests:
```bash
npm test                 # Run all tests
npm run test:coverage    # Generate coverage report
npm run test:e2e        # Run E2E tests
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Submit a pull request

### Contribution Guidelines
- Follow the coding style
- Add tests for new features
- Update documentation
- Follow commit message conventions

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.

## 🆘 Support

- Technical Support: [support@revoai.com](mailto:support@revoai.com)
- Documentation: [docs.revoai.com](https://docs.revoai.com)
- Issue Tracking: GitHub Issues

## 🔄 Version History

- v1.0.0 - Initial Release
  - Basic authentication
  - Core medical records functionality
  - Doctor-patient interaction features

---

Built with ❤️ by the RevoAI Team
