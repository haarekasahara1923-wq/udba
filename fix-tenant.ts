import { prisma } from './src/lib/prisma';
async function run() {
    const users = await prisma.user.findMany({where:{role:'SUPER_ADMIN'}});
    for (const u of users) {
        const t = await prisma.tenant.findUnique({where:{id:u.tenantId}});
        if (!t) {
            console.log(`Creating tenant ${u.tenantId} for SUPER_ADMIN ${u.email}`);
            await prisma.tenant.create({
                data: {
                    id: u.tenantId,
                    name: 'Super Admin Tenant',
                    domain: 'system',
                    status: 'ACTIVE'
                }
            });
        }
    }
}
run().catch(console.error).finally(()=>prisma.$disconnect());
