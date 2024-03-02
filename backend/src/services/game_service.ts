/**
 * Game Service
 */

import { Game } from "@shared/types/Models";
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
