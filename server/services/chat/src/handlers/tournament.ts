import { getSocketIds } from "../socketRegistry.js";

function emitToAllSocketsOf(io: any, userId: number, event: string, payload: any) {
    for (const sid of getSocketIds(userId)) {
        io.to(sid).emit(event, payload);
    }
}

export function registerTournamentHandlers(io: any, socket: any) {
    socket.on("tournament:nextMatch", (data: {
        tournamentId: string;
        playerAName: string;
        playerBName: string;
        participantIds?: number[];
    }) => {
        if (!data.tournamentId || !data.playerAName || !data.playerBName)
            return;

        const payload = {
            tournamentId: data.tournamentId,
            playerAName: data.playerAName,
            playerBName: data.playerBName,
        };

        if (data.participantIds && Array.isArray(data.participantIds)) {
            for (const userId of data.participantIds) {
                if (userId !== socket.user.id)
                    emitToAllSocketsOf(io, userId, "tournament:nextMatch", payload);
            }
        }
    });
}
