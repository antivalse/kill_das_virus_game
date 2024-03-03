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
 * @param gameId id of game
 * @param players array of players to be added to game
 */

// Add players to game
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

/**
 * Get a single game with players to see if players were added
 * @param gameId
 * @returns
 */

export const getGameWithPlayers = async (gameId: string) => {
	return prisma.game.findUnique({
		where: {
			id: gameId,
		},
		include: {
			players: true,
		},
	});
};
