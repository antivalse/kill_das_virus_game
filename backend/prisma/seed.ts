import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
	// Here be all your seeds 🌱
	const player = await prisma.player.upsert({
		where: { id: '1' }, // Ange det identifierande värdet för spelaren här
		update: {}, // Tomt update-block
		create: {
		  username: 'Josefine',
		},
	  });
	}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});
