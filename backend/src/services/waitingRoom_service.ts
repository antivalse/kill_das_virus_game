import { Player } from "@shared/types/Models";
import prisma from "../prisma";

/**
 * get waiting room from database
 */

export const getWaitingRoom = (waitingRoomId: string) => {
	return prisma.waitingRoom.findUnique({
		where: {
			id: waitingRoomId,
		},
	});
};

/**
 * Add players to game
 * @param gameId id of game
 * @param players array of players to be added to game
 */

// Add players to game
export const addPlayersToWaitingRoom = async (
	waitingRoomId: string,
	players: Player[]
) => {
	return prisma.waitingRoom.update({
		where: {
			id: waitingRoomId,
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

// /**
//  * Get waitingroom with players to see if players were added
//  * @param waitingRoomId
//  * @returns
//  */

// export const getWaitingRoomWithPlayers = async (waitingRoomId: string) => {
// 	return prisma.waitingRoom.findUnique({
// 		where: {
// 			id: waitingRoomId,
// 		},
// 		include: {
// 			players: true,
// 		},
// 	});
// };
