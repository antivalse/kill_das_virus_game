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

// Add player to waiting room
export const addPlayerToWaitingRoom = async (
	waitingRoomId: string,
	player: Player
) => {
	return prisma.waitingRoom.update({
		where: {
			id: waitingRoomId,
		},
		data: {
			players: {
				connect: [{ id: player.id }],
			},
		},
		include: {
			players: true,
		},
	});
};

/**
 * Remove all players from waiting room
 */

export const deletePlayersFromWaitingRoom = async (
	waitingRoomId: string,
	players: Player[]
) => {
	return prisma.waitingRoom.update({
		where: {
			id: waitingRoomId,
		},
		data: {
			players: {
				disconnect: players.map((player) => ({ id: player.id })),
			},
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
