import { prisma } from './src/lib/prisma';
async function main() {
    const tenants = await prisma.tenant.findMany({ take: 5 });
    console.log("Tenants:", tenants.map(t => ({ id: t.id, slug: t.slug, name: t.name })));
    const users = await prisma.user.findMany({ take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, email: true, role: true, tenantId: true }});
    console.log("Latest Users:", users);
}
main();
