# RevoAI Medical Records Management System

A secure medical records management system built with Node.js and Firebase, featuring real-time updates, role-based access control, and multilingual support (English/Arabic).

## Features

- **User Authentication**

  - Email/Password and Google authentication
  - Role-based access (Doctors and Patients)
  - Session management with JWT tokens

- **Doctor Features**

  - Professional profile management
  - License verification system
  - Patient search and access requests
  - Medical records management
  - Real-time notifications

- **Patient Features**

  - Medical profile management
  - Access control management
  - Medical history tracking
  - Doctor permission management
  - Real-time updates

- **Security**

  - Role-based access control
  - Firebase Security Rules
  - Rate limiting
  - Input validation
  - Secure file uploads

- **Technical Features**
  - Real-time updates using Firebase
  - Scalable architecture
  - Comprehensive error handling
  - Detailed logging system
  - Test coverage with Jest
  - ESLint and Prettier integration

## Prerequisites

- Node.js >= 14
- Firebase account and project
- npm or yarn

## Installation

1. Clone the repository:

```bash
git clone [repository-url]
cd revoai
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:

```bash
cp .env.example .env
```

Edit `.env` with your Firebase configuration and other settings.

4. Initialize Firebase:

```bash
npm install -g firebase-tools
firebase login
firebase init
```

## Development

Start the development server:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

Lint code:

```bash
npm run lint
```

Format code:

```bash
npm run format
```

## Project Structure

```
├── config/          # Configuration files
├── functions/       # Firebase Cloud Functions
├── middleware/      # Express middleware
├── public/         # Static files
├── routes/         # API routes
├── services/       # Business logic
├── tests/          # Test files
└── utils/          # Utility functions
```

## API Documentation

### Doctor Endpoints

- `POST /api/doctors/register/email` - Register a new doctor with email and license verification
  - Requires: email, password, fullName, specialization, licenseNumber, licenseImage
  - Returns: doctor profile with JWT token

- `POST /api/doctors/register/google` - Register a new doctor with Google authentication
  - Requires: fullName, specialization, licenseNumber, licenseImage
  - Returns: doctor profile with JWT token

- `GET /api/doctors/search-patients` - Search for patients by email, phone, or name
  - Requires: Authentication and active doctor status
  - Query params: email, phone, or name (at least one required)
  - Returns: Limited patient information for privacy

- `GET /api/doctors/profile` - Get doctor's professional profile
  - Requires: Authentication
  - Returns: Complete doctor profile with status

### Patient Endpoints

- `POST /api/patients/register/email` - Register a new patient with email
  - Requires: email, password, fullName, age, gender
  - Optional: medicalConditions, hadSurgeries, surgeries
  - Returns: patient profile with JWT token

- `POST /api/patients/register/google` - Register a new patient with Google authentication
  - Requires: fullName, age, gender
  - Optional: medicalConditions, hadSurgeries, surgeries
  - Returns: patient profile with JWT token

- `GET /api/patients/profile` - Get patient's medical profile
  - Requires: Authentication
  - Returns: Complete patient profile with medical history

- `PUT /api/patients/medical-data` - Update patient's medical information
  - Requires: Authentication
  - Body: medicalConditions, hadSurgeries, surgeries
  - Returns: Updated patient profile

### Authentication Headers

All authenticated endpoints require the following header:
```
Authorization: Bearer {jwt-token}
```

### Response Format

Success responses include:
```json
{
  "message": "Success message (bilingual)",
  "data": {
    // Response data
  }
}
```

Error responses include:
```json
{
  "error": "Error type",
  "message": "Error message (bilingual)",
  "code": "ERROR_CODE"
}
```

## Security

The system implements multiple layers of security:

1. **Authentication**: Firebase Authentication with multiple providers
2. **Authorization**: Role-based access control with Firebase Security Rules
3. **Data Protection**: Granular permissions for medical records
4. **API Security**: Rate limiting, CORS, and Helmet security headers
5. **Input Validation**: Comprehensive validation for all inputs
6. **File Security**: Secure file upload with type and size restrictions

## Testing

The project uses Jest for testing. Tests are organized in the `tests` directory:

- Unit tests for utilities and services
- Integration tests for API endpoints
- Mock Firebase services for testing

Run tests:

```bash
npm test
```

Generate coverage report:

```bash
npm test -- --coverage
```

## Error Handling

The system implements a comprehensive error handling system:

- Custom error types for different scenarios
- Bilingual error messages (English/Arabic)
- Detailed error logging
- Client-friendly error responses

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email [support-email] or open an issue in the repository.
