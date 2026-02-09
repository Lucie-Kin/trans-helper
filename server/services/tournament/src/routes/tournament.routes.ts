import { FastifyInstance } from 'fastify';
import { createTournament, getTournament } from '../plugins/tournament.controller';
import { tournamentManager } from '../singletons';

export async function tournamentRoutes(fastify: FastifyInstance) {
    fastify.get('/', async() => {
        return { ok: true };
    });

    fastify.post('/', { preHandler: [fastify.authenticate] }, createTournament);
    
    fastify.get('/:id', getTournament);

    fastify.get('/:id/bracket', async (request, reply) => {
        const { id } = request.params as { id:string };
        const bracket = await tournamentManager.getTournamentBracket(id);
        if (!bracket)
            return reply.code(404).send({ error:'Tournament not found' });
        return bracket;
    });
    //fastify.put();
}
