/**
 * Result Service
 */

import prisma from "../prisma";
import { ResultData } from "@shared/types/SocketTypes";

export const getResults = async () => {
	// query database for list of results
	return await prisma.result.findMany({
		orderBy: {
			id: "asc",
		},
	});
};

/**
 * Get a single result
 *
 * @param resultId Result ID
 */
export const getResult = (resultId: string) => {
	return prisma.game.findUnique({
		where: {
			id: resultId,
		},
	});
};

/**
 * Create a new result when game ends
 * @param data is the data provided by the ended game
 */

export const createResult = (data: ResultData) => {
	// create result and store in database
	return prisma.result.create({
		data,
	});
};
