/**
 * State management service
 * @module services/state
 */
import { EventEmitter } from 'events';

class StateService extends EventEmitter {
  constructor() {
    super();
    this.state = {
      auth: {
        currentUser: null,
        isAuthenticated: false
      },
      doctors: {
        activeDoctors: new Map(),
        pendingDoctors: new Map()
      },
      patients: {
        activePatients: new Map(),
        permissions: new Map()
      }
    };
  }

  // Auth State Methods
  setCurrentUser(user) {
    this.state.auth.currentUser = user;
    this.state.auth.isAuthenticated = !!user;
    this.emit('authStateChange', this.state.auth);
  }

  getCurrentUser() {
    return this.state.auth.currentUser;
  }

  // Doctors State Methods
  setDoctor(doctorId, doctorData) {
    if (doctorData.status === 'active') {
      this.state.doctors.activeDoctors.set(doctorId, doctorData);
    } else {
      this.state.doctors.pendingDoctors.set(doctorId, doctorData);
    }
    this.emit('doctorsStateChange', this.state.doctors);
  }

  getDoctor(doctorId) {
    return (
      this.state.doctors.activeDoctors.get(doctorId) ||
      this.state.doctors.pendingDoctors.get(doctorId)
    );
  }

  // Patients State Methods
  setPatient(patientId, patientData) {
    this.state.patients.activePatients.set(patientId, patientData);
    this.emit('patientsStateChange', this.state.patients);
  }

  getPatient(patientId) {
    return this.state.patients.activePatients.get(patientId);
  }

  // Permissions State Methods
  setPermission(patientId, doctorId, permission) {
    if (!this.state.patients.permissions.has(patientId)) {
      this.state.patients.permissions.set(patientId, new Map());
    }
    this.state.patients.permissions.get(patientId).set(doctorId, permission);
    this.emit('patientsStateChange', this.state.patients);
  }

  getPermission(patientId, doctorId) {
    return this.state.patients.permissions.get(patientId)?.get(doctorId);
  }

  // Subscribe to state changes
  subscribeToAuth(callback) {
    this.on('authStateChange', callback);
    return () => this.removeListener('authStateChange', callback);
  }

  subscribeToDoctors(callback) {
    this.on('doctorsStateChange', callback);
    return () => this.removeListener('doctorsStateChange', callback);
  }

  subscribeToPatients(callback) {
    this.on('patientsStateChange', callback);
    return () => this.removeListener('patientsStateChange', callback);
  }
}

export const stateService = new StateService();
