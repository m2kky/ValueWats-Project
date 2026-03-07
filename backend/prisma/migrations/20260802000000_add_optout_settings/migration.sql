ALTER TABLE "tenants"
  ADD COLUMN IF NOT EXISTS "optout_enabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "optout_message" TEXT NOT NULL DEFAULT '✅ تم إلغاء اشتراكك بنجاح. لن تصلك رسائل تسويقية منا بعد الآن. يمكنك التواصل معنا في أي وقت.',
  ADD COLUMN IF NOT EXISTS "optout_keywords" TEXT[] NOT NULL DEFAULT ARRAY['stop','وقف','انهاء','إلغاء','الغاء','لا رسائل','unsubscribe','إلغاء الاشتراك'];
