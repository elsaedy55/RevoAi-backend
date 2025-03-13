/**
 * Firestore collections service
 * مسؤول عن إدارة البيانات في Firestore وإدارة الصلاحيات بين الأطباء والمرضى
 * @module services/firestore
 */
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { firebaseService } from './firebase.service.js';
import { stateService } from './state.service.js';
import { logger } from '../utils/logger.js';

// ثوابت النظام
const COLLECTIONS = {
  PATIENTS: 'patients',
  DOCTORS: 'doctors',
};

const MEDICAL_DATA_RULES = {
  validateConditions: conditions => {
    return Array.isArray(conditions)
      ? conditions
          .filter(condition => typeof condition === 'string' && condition.trim().length > 0)
          .map(condition => condition.trim())
      : [];
  },
  validateSurgeries: (hadSurgeries, surgeries) => ({
    hadSurgeries: Boolean(hadSurgeries),
    surgeries:
      hadSurgeries && Array.isArray(surgeries)
        ? surgeries
            .filter(surgery => typeof surgery === 'string' && surgery.trim().length > 0)
            .map(surgery => surgery.trim())
        : [],
  }),
};

class FirestoreService {
  constructor() {
    this.db = firebaseService.getFirestore();
    this.collections = COLLECTIONS;
  }

  /**
   * التحقق من صحة البيانات الطبية
   * @param {Object} medicalData - معلومات المريض الطبية
   * @returns {Object} البيانات الطبية بعد التحقق والتنظيف
   */
  validateMedicalData(medicalData) {
    const conditions = MEDICAL_DATA_RULES.validateConditions(medicalData.medicalConditions);
    const { hadSurgeries, surgeries } = MEDICAL_DATA_RULES.validateSurgeries(
      medicalData.hadSurgeries,
      medicalData.surgeries
    );

    return {
      medicalConditions: conditions,
      hadSurgeries,
      surgeries,
    };
  }

  /**
   * Set document in Firestore
   * @param {string} collection - Collection name
   * @param {string} docId - Document ID
   * @param {Object} data - Document data
   */
  async setDoc(collection, docId, data) {
    try {
      const docRef = doc(this.db, collection, docId);
      await setDoc(docRef, data);

      // Update state based on collection type
      if (collection === this.collections.doctors) {
        stateService.setDoctor(docId, data);
      } else if (collection === this.collections.patients) {
        stateService.setPatient(docId, data);
      }

      logger.info(`Document ${docId} created/updated in ${collection}`);
    } catch (error) {
      logger.error(`Error setting document in ${collection}:`, error);
      throw error;
    }
  }

  /**
   * Get document from Firestore
   * @param {string} collection - Collection name
   * @param {string} docId - Document ID
   */
  async getDoc(collection, docId) {
    try {
      // First check state cache based on collection type
      let data;
      if (collection === this.collections.doctors) {
        data = stateService.getDoctor(docId);
      } else if (collection === this.collections.patients) {
        data = stateService.getPatient(docId);
      }

      if (!data) {
        // If not in state, fetch from Firestore
        const docRef = doc(this.db, collection, docId);
        const docSnap = await getDoc(docRef);
        data = docSnap.exists() ? docSnap.data() : null;

        // Update state if data exists
        if (data) {
          if (collection === this.collections.doctors) {
            stateService.setDoctor(docId, data);
          } else if (collection === this.collections.patients) {
            stateService.setPatient(docId, data);
          }
        }
      }

      return data;
    } catch (error) {
      logger.error(`Error getting document from ${collection}:`, error);
      throw error;
    }
  }

  /**
   * Update document in Firestore
   * @param {string} collection - Collection name
   * @param {string} docId - Document ID
   * @param {Object} data - Update data
   */
  async updateDoc(collection, docId, data) {
    try {
      const docRef = doc(this.db, collection, docId);
      await updateDoc(docRef, data);

      // Update state based on collection type
      const existingDoc = await this.getDoc(collection, docId);
      if (existingDoc) {
        const updatedData = { ...existingDoc, ...data };
        if (collection === this.collections.doctors) {
          stateService.setDoctor(docId, updatedData);
        } else if (collection === this.collections.patients) {
          stateService.setPatient(docId, updatedData);
        }
      }

      logger.info(`Document ${docId} updated in ${collection}`);
    } catch (error) {
      logger.error(`Error updating document in ${collection}:`, error);
      throw error;
    }
  }

  /**
   * Grant permission for a doctor to access a patient's data
   * @param {string} patientId - The patient's ID
   * @param {string} doctorId - The doctor's ID
   */
  async grantDoctorAccess(patientId, doctorId) {
    try {
      // Verify doctor exists and is active
      const doctorRef = doc(this.db, this.collections.doctors, doctorId);
      const doctorSnap = await getDoc(doctorRef);
      if (!doctorSnap.exists()) {
        throw new Error('الطبيب غير موجود');
      }
      if (doctorSnap.data().status !== 'active') {
        throw new Error('حساب الطبيب غير نشط');
      }

      // Verify patient exists
      const patientRef = doc(this.db, this.collections.patients, patientId);
      const patientSnap = await getDoc(patientRef);
      if (!patientSnap.exists()) {
        throw new Error('المريض غير موجود');
      }

      // Create or update permission document
      const permissionRef = doc(
        this.db,
        `${this.collections.patients}/${patientId}/permissions/${doctorId}`
      );
      const permissionData = {
        grantedAt: new Date(),
        doctorName: doctorSnap.data().name || 'غير معروف',
        doctorSpecialty: doctorSnap.data().specialty || 'غير محدد',
        status: 'active',
        lastUpdated: new Date(),
      };

      await setDoc(permissionRef, permissionData);

      // Update doctor's active patients count
      const updatedDoctor = {
        ...doctorSnap.data(),
        activePatientCount: (doctorSnap.data().activePatientCount || 0) + 1,
      };
      await updateDoc(doctorRef, { activePatientCount: updatedDoctor.activePatientCount });

      // Update state
      stateService.setDoctor(doctorId, updatedDoctor);
      stateService.setPermission(patientId, doctorId, permissionData);

      logger.info(`تم منح الإذن للطبيب ${doctorId} للوصول إلى بيانات المريض ${patientId}`);
      return permissionData;
    } catch (error) {
      logger.error('خطأ في منح إذن الطبيب:', error);
      throw error;
    }
  }

  /**
   * Revoke a doctor's access to a patient's data
   * @param {string} patientId - The patient's ID
   * @param {string} doctorId - The doctor's ID
   */
  async revokeDoctorAccess(patientId, doctorId) {
    try {
      const permissionRef = doc(
        this.db,
        `${this.collections.patients}/${patientId}/permissions/${doctorId}`
      );
      const permissionSnap = await getDoc(permissionRef);

      if (!permissionSnap.exists()) {
        throw new Error('لا يوجد إذن للطبيب للوصول إلى بيانات هذا المريض');
      }

      // Update doctor's active patients count
      const doctorRef = doc(this.db, this.collections.doctors, doctorId);
      const doctorSnap = await getDoc(doctorRef);
      if (doctorSnap.exists()) {
        const updatedDoctor = {
          ...doctorSnap.data(),
          activePatientCount: Math.max((doctorSnap.data().activePatientCount || 1) - 1, 0),
        };
        await updateDoc(doctorRef, { activePatientCount: updatedDoctor.activePatientCount });
        stateService.setDoctor(doctorId, updatedDoctor);
      }

      await deleteDoc(permissionRef);
      // Remove permission from state
      stateService.setPermission(patientId, doctorId, null);

      logger.info(`تم إلغاء إذن الطبيب ${doctorId} للوصول إلى بيانات المريض ${patientId}`);
    } catch (error) {
      logger.error('خطأ في إلغاء إذن الطبيب:', error);
      throw error;
    }
  }

  /**
   * Get list of doctors with access to a patient
   * @param {string} patientId - The patient's ID
   * @returns {Promise<Array>} List of doctors with access
   */
  async getPatientDoctors(patientId) {
    try {
      const permissionsRef = collection(
        this.db,
        `${this.collections.patients}/${patientId}/permissions`
      );
      const permissionsSnap = await getDocs(permissionsRef);

      const doctors = [];
      for (const doc of permissionsSnap.docs) {
        const doctorRef = doc(this.db, this.collections.doctors, doc.id);
        const doctorSnap = await getDoc(doctorRef);
        if (doctorSnap.exists()) {
          doctors.push({
            id: doctorSnap.id,
            ...doctorSnap.data(),
            permission: doc.data(),
          });
        }
      }

      return doctors;
    } catch (error) {
      logger.error('Error getting patient doctors:', error);
      throw error;
    }
  }

  /**
   * Get list of patients that a doctor has access to
   * @param {string} doctorId - The doctor's ID
   * @returns {Promise<Array>} List of accessible patients
   */
  async getDoctorPatients(doctorId) {
    try {
      const patients = [];
      const patientsRef = collection(this.db, this.collections.patients);
      const patientsSnap = await getDocs(patientsRef);

      for (const patientDoc of patientsSnap.docs) {
        const permissionRef = doc(
          this.db,
          `${this.collections.patients}/${patientDoc.id}/permissions/${doctorId}`
        );
        const permissionSnap = await getDoc(permissionRef);

        if (permissionSnap.exists()) {
          patients.push({
            id: patientDoc.id,
            ...patientDoc.data(),
            permission: permissionSnap.data(),
          });
        }
      }

      return patients;
    } catch (error) {
      logger.error('Error getting doctor patients:', error);
      throw error;
    }
  }

  /**
   * Search for patients by criteria
   * @param {Object} searchParams - Search parameters
   * @returns {Promise<Array>} Array of matching patients
   */
  async searchPatients(searchParams) {
    try {
      const { email, phone, name } = searchParams;
      let query = collection(this.db, this.collections.patients);

      if (email) {
        query = query.where('email', '==', email.toLowerCase());
      }
      if (phone) {
        query = query.where('phone', '==', phone);
      }
      if (name) {
        query = query.where('fullName', '>=', name).where('fullName', '<=', name + '\uf8ff');
      }

      const snapshot = await getDocs(query);
      const patients = [];

      snapshot.forEach(doc => {
        patients.push({
          uid: doc.id,
          ...doc.data(),
        });
      });

      return patients;
    } catch (error) {
      logger.error('Error searching patients:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const firestoreService = new FirestoreService();
