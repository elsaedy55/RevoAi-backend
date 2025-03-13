# RevoAI نظام إدارة السجلات الطبية

نظام شامل لإدارة السجلات الطبية مبني باستخدام Node.js و Firebase، مصمم لتسهيل إدارة البيانات الطبية مع قدرات الوقت الفعلي، أمان قوي، ودعم للغتين (الإنجليزية/العربية). يسهل النظام التواصل الآمن بين الأطباء والمرضى مع ضمان خصوصية البيانات والامتثال للمعايير الطبية.

## 🌟 المميزات الرئيسية

- **نظام مصادقة متقدم**
  - مصادقة متعددة المزودين (البريد الإلكتروني/كلمة المرور، جوجل)
  - التحكم في الصلاحيات القائم على الأدوار (RBAC)
  - إدارة آمنة للجلسات باستخدام JWT
  - استعادة كلمة المرور والتحقق من البريد الإلكتروني

- **🏥 بوابة الطبيب**
  - إدارة شاملة للملف الشخصي
  - نظام التحقق الآلي من التراخيص
  - عملية التحقق من الهوية متعددة المراحل
  - البحث عن المرضى مع ضوابط الخصوصية
  - الوصول وإدارة السجلات الطبية
  - إشعارات فورية لتحديثات المرضى
  - جدولة وإدارة المواعيد

- **👤 بوابة المريض**
  - إدارة آمنة للملف الطبي
  - تحكم دقيق في صلاحيات البيانات الطبية
  - تتبع شامل للتاريخ الطبي
  - إدارة أذونات وصول الأطباء
  - تحديثات فورية للسجلات الطبية
  - حجز وتتبع المواعيد

- **🔒 أمان مؤسسي المستوى**
  - التحكم المتقدم في الصلاحيات القائم على الأدوار
  - تنفيذ قواعد أمان Firebase
  - تحديد ذكي لمعدل الطلبات
  - تحقق شامل من المدخلات
  - نظام آمن لرفع الملفات مع التحقق
  - تشفير البيانات أثناء الراحة والنقل

## 🚀 البدء السريع

### المتطلبات الأساسية

- Node.js (الإصدار >= 14)
- حساب Firebase ومشروع مُعد
- مدير الحزم npm أو yarn
- Git

### خطوات التثبيت

1. **استنساخ وإعداد المشروع**
   ```bash
<<<<<<< HEAD
   git clone [رابط-المستودع]
=======
   git clone https://github.com/elsaedy55/RevoAi-backend
>>>>>>> 50f7a2f365e552056a476ad27c57e6099b3e8609
   cd revoai
   npm install
   ```

2. **تكوين البيئة**
   ```bash
   cp .env.example .env
   # قم بتحرير ملف .env مع بيانات اعتماد Firebase وإعدادات التطبيق
   ```

3. **إعداد Firebase**
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init
   ```

4. **التطوير**
   ```bash
   npm run dev          # تشغيل خادم التطوير
   npm test            # تشغيل الاختبارات
   npm run lint        # فحص نمط الكود
   npm run format      # تنسيق الكود
   ```

## 📁 هيكل المشروع

```
project-root/
├── config/          # تكوين التطبيق والثوابت
├── functions/       # دوال Firebase السحابية
├── middleware/      # وسائط Express (المصادقة، التحقق)
├── public/         # الملفات الثابتة وملفات جانب العميل
├── routes/         # تعريفات مسارات API
├── services/       # المنطق الأساسي للأعمال
├── tests/          # مجموعات الاختبار
└── utils/          # الدوال المساعدة
```

## 📚 توثيق API

### 🏥 نقاط نهاية API الطبيب

#### المصادقة
- `POST /api/doctors/register/email` - تسجيل طبيب جديد بالبريد الإلكتروني
- `POST /api/doctors/register/google` - تسجيل طبيب جديد بحساب جوجل
- `POST /api/doctors/login` - تسجيل دخول الطبيب
- `GET /api/doctors/profile` - عرض الملف الشخصي للطبيب

#### إدارة المرضى
- `GET /api/doctors/patients` - عرض قائمة المرضى
- `GET /api/doctors/search-patients` - البحث عن المرضى
- `POST /api/doctors/request-access` - طلب الوصول لملف مريض

### 🔒 نقاط نهاية API المسؤول

#### إدارة الأطباء
- `GET /api/admin/doctors/pending` - عرض قائمة الأطباء المعلقين
- `PUT /api/admin/doctors/:doctorId/approval` - تحديث حالة موافقة الطبيب

### 👤 نقاط نهاية API المريض

#### المصادقة
- `POST /api/patients/register/email` - تسجيل مريض جديد بالبريد الإلكتروني
- `POST /api/patients/login` - تسجيل دخول المريض
- `GET /api/patients/profile` - عرض الملف الشخصي للمريض

#### السجلات الطبية
- `GET /api/patients/medical-history` - عرض التاريخ الطبي
- `PUT /api/patients/medical-data` - تحديث البيانات الطبية
- `POST /api/patients/grant-access` - منح صلاحية الوصول لطبيب

### 🔒 تنفيذ نظام الأمان

1. **طبقة المصادقة**
   - مصادقة Firebase
   - إدارة رموز JWT
   - معالجة الجلسات

2. **طبقة التفويض**
   - الصلاحيات القائمة على الأدوار
   - التحكم في الوصول على مستوى الموارد
   - سياسات الوصول للبيانات

3. **حماية البيانات**
   - تشفير من طرف إلى طرف
   - نقل آمن للبيانات
   - ضوابط الخصوصية

## ⚙️ التكوين

### متغيرات البيئة

```env
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_domain
FIREBASE_PROJECT_ID=your_project_id
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

## 🧪 استراتيجية الاختبار

- **اختبارات الوحدة**: المنطق الأساسي للأعمال
- **اختبارات التكامل**: نقاط نهاية API
- **اختبارات E2E**: تدفقات المستخدم
- **اختبارات الأمان**: فحص الثغرات

تشغيل الاختبارات:
```bash
npm test                 # تشغيل جميع الاختبارات
npm run test:coverage    # إنشاء تقرير التغطية
npm run test:e2e        # تشغيل اختبارات E2E
```

## 🤝 المساهمة

1. انسخ المستودع
2. أنشئ فرع الميزة الخاص بك: `git checkout -b feature/amazing-feature`
3. قم بعمل commit للتغييرات: `git commit -m 'إضافة ميزة رائعة'`
4. ادفع إلى الفرع: `git push origin feature/amazing-feature`
5. قدم طلب سحب

### إرشادات المساهمة
- اتبع نمط الترميز
- أضف اختبارات للميزات الجديدة
- حدّث التوثيق
- اتبع اصطلاحات رسائل commit

## 📄 الترخيص

هذا المشروع مرخص تحت رخصة MIT - انظر [LICENSE](LICENSE) للتفاصيل.

## 🆘 الدعم

- الدعم الفني: [support@revoai.com](mailto:support@revoai.com)
- التوثيق: [docs.revoai.com](https://docs.revoai.com)
- تتبع المشكلات: GitHub Issues

## 🔄 سجل الإصدارات

- v1.0.0 - الإصدار الأولي
  - المصادقة الأساسية
  - وظائف السجلات الطبية الأساسية
  - ميزات تفاعل الطبيب والمريض
  - نظام التحقق من الأطباء

---

بُني بـ ❤️ بواسطة فريق RevoAI
