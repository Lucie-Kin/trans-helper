import Fastify, { FastifyReply, FastifyRequest } from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyJwt from '@fastify/jwt';
import fastifyStatic from '@fastify/static';
import path from 'node:path';
import { tournamentRoutes } from './routes/tournament.routes';
import { initSingletons } from './singletons';


async function  main() {
    const app = Fastify({ logger: true });

    await initSingletons();

    app.register(fastifyCookie, {
        secret: process.env.COOKIE_SECRET!,
    });


    app.register(fastifyJwt, {
        secret: process.env.JWT_SECRET!,
        cookie: {
            cookieName: 'appToken',
            signed: false,
        },
    });

        app.register(fastifyStatic, {
        root: path.join(__dirname, 'public'),
            prefix: '/public'
        });

    app.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
        try {
            await request.jwtVerify({ onlyCookie: true });
        } catch(err) {
            return reply.code(401).send({ error: 'Unauthorized' });
        }
    });

    app.register(tournamentRoutes, { prefix: '/tournament' });

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGHUP', () => shutdown('SIGHUP'));

    async function shutdown(signal: string) {
        await app.close();
        process.exit(0);
    }

    await app.listen({ port: 3003, host: '0.0.0.0' });
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
