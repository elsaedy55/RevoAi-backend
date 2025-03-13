// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/9.2.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.2.0/firebase-messaging-compat.js');

// تكوين Firebase
const firebaseConfig = {
  apiKey: 'AIzaSyBfBF_cBgsJW3ASzE3hBjWBcXS7aNKaf0w',
  authDomain: 'revoai-f5a20.firebaseapp.com',
  projectId: 'revoai-f5a20',
  storageBucket: 'revoai-f5a20.firebasestorage.app',
  messagingSenderId: '692148281592',
  appId: '1:692148281592:web:5a2666733b11d105961b0d',
};

// تهيئة تطبيق Firebase
firebase.initializeApp(firebaseConfig);

// الحصول على خدمة Messaging
const messaging = firebase.messaging();

// معالجة الرسائل في الخلفية
messaging.onBackgroundMessage(payload => {
  // إعداد خيارات الإشعار
  const notificationTitle = payload.notification?.title || 'إشعار جديد';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/logo.png',
    badge: '/badge.png',
    tag: payload.data?.tag || 'default',
    data: payload.data || {},
    // السماح بالاهتزاز
    vibrate: [200, 100, 200],
    // إضافة أصوات للإشعارات
    silent: false,
    // السماح بعرض الإشعار حتى لو كان المستخدم نشطًا
    requireInteraction: true,
    // تحديد أولوية الإشعار
    priority: 'high',
  };

  // عرض الإشعار
  return self.registration.showNotification(notificationTitle, notificationOptions).catch(error => {
    // Log error for debugging
    // eslint-disable-next-line no-console
    console.error('خطأ في عرض الإشعار:', error);
  });
});

// معالجة الضغط على الإشعار
self.addEventListener('notificationclick', event => {
  // إغلاق الإشعار
  event.notification.close();

  // استخراج البيانات المخصصة من الإشعار
  const notificationData = event.notification.data;

  // تحديد المسار المطلوب فتحه بناءً على نوع الإشعار
  let urlToOpen = '/';
  if (notificationData.type === 'DIAGNOSIS_UPDATE') {
    urlToOpen = `/patient/records/${notificationData.recordId}`;
  } else if (notificationData.type === 'PERMISSION_GRANTED') {
    urlToOpen = `/doctor/patients/${notificationData.patientId}`;
  } else if (notificationData.type === 'ACCESS_REQUEST') {
    urlToOpen = `/patient/access-requests/${notificationData.requestId}`;
  }

  // فتح أو التركيز على النافذة الموجودة
  event.waitUntil(
    clients
      .matchAll({ type: 'window' })
      .then(clientList => {
        // البحث عن نافذة مفتوحة بنفس الرابط
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // إذا لم يتم العثور على نافذة مفتوحة، افتح نافذة جديدة
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
      .catch(error => {
        // Log error for debugging
        // eslint-disable-next-line no-console
        console.error('خطأ في معالجة الضغط على الإشعار:', error);
      })
  );
});
