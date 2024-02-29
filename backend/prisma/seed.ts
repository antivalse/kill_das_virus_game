import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
	// Here be all your seeds 🌱

	await prisma.player.create({
		data: {
			username: "Mattea",
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
