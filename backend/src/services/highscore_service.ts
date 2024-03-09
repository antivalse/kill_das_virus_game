/**
 * Highscore service
 */

import prisma from "../prisma";

// Get all highscores from database
// Only get latest 10 highscores

export const getHighscores = async () => {
	return await prisma.highscore.findMany({
		orderBy: {
			highscore: "asc",
		},
		take: -10,
	});
};
