import { FastifyInstance } from 'fastify';
import { createTournament, getTournament } from '../plugins/tournament.controller';
import { tournamentManager, tournamentRepo } from '../singletons';

export async function tournamentRoutes(fastify: FastifyInstance) {
  fastify.get('/', async () => {
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
        player1Id?: string;
        player2Id?: string; // USER id | AI_x | GUEST:...
        winner?: 1 | 2;
        scoreP1?: number;
        scoreP2?: number;
        playedAt?: string;
        sourceMatchId?: string;
        opponentName?: string;
      };

      if (!body.player1Id || !body.player2Id) {
        return reply.code(400).send({ error: 'player1Id and player2Id required' });
      }

      const caller = String(callerUserId);
      const p1 = String(body.player1Id);
      const p2 = String(body.player2Id);

      if (!body.sourceMatchId || typeof body.sourceMatchId !== 'string' || body.sourceMatchId.length > 128) {
        return reply.code(400).send({ error: 'sourceMatchId required' });
      }
      if (caller !== p1 && caller !== p2) {
        return reply.code(403).send({ error: 'Forbidden' });
      }
      if (body.winner !== 1 && body.winner !== 2) {
        return reply.code(400).send({ error: 'winner must be 1 or 2' });
      }
      if (!Number.isFinite(body.scoreP1) || !Number.isFinite(body.scoreP2)) {
        return reply.code(400).send({ error: 'scores must be numbers' });
      }

      const playedAt = body.playedAt ? new Date(body.playedAt) : new Date();
      if (Number.isNaN(playedAt.getTime())) {
        return reply.code(400).send({ error: 'playedAt invalid' });
      }

      const other = caller === p1 ? p2 : p1;

      const detectKind = (id: string): 'USER' | 'AI' | 'GUEST' => {
        if (/^AI_/i.test(id)) return 'AI';
        if (/^GUEST:/i.test(id)) return 'GUEST';
        return 'USER';
      };
      const otherKind = detectKind(other);

      const s1 = body.scoreP1!;
      const s2 = body.scoreP2!;

      const winnerUserId = body.winner === 1 ? p1 : p2;
      const loserUserId = body.winner === 1 ? p2 : p1;
      const winnerScore = body.winner === 1 ? s1 : s2;
      const loserScore = body.winner === 1 ? s2 : s1;

      await tournamentRepo.withTransaction(async () => {
        if (otherKind === 'USER') {
          await tournamentRepo.addMatchHistory(
            String(winnerUserId),
            String(loserUserId),
            'WIN',
            winnerScore,
            loserScore,
            'NORMAL',
            playedAt,
            body.sourceMatchId,
            'USER'
          );

          await tournamentRepo.addMatchHistory(
            String(loserUserId),
            String(winnerUserId),
            'LOSE',
            loserScore,
            winnerScore,
            'NORMAL',
            playedAt,
            body.sourceMatchId,
            'USER'
          );

          return;
        }

        const callerIsP1 = caller === p1;
        const callerScoreFor = callerIsP1 ? s1 : s2;
        const callerScoreAgainst = callerIsP1 ? s2 : s1;
        const callerIsWinner = caller === String(winnerUserId);

        const opponentName =
          otherKind === 'AI'
            ? (body.opponentName ?? 'AI')
            : (body.opponentName ?? (other.startsWith('GUEST:') ? other.slice('GUEST:'.length) : 'Guest'));

        await tournamentRepo.addMatchHistory(
          caller,
          other,
          callerIsWinner ? 'WIN' : 'LOSE',
          callerScoreFor,
          callerScoreAgainst,
          'NORMAL',
          playedAt,
          body.sourceMatchId,
          otherKind,
          opponentName
        );
      });

      return reply.send({ ok: true });
    }
  );


  fastify.post(
    '/match-history/tournament/complete',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const body = request.body as {
        player1Id?: string;
        player2Id?: string; // USER id | AI_x | GUEST:...
        winner?: 1 | 2;
        scoreP1?: number;
        scoreP2?: number;
        playedAt?: string;
        sourceMatchId?: string;
        opponentName?: string;
      };
  
      if (!body.player1Id || !body.player2Id) {
        return reply.code(400).send({ error: 'player1Id and player2Id required' });
      }
  
      const p1 = String(body.player1Id);
      const p2 = String(body.player2Id);
  
      if (!body.sourceMatchId || typeof body.sourceMatchId !== 'string' || body.sourceMatchId.length > 128) {
        return reply.code(400).send({ error: 'sourceMatchId required' });
      }
      if (!body.sourceMatchId.startsWith('tournament:')) {
        return reply.code(400).send({ error: 'sourceMatchId must start with tournament:' });
      }
  
      if (body.winner !== 1 && body.winner !== 2) {
        return reply.code(400).send({ error: 'winner must be 1 or 2' });
      }
      if (!Number.isFinite(body.scoreP1) || !Number.isFinite(body.scoreP2)) {
        return reply.code(400).send({ error: 'scores must be numbers' });
      }
  
      const playedAt = body.playedAt ? new Date(body.playedAt) : new Date();
      if (Number.isNaN(playedAt.getTime())) {
        return reply.code(400).send({ error: 'playedAt invalid' });
      }
  
      const detectKind = (id: string): 'USER' | 'AI' | 'GUEST' => {
        if (/^AI_/i.test(id)) return 'AI';
        if (/^GUEST:/i.test(id)) return 'GUEST';
        return 'USER';
      };
  
      const kind1 = detectKind(p1);
      const kind2 = detectKind(p2);
  
      const s1 = body.scoreP1!;
      const s2 = body.scoreP2!;
  
      const winnerIsP1 = body.winner === 1;
      const winnerUserId = winnerIsP1 ? p1 : p2;
      const loserUserId  = winnerIsP1 ? p2 : p1;
      const winnerScore  = winnerIsP1 ? s1 : s2;
      const loserScore   = winnerIsP1 ? s2 : s1;
  
      const buildOpponentName = (id: string, kind: 'USER' | 'AI' | 'GUEST') => {
        if (kind === 'AI') return body.opponentName ?? 'AI';
        if (kind === 'GUEST') {
          if (body.opponentName) return body.opponentName;
          return id.startsWith('GUEST:') ? id.slice('GUEST:'.length) : 'Guest';
        }
        return undefined;
      };
  
      await tournamentRepo.withTransaction(async () => {
        if (kind1 === 'USER' && kind2 === 'USER') {
          await tournamentRepo.addMatchHistory(
            winnerUserId, loserUserId, 'WIN',
            winnerScore, loserScore,
            'TOURNAMENT', playedAt, body.sourceMatchId,
            'USER'
          );
  
          await tournamentRepo.addMatchHistory(
            loserUserId, winnerUserId, 'LOSE',
            loserScore, winnerScore,
            'TOURNAMENT', playedAt, body.sourceMatchId,
            'USER'
          );
          return;
        }
  
        if (kind1 === 'USER' && kind2 !== 'USER') {
          const userWon = winnerUserId === p1;
          await tournamentRepo.addMatchHistory(
            p1, p2,
            userWon ? 'WIN' : 'LOSE',
            userWon ? winnerScore : loserScore,
            userWon ? loserScore : winnerScore,
            'TOURNAMENT', playedAt, body.sourceMatchId,
            kind2,
            buildOpponentName(p2, kind2)
          );
          return;
        }
  
        if (kind2 === 'USER' && kind1 !== 'USER') {
          const userWon = winnerUserId === p2;
          await tournamentRepo.addMatchHistory(
            p2, p1,
            userWon ? 'WIN' : 'LOSE',
            userWon ? winnerScore : loserScore,
            userWon ? loserScore : winnerScore,
            'TOURNAMENT', playedAt, body.sourceMatchId,
            kind1,
            buildOpponentName(p1, kind1)
          );
          return;
        }
      });
  
      return reply.send({ ok: true });
    }
  );


  fastify.get('/:id', getTournament);

  fastify.get('/:id/bracket', async (request, reply) => {
    const { id } = request.params as { id: string };
    const bracket = await tournamentManager.getTournamentBracket(id);
    if (!bracket)
      return reply.code(404).send({ error: 'Tournament not found' });
    return bracket;
  });
}
