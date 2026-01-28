import { FastifyRequest, FastifyReply } from 'fastify';
import { FastifyJWT } from '@fastify/jwt';
import { tournamentManager } from '../singletons';
import { toTournamentInfo } from '../mappers/tournament.mapper';

export async function createTournament(request: FastifyRequest, reply: FastifyReply) {
    try {
        const { title } = request.body as { title: string };
        const organizedId = (request.user as FastifyJWT['user']).id;
        const tournament = await tournamentManager.createTournament(title, organizedId);
    
        return reply.code(201).send(toTournamentInfo(tournament, 'TODO-organizer_name'));
    } catch(err) {
        console.error('Error creating tournament: ', err);
        return reply.code(500).send({ error: 'Internal Server Error' });
    }
}

export async function getTournament(request: FastifyRequest, reply: FastifyReply) {
    try {
        const { id } = request.params as { id: string };
        const tournament = await tournamentManager.getTournament(id);
    
        if (!tournament)
            return reply.code(404).send({ error: 'Tournament not found' });
        return reply.send(toTournamentInfo(tournament, 'TODO-organizer-name'));
    } catch(err) {
        console.error('Error fetching tournament: ', err);
        return reply.code(500).send({ error: 'Internal Server Error' });
    }
}
