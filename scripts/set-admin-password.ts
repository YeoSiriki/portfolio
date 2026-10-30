// Définit (ou réinitialise) le mot de passe de l'administrateur.
// Usage : npm run admin:password -- "nouveau mot de passe"
// Sans argument, un mot de passe est généré et affiché une seule fois.
import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'asc' } });
  if (!admin) throw new Error('Aucun compte administrateur : lancez d’abord « npm run db:seed ».');

  const provided = process.argv[2];
  if (provided !== undefined && provided.length < 12)
    throw new Error('Le mot de passe doit compter au moins 12 caractères.');
  const password = provided ?? randomBytes(12).toString('base64url');

  await prisma.user.update({ where: { id: admin.id }, data: { passwordHash: await bcrypt.hash(password, 12) } });
  console.log(`Mot de passe mis à jour pour ${admin.email}.`);
  if (!provided) console.log(`Mot de passe généré (à noter, il ne sera plus affiché) : ${password}`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
