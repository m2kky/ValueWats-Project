# إعداد ربط Google OAuth لتطبيق ValueWats (n8n-Style)

يتيح هذا النظام للمستخدمين (Tenants) ربط حسابات جوجل الخاصة بهم (Google Calendar, Google Drive) بشكل آمن من خلال إنشاء تطبيق OAuth خاص بهم في Google Cloud Console، تماماً مثل طريقة عمل `n8n`.

## الخطوة الأولى: إنشاء مشروع وتفعيل الـ APIs

1. انتقل إلى [Google Cloud Console](https://console.cloud.google.com).
2. انقر على **Select a Project** ثم **New Project**، وقم بتسميته (مثلاً: `ValueWats AI Integrations`).
3. انتقل إلى **APIs & Services** > **Library**.
4. ابحث عن و**قم بتفعيل** الخدمات التالية بالترتيب:
   - `Google Calendar API`
   - `Google Drive API`

## الخطوة الثانية: إعداد شاشة الموافقة (OAuth Consent Screen)

1. من القائمة الجانبية، اذهب إلى **APIs & Services** > **OAuth consent screen**.
2. اختر **External** (للسماح لأي حساب جيميل بالدخول) واضغط **Create**.
3. **App information**:
   - اسم التطبيق: `ValueWats AI`
   - بريد الدعم: (أدخل بريدك الإلكتروني)
4. اضغط **Save and Continue** حتى تصل إلى صفحة **Test Users**.
5. قم بإضافة بريدك الإلكتروني كـ Test User للمشروع.
6. لاحقاً يمكنك نشر التطبيق (Publish App).

## الخطوة الثالثة: إنشاء Client ID و Client Secret

1. اذهب إلى **APIs & Services** > **Credentials**.
2. اضغط على **+ CREATE CREDENTIALS** واختر **OAuth client ID**.
3. في خانة **Application type**، اختر **Web application**.
4. اكتب الاسم (مثلاً `ValueWats Custom App`).
5. في قسم **Authorized JavaScript origins**، أضف رابط المنصة الخاص بك (مثلاً `https://valuechat.app`).
6. في قسم **Authorized redirect URIs**، أضف الرابط الخاص بك متبوعاً بالمسار التالي:
   ```text
   https://valuechat.app/api/oauth/google/callback
   ```
   *(قم بتغيير النطاق حسب الاستضافة الخاصة بك. يمكنك دائماً نسخ هذا الرابط مباشرة من داخل المنصة عند اختيار Connection Type: Google OAuth).*
7. اضغط **Create**.
8. ستظهر لك شاشة تحتوي على **Client ID** و **Client Secret**.

## الخطوة الرابعة: الربط في المنصة واستخدام الذكاء الاصطناعي

1. داخل واجهة **ValueWats**، اذهب إلى صفحة **Integrations**.
2. اضغط **Add Integration** واختر **Sign in with Google (OAuth 2.0)**.
3. قم بتسمية الحساب (مثلاً `My Work Drive & Calendar`)، وأدخل الـ **Client ID** و **Client Secret** اللي حصلت عليهم، ثم اضغط **Sign in with Google**.
4. عند الانتقال لصفحة **Agents**، أضف الكلمة السحرية `@GoogleDrive` أو `@GoogleCalendar` داخل مربع `System Instructions`.
5. سيظهر لك مربع سحري فوري بالأسفل يتيح لك اختيار الحساب المربوط. الآن، موظف الذكاء الاصطناعي الخاص بك يمتلك الصلاحية لإنشاء المواعيد والبحث في ملفات Drive!

> [!TIP]
> بعد تفعيل `@GoogleDrive`، يمكنك أن تطلب من الـ Agent البحث عن الملفات أثناء المحادثة (مثلاً "أرسل ملف الأسعار للموظف") وسيقوم الـ Agent بجلب روابط الملفات وإرسالها مباشرة!
