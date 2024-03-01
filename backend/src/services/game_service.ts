/**
 * Game Service
 */

import prisma from "../prisma";

export const getGames = async () => {
	// query database for list of rooms
	return await prisma.game.findMany({
		orderBy: {
			id: "asc",
		},
	});
};

/**
 * Get a single room
 *
 * @param gameId Game ID
 */
export const getGame = (gameId: string) => {
	return prisma.game.findUnique({
		where: {
			id: gameId,
		},
	});
};
