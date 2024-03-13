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

export const createGame = (waitingPlayers: Player[], data: number) => {
	// create game and connect waiting players directly
	return prisma.game.create({
		data: {
			players: {
				connect: waitingPlayers.map((player) => ({ id: player.id })),
			},
			rounds: data,
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

/**
 * Update game roundsPlayed
 * @params playerId
 * @params roundsPlayed
 */
export const updateGameRounds = async (playerId: string, data: number) => {
	return await prisma.game.update({
		where: {
			id: playerId,
		},
		data: {
			rounds: data,
		},
	});
};

/**
 * Update game clicks
 * @params playerId
 * @params clicks
 */
export const updateClicks = async (playerId: string, data: number) => {
	return await prisma.game.update({
		where: {
			id: playerId,
		},
		data: {
			clicks: data,
		},
	});
};
