require('dotenv').config(); // Load env vars first
const evolutionApi = require('../src/services/evolutionApi'); // Fix relative path
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const setup = async () => {
    const args = process.argv.slice(2);
    const publicUrl = args[0];

    if (!publicUrl) {
        console.error('Please provide the public URL as an argument.');
        console.log('Usage: node scripts/setupWebhook.js https://your-ngrok-url.ngrok-free.app');
        process.exit(1);
    }

    console.log(`Configuring webhooks for instances to point to: ${publicUrl}/api/webhooks/evolution`);

    try {
        // Fetch ALL instances regardless of status
        const instances = await prisma.instance.findMany();

        if (instances.length === 0) {
            console.log('❌ No instances found in database.');
            console.log('👉 Please go to your Dashboard and connect a new instance first.');
            return;
        }

        console.log(`Found ${instances.length} instances. Checking statuses...`);

        for (const instance of instances) {
            console.log(`\nChecking instance: ${instance.instanceName} (current DB status: ${instance.status})...`);
            
            // 1. Sync Status with Evolution API
            try {
                const statusData = await evolutionApi.getInstanceStatus(instance.instanceName);
                const newStatus = statusData.state === 'open' ? 'connected' : 'disconnected';
                
                if (instance.status !== newStatus) {
                    console.log(`🔄 Updating status from ${instance.status} to ${newStatus}`);
                    await prisma.instance.update({
                        where: { id: instance.id },
                        data: { status: newStatus }
                    });
                }

                // 2. Set Webhook if connected
                if (newStatus === 'connected') {
                    console.log(`📡 Setting webhook...`);
                    const result = await evolutionApi.setWebhook(
                        instance.instanceName,
                        `${publicUrl}/api/webhooks/evolution`,
                        true
                    );
                    if (result) {
                        console.log(`✅ Webhook set successfully for ${instance.instanceName}`);
                    } else {
                        console.log(`⚠️ Failed to set webhook for ${instance.instanceName}`);
                    }
                } else {
                    console.log(`⚠️ Skipping webhook setup: Instance is not connected (State: ${statusData.state})`);
                }

            } catch (err) {
                console.error(`❌ Error processing ${instance.instanceName}:`, err.message);
            }
        }
    } catch (error) {
        console.error('Script error:', error);
    } finally {
        await prisma.$disconnect();
    }
};

setup();
