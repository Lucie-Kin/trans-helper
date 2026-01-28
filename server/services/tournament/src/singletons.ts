import { TournamentRepository } from './repository/tournament.repository';
import { TournamentManager } from './utils/tournament.manager'

export const tournamentRepo = new TournamentRepository();
export const tournamentManager = new TournamentManager(tournamentRepo);

export async function initSingletons() {
    await tournamentRepo.init();
}
