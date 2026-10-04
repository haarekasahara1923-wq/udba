import { prisma } from './src/lib/prisma'

async function check() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  })
  console.log("Recent users:")
  for (const u of users) {
    console.log(`- ${u.name} | Role: ${u.role} | Email: ${u.email} | Phone: ${u.phone} | Password: ${u.plainPassword}`)
  }
}
check().catch(console.error).finally(() => prisma.$disconnect())
