
> start:backend
> cd backend && npm start


> valuewats-backend@1.0.1 start
> prisma migrate deploy && node src/server.js

Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "postgres", schema "public" at "ic4c04s008gwc8cg4k8skkks:5432"

16 migrations found in prisma/migrations


No pending migrations to apply.
[dotenv@17.2.3] injecting env (0) from .env -- tip: 🔐 prevent committing .env to code: https://dotenvx.com/precommit
🚀 Server running on port 3000
📊 Environment: production
[Scheduler] Campaign scheduler started (checking every 30s)
✅ Redis connected
[getInstanceStatus] 7: {"instance":{"instanceName":"7","state":"open"}}
Could not sync status for meky: Failed to get instance status
Could not sync status for 515: Failed to get instance status
Could not sync status for ي: Failed to get instance status
[getInstanceStatus] 7: {"instance":{"instanceName":"7","state":"open"}}
Could not sync status for meky: Failed to get instance status
Could not sync status for 515: Failed to get instance status
Could not sync status for ي: Failed to get instance status
[getInstanceStatus] 7: {"instance":{"instanceName":"7","state":"open"}}
Could not sync status for 515: Failed to get instance status
Could not sync status for ي: Failed to get instance status
Could not sync status for meky: Failed to get instance status
[Campaign] Created campaign 4647ecdd-f1af-49c7-aaf1-0c31b3893610 with 8 contacts, instances: 2, templates: 2, status: PENDING
[Queue] Scheduling message 1/8 to 201098620547 via meky (Template 1) with 15000ms delay
Processing message for 201098620547 via meky (Media: No)
[Queue] Scheduling message 2/8 to 201098620547 via 7 (Template 2) with 29000ms delay
[Queue] Scheduling message 3/8 to 201098620547 via meky (Template 1) with 39000ms delay
[Queue] Scheduling message 4/8 to 201098620547 via 7 (Template 2) with 50000ms delay
[Queue] Scheduling message 5/8 to 201098620547 via meky (Template 1) with 63000ms delay
[Queue] Scheduling message 6/8 to 201098620547 via 7 (Template 2) with 75000ms delay
[Queue] Scheduling message 7/8 to 201098620547 via meky (Template 1) with 87000ms delay
[Queue] Scheduling message 8/8 to 201098620547 via 7 (Template 2) with 94000ms delay
[Socket] New client connected: 8GLjWtHjPsSMi5bMAAAB
[Socket] Client 8GLjWtHjPsSMi5bMAAAB joined campaign_4647ecdd-f1af-49c7-aaf1-0c31b3893610
Processing message for 201098620547 via meky (Media: No)
[Socket] Client disconnected: 8GLjWtHjPsSMi5bMAAAB
[Socket] New client connected: 5M7FQB3Kt8796WpQAAAD
[Socket] Client 5M7FQB3Kt8796WpQAAAD joined campaign_4647ecdd-f1af-49c7-aaf1-0c31b3893610
Processing message for 201098620547 via meky (Media: No)
Processing message for 201098620547 via 7 (Media: No)
[sendMessage] Success (Attempt 1): {"key":{"remoteJid":"<REDACTED>","fromMe":true,"id":"3EB02BDF6F19D73AB79438"},"pushName":"Você","status":"PENDING","message":{"conversation":"23قيشس"},"contextInfo":{"mentionedJid":[],"groupMentions":[],"ephemeralSettingTimestamp":{"low":1771994251,"high":0,"unsigned":false},"disappearingMode":{"initiator":0}},"messageType":"conversation","messageTimestamp":1772167051,"instanceId":"cb8cc9ca-7adb-4072-9242-8a197117e218","source":"web"}
Job 7809 completed!
Processing message for 201098620547 via meky (Media: No)
Processing message for 201098620547 via meky (Media: No)
Processing message for 201098620547 via 7 (Media: No)
Processing message for 201098620547 via meky (Media: No)
Processing message for 201098620547 via 7 (Media: No)
Campaign 4647ecdd-f1af-49c7-aaf1-0c31b3893610 completed! Sent: 1, Failed: 7
Processing message for 201098620547 via 7 (Media: No)
Processing message for 201098620547 via meky (Media: No)
Processing message for 201098620547 via meky (Media: No)
Processing message for 201098620547 via 7 (Media: No)
Processing message for 201098620547 via meky (Media: No)
Processing message for 201098620547 via 7 (Media: No)
Processing message for 201098620547 via meky (Media: No)
Processing message for 201098620547 via 7 (Media: No)
Processing message for 201098620547 via meky (Media: No)
Processing message for 201098620547 via 7 (Media: No)
Processing message for 201098620547 via 7 (Media: No)
npm warn config production Use `--omit=dev` instead.
npm warn config production Use `--omit=dev` instead.
Get status error: {
  status: 404,
  error: 'Not Found',
  response: { message: [ 'The "meky" instance does not exist' ] }
}
Get status error: {
  status: 404,
  error: 'Not Found',
  response: { message: [ 'The "515" instance does not exist' ] }
}
Get status error: {
  status: 404,
  error: 'Not Found',
  response: { message: [ 'The "ي" instance does not exist' ] }
}
Get status error: {
  status: 404,
  error: 'Not Found',
  response: { message: [ 'The "meky" instance does not exist' ] }
}
Get status error: {
  status: 404,
  error: 'Not Found',
  response: { message: [ 'The "515" instance does not exist' ] }
}
Get status error: {
  status: 404,
  error: 'Not Found',
  response: { message: [ 'The "ي" instance does not exist' ] }
}
Get status error: {
  status: 404,
  error: 'Not Found',
  response: { message: [ 'The "515" instance does not exist' ] }
}
Get status error: {
  status: 404,
  error: 'Not Found',
  response: { message: [ 'The "ي" instance does not exist' ] }
}
Get status error: {
  status: 404,
  error: 'Not Found',
  response: { message: [ 'The "meky" instance does not exist' ] }
}
[sendMessage] Error (Attempt 1/2) sending to 201098620547 via meky: Request failed with status code 404
[sendMessage] Error (Attempt 2/2) sending to 201098620547 via meky: Request failed with status code 404
Failed to send message to 201098620547: Failed to send message: Request failed with status code 404
Job 7808 failed: Failed to send message: Request failed with status code 404
[sendMessage] Error (Attempt 1/2) sending to 201098620547 via meky: Request failed with status code 404
[sendMessage] Error (Attempt 2/2) sending to 201098620547 via meky: Request failed with status code 404
Failed to send message to 201098620547: Failed to send message: Request failed with status code 404
Job 7808 failed: Failed to send message: Request failed with status code 404
[sendMessage] Error (Attempt 1/2) sending to 201098620547 via meky: Request failed with status code 404
[sendMessage] Error (Attempt 2/2) sending to 201098620547 via meky: Request failed with status code 404
Failed to send message to 201098620547: Failed to send message: Request failed with status code 404
Job 7808 failed: Failed to send message: Request failed with status code 404
[sendMessage] Error (Attempt 1/2) sending to 201098620547 via meky: Request failed with status code 404
[sendMessage] Error (Attempt 2/2) sending to 201098620547 via meky: Request failed with status code 404
Failed to send message to 201098620547: Failed to send message: Request failed with status code 404
Job 7810 failed: Failed to send message: Request failed with status code 404
[sendMessage] Error (Attempt 1/2) sending to 201098620547 via meky: Request failed with status code 404
[sendMessage] Error (Attempt 2/2) sending to 201098620547 via meky: Request failed with status code 404
Failed to send message to 201098620547: Failed to send message: Request failed with status code 404
Job 7810 failed: Failed to send message: Request failed with status code 404
[sendMessage] Error (Attempt 1/2) sending to 201098620547 via 7: Request failed with status code 500
[sendMessage] Error (Attempt 2/2) sending to 201098620547 via 7: Request failed with status code 500
Failed to send message to 201098620547: Failed to send message: Request failed with status code 500
Job 7811 failed: Failed to send message: Request failed with status code 500
[sendMessage] Error (Attempt 1/2) sending to 201098620547 via meky: Request failed with status code 404
[sendMessage] Error (Attempt 2/2) sending to 201098620547 via meky: Request failed with status code 404
Failed to send message to 201098620547: Failed to send message: Request failed with status code 404
Job 7810 failed: Failed to send message: Request failed with status code 404
[sendMessage] Error (Attempt 1/2) sending to 201098620547 via 7: Request failed with status code 500
[sendMessage] Error (Attempt 2/2) sending to 201098620547 via 7: Request failed with status code 500
Failed to send message to 201098620547: Failed to send message: Request failed with status code 500
Job 7811 failed: Failed to send message: Request failed with status code 500
[sendMessage] Error (Attempt 1/2) sending to 201098620547 via 7: Request failed with status code 500
[sendMessage] Error (Attempt 2/2) sending to 201098620547 via 7: Request failed with status code 500
Failed to send message to 201098620547: Failed to send message: Request failed with status code 500
Job 7811 failed: Failed to send message: Request failed with status code 500
[sendMessage] Error (Attempt 1/2) sending to 201098620547 via meky: Request failed with status code 404
[sendMessage] Error (Attempt 2/2) sending to 201098620547 via meky: Request failed with status code 404
Failed to send message to 201098620547: Failed to send message: Request failed with status code 404
Job 7812 failed: Failed to send message: Request failed with status code 404
[sendMessage] Error (Attempt 1/2) sending to 201098620547 via meky: Request failed with status code 404
[sendMessage] Error (Attempt 2/2) sending to 201098620547 via meky: Request failed with status code 404
Failed to send message to 201098620547: Failed to send message: Request failed with status code 404
Job 7812 failed: Failed to send message: Request failed with status code 404
[sendMessage] Error (Attempt 1/2) sending to 201098620547 via 7: Request failed with status code 500
[sendMessage] Error (Attempt 2/2) sending to 201098620547 via 7: Request failed with status code 500
Failed to send message to 201098620547: Failed to send message: Request failed with status code 500
Job 7813 failed: Failed to send message: Request failed with status code 500
[sendMessage] Error (Attempt 1/2) sending to 201098620547 via meky: Request failed with status code 404
[sendMessage] Error (Attempt 2/2) sending to 201098620547 via meky: Request failed with status code 404
Failed to send message to 201098620547: Failed to send message: Request failed with status code 404
Job 7812 failed: Failed to send message: Request failed with status code 404
[sendMessage] Error (Attempt 1/2) sending to 201098620547 via 7: Request failed with status code 500
[sendMessage] Error (Attempt 2/2) sending to 201098620547 via 7: Request failed with status code 500
Failed to send message to 201098620547: Failed to send message: Request failed with status code 500
Job 7813 failed: Failed to send message: Request failed with status code 500
[sendMessage] Error (Attempt 1/2) sending to 201098620547 via meky: Request failed with status code 404
[sendMessage] Error (Attempt 2/2) sending to 201098620547 via meky: Request failed with status code 404
Failed to send message to 201098620547: Failed to send message: Request failed with status code 404
Job 7814 failed: Failed to send message: Request failed with status code 404
[sendMessage] Error (Attempt 1/2) sending to 201098620547 via 7: Request failed with status code 500
[sendMessage] Error (Attempt 2/2) sending to 201098620547 via 7: Request failed with status code 500
Failed to send message to 201098620547: Failed to send message: Request failed with status code 500
Job 7813 failed: Failed to send message: Request failed with status code 500
[sendMessage] Error (Attempt 1/2) sending to 201098620547 via meky: Request failed with status code 404
[sendMessage] Error (Attempt 2/2) sending to 201098620547 via meky: Request failed with status code 404
Failed to send message to 201098620547: Failed to send message: Request failed with status code 404
Job 7814 failed: Failed to send message: Request failed with status code 404
[sendMessage] Error (Attempt 1/2) sending to 201098620547 via 7: Request failed with status code 500
[sendMessage] Error (Attempt 2/2) sending to 201098620547 via 7: Request failed with status code 500
Failed to send message to 201098620547: Failed to send message: Request failed with status code 500
Job 7815 failed: Failed to send message: Request failed with status code 500
[sendMessage] Error (Attempt 1/2) sending to 201098620547 via 7: Request failed with status code 500
[sendMessage] Error (Attempt 2/2) sending to 201098620547 via 7: Request failed with status code 500
Failed to send message to 201098620547: Failed to send message: Request failed with status code 500
Processing message for 201098620547 via meky (Media: No)
Job 7815 failed: Failed to send message: Request failed with status code 500
[sendMessage] Error (Attempt 1/2) sending to 201098620547 via meky: Request failed with status code 404
[sendMessage] Error (Attempt 2/2) sending to 201098620547 via meky: Request failed with status code 404
Failed to send message to 201098620547: Failed to send message: Request failed with status code 404
Job 7814 failed: Failed to send message: Request failed with status code 404
Processing message for 201098620547 via 7 (Media: No)
[sendMessage] Error (Attempt 1/2) sending to 201098620547 via 7: Request failed with status code 500
[sendMessage] Error (Attempt 2/2) sending to 201098620547 via 7: Request failed with status code 500
Failed to send message to 201098620547: Failed to send message: Request failed with status code 500
Job 7815 failed: Failed to send message: Request failed with status code 500
[Socket] Client disconnected: 5M7FQB3Kt8796WpQAAAD
OTP sent to <REDACTED>
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "0d6e7316-bf16-4d9d-bf78-a3865ba47df6",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "0d6e7316-bf16-4d9d-bf78-a3865ba47df6",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "0d6e7316-bf16-4d9d-bf78-a3865ba47df6",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "0d6e7316-bf16-4d9d-bf78-a3865ba47df6",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "0d6e7316-bf16-4d9d-bf78-a3865ba47df6",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "0d6e7316-bf16-4d9d-bf78-a3865ba47df6",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "0d6e7316-bf16-4d9d-bf78-a3865ba47df6",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "0d6e7316-bf16-4d9d-bf78-a3865ba47df6",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "0d6e7316-bf16-4d9d-bf78-a3865ba47df6",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "0d6e7316-bf16-4d9d-bf78-a3865ba47df6",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "0d6e7316-bf16-4d9d-bf78-a3865ba47df6",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "0d6e7316-bf16-4d9d-bf78-a3865ba47df6",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "0d6e7316-bf16-4d9d-bf78-a3865ba47df6",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "0d6e7316-bf16-4d9d-bf78-a3865ba47df6",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "0d6e7316-bf16-4d9d-bf78-a3865ba47df6",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
Creating instance: Ibrahim010 at http://api-sgwcco4kw80sckwg4c08sgk4:8080
Instance created at Evolution API: {"instance":{"instanceName":"Ibrahim010","instanceId":"dd26c415-932a-4022-af8e-02622ee5d14f","integration":"WHATSAPP-BAILEYS","webhookWaBusiness":null,"accessTokenWaBusiness":"","status":"connecting"},"hash":"Ibrahim010","webhook":{},"websocket":{},"rabbitmq":{},"nats":{},"sqs":{},"settings":{"rejectCall":false,"msgCall":"","groupsIgnore":false,"alwaysOnline":false,"readMessages":false,"readStatus":false,"syncFullHistory":false,"wavoipToken":""},"qrcode":{"pairingCode":null,"code":"2@3gxElv/eeoe8GWOc2SZgSW175y/3dYzCWQSd3Wwa26CFFFG4ms4ySVntb7/313PjO0gHr+Fqxa/CbaLOkuJPd3j4zNL0DDW/Ig0=,6/PFcnMTZqj+5tQ2s8XQat6XkYL0YwsMrb7a3f7KHSI=,0heysnivPZRyaFmKsM0p0KR+WDdQssRxmwYLA34Y0TM=,mSTH+GuuqK2WJq2YaQwu01PnSWVALP70CihS68m6+0Y=","base64":"data:image/png;base64,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i8ktTiKLG24xRRYnbjFFFjciixuRxeQWk1ucuMVJZDG5xUlkcRJZTG5x4hYnkcXkFpNbTJHFFFlMbvFND2uttV7xsNZa6xUPa621XvHDpchicovJLabI4kZkccMtPuEW3xRZTG5xEllMbjFFFp+ILE7c4iSymNxiiiw+4RYnbjFFFp+ILCa3mCKLk8jiRmRxwy2myOKbIotPuMUn3GKKLKbIYnKLKbI4cYspspjcYnKLk8jimx7WWmu94mGttdYrHtZaa73iz99/cCGymNxiiiwmt/imyOLELabIYnKLKbI4cYtPRBaTW0yRxeQWU2TxCbeYIosTt5gii8ktbkQWk1tMkcWJW0yRxQ23+KbIYnKLk8jiTW4xRRYnbjFFFp9wi5PI4sQt3hRZnLjFNz2stdZ6xcNaa61XPKy11nrFn7//4AORxYlbTJHF5BZTZHHiFieRxeQWU2Txm9ziJLKY3GKKLE7c4iSy+Ca3+KbIYnKLk8jihltMkcWJW0yRxSfcYoosTtxiiiwmt5gii8ktpshicospsviEW7wpsjhxi5PI4sQtpshicotvelhrrfWKh7XWWq94WGut9YofvswtTtzixC1uRBa/yS1OIospsnhTZHHiFieRxUlkMbnFjchicospspjc4oZbTJHF5BZTZHHDLf7LIouTyOLELabI4iSymNziJLKY3GKKLE7cYoospsjihltMkcVJZDG5xSce1lprveJhrbXWKx7WWmu94odLkcXkFlNkccMtpshicosTt5giiymyOHGLk8hicosbbnESWZy4xb/JLW5EFieRxQ23+ERkMbnFFFlMbjFFFiduceIWN9zihltMkcXkFt/kFv8lbnESWdxwiymy+KaHtdZar3hYa631ioe11lqv+OGSW5y4xY3IYnKLk8jihltMkcUnIotPRBaTW0yRxRRZnLjFSWQxucWNyGJyixtucRJZTJHF5BZTZDG5xYlbnLjFDbc4iSwmt5gii8ktTiKLyS2myOITkcXkFieRxeQWNyKLT7jFFFl8wi2myGJyi296WGut9YqHtdZar3hYa631ih8uRRYnbjFFFjciixO3uBFZTG5xElmcuMUUWdxwiymyuOEWU2RxI7L4N0UWJ24xRRaTW0yRxeQWU2TxCbf4RGQxucUUWUxuMbnFFFmcuMU3RRaTW5xEFpNbnEQWk1tMkcWJW3yTW/ymh7XWWq94WGut9YqHtdZar/jhZW5xI7KYIosTt/gmtzhxixuRxeQWU2RxElnccIuTyOLELW64xRRZ3IgsJre4EVlMbnESWUxuMUUWN9ziJLKY3OKGW0yRxRRZ3HCLb3KLk8jiJLKY3OIksjhxiymymNxiiixO3OITD2uttV7xsNZa6xUPa621XvHDh9xiiiwmt5giixtuMUUWJ5HFmyKLyS2myOI3ucUUWUyRxeQWk1t8IrKY3GJyiymymNziRmRxI7K4EVlMbnESWZxEFieRxeQW3+QWNyKLyS2myGJyizdFFiduMUUWk1tMkcWbHtZaa73iYa211ise1lprveKHD0UWk1tMkcUNt7jhFlNkcRJZTG5xEllMbjG5xTe5xRRZ3HCLG5HF5BZTZDG5xSfc4pvcYoosJre4EVnccIspspjcYoosTiKLyS2myGJyiymymCKLyS3+y9zixC1OIovJLU7cYoosTiKLyS1uPKy11nrFw1prrVc8rLXWesWfv//giyKLN7nFFFnccIuTyGJyiymymNxiiiwmtziJLCa3mCKLb3KLG5HFN7nFSWRx4hafiCwmt5giize5xY3IYnKLb4osPuEWU2TxX+IWJ5HF5BafeFhrrfWKh7XWWq94WGut9Yo/f//BhchicospspjcYoosJre4EVlMbnESWdxwi5PIYnKLG5HFDbeYIovJLW5EFpNbnEQWk1ucRBb/JreYIovf5BY3IovJLabIYnKLk8hicospspjc4k2RxQ23OIksJre4EVmcuMUUWZy4xY2HtdZar3hYa631ioe11lqv+OGSW5y4xRRZ3IgsJrc4iSxO3OIksvhEZHHiFpNbTJHFN0UWk1ucRBa/yS1OIosbbjFFFiduMUUWJ24xRRY3IovJLU4ii8ktbrjFFFlMbnESWUxucRJZnLjF5BZTZHESWUxucSOymNzixC1O3OKbHtZaa73iYa211ise1lprveKHS5HFiVt8wi1uuMVJZDG5xUlkMbnFiVtMkcUUWUxuMbnFFFl8wi1uuMWNyGJyi5PI4oZbnEQWk1t8wi2myOITbvGJyOITbjFFFiduMUUWk1tMbjFFFlNkMbnFiVtMkcUUWdxwixuRxSfc4sbDWmutVzystdZ6xcNaa61X/Pn7Dz4QWfyXuMVJZDG5xUlkccMtvimy+E1uMUUWk1t8IrKY3OIksvhNbjFFFpNbnEQWb3KLKbI4cYtPRBYnbjFFFpNbnEQWk1vciCy+yS2myGJyiymymNzixsNaa61XPKy11nrFw1prrVf8+fsPPhBZTG7xTZHFiVt8IrI4cYspspjcYoosbrjFFFlMbvGJyGJyi5PIYnKL/yWRxQ23OIksTtxiiixuuMVJZDG5xRRZnLjFFFlMbnESWXyTW0yRxeQWU2QxucVviixO3OITD2uttV7xsNZa6xUPa621XvHDpchicospspjc4kZk8Zsii8ktPhFZnLjFSWRxI7K44RYnkcVJZDG5xRRZTG4xRRYnbnESWXzCLU4iixO3mCKLE7eYIovJLW64xRRZnLjFJyKLyS2myGJyi0+4xRRZnEQWk1ucRBaTW0yRxeQWU2TxTQ9rrbVe8bDWWusVD2uttV7xwyW3mCKLb3KLk8hiiiy+KbI4cYuTyOIksviEW0yRxeQWN9xiiixOIouTyOJNbjFFFieRxeQWU2Rx4hYnkcVJZDG5xUlkMbnFFFlMkcWJW/ymyGJyiymymNziE5HF5BafiCwmt/imh7XWWq94WGut9YqHtdZar/jz9x/8oshicouTyOLELabIYnKL3xRZnLjFFFlMbnESWUxucSOymNxiiiwmt5giixO3mCKLE7c4iSxO3GKKLG64xUlkceIWJ5HF5BY3IosTtziJLE7c4iSy+IRbvCmymNziN0UWk1t84mGttdYrHtZaa73iYa211it+uBRZfCKyOHGLKbI4cYspsjhxiymymNzihlucuMUNt/hNbvGmyGJyixO3uOEWU2QxRRYnbnESWUxuMbnFSWQxucXkFieRxeQW3+QWU2Rx4hbfFFl8IrI4cYspspjcYoosJreYIovJLW48rLXWesXDWmutVzystdZ6xQ8fcospsrjhFlNkMbnFJ9xiiiwmtziJLE4ii0+4xY3I4sQtbkQWJ24xRRaTW5xEFlNkMbnFFFlMbvEJtziJLE7cYoosJrf4RGRx4hZTZDG5xRRZnEQWN9xiiixO3GKKLL7JLabIYnKLE7eYIosbbvGJh7XWWq94WGut9YqHtdZar/jhQ5HF5BZTZHHDLabIYnKLb4osJrc4cYvfFFnccIspsjhxixO3OHGLKbKY3GJyixtuMUUWk1t8IrKY3OIkspjcYoosTtzixC0+EVlMbnHiFieRxScii8ktbkQWJ5HFvymymNzixsNaa61XPKy11nrFw1prrVf8cMktPuEWJ5HF5BZTZDG5xUlkMbnFSWQxucVJZHHiFlNk8U2RxYlbTJHFSWQxucUUWXxTZDG5xTdFFieRxeQWk1ucuMUUWXwispjcYnKLk8jihltMbjFFFt8UWZy4xY3I4pvc4sQtPvGw1lrrFQ9rrbVe8bDWWusVf/7+g18UWZy4xUlkccMtflNkMbnFFFmcuMUUWUxuMUUWN9ziJLL4hFt8IrL4TW7xicjim9xiiiwmt/hEZHHDLW5EFiduMUUWk1ucRBaTW5xEFiduMUUWk1ucRBY33OLGw1prrVc8rLXWesXDWmutV/zwZZHFjcjihltMkcUUWZy4xRRZ3HCLKbL4N7nFDbf4pshicospspjcYoosTtziN0UW3+QW3xRZnLjFSWRxEll8IrKY3OITkcXkFiduMUUWNyKLyS2myGJyi088rLXWesXDWmutVzystdZ6xQ8fiiwmt5giixO3OIksTtxiiiy+yS1O3OITbjFFFiduMUUWk1tMkcWJW0yRxeQWJ24xRRaTW9xwi5PI4je5xUlkcSOyuBFZTG4xRRZTZHEjspjc4psii8ktpshicospspgii5PIYnKLKbK4EVn8poe11lqveFhrrfWKh7XWWq/44VJkMbnFFFlMbnESWfyXuMWNyGJyixuRxeQWN9zixC2myOKbIovJLT4RWZy4xUlkccMtpsjim9ziJLL4hFtMkcXkFlNkMUUWk1tMkcWJW9xwiymymNxiiiwmt5giixO3OHGLG5HF5BY3HtZaa73iYa211ise1lprveKHS24xRRbf5Bbf5BZTZHESWZy4xeQWJ5HF5BYnkcXkFr8psrgRWZxEFpNbfMItpshicovJLabI4iSy+E2RxYlbnEQWJ5HFSWQxucVJZDG5xRRZnLjFJyKLyS2+KbL4Nz2stdZ6xcNaa61XPKy11nrFD5cii8ktbkQWk1tMkcWJW5y4xYlbTJHF5BYnkcXkFlNkMbnFJyKLyS1OIovJLSa3mCKLb3KLKbKY3OLELW5EFjfcYoosJreYIosbkcXkFr/JLabIYnKLT0QWk1t8k1tMkcUnIovJLSa3+Dc9rLXWesXDWmutVzystdZ6xQ+X3GKKLD4RWUxuMUUWU2QxucUUWUxu8ZsiixuRxeQWNyKLyS0mt5giixO3uOEWU2TxJreYIovJLabIYoosbrjFjchiiixuuMWJW0yRxeQWU2Rxwy2myGKKLE7cYoosbrjFFFnccIsbkcUNt/jEw1prrVc8rLXWesXDWmutV/zwy9xiiixOIosTt/gmtziJLG64xRRZ3IgsJreY3GKKLCa3mNxiiixOIovJLabIYnKLKbKY3GKKLCa3uBFZnEQWk1ucRBYnkcXkFlNkceIWJ5HFFFlMbnHiFlNkMbnFFFlMbjFFFjfc4sQtpsjihltMkcXkFr/JLb7pYa211ise1lprveJhrbXWK374MreYIovJLabIYnKLKbKYIotPRBYnbjG5xRRZTG7xichicotPRBbfFFlMbjFFFieRxeQWU2TxCbc4iSwmt5jcYoosJreYIosTtziJLCa3OIksJreYIovJLf7L3GKKLKbIYnKLyS1OIosTt5jc4kZkMbnFjYe11lqveFhrrfWKh7XWWq/48/cfXIgsTtxiiiwmt5giixO3uBFZfMItbkQWk1tMkcXkFlNkceIWJ5HF5Ba/KbK44RZTZHHiFp+ILG64xUlk8U1uMUUWn3CLKbKY3GKKLD7hFlNkMbnFFFlMbnESWdxwiymyOHGLKbKY3GKKLCa3+MTDWmutVzystdZ6xcNaa61X/HDJLabIYoosbrjFJyKLE7eYIovJLabI4oZbfMItpsjihlt8IrI4cYsTt5gii09EFiduceIWU2RxI7KY3OJGZPEJt5giixtuceIWU2Rx4hZTZPGJyGJyi09EFpNbnEQWJ5HFb3pYa631ioe11lqveFhrrfWKP3//wYXI4sQtpsjiv8QtpsjihltMkcUn3OIksvhNbjFFFpNbfCKyOHGLT0QWJ24xRRYnbjFFFm9yi/+SyGJyiymymNziRmRx4hZTZPEmt/imh7XWWq94WGut9YqHtdZar/jhkltMkcUn3OJGZHHDLabIYnKLKbKY3OI3RRafcIsbkcWNyGJyiymymNzixC2myGJyiymy+ERk8Qm3mCKLyS1uRBYnkcWb3OITbnEjsvgmt7gRWUxucSOymNzixsNaa61XPKy11nrFw1prrVf88GWRxeQWU2RxEllMbvGbIouTyOKGW0yRxZsii8ktPuEWU2QxucUUWUxuMUUWk1ucuMVJZHHiFjcii8ktbkQWk1ucuMWNyOITbjFFFpNbnEQW3+QWJ5HFjchicouTyOKGW3ziYa211ise1lprveJhrbXWK364FFlMbnESWdxwixtucRJZTG4xRRY33GKKLL7JLabI4oZb3IgsbrjFjcjiE5HFDbc4iSxO3OITbvGJyOITbnHDLU7c4iSymNxiiixOIovJLSa3mCKLE7e44RZTZDG5xRRZTG5x42GttdYrHtZaa73iYa211iv+/P0HL4osvsktTiKLE7eYIovJLabIYnKLKbL4X+YW3xRZnLjFFFlMbjFFFpNb3IgsJrc4iSz+TW7xpsjim9xiiiwmt7gRWfwmt5gii8ktPvGw1lrrFQ9rrbVe8bDWWusVf/7+gw9EFidu8YnIYnKLKbKY3OIksvgmt7gRWUxuMUUWJ24xRRaTW0yRxeQW/yWRxeQWJ5HFiVt8IrI4cYtPRBb/Jrc4iSwmt/hEZDG5xRRZTG5xI7KY3GKKLCa3OIksJrf4poe11lqveFhrrfWKh7XWWq/44VJkMbnFSWQxucUUWXzCLabI4sQtTiKLyS2myOIksjhxi/+yyOLELabIYnKLG25xElmcuMUUWXzCLabIYoosbrjF5BZTZDG5xRRZnLjFFFlMbnESWUxuMUUWk1tMkcXkFpNb3IgsJreYIotPRBaTW0xuMUUWk1t84mGttdYrHtZaa73iYa211it+uOQWJ5HF5BYnbnESWXxTZPFf5hZTZDFFFjfcYoosbrjFiVtMkcXkFjcii8ktbrjFSWQxucUUWUxuMUUWk1t8wi2myOLELabIYnKLKbI4cYspspjcYoosPhFZfMItbrjFSWRx4hZTZDG5xY2HtdZar3hYa631ioe11lqv+OFDkcVJZDG5xUlkMbnFFFlMbjG5xRRZTG5xEllMkcXkFlNkMbnFFFlMkcWJW3xTZHHiFlNkMUUWk1tMkcWNyGJyixuRxeQWJ5HFDbc4cYsbkcXkFlNkMbnFSWQxucUUWUxucRJZTG4xRRYnbjFFFpNbnLjFFFmcRBYnbnESWfybHtZaa73iYa211ise1lprveKHX+YWN9xiiiwmt5gii8ktJreYIosbbjFFFpNb3HCLKbI4cYuTyOITkcWJW9xwixO3+KbIYnKLE7eYIovJLabI4sQtpsjiJLL4hFtMkcXkFjfcYoosJre44RYnbjFFFieRxeQWJ5HFiVtMkcWbHtZaa73iYa211ise1lprveLP339wIbKY3GKKLG64xRRZTG5xEll8wi2myOLELd4UWZy4xZsiixtucSOymNziJLKY3GKKLE7c4iSymNxiiixuuMUUWUxucRJZTG5xElnccIspsrjhFr8psjhxiymymNziRmQxucUnHtZaa73iYa211ise1lprveLP33/wRZHFJ9ziJLI4cYspsrjhFjcii8ktTiKLE7eYIovJLU4ii8ktpshicosbkcXkFp+ILG64xY3I4je5xUlkceIWU2TxCbeYIovJLU4ii29yiymymNxiiixuuMUnIosTt/imh7XWWq94WGut9YqHtdZar/jhUmRxwy2myGJyiymymNxicospsvimyOLELSa3OIksJrc4iSxOIotviiwmt5gii3+TW9yILCa3OIksJreYIouTyGJyixuRxeQWJ5HF5BYnbjFFFpNbTG4xRRb/Jrc4iSwmt5gii8ktJreYIouTyGJyixsPa621XvGw1lrrFQ9rrbVe8cOH3OIkspjc4sQtpsjim9zimyKLyS1OIotvcospspgii29yi5PI4sQtTtziE25xElmcRBYnbjFFFlNkccMtpshicouTyOLELW5EFpNbTJHF5BYnkcXkFiduMUUWJ25x4hY33GKKLL7pYa211ise1lprveJhrbXWK/78/QcXIotvcospspjc4kZkMbnFjchicospspjc4t8UWUxuMUUWN9xiiixO3OIksviEW0yRxeQWU2QxucUUWdxwiymymNziJLI4cYspspjc4hORxYlbnEQWn3CLk8jixC1uRBbf5Bbf9LDWWusVD2uttV7xsNZa6xU/fJlbTJHFSWQxucWNyGJyiymymNxiiiwmtzhxi5PIYnKLKbI4cYuTyOKGW0yRxUlkceIWJ5HF5BY3IosTt5gii8ktpsjixC2myGKKLCa3eFNk8Qm3OIksTtxiiiwmt7gRWZy4xUlkMbnFiVtMkcXkFlNkcRJZTG5x42GttdYrHtZaa73iYa211iv+/P0HH4gsJreYIovJLU4iixtuMUUWk1v8l0UWk1tMkcUn3GKKLCa3mCKL3+QWU2QxucUUWUxu8ZsiixO3mCKLG27xichicotPRBY33OIkspjcYoosJreYIovJLabI4sQtTiKLE7f4TQ9rrbVe8bDWWusVD2uttV7xw6XIYnKLKbKY3GKKLCa3mNxiiiy+KbKY3GKKLCa3mCKLb3KLKbI4cYsbkcVJZDG5xRRZ3HCLT0QWJ5HF5BYnkcXkFlNkMbnFN7nFjcjiRmQxucUUWZy4xRRZnEQWk1vccIspsrjhFlNkMUUWJ24xRRYnkcWJW9x4WGut9YqHtdZar3hYa631ih/+YyKLE7eYIotPRBaTW5y4xRRZnLjFN0UW/5e4xRRZ3IgsJrf4RGQxucWJW0yRxUlkceIWU2QxucVJZDG5xUlkceIWU2Rx4hZTZDG5xeQWU2RxEln8pshicotvelhrrfWKh7XWWq94WGut9YofPhRZTG5x4hYnbjFFFiduMUUWU2QxucUUWXzCLW5EFjfc4iSymNxiiiwmtziJLCa3mCKLyS2myOKGW3zCLabIYnKLf1NkceIWU2QxucUUWUxuMbnFFFmcuMVJZDG5xRRZTG5xElnciCwmt/hEZDG5xRRZnEQWk1vceFhrrfWKh7XWWq94WGut9Yo/f//BhcjihlvciCwmtziJLCa3mCKLE7eYIovJLabIYnKLG5HF5BZTZPFNbjFFFiducSOymNziRmTxCbc4iSxO3GKKLCa3mCKLE7c4iSwmtziJLCa3mCKLyS1uRBafcIsbkcXkFp+ILCa3mCKLyS2myGJyi9/0sNZa6xUPa621XvGw1lrrFX/+/oMLkcXkFlNkMbnFSWQxucUUWUxu8abIYnKLKbI4cYtPRBaTW0yRxQ23uBFZTG4xRRbf5BYnkcUn3OJNkcXkFlNkMbnFFFl8wi2myGJyiymyOHGLb4osJreYIovJLabIYnKLG5HFiVtMkcXkFjce1lprveJhrbXWKx7WWmu94odLbjFFFieRxeQWk1tMkcXkFieRxYlbTJHF5BYnbjFFFr8pspjc4jdFFpNbTG4xRRaTW0yRxeQWJ5HFSWQxucVJZHESWUxucRJZ3HCLk8jim9xiiixuRBaTW0yRxUlkceIWNyKLyS1uRBaTW0yRxYlbnLjFJx7WWmu94mGttdYrHtZaa73ihy9zixuRxeQWv8ktpshicospspjcYoosbkQWJ25xElmcuMUnIosbkcWNyOKGW0yRxQ23mCKLk8hicouTyGKKLE7cYoosbrjFFFmcRBYnbjFFFpNbTJHFjchicotPRBaTW0yRxSciixO3+MTDWmutVzystdZ6xcNaa61X/Pn7Dz4QWdxwi5PIYnKLG5HFif/0tNnRAAAElUlEQVRfe3BwI9kRA1Hw6WOMoF20Ik2iFbSLXkg68lRAoXv+YoGMaLFFFp+YFieRxcm02CKLbVpskcU3TYststimxUlksU2LLbL4xLS4EVmcTIststimxUlk8ZumxUlkcTItbkQW27TYIouTaXEjstimxUlk8SdNiy2y2KbFjQczM3vFg5mZveLBzMxe8c+//+MvElncmBZbZLFNiy2yOJkWW2Txm6bFFlls0+JGZHEyLb4psvjEtNgii21abJHFjWlxElmcTIsbkcWNabFFFifT4hORxcm0uBFZfGJabJHFNi1uRBbbtNgiixvT4saDmZm94sHMzF7xYGZmr/jhUmTxpmmxTYststimxcm02CKLk2nxpmnxichimxYn0+IksrgxLbZpsUUW27T4RGSxTYststimxY1psUUWJ5HFNi0+EVls0+JGZHEyLU6mxRZZbNPiZFqcRBYnkcWNyGKbFieRxTYtftODmZm94sHMzF7xYGZmr/jhQ9PimyKLG9NiiyxOpsU2LbbI4pumxRZZbNNiiyy2aXFjWtyILE6mxRZZbNNiiyxOpsUWWWzTYossbkQW27Q4iSxOpsWNafGJabFFFltksU2LLbI4mRZbZPFNkcU2LbbI4jdNi09EFifT4hMPZmb2igczM3vFg5mZveKHL4ssbkyLG5HFN0UW27TYIotvmhYn02KLLE4ii09Miy2y2CKLbVpskcU2LbbIYosstmmxRRbbtDiJLLZpcRJZbNPiJLI4iSw+MS22yGKbFieRxcm02CKLbVqcRBYnkcWNaXESWWzTYosstsjiE9PiJLL4pgczM3vFg5mZveLBzMxe8cNfblqcRBZbZLFNiy2yOJkWJ5HFjchimxbbtNgii5NpcSOy+E3TYossTqbFFlls02KbFltksU2LbVpskcU2LbZp8U2RxRZZbNPiE9PiE5HFybQ4iSxOIosbkcU2LbbI4mRabJHFSWSxTYtvejAzs1c8mJnZKx7MzOwVP/zlIouTaXESWXwisjiJLLZpsU2LLbLYpsU2LbbIYosstmlxMi22yGKbFjciixuRxcm02CKLbVps02KLLE6mxUlkcWNa3JgWNyKLk8himxbbtPhEZHEyLbbIYpsWNyKLk2lxElls02KLLLZp8ZsezMzsFQ9mZvaKBzMze8UPXzYtftO0uBFZbNNimxZbZLFNiy2y2KbFFlnciCw+MS22yOIT02KLLG5Miy2y2KbFFlls0+JkWtyYFltk8U3T4sa02CKLb5oWW2SxTYstsvjEtLgRWbxpWmyRxUlksU2Lb3owM7NXPJiZ2SsezMzsFT98KLL4kyKLbVps0+IkstimxZumxUlksU2LLbK4EVncmBYnkcXJtNgii21abJHFNi22yGKbFieRxZsii5NpcWNabJHFSWSxTYststimxUlkcRJZnEyLk8himxYnkcU2LT4xLbbIYosstmnxiQczM3vFg5mZveLBzMxe8c+//8PMzH7dg5mZveLBzMxe8WBmZq94MDOzVzyYmdkrHszM7BUPZmb2igczM3vFg5mZveLBzMxe8WBmZq/4D85TOZpKI5/NAAAAAElFTkSuQmCC","count":1}}
Setting webhook for instance: Ibrahim010 URL: http://i0kwck044gc80s0osco8w0wg.72.62.50.238.sslip.io/api/webhooks/receive
✅ Webhook configured for Ibrahim010 → http://i0kwck044gc80s0osco8w0wg.72.62.50.238.sslip.io/api/webhooks/receive
[getInstanceStatus] Ibrahim010: {"instance":{"instanceName":"Ibrahim010","state":"connecting"}}
[getInstanceStatus] Ibrahim010: {"instance":{"instanceName":"Ibrahim010","state":"connecting"}}
[getInstanceStatus] Ibrahim010: {"instance":{"instanceName":"Ibrahim010","state":"connecting"}}
Creating instance: 011 at http://api-sgwcco4kw80sckwg4c08sgk4:8080
Instance created at Evolution API: {"instance":{"instanceName":"011","instanceId":"b5bb651a-c0e2-425b-bcdb-3e066d0bf9d9","integration":"WHATSAPP-BAILEYS","webhookWaBusiness":null,"accessTokenWaBusiness":"","status":"connecting"},"hash":"011","webhook":{},"websocket":{},"rabbitmq":{},"nats":{},"sqs":{},"settings":{"rejectCall":false,"msgCall":"","groupsIgnore":false,"alwaysOnline":false,"readMessages":false,"readStatus":false,"syncFullHistory":false,"wavoipToken":""},"qrcode":{"pairingCode":null,"code":"2@L1htxeiwG1TwfKAZRewPhna/961Jfu6o/1QbeDwFCnfWbJvKG18ZrUHFu+eamZPi//k67MtP4V8LCIt10Nfb9aFmvuxvRg37Xts=,FaTSzl4lxNq0GTjIcIOVYauAIB60LOQn8zAoq91FaGY=,TN0aQHE+no4oSmT5mxIFox5ssAto/sLzehAJdPJCzDE=,YemkHfI8nIsKfRZHRmp/tPNC702TAT8Gt/yHVQTXdFg=","base64":"data:image/png;base64,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","count":1}}
Setting webhook for instance: 011 URL: http://i0kwck044gc80s0osco8w0wg.72.62.50.238.sslip.io/api/webhooks/receive
✅ Webhook configured for 011 → http://i0kwck044gc80s0osco8w0wg.72.62.50.238.sslip.io/api/webhooks/receive
[getInstanceStatus] 011: {"instance":{"instanceName":"011","state":"open"}}
[getInstanceStatus] Ibrahim010: {"instance":{"instanceName":"Ibrahim010","state":"connecting"}}
[getInstanceStatus] 011: {"instance":{"instanceName":"011","state":"open"}}
[getInstanceStatus] Ibrahim010: {"instance":{"instanceName":"Ibrahim010","state":"connecting"}}
[getInstanceStatus] 011: {"instance":{"instanceName":"011","state":"open"}}
[getInstanceStatus] Ibrahim010: {"instance":{"instanceName":"Ibrahim010","state":"connecting"}}
Bucket valuewats-media policy set to public-read.
[Campaign] Created campaign dba834f5-b875-4de2-b4d9-252f31200058 with 2 contacts, instances: 1, templates: 1, status: PENDING
[Queue] Scheduling message 1/2 to 201030980487 via 011 (Template 1) with 12000ms delay
[Queue] Scheduling message 2/2 to 201098620547 via 011 (Template 1) with 21000ms delay
Processing message for 201030980487 via 011 (Media: Yes)
[sendMessage] Success (Attempt 1): {"key":{"remoteJid":"<REDACTED>","fromMe":true,"id":"3EB07F687BA29993B52BA3"},"pushName":"Você","status":"PENDING","message":{"imageMessage":{"interactiveAnnotations":[],"scanLengths":[],"annotations":[],"url":"https://mmg.whatsapp.net/o1/v/t24/f2/m234/AQPya7M8bdY8iyR2Xqrp5vd826n0L6gmNj3_7O6_ozGEBVjmQ9WGj05XZGzOtzV3tY3qSiML8NTbaAhOQ5VkkeszBE6hSbgk7KfGMwQAlA?ccb=9-4&oh=01_Q5Aa3wEtpUVFnPnVQaAeNvwFGVzC9OGidpDb6MQVnOG_K_BYFA&oe=69C97F7E&_nc_sid=e6ed6c&mms3=true","mimetype":"image/jpeg","caption":"Hello there, this is a test campaign for a new tool.","fileSha256":{"0":6,"1":196,"2":205,"3":243,"4":12,"5":36,"6":95,"7":152,"8":137,"9":118,"10":4,"11":246,"12":75,"13":117,"14":22,"15":144,"16":95,"17":224,"18":140,"19":130,"20":188,"21":151,"22":101,"23":83,"24":66,"25":113,"26":13,"27":197,"28":221,"29":149,"30":109,"31":123},"fileLength":{"low":262748,"high":0,"unsigned":true},"height":893,"width":1600,"mediaKey":{"0":146,"1":129,"2":170,"3":24,"4":28,"5":118,"6":144,"7":38,"8":29,"9":127,"10":222,"11":249,"12":187,"13":147,"14":132,"15":192,"16":225,"17":217,"18":218,"19":216,"20":75,"21":167,"22":218,"23":159,"24":87,"25":182,"26":61,"27":209,"28":13,"29":119,"30":17,"31":157},"fileEncSha256":{"0":84,"1":5,"2":171,"3":112,"4":53,"5":228,"6":69,"7":232,"8":27,"9":168,"10":32,"11":199,"12":249,"13":14,"14":203,"15":217,"16":132,"17":20,"18":155,"19":140,"20":98,"21":206,"22":6,"23":35,"24":180,"25":203,"26":137,"27":131,"28":73,"29":134,"30":161,"31":229},"directPath":"/o1/v/t24/f2/m234/AQPya7M8bdY8iyR2Xqrp5vd826n0L6gmNj3_7O6_ozGEBVjmQ9WGj05XZGzOtzV3tY3qSiML8NTbaAhOQ5VkkeszBE6hSbgk7KfGMwQAlA?ccb=9-4&oh=01_Q5Aa3wEtpUVFnPnVQaAeNvwFGVzC9OGidpDb6MQVnOG_K_BYFA&oe=69C97F7E&_nc_sid=e6ed6c","mediaKeyTimestamp":{"low":1772226285,"high":0,"unsigned":false},"jpegThumbnail":{"0":255,"1":216,"2":255,"3":219,"4":0,"5":67,"6":0,"7":16,"8":11,"9":12,"10":14,"11":12,"12":10,"13":16,"14":14,"15":13,"16":14,"17":18,"18":17,"19":16,"20":19,"21":24,"22":40,"23":26,"24":24,"25":22,"26":22,"27":24,"28":49,"29":35,"30":37,"31":29,"32":40,"33":58,"34":51,"35":61,"36":60,"37":57,"38":51,"39":56,"40":55,"41":64,"42":72,"43":92,"44":78,"45":64,"46":68,"47":87,"48":69,"49":55,"50":56,"51":80,"52":109,"53":81,"54":87,"55":95,"56":98,"57":103,"58":104,"59":103,"60":62,"61":77,"62":113,"63":121,"64":112,"65":100,"66":120,"67":92,"68":101,"69":103,"70":99,"71":255,"72":219,"73":0,"74":67,"75":1,"    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "0d6e7316-bf16-4d9d-bf78-a3865ba47df6",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "0d6e7316-bf16-4d9d-bf78-a3865ba47df6",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "0d6e7316-bf16-4d9d-bf78-a3865ba47df6",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "0d6e7316-bf16-4d9d-bf78-a3865ba47df6",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "0d6e7316-bf16-4d9d-bf78-a3865ba47df6",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "0d6e7316-bf16-4d9d-bf78-a3865ba47df6",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "0d6e7316-bf16-4d9d-bf78-a3865ba47df6",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
[ContactController] createContact: PrismaClientKnownRequestError: 
Invalid `prisma.contact.create()` invocation:


Unique constraint failed on the fields: (`tenant_id`,`phone_number`)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:7315)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async CrmService.createContact (/app/backend/src/services/crmService.js:61:21)
    at async createContact (/app/backend/src/controllers/contactController.js:40:21) {
  code: 'P2002',
  clientVersion: '5.22.0',
  meta: { modelName: 'Contact', target: [ 'tenant_id', 'phone_number' ] }
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "0d6e7316-bf16-4d9d-bf78-a3865ba47df6",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "0d6e7316-bf16-4d9d-bf78-a3865ba47df6",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/libr76":17,"77":18,"78":18,"79":24,"80":21,"81":24,"82":47,"83":26,"84":26,"85":47,"86":99,"87":66,"88":56,"89":66,"90":99,"91":99,"92":99,"93":99,"94":99,"95":99,"96":99,"97":99,"98":99,"99":99,"100":99,"101":99,"102":99,"103":99,"104":99,"105":99,"106":99,"107":99,"108":99,"109":99,"110":99,"111":99,"112":99,"113":99,"114":99,"115":99,"116":99,"117":99,"118":99,"119":99,"120":99,"121":99,"122":99,"123":99,"124":99,"125":99,"126":99,"127":99,"128":99,"129":99,"130":99,"131":99,"132":99,"133":99,"134":99,"135":99,"136":99,"137":99,"138":99,"139":99,"140":255,"141":192,"142":0,"143":17,"144":8,"145":0,"146":18,"147":0,"148":32,"149":3,"150":1,"151":34,"152":0,"153":2,"154":17,"155":1,"156":3,"157":17,"158":1,"159":255,"160":196,"161":0,"162":25,"163":0,"164":0,"165":2,"166":3,"167":1,"168":0,"169":0,"170":0,"171":0,"172":0,"173":0,"174":0,"175":0,"176":0,"177":0,"178":0,"179":0,"180":0,"181":2,"182":1,"183":4,"184":5,"185":6,"186":255,"187":196,"188":0,"189":43,"190":16,"191":0,"192":1,"193":4,"194":1,"195":3,"196":2,"197":2,"198":11,"199":0,"200":0,"201":0,"202":0,"203":0,"204":0,"205":0,"206":0,"207":1,"208":0,"209":2,"210":3,"211":17,"212":33,"213":4,"214":18,"215":19,"216":5,"217":20,"218":35,"219":49,"220":6,"221":34,"222":36,"223":50,"224":65,"225":81,"226":113,"227":114,"228":129,"229":209,"230":225,"231":255,"232":196,"233":0,"234":22,"235":1,"236":1,"237":1,"238":1,"239":0,"240":0,"241":0,"242":0,"243":0,"244":0,"245":0,"246":0,"247":0,"248":0,"249":0,"250":0,"251":0,"252":2,"253":0,"254":1,"255":255,"256":196,"257":0,"258":22,"259":17,"260":1,"261":1,"262":1,"263":0,"264":0,"265":0,"266":0,"267":0,"268":0,"269":0,"270":0,"271":0,"272":0,"273":0,"274":0,"275":0,"276":0,"277":1,"278":17,"279":255,"280":218,"281":0,"282":12,"283":3,"284":1,"285":0,"286":2,"287":17,"288":3,"289":17,"290":0,"291":63,"292":0,"293":231,"294":32,"295":211,"296":251,"297":47,"298":46,"299":255,"300":0,"301":81,"302":163,"303":35,"304":96,"305":253,"306":40,"307":15,"308":99,"309":134,"310":227,"311":64,"312":94,"313":112,"314":14,"315":21,"316":142,"317":102,"318":142,"319":157,"320":196,"321":215,"322":52,"323":52,"324":180,"325":18,"326":55,"327":58,"328":237,"329":83,"330":219,"331":109,"332":49,"333":180,"334":144,"335":49,"336":96,"337":59,"338":248,"339":134,"340":150,"341":55,"342":164,"343":232,"344":186,"345":65,"346":167,"347":50,"348":51,"349":168,"350":69,"351":38,"352":8,"353":1,"354":140,"355":25,"356":53,"357":228,"358":177,"359":101,"360":211,"361":55,"362":133,"363":210,"364":53,"365":179,"366":237,"367":2,"368":236,"369":180,"370":87,"371":231,"372":10,"373":233,"374":215,"375":128,"376":75,"377":160,"378":149,"379":204,"380":101,"381":121,"382":48,"383":213,"384":225,"385":55,"386":127,"387":3,"388":125,"389":28,"390":147,"391":74,"392":201,"393":53,"394":61,"395":212,"396":185,"397":147,"398":196,"399":240,"400":220,"401":47,"402":229,"403":244,"404":84,"405":138,"406":214,"407":52,"408":254,"409":236,"410":127,"411":106,"412":102,"413":1,"414":176,"415":99,"416":224,"417":132,"418":36,"419":38,"420":0,"421":3,"422":128,"423":157,"424":128,"425":27,"426":177,"427":120,"428":40,"429":66,"430":198,"431":199,"432":255,"433":217},"contextInfo":{"mentionedJid":[],"groupMentions":[],"ephemeralSettingTimestamp":{"low":1772053485,"high":0,"unsigned":false},"disappearingMode":{"initiator":0}}}},"contextInfo":{"mentionedJid":[],"groupMentions":[],"ephemeralSettingTimestamp":{"low":1772053485,"high":0,"unsigned":false},"disappearingMode":{"initiator":0}},"messageType":"imageMessage","messageTimestamp":1772226285,"instanceId":"b5bb651a-c0e2-425b-bcdb-3e066d0bf9d9","source":"web"}
Job 7816 completed!
Processing message for 201098620547 via 011 (Media: Yes)
[sendMessage] Success (Attempt 1): {"key":{"remoteJid":"<REDACTED>","fromMe":true,"id":"3EB0C4B70E6EE497D05726"},"pushName":"Você","status":"PENDING","message":{"imageMessage":{"interactiveAnnotations":[],"scanLengths":[],"annotations":[],"url":"https://mmg.whatsapp.net/o1/v/t24/f2/m269/AQNGC-j3XQkDIPwvd_d6ZclIPSZZ8KRFFbCyNhWpHwfx2LsvPo67afOsz4d90-xmCIl6tJMEtLaIlbc88LyjObPKN2uJ8jpgryGLPY6AwA?ccb=9-4&oh=01_Q5Aa3wFcaNo9-Ei2-CXMORgnh0TMhwawCaNCbVHxRU-qkVhUAw&oe=69C9928F&_nc_sid=e6ed6c&mms3=true","mimetype":"image/jpeg","caption":"Hello there, this is a test campaign for a new tool.","fileSha256":{"0":6,"1":196,"2":205,"3":243,"4":12,"5":36,"6":95,"7":152,"8":137,"9":118,"10":4,"11":246,"12":75,"13":117,"14":22,"15":144,"16":95,"17":224,"18":140,"19":130,"20":188,"21":151,"22":101,"23":83,"24":66,"25":113,"26":13,"27":197,"28":221,"29":149,"30":109,"31":123},"fileLength":{"low":262748,"high":0,"unsigned":true},"height":893,"width":1600,"mediaKey":{"0":0,"1":210,"2":177,"3":208,"4":191,"5":224,"6":69,"7":64,"8":198,"9":7,"10":108,"11":194,"12":124,"13":207,"14":12,"15":67,"16":3,"17":96,"18":135,"19":212,"20":195,"21":33,"22":162,"23":113,"24":220,"25":211,"26":223,"27":160,"28":49,"29":83,"30":39,"31":39},"fileEncSha256":{"0":111,"1":129,"2":18,"3":182,"4":232,"5":84,"6":47,"7":4,"8":92,"9":247,"10":47,"11":236,"12":234,"13":235,"14":137,"15":129,"16":174,"17":14,"18":21,"19":52,"20":251,"21":139,"22":8,"23":232,"24":88,"25":116,"26":82,"27":145,"28":189,"29":227,"30":43,"31":35},"directPath":"/o1/v/t24/f2/m269/AQNGC-j3XQkDIPwvd_d6ZclIPSZZ8KRFFbCyNhWpHwfx2LsvPo67afOsz4d90-xmCIl6tJMEtLaIlbc88LyjObPKN2uJ8jpgryGLPY6AwA?ccb=9-4&oh=01_Q5Aa3wFcaNo9-Ei2-CXMORgnh0TMhwawCaNCbVHxRU-qkVhUAw&oe=69C9928F&_nc_sid=e6ed6c","mediaKeyTimestamp":{"low":1772226305,"high":0,"unsigned":false},"jpegThumbnail":{"0":255,"1":216,"2":255,"3":219,"4":0,"5":67,"6":0,"7":16,"8":11,"9":12,"10":14,"11":12,"12":10,"13":16,"14":14,"15":13,"16":14,"17":18,"18":17,"19":16,"20":19,"21":24,"22":40,"23":26,"24":24,"25":22,"26":22,"27":24,"28":49,"29":35,"30":37,"31":29,"32":40,"33":58,"34":51,"35":61,"36":60,"37":57,"38":51,"39":56,"40":55,"41":64,"42":72,"43":92,"44":78,"45":64,"46":68,"47":87,"48":69,"49":55,"50":56,"51":80,"52":109,"53":81,"54":87,"55":95,"56":98,"57":103,"58":104,"59":103,"60":62,"61":77,"62":113,"63":121,"64":112,"65":100,"66":120,"67":92,"68":101,"69":103,"70":99,"71":255,"72":219,"73":0,"74":67,"75":1,"76":17,"77":18,"78":18,"79":24,"80":21,"81":24,"82":47,"83":26,"84":26,"85":47,"86":99,"87":66,"88":56,"89":66,"90":99,"91":99,"92":99,"93":99,"94":99,"95":99,"96":99,"97":99,"98":99,"99":99,"100":99,"101":99,"102":99,"103":99,"104":99,"105":99,"106":99,"107":99,"108":99,"109":99,"110":99,"111":99,"112":99,"113":99,"114":99,"115":99,"116":99,"117":99,"118":99,"119":99,"120":99,"121":99,"122":99,"123":99,"124":99,"125":99,"126":99,"127":99,"128":99,"129":99,"130":99,"131":99,"132":99,"133":99,"134":99,"135":99,"136":99,"137":99,"138":99,"139":99,"140":255,"141":192,"142":0,"143":17,"144":8,"145":0,"146":18,"147":0,"148":32,"149":3,"150":1,"151":34,"152":0,"153":2,"154":17,"155":1,"156":3,"157":17,"158":1,"159":255,"160":196,"161":0,"162":25,"163":0,"164":0,"165":2,"166":3,"167":1,"168":0,"169":0,"170":0,"171":0,"172":0,"173":0,"174":0,"175":0,"176":0,"177":0,"178":0,"179":0,"180":0,"181":2,"182":1,"183":4,"184":5,"185":6,"186":255,"187":196,"188":0,"189":43,"190":16,"191":0,"192":1,"193":4,"194":1,"195":3,"196":2,"197":2,"198":11,"199":0,"200":0,"201":0,"202":0,"203":0,"204":0,"205":0,"206":0,"207":1,"208":0,"209":2,"210":3,"211":17,"212":33,"213":4,"214":18,"215":19,"216":5,"217":20,"218":35,"219":49,"220":6,"221":34,"222":36,"223":50,"224":65,"225":81,"226":113,"227":114,"228":129,"229":209,"230":225,"231":255,"232":196,"233":0,"234":22,"235":1,"236":1,"237":1,"238":1,"239":0,"240":0,"241":0,"242":0,"243":0,"244":0,"245":0,"246":0,"247":0,"248":0,"249":0,"250":0,"251":0,"252":2,"253":0,"254":1,"255":255,"256":196,"257":0,"258":22,"259":17,"260":1,"261":1,"262":1,"263":0,"264":0,"265":0,"266":0,"267":0,"268":0,"269":0,"270":0,"271":0,"272":0,"273":0,"274":0,"275":0,"276":0,"277":1,"278":17,"279":255,"280":218,"281":0,"282":12,"283":3,"284":1,"285":0,"286":2,"287":17,"288":3,"289":17,"290":0,"291":63,"292":0,"293":231,"294":32,"295":211,"296":251,"297":47,"298":46,"299":255,"300":0,"301":81,"302":163,"303":35,"304":96,"305":253,"306":40,"307":15,"308":99,"309":134,"310":227,"311":64,"312":94,"313":112,"314":14,"315":21,"316":142,"317":102,"318":142,"319":157,"320":196,"321":215,"322":52,"323":52,"324":180,"325":18,"326":55,"327":58,"328":237,"329":83,"330":219,"331":109,"332":49,"333":180,"334":144,"335":49,"336":96,"337":59,"338":248,"339":134,"340":150,"341":55,"342":164,"343":232,"344":186,"345":65,"346":167,"347":50,"348":51,"349":168,"350":69,"351":38,"352":8,"353":1,"354":140,"355":25,"356":53,"357":228,"358":177,"359":101,"360":211,"361":55,"362":133,"363":210,"364":53,"365":179,"366":237,"367":2,"368":236,"369":180,"370":87,"371":231,"372":10,"373":233,"374":215,"375":128,"376":75,"377":160,"378":149,"379":204,"380":101,"381":121,"382":48,"383":213,"384":225,"385":55,"386":127,"387":3,"388":125,"389":28,"390":147,"391":74,"392":201,"393":53,"394":61,"395":212,"396":185,"397":147,"398":196,"399":240,"400":220,"401":47,"402":229,"403":244,"404":84,"405":138,"406":214,"407":52,"408":254,"409":236,"410":127,"411":106,"412":102,"413":1,"414":176,"415":99,"416":224,"417":132,"418":36,"419":38,"420":0,"421":3,"422":128,"423":157,"424":128,"425":27,"426":177,"427":120,"428":40,"429":66,"430":198,"431":199,"432":255,"433":217},"contextInfo":{"mentionedJid":[],"groupMentions":[],"ephemeralSettingTimestamp":{"low":1772053505,"high":0,"unsigned":false},"disappearingMode":{"initiator":0}}}},"contextInfo":{"mentionedJid":[],"groupMentions":[],"ephemeralSettingTimestamp":{"low":1772053505,"high":0,"unsigned":false},"disappearingMode":{"initiator":0}},"messageType":"imageMessage","messageTimestamp":1772226305,"instanceId":"b5bb651a-c0e2-425b-bcdb-3e066d0bf9d9","source":"web"}
Job 7817 completed!
Campaign dba834f5-b875-4de2-b4d9-252f31200058 completed! Sent: 2, Failed: 0
[Socket] New client connected: x3ca8sNVUUPfa3wqAAAF
[Socket] Client x3ca8sNVUUPfa3wqAAAF joined campaign_dba834f5-b875-4de2-b4d9-252f31200058
[Socket] Client disconnected: x3ca8sNVUUPfa3wqAAAF
[getInstanceStatus] 011: {"instance":{"instanceName":"011","state":"open"}}
[getInstanceStatus] Ibrahim010: {"instance":{"instanceName":"Ibrahim010","state":"connecting"}}
[getInstanceStatus] 011: {"instance":{"instanceName":"011","state":"open"}}
[getInstanceStatus] Ibrahim010: {"instance":{"instanceName":"Ibrahim010","state":"connecting"}}
ary.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Error: Error: Error: File type not allowed!
    at fileFilter (/app/backend/src/middleware/upload.js:31:8)
    at wrappedFileFilter (/app/backend/node_modules/multer/index.js:44:7)
    at Multipart.<anonymous> (/app/backend/node_modules/multer/lib/make-middleware.js:132:7)
    at Multipart.emit (node:events:518:28)
    at HeaderParser.cb (/app/backend/node_modules/busboy/lib/types/multipart.js:358:14)
    at HeaderParser.push (/app/backend/node_modules/busboy/lib/types/multipart.js:162:20)
    at SBMH.ssCb [as _cb] (/app/backend/node_modules/busboy/lib/types/multipart.js:394:37)
    at feed (/app/backend/node_modules/streamsearch/lib/sbmh.js:248:10)
    at SBMH.push (/app/backend/node_modules/streamsearch/lib/sbmh.js:104:16)
    at Multipart._write (/app/backend/node_modules/busboy/lib/types/multipart.js:567:19) {
  storageErrors: []
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "0d6e7316-bf16-4d9d-bf78-a3865ba47df6",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "9de65afd-c8e8-4bef-98c6-86aea1b4e110",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
[getInstanceStatus] 7: {"instance":{"instanceName":"7","state":"close"}}
Could not sync status for meky: Failed to get instance status
Could not sync status for 515: Failed to get instance status
Could not sync status for ي: Failed to get instance status
[getInstanceStatus] 7: {"instance":{"instanceName":"7","state":"close"}}
[getInstanceStatus] 7: {"instance":{"instanceName":"7","state":"close"}}
Could not sync status for meky: Failed to get instance status
Could not sync status for 515: Failed to get instance status
Could not sync status for ي: Failed to get instance status
[getInstanceStatus] 7: {"instance":{"instanceName":"7","state":"close"}}
[getInstanceStatus] 7: {"instance":{"instanceName":"7","state":"close"}}
Could not sync status for meky: Failed to get instance status
Could not sync status for 515: Failed to get instance status
Could not sync status for ي: Failed to get instance status
Fetching QR code for 7...
[getInstanceStatus] 7: {"instance":{"instanceName":"7","state":"open"}}
Could not sync status for meky: Failed to get instance status
Could not sync status for ي: Failed to get instance status
Could not sync status for 515: Failed to get instance status
[getInstanceStatus] 7: {"instance":{"instanceName":"7","state":"open"}}
Could not sync status for meky: Failed to get instance status
Could not sync status for ي: Failed to get instance status
Could not sync status for 515: Failed to get instance status
[getInstanceStatus] 7: {"instance":{"instanceName":"7","state":"open"}}
Could not sync status for meky: Failed to get instance status
Could not sync status for 515: Failed to get instance status
Could not sync status for ي: Failed to get instance status
[getInstanceStatus] 7: {"instance":{"instanceName":"7","state":"open"}}
Could not sync status for meky: Failed to get instance status
Could not sync status for 515: Failed to get instance status
Could not sync status for ي: Failed to get instance status
[getInstanceStatus] Ibrahim010: {"instance":{"instanceName":"Ibrahim010","state":"connecting"}}
[getInstanceStatus] 011: {"instance":{"instanceName":"011","state":"open"}}
[getInstanceStatus] 011: {"instance":{"instanceName":"011","state":"open"}}
[getInstanceStatus] Ibrahim010: {"instance":{"instanceName":"Ibrahim010","state":"connecting"}}
[getInstanceStatus] Ibrahim010: {"instance":{"instanceName":"Ibrahim010","state":"close"}}
[getInstanceStatus] 011: {"instance":{"instanceName":"011","state":"open"}}
[getInstanceStatus] 011: {"instance":{"instanceName":"011","state":"open"}}
[getInstanceStatus] Ibrahim010: {"instance":{"instanceName":"Ibrahim010","state":"close"}}
[getInstanceStatus] 011: {"instance":{"instanceName":"011","state":"open"}}
[getInstanceStatus] Ibrahim010: {"instance":{"instanceName":"Ibrahim010","state":"close"}}
[getInstanceStatus] 011: {"instance":{"instanceName":"011","state":"open"}}
[getInstanceStatus] Ibrahim010: {"instance":{"instanceName":"Ibrahim010","state":"close"}}
[getInstanceStatus] 011: {"instance":{"instanceName":"011","state":"open"}}
[getInstanceStatus] Ibrahim010: {"instance":{"instanceName":"Ibrahim010","state":"close"}}
[getInstanceStatus] 011: {"instance":{"instanceName":"011","state":"open"}}
[getInstanceStatus] Ibrahim010: {"instance":{"instanceName":"Ibrahim010","state":"close"}}
OTP sent to <REDACTED>
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "9de65afd-c8e8-4bef-98c6-86aea1b4e110",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Get status error: {
  status: 404,
  error: 'Not Found',
  response: { message: [ 'The "meky" instance does not exist' ] }
}
Get status error: {
  status: 404,
  error: 'Not Found',
  response: { message: [ 'The "515" instance does not exist' ] }
}
Get status error: {
  status: 404,
  error: 'Not Found',
  response: { message: [ 'The "ي" instance does not exist' ] }
}
Delete instance error: {
  status: 404,
  error: 'Not Found',
  response: { message: [ 'The "meky" instance does not exist' ] }
}
Delete instance error: Error: Failed to delete instance
    at EvolutionAPI.deleteInstance (/app/backend/src/services/evolutionApi.js:215:13)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async /app/backend/src/routes/instances.js:175:5
Get status error: {
  status: 404,
  error: 'Not Found',
  response: { message: [ 'The "meky" instance does not exist' ] }
}
Get status error: {
  status: 404,
  error: 'Not Found',
  response: { message: [ 'The "515" instance does not exist' ] }
}
Get status error: {
  status: 404,
  error: 'Not Found',
  response: { message: [ 'The "ي" instance does not exist' ] }
}
Get status error: {
  status: 404,
  error: 'Not Found',
  response: { message: [ 'The "meky" instance does not exist' ] }
}
Get status error: {
  status: 404,
  error: 'Not Found',
  response: { message: [ 'The "515" instance does not exist' ] }
}
Get status error: {
  status: 404,
  error: 'Not Found',
  response: { message: [ 'The "ي" instance does not exist' ] }
}
Get status error: {
  status: 404,
  error: 'Not Found',
  response: { message: [ 'The "meky" instance does not exist' ] }
}
Get status error: {
  status: 404,
  error: 'Not Found',
  response: { message: [ 'The "ي" instance does not exist' ] }
}
Get status error: {
  status: 404,
  error: 'Not Found',
  response: { message: [ 'The "515" instance does not exist' ] }
}
Get status error: {
  status: 404,
  error: 'Not Found',
  response: { message: [ 'The "meky" instance does not exist' ] }
}
Get status error: {
  status: 404,
  error: 'Not Found',
  response: { message: [ 'The "ي" instance does not exist' ] }
}
Get status error: {
  status: 404,
  error: 'Not Found',
  response: { message: [ 'The "515" instance does not exist' ] }
}
Get status error: {
  status: 404,
  error: 'Not Found',
  response: { message: [ 'The "meky" instance does not exist' ] }
}
Get status error: {
  status: 404,
  error: 'Not Found',
  response: { message: [ 'The "515" instance does not exist' ] }
}
Get status error: {
  status: 404,
  error: 'Not Found',
  response: { message: [ 'The "ي" instance does not exist' ] }
}
Get status error: {
  status: 404,
  error: 'Not Found',
  response: { message: [ 'The "meky" instance does not exist' ] }
}
Get status error: {
  status: 404,
  error: 'Not Found',
  response: { message: [ 'The "515" instance does not exist' ] }
}
Get status error: {
  status: 404,
  error: 'Not Found',
  response: { message: [ 'The "ي" instance does not exist' ] }
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "0d6e7316-bf16-4d9d-bf78-a3865ba47df6",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "0d6e7316-bf16-4d9d-bf78-a3865ba47df6",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "0d6e7316-bf16-4d9d-bf78-a3865ba47df6",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "0d6e7316-bf16-4d9d-bf78-a3865ba47df6",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
Creating instance: Menna at http://api-sgwcco4kw80sckwg4c08sgk4:8080
Instance created at Evolution API: {"instance":{"instanceName":"Menna","instanceId":"4ea7865a-c109-4209-b338-af4bb3154730","integration":"WHATSAPP-BAILEYS","webhookWaBusiness":null,"accessTokenWaBusiness":"","status":"connecting"},"hash":"Menna","webhook":{},"websocket":{},"rabbitmq":{},"nats":{},"sqs":{},"settings":{"rejectCall":false,"msgCall":"","groupsIgnore":false,"alwaysOnline":false,"readMessages":false,"readStatus":false,"syncFullHistory":false,"wavoipToken":""},"qrcode":{"pairingCode":null,"code":"2@CrnpT44+dSADO8wnzKsGpFcTVArPyd1hYlpeFXPfWrgkAVsHaHxegPaWRic31UDm/WRma8GRrlfUZ+vbjOBozHMcL/tFr3vE2fk=,W1hCmtGkHtDuWJAtnG0rkaGJ6McobUVEzzGU87aKtA8=,ir9UzwwEWb2JYEVnC57kjsOOv3wUhoZw5/5z5e9tP2A=,1iwCT/LKB42Yp9W0uSEZXYepkufut5L+NE8lVFELwjk=","base64":"data:image/png;base64,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","count":1}}
Setting webhook for instance: Menna URL: http://i0kwck044gc80s0osco8w0wg.72.62.50.238.sslip.io/api/webhooks/receive
✅ Webhook configured for Menna → http://i0kwck044gc80s0osco8w0wg.72.62.50.238.sslip.io/api/webhooks/receive
[getInstanceStatus] Menna: {"instance":{"instanceName":"Menna","state":"connecting"}}
[getInstanceStatus] Menna: {"instance":{"instanceName":"Menna","state":"connecting"}}
[getInstanceStatus] Menna: {"instance":{"instanceName":"Menna","state":"connecting"}}
[getInstanceStatus] Menna: {"instance":{"instanceName":"Menna","state":"connecting"}}
[getInstanceStatus] Menna: {"instance":{"instanceName":"Menna","state":"connecting"}}
[getInstanceStatus] Menna: {"instance":{"instanceName":"Menna","state":"connecting"}}
[getInstanceStatus] Menna: {"instance":{"instanceName":"Menna","state":"connecting"}}
[getInstanceStatus] Menna: {"instance":{"instanceName":"Menna","state":"connecting"}}
[getInstanceStatus] Menna: {"instance":{"instanceName":"Menna","state":"connecting"}}
[getInstanceStatus] 7: {"instance":{"instanceName":"7","state":"open"}}
Could not sync status for meky: Failed to get instance status
Could not sync status for ي: Failed to get instance status
Could not sync status for 515: Failed to get instance status
[getInstanceStatus] 7: {"instance":{"instanceName":"7","state":"open"}}
Could not sync status for meky: Failed to get instance status
Could not sync status for ي: Failed to get instance status
Could not sync status for 515: Failed to get instance status
[Campaign] Created campaign d4e0e41f-54dc-4f8b-bfb7-d77f7bf73ffc with 4 contacts, instances: 2, templates: 1, status: PENDING
[Queue] Scheduling message 1/4 to 201098620547 via meky (Template 1) with 2000ms delay
[Queue] Scheduling message 2/4 to 201098620547 via 7 (Template 1) with 13000ms delay
[Queue] Scheduling message 3/4 to 201098620547 via meky (Template 1) with 26000ms delay
[Queue] Scheduling message 4/4 to 201098620547 via 7 (Template 1) with 31000ms delay
Processing message for 201098620547 via meky (Media: No)
Processing message for 201098620547 via meky (Media: No)
[Socket] New client connected: fdiwAfkfF8z20QUgAAAH
[Socket] Client fdiwAfkfF8z20QUgAAAH joined campaign_d4e0e41f-54dc-4f8b-bfb7-d77f7bf73ffc
Processing message for 201098620547 via meky (Media: No)
[Socket] Client disconnected: fdiwAfkfF8z20QUgAAAH
[Socket] New client connected: DK3EpAMW6VJBH0zlAAAJ
[Socket] Client DK3EpAMW6VJBH0zlAAAJ joined campaign_d4e0e41f-54dc-4f8b-bfb7-d77f7bf73ffc
Processing message for 201098620547 via 7 (Media: No)
[sendMessage] Success (Attempt 1): {"key":{"remoteJid":"<REDACTED>","fromMe":true,"id":"3EB0393708E92E85AA21A1"},"pushName":"Você","status":"PENDING","message":{"conversation":"asd"},"contextInfo":{"mentionedJid":[],"groupMentions":[],"ephemeralSettingTimestamp":{"low":1772186482,"high":0,"unsigned":false},"disappearingMode":{"initiator":0}},"messageType":"conversation","messageTimestamp":1772359282,"instanceId":"cb8cc9ca-7adb-4072-9242-8a197117e218","source":"web"}
Job 7819 completed!
Campaign d4e0e41f-54dc-4f8b-bfb7-d77f7bf73ffc completed! Sent: 1, Failed: 3
[Socket] Client disconnected: DK3EpAMW6VJBH0zlAAAJ
[Socket] New client connected: LV81aICYpEa-TDIXAAAL
[Socket] Client LV81aICYpEa-TDIXAAAL joined campaign_d4e0e41f-54dc-4f8b-bfb7-d77f7bf73ffc
[Socket] Client disconnected: LV81aICYpEa-TDIXAAAL
[getInstanceStatus] 7: {"instance":{"instanceName":"7","state":"open"}}
Could not sync status for meky: Failed to get instance status
Could not sync status for 515: Failed to get instance status
Could not sync status for ي: Failed to get instance status
Processing message for 201098620547 via meky (Media: No)
Processing message for 201098620547 via meky (Media: No)
Processing message for 201098620547 via 7 (Media: No)
[sendMessage] Success (Attempt 1): {"key":{"remoteJid":"<REDACTED>","fromMe":true,"id":"3EB05F9A908B5B9A590BB1"},"pushName":"Você","status":"PENDING","message":{"conversation":"asd"},"contextInfo":{"mentionedJid":[],"groupMentions":[],"ephemeralSettingTimestamp":{"low":1772186500,"high":0,"unsigned":false},"disappearingMode":{"initiator":0}},"messageType":"conversation","messageTimestamp":1772359300,"instanceId":"cb8cc9ca-7adb-4072-9242-8a197117e218","source":"web"}
Job 7821 completed!
Processing message for 201098620547 via meky (Media: No)
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "f10c2ecc-c5ff-4a38-a233-7e6742b779b1",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Dashboard Stats Error: PrismaClientValidationError: 
Invalid `prisma.chatMessage.count()` invocation:

{
  select: {
    _count: {
      select: {
        _all: true
      }
    }
  },
  where: {
    tenantId: "9de65afd-c8e8-4bef-98c6-86aea1b4e110",
    ~~~~~~~~
    direction: "outgoing",
?   AND?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   OR?: ChatMessageWhereInput[],
?   NOT?: ChatMessageWhereInput | ChatMessageWhereInput[],
?   id?: StringFilter | String,
?   conversationId?: StringFilter | String,
?   instanceId?: StringNullableFilter | String | Null,
?   senderNumber?: StringFilter | String,
?   recipientNumber?: StringFilter | String,
?   messageType?: StringFilter | String,
?   content?: StringNullableFilter | String | Null,
?   mediaUrl?: StringNullableFilter | String | Null,
?   wamid?: StringNullableFilter | String | Null,
?   status?: StringFilter | String,
?   createdAt?: DateTimeFilter | DateTime,
?   conversation?: ConversationRelationFilter | ConversationWhereInput,
?   instance?: InstanceNullableRelationFilter | InstanceWhereInput | Null
  }
}

Unknown argument `tenantId`. Available options are marked with ?.
    at wn (/app/backend/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/app/backend/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/app/backend/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async getStats (/app/backend/src/controllers/dashboardController.js:85:24) {
  clientVersion: '5.22.0'
}
Get status error: {
  status: 404,
  error: 'Not Found',
  response: { message: [ 'The "meky" instance does not exist' ] }
}
Get status error: {
  status: 404,
  error: 'Not Found',
  response: { message: [ 'The "ي" instance does not exist' ] }
}
Get status error: {
  status: 404,
  error: 'Not Found',
  response: { message: [ 'The "515" instance does not exist' ] }
}
Get status error: {
  status: 404,
  error: 'Not Found',
  response: { message: [ 'The "meky" instance does not exist' ] }
}
Get status error: {
  status: 404,
  error: 'Not Found',
  response: { message: [ 'The "ي" instance does not exist' ] }
}
Get status error: {
  status: 404,
  error: 'Not Found',
  response: { message: [ 'The "515" instance does not exist' ] }
}
[sendMessage] Error (Attempt 1/2) sending to 201098620547 via meky: Request failed with status code 404
[sendMessage] Error (Attempt 2/2) sending to 201098620547 via meky: Request failed with status code 404
Failed to send message to 201098620547: Failed to send message: Request failed with status code 404
Job 7818 failed: Failed to send message: Request failed with status code 404
[sendMessage] Error (Attempt 1/2) sending to 201098620547 via meky: Request failed with status code 404
[sendMessage] Error (Attempt 2/2) sending to 201098620547 via meky: Request failed with status code 404
Failed to send message to 201098620547: Failed to send message: Request failed with status code 404
Job 7818 failed: Failed to send message: Request failed with status code 404
[sendMessage] Error (Attempt 1/2) sending to 201098620547 via meky: Request failed with status code 404
[sendMessage] Error (Attempt 2/2) sending to 201098620547 via meky: Request failed with status code 404
Failed to send message to 201098620547: Failed to send message: Request failed with status code 404
Job 7818 failed: Failed to send message: Request failed with status code 404
Get status error: {
  status: 404,
  error: 'Not Found',
  response: { message: [ 'The "meky" instance does not exist' ] }
}
Get status error: {
  status: 404,
  error: 'Not Found',
  response: { message: [ 'The "515" instance does not exist' ] }
}
Get status error: {
  status: 404,
  error: 'Not Found',
  response: { message: [ 'The "ي" instance does not exist' ] }
}
[sendMessage] Error (Attempt 1/2) sending to 201098620547 via meky: Request failed with status code 404
[sendMessage] Error (Attempt 2/2) sending to 201098620547 via meky: Request failed with status code 404
Failed to send message to 201098620547: Failed to send message: Request failed with status code 404
Job 7820 failed: Failed to send message: Request failed with status code 404
[sendMessage] Error (Attempt 1/2) sending to 201098620547 via meky: Request failed with status code 404
[sendMessage] Error (Attempt 2/2) sending to 201098620547 via meky: Request failed with status code 404
Failed to send message to 201098620547: Failed to send message: Request failed with status code 404
Job 7820 failed: Failed to send message: Request failed with status code 404
[sendMessage] Error (Attempt 1/2) sending to 201098620547 via meky: Request failed with status code 404
[sendMessage] Error (Attempt 2/2) sending to 201098620547 via meky: Request failed with status code 404
Failed to send message to 201098620547: Failed to send message: Request failed with status code 404
Job 7820 failed: Failed to send message: Request failed with status code 404
