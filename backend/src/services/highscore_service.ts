/**
 * Highscore service
 */

import prisma from "../prisma";

// Get all highscores from database

export const getHighscores = async () => {
	return await prisma.highscore.findMany({
		orderBy: {
			id: "desc",
		},
	});
};
