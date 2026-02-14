import { FastifyInstance } from 'fastify';
import { createTournament, getTournament } from '../plugins/tournament.controller';
import { tournamentManager, tournamentRepo } from '../singletons';

export async function tournamentRoutes(fastify: FastifyInstance) {
    fastify.get('/', async() => {
        return { ok: true };
    });

    fastify.post('/', { preHandler: [fastify.authenticate] }, createTournament);

    fastify.get('/list', async (_request, reply) => {
        const tournaments = await tournamentManager.listActiveTournaments();
        return reply.send(tournaments);
    });

    fastify.get('/match-history', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const user = (request as any).user || {};
        const userId = (user.id ?? user.sub) as string | undefined;
        if (!userId) {
            return reply.code(401).send({ error: 'Unauthorized' });
        }

        const items = await tournamentRepo.getDb().all(
            `
            SELECT *
            FROM match_history
            WHERE user_id = ?
            ORDER BY datetime(played_at) DESC
            `,
            userId
        );

        return reply.send({ items });
    });

    
    fastify.get('/match-history/stats', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const userId = (request.query as { userId?: string }).userId;
        if (!userId) {
            return reply.code(400).send({ error: 'userId required' });
        }
        const winRow = await tournamentRepo.getDb().get<{ c: number }>(
            `SELECT COUNT(*) as c FROM match_history WHERE user_id = ? AND result = ?`,
            userId,
            'WIN'
        );
        const lossRow = await tournamentRepo.getDb().get<{ c: number }>(
            `SELECT COUNT(*) as c FROM match_history WHERE user_id = ? AND result = ?`,
            userId,
            'LOSE'
        );
        return reply.send({
            wins: winRow?.c ?? 0,
            losses: lossRow?.c ?? 0,
        });
    });

    fastify.post(
        '/match-history/normal/complete',
        { preHandler: [fastify.authenticate] },
        async (request, reply) => {
          const callerUserId = (request as any).user?.id || (request as any).user?.sub;
          if (!callerUserId) return reply.code(401).send({ error: 'Unauthorized' });
      
          const body = request.body as {
            player1Id: string;
            player2Id: string;
            winner: 1 | 2;
            scoreP1: number;
            scoreP2: number;
            playedAt?: string;
            sourceMatchId?: string;
          };

          if (!body.sourceMatchId || typeof body.sourceMatchId !== 'string' || body.sourceMatchId.length > 128) {
            return reply.code(400).send({ error: 'sourceMatchId required' });
          }

          
          if (String(callerUserId) !== String(body.player1Id) && String(callerUserId) !== String(body.player2Id)) {
            return reply.code(403).send({ error: 'Forbidden' });
          }

          const playedAt = body.playedAt ? new Date(body.playedAt) : new Date();
          const winnerUserId = body.winner === 1 ? body.player1Id : body.player2Id;
          const loserUserId  = body.winner === 1 ? body.player2Id : body.player1Id;
          const winnerScore = body.winner === 1 ? body.scoreP1 : body.scoreP2;
          const loserScore  = body.winner === 1 ? body.scoreP2 : body.scoreP1;

          
          const existing = await tournamentRepo.getDb().get(
            `SELECT 1 FROM match_history WHERE source_match_id = ? LIMIT 1`,
            body.sourceMatchId
          );
          if (existing) return reply.send({ ok: true, skipped: true });

          await tournamentRepo.withTransaction(async () => {
            await tournamentRepo.addMatchHistory(
              String(winnerUserId),
              String(loserUserId),
              'WIN',
              winnerScore,
              loserScore,
              'NORMAL',
              playedAt,
              body.sourceMatchId
            );
            await tournamentRepo.addMatchHistory(
              String(loserUserId),
              String(winnerUserId),
              'LOSE',
              loserScore,
              winnerScore,
              'NORMAL',
              playedAt,
              body.sourceMatchId
            );
          });
      
          return reply.send({ ok: true });
        }
      );
    
    fastify.get('/:id', getTournament);

    fastify.get('/:id/bracket', async (request, reply) => {
        const { id } = request.params as { id:string };
        const bracket = await tournamentManager.getTournamentBracket(id);
        if (!bracket)
            return reply.code(404).send({ error:'Tournament not found' });
        return bracket;
    });
}
