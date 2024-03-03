/**
 * Game Service
 */

import { Game, Player } from "@shared/types/Models";
import prisma from "../prisma";

export const getGames = async () => {
	// query database for list of games
	return await prisma.game.findMany({
		orderBy: {
			id: "asc",
		},
	});
};

/**
 * Get a single game
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

/**
 * Create a new game (room)
 */

export const createGame = () => {
	return prisma.game.create({});
};

/**
 * Add players to game
 */

// Add this function to your services or wherever you keep your Prisma operations
export const addPlayersToGame = async (gameId: string, players: Player[]) => {
	return prisma.game.update({
		where: {
			id: gameId,
		},
		data: {
			players: {
				connect: players.map((player) => ({ id: player.id })),
			},
		},
		include: {
			players: true,
		},
	});
};
