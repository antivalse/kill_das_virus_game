/**
 * User Service
 */
import { Player } from "@shared/types/Models";
import prisma from "../prisma";

/**
 * Get a single user from database
 *
 * @param player User ID (in our app it's the socket's id)
 */
export const getUser = (playerId: string) => {
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
export const createPlayer = (data: Player) => {
	return prisma.player.create({
		data,
	});
};
