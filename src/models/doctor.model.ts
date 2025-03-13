interface Doctor {
  uid: string;
  email: string;
  fullName: string;
  specialization: string;
  licenseNumber: string;
  workExperience: number;
  education: string;
  licenseImageUrl: string;
  approved: boolean;  // حقل الموافقة
  status: 'pending' | 'active' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

export default Doctor;