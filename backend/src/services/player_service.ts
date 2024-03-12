/**
 * Player Service
 */
import { Player } from "@shared/types/Models";
import prisma from "../prisma";

/**
 * Get a single user from database
 *
 * @param player User ID (in our app it's the socket's id)
 */
export const getPlayer = (playerId: string) => {
	return prisma.player.findUnique({
		where: {
			id: playerId,
		},
	});
};

/**
 * Create a new player in database
 *
 * @param data User information
 * @returns
 */
export const createPlayer = async (data: Player) => {
	return prisma.player.create({
		data,
	});
};

/**
 * Delete a single player in database
 * @param playerID Player ID === socket.id
 */

export const deletePlayer = (playerId: string) => {
	return prisma.player.delete({
		where: {
			id: playerId,
		},
	});
};

/**
 * Update player clickTime
 * @params playerId
 * @params clicktime
 */

export const updatePlayerScore = async (playerId: string, data: number) => {
	return await prisma.player.update({
		where: {
			id: playerId,
		},
		data: {
			clickTime: data,
			clickTimes: { push: data },
		},
	});
};
