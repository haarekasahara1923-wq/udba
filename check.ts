import { prisma } from './src/lib/prisma';
async function main() {
    const users = await prisma.user.findMany({ take: 5, orderBy: { createdAt: 'desc' } });
    console.log(users);
}
main();
