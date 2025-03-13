/**
 * Base service class providing common functionality
 * @module services/base
 */
import { ApplicationError } from '../middleware/error.middleware.js';
import { ValidationError } from '../utils/validation.js';
import { logger } from '../utils/logger.js';

export class BaseService {
  constructor(collectionName) {
    if (this.constructor === BaseService) {
      throw new Error('BaseService is abstract and cannot be instantiated directly');
    }
    this.collectionName = collectionName;
  }

  /**
   * Handles service operation errors consistently
   * @param {Function} operation - The operation to execute
   * @param {string} errorMessage - Error message if operation fails
   * @returns {Promise<any>} Operation result
   */
  async handleOperation(operation, errorMessage) {
    try {
      return await operation();
    } catch (error) {
      logger.error(`${errorMessage}:`, error);
      throw error instanceof ApplicationError ? error : new ApplicationError(errorMessage);
    }
  }

  /**
   * Validates entity data against provided rules
   * @param {Object} data - Data to validate
   * @param {Object} rules - Validation rules
   * @throws {ValidationError} If validation fails
   */
  validateData(data, rules) {
    const errors = Object.entries(rules)
      .map(([field, validator]) => validator(data[field], field))
      .filter(error => error);

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }
  }

  /**
   * Creates a standardized document
   * @param {string} id - Document ID
   * @param {Object} data - Document data
   * @returns {Object} Standardized document
   */
  createDocument(id, data) {
    return {
      id,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Updates a standardized document
   * @param {Object} existingDoc - Existing document
   * @param {Object} updates - Update data
   * @returns {Object} Updated document
   */
  updateDocument(existingDoc, updates) {
    return {
      ...existingDoc,
      ...updates,
      updatedAt: new Date(),
    };
  }
}
