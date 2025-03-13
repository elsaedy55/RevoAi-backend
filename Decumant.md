# دليل استخدام واجهة برمجة التطبيقات (API)

## معلومات أساسية

- **رابط الخادم**: `http://localhost:3000/api`
- **نوع البيانات**: `application/json`

## كيفية استخدام API

### 1. التسجيل

#### تسجيل طبيب جديد:

```javascript
// باستخدام Fetch
const registerDoctor = async () => {
  const formData = new FormData();
  formData.append('email', 'doctor@example.com');
  formData.append('password', '123456');
  formData.append('fullName', 'د. أحمد محمد');
  formData.append('specialization', 'قلب');
  formData.append('licenseNumber', 'DOC123');
  formData.append('licenseImage', imageFile); // ملف الرخصة

  const response = await fetch('http://localhost:3000/api/doctors/register/email', {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();
  // النتيجة ستحتوي على token للاستخدام في الطلبات القادمة
  const token = result.token;
};
```

#### تسجيل مريض جديد:

```javascript
// باستخدام Fetch
const registerPatient = async () => {
  const response = await fetch('http://localhost:3000/api/patients/register/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'patient@example.com',
      password: '123456',
      fullName: 'محمد أحمد',
      age: 30,
      gender: 'male',
    }),
  });

  const result = await response.json();
  const token = result.token;
};
```

### 2. الدخول للنظام

بعد التسجيل، ستحصل على token. استخدم هذا الـ token مع كل طلب بهذه الطريقة:

```javascript
fetch('http://localhost:3000/api/any-endpoint', {
  headers: {
    Authorization: 'Bearer ' + token,
  },
});
```

### 3. العمليات الأساسية

#### للأطباء:

1. **البحث عن المرضى**:

```javascript
// البحث باستخدام الاسم
const searchPatients = async token => {
  const response = await fetch('http://localhost:3000/api/doctors/search-patients?name=محمد', {
    headers: {
      Authorization: 'Bearer ' + token,
    },
  });
  return await response.json();
};
```

2. **عرض الملف الشخصي**:

```javascript
const getDoctorProfile = async token => {
  const response = await fetch('http://localhost:3000/api/doctors/profile', {
    headers: {
      Authorization: 'Bearer ' + token,
    },
  });
  return await response.json();
};
```

#### للمرضى:

1. **تحديث البيانات الطبية**:

```javascript
const updateMedicalData = async token => {
  const response = await fetch('http://localhost:3000/api/patients/medical-data', {
    method: 'PUT',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      medicalConditions: ['السكري', 'ضغط الدم'],
      hadSurgeries: true,
      surgeries: ['عملية القلب المفتوح 2020'],
    }),
  });
  return await response.json();
};
```

2. **عرض الملف الشخصي**:

```javascript
const getPatientProfile = async token => {
  const response = await fetch('http://localhost:3000/api/patients/profile', {
    headers: {
      Authorization: 'Bearer ' + token,
    },
  });
  return await response.json();
};
```

## ملاحظات مهمة

1. **حجم الملفات**: لا يمكن رفع ملفات أكبر من 5 ميجابايت
2. **أنواع الصور المسموحة**: JPG, PNG فقط
3. **عدد الطلبات**: 100 طلب كل 15 دقيقة لكل مستخدم

## الأخطاء الشائعة وحلولها

### 1. خطأ في التوثيق (401)

```json
{
  "error": "Unauthorized",
  "message": "التوكن غير صالح أو منتهي الصلاحية"
}
```

**الحل**: تأكد من إرسال التوكن بشكل صحيح أو قم بتسجيل الدخول مرة أخرى

### 2. خطأ في البيانات المرسلة (400)

```json
{
  "error": "Bad Request",
  "message": "البيانات المرسلة غير مكتملة أو غير صحيحة"
}
```

**الحل**: راجع البيانات المرسلة وتأكد من إرسال جميع الحقول المطلوبة

### 3. تجاوز عدد الطلبات المسموح (429)

```json
{
  "error": "Too Many Requests",
  "message": "تم تجاوز الحد المسموح من الطلبات"
}
```

**الحل**: انتظر 15 دقيقة ثم حاول مرة أخرى
