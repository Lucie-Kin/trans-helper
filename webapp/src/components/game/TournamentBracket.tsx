import React, { useMemo, useState } from "react";
import "../../style/game/tournamentBracket.css";

export type TournamentPlayer = {
    id: number;
    name: string;
    isAI: boolean;
    confirmed: boolean;
};

export type TournamentMatch = {
    id: number;
    round: number;
    position: number;
    playerA?: TournamentPlayer;
    playerB?: TournamentPlayer;
    winner?: number;
};

type Props = {
    tournamentId: string;
    tournamentName?: string;
    players: TournamentPlayer[];
    matches: TournamentMatch[];
    isOrganizer: boolean;
    onStart: () => void;
    onChangeName: (name: string) => void;
};

const MATCH_W = 200;
const MATCH_H = 50;
const PLAYER_H = 22;
const ROUND_GAP = 60;
const MATCH_VGAP = 20;
const SEED_W = 24;

type MatchBox = {
    match: TournamentMatch;
    x: number;
    y: number;
};

function buildLayout(matchesByRound: TournamentMatch[][]) {
    const boxes: MatchBox[][] = [];
    const totalRounds = matchesByRound.length;

    for (let r = 0; r < totalRounds; r++) {
        const roundBoxes: MatchBox[] = [];
        const roundMatches = matchesByRound[r];
        const x = r * (MATCH_W + ROUND_GAP);

        if (r === 0) {
            roundMatches.forEach((match, i) => {
                roundBoxes.push({
                    match,
                    x,
                    y: i * (MATCH_H + MATCH_VGAP),
                });
            });
        } else {
            const prevBoxes = boxes[r - 1];
            roundMatches.forEach((match, i) => {
                const topIdx = i * 2;
                const botIdx = i * 2;
                const topBox = prevBoxes[topIdx];
                const botBox = prevBoxes[botIdx];
                let y: number;
                if (topBox && botBox)
                    y = (topBox.y + botBox.y + MATCH_H) / 2 - MATCH_H / 2;
                else if (topBox)
                    y = topBox.y;
                else
                    y = i * (MATCH_H + MATCH_VGAP);
                roundBoxes.push({ match, x, y });
            });
        }
        boxes.push(roundBoxes);
    }
    return boxes;
}

function MatchSVG({ box }: { box: MatchBox }) {
    const { match, x, y } = box;
    const pA = match.playerA;
    const pB = match.playerB;

    const winA = match.winner !== undefined && match.winner === pA?.id;
    const winB = match.winner !== undefined && match.winner === pB?.id;

    return (
        <g transform={`translate(${x}, ${y})`}>
            <rect x ={0} y={0} width={MATCH_W} height={MATCH_H}
                rx={3} ry={3}
                className="svg-match-bg"
            />
            <rect x ={0} y={0} width={SEED_W} height={PLAYER_H}
                className="svg-seed-bg"
            />
            <text x={SEED_W / 2} y={PLAYER_H / 2 + 4}
                textAnchor="middle" 
                className="svg-seed-text" >
              {match.position * 2 - 1}
            </text>
            <rect x ={SEED_W} y={0} width={MATCH_W - SEED_W} height={PLAYER_H}
                className={`svg-player-bg ${winA ? "winner" : ""}`}
            />
            <text x ={SEED_W + 6} y={PLAYER_H / 2 + 4}
                className={`svg-player-name ${winA ? "winner" : ""} ${pA && !pA.confirmed ? "pending" : ""}`} >
              {pA ? (pA.isAI ? `🤖 ${pA.name}` : pA.name) : "TBD"}
            </text>
            <line x1={0} y1={PLAYER_H} x2={MATCH_W} y2={PLAYER_H}
                className="svg-player-divider"
            />
            <rect x ={0} y={PLAYER_H} width={SEED_W} height={MATCH_H - PLAYER_H}
                className="svg-seed-bg"
            />
            <text x={SEED_W / 2} y={PLAYER_H + (MATCH_H - PLAYER_H)/ 2 + 4}
                textAnchor="middle" 
                className="svg-seed-text" >
              {match.position * 2}
            </text>
            <rect x ={SEED_W} y={PLAYER_H} width={MATCH_W - SEED_W} height={MATCH_H - PLAYER_H}
                className={`svg-player-bg ${winB ? "winner" : ""}`}
            />
            <text x ={SEED_W + 6} y={PLAYER_H + (MATCH_H - PLAYER_H) / 2 + 4}
                className={`svg-player-name ${winB ? "winner" : ""} ${pB && !pB.confirmed ? "pending" : ""}`} >
              {pB ? (pB.isAI ? `🤖 ${pB.name}` : pB.name) : "TBD"}
            </text>
            <rect x ={0} y={0} width={MATCH_W} height={MATCH_H}
                rx={3} ry={3}
                className="svg-match-border"
            />
        </g>
    );
}

function ConnectorLines({ boxes }: { boxes: MatchBox[][] }) {
    const lines: React.ReactElement[] = [];

    for (let r = 1; r < boxes.length; r++) {
        const prevRound = boxes[r - 1];
        const currRound = boxes[r];

        currRound.forEach((currBox, i) => {
            const topIdx = i * 2;
            const botIdx = i * 2 + 1;
            const topBox = prevRound[topIdx];
            const botBox = prevRound[botIdx];

            if (topBox && botBox) {
                const fromX = topBox.x + MATCH_W;
                const midX = fromX + ROUND_GAP / 2;
                const toX = currBox.x;

                const topY = topBox.y + MATCH_H / 2;
                const botY = botBox.y + MATCH_H / 2;
                const destY = currBox.y + MATCH_H / 2;

                lines.push(
                    <g key={`conn-${r}-${i}`}>
                        <line x1={fromX} y1={topY} x2={midX} y2={topY} className="svg-connector"/>
                        <line x1={fromX} y1={botY} x2={midX} y2={botY} className="svg-connector"/>
                        <line x1={midX} y1={topY} x2={midX} y2={botY} className="svg-connector"/>
                        <line x1={midX} y1={destY} x2={toX} y2={destY} className="svg-connector"/>
                    </g>
                );
            } else if (topBox) {
                const fromX = topBox.x + MATCH_W;
                const toX = currBox.x;
                const lineY = topBox.y + MATCH_H / 2;
                lines.push(
                    <line key={`conn-${r}-${i}`} x1={fromX} y1={lineY} x2={toX} y2={lineY} className="svg-connector"/>
                );
            }
        });
    }
    return <>{lines}</>;
}

export default function TournamentBracket({
    tournamentId,
    tournamentName,
    players,
    matches,
    onStart,
    onChangeName,
}: Props) {
    const [editingName, setEditingName] = useState(false);
    const [nameInput, setNameInput] = useState(tournamentName || "");

    const displayName = tournamentName || `Tournament #${tournamentId}`;

    const sanitizeName = (value: string): string => {
        return value.replace(/[^\x20-\x7E]/g, "").trim().slice(0, 20);
    };

    const handleNameChange = (value: string) => {
        setNameInput(sanitizeName(value));
    };

    const handleNameSubmit = () => {
        const clean = sanitizeName(nameInput);
        if (clean.length > 0)
            onChangeName(clean);
        setEditingName(false);
    };

    const generatePlaceholderMatches = (playerList: TournamentPlayer[]): TournamentMatch[] => {
        if (playerList.length < 2) return [];
        const totalSlots = Math.pow(2, Math.ceil(Math.log2(playerList.length)));
        const totalRounds = Math.log2(totalSlots);
        const generated: TournamentMatch[] = [];
        let matchId = 1;

        for (let r = 1; r <= totalRounds; r++) {
            const matchesInRound = totalSlots / Math.pow(2, r);
            for (let p = 1; p <= matchesInRound; p++) {
                const match: TournamentMatch = {
                    id: matchId++,
                    round: r,
                    position: p,
                };
                if (r === 1) {
                    const idxA = (p - 1) * 2;
                    const idxB = (p - 1) * 2 + 1;
                    if (idxA < playerList.length) match.playerA = playerList[idxA];
                    if (idxB < playerList.length) match.playerB = playerList[idxB];
                }
                generated.push(match);
            }
        }
        return generated;
    };

    const effectiveMatches = matches.length > 0 ? matches : generatePlaceholderMatches(players);
    const rounds = effectiveMatches.length > 0 ? Math.max(...effectiveMatches.map((m) => m.round), 0) : 0;
    const matchesByRound: TournamentMatch[][] = [];
    for (let r = 1; r <= rounds; r++)
        matchesByRound.push(effectiveMatches.filter((m) => m.round === r).sort((a, b) => a.position - b.position));

    const getRoundName = (round: number, total: number) => {
        if (round === total) return "Finale";
        if (round === total - 1) return "Demi-finales";
        if (round === total - 2) return "Quarts";
        return `Tour ${round}`;
    };

    const hasNoMatches = effectiveMatches.length === 0;

    const layout = useMemo(() => {
        if (matchesByRound.length === 0)
            return [];
        return buildLayout(matchesByRound);
    }, [effectiveMatches, players]);

    const svgWidth = useMemo(() => {
        if (layout.length === 0)
            return 0;
        return layout.length * (MATCH_W + ROUND_GAP) - ROUND_GAP + 20;
    }, [layout]);

    const svgHeight = useMemo(() => {
        if (layout.length === 0)
            return 0;
        let maxY = 0;
        layout.forEach((round) => {
            round.forEach((box) => {
                if (box.y + MATCH_H > maxY)
                    maxY = box.y + MATCH_H;
            });
        });
        return maxY + 40;
    }, [layout]);

    return (
        <div className="tournament-bracket">
            <div className="tournament-header">
                {editingName ? (
                    <div className="tournament-name-edit">
                        <input  type="text" 
                                value={nameInput} 
                                onChange={(e) => handleNameChange(e.target.value)}
                                maxLength={20}
                                placeholder="Nom du tournoi"
                                autoFocus
                        />
                        <button onClick={handleNameSubmit}>OK</button>
                    </div>
                ) : (
                    <h3 className="tournament-name" onClick={() => setEditingName(true)}>
                        {displayName}
                        <span className="edit-hint">✏️</span>
                    </h3>
                )}
                <div className="tournament-players-count">{players.length} joueurs</div>
            </div>

            {hasNoMatches ? (
                <div className="bracket-empty">
                    <div className="bracket-empty-icon">🏆</div>
                    <div className="bracket-empty-text">En attente de joueurs...</div>
                    <div className="bracket-empty-hint">Inviter des joueurs puis lancez le tournoi</div>
                    {players.length > 0 && (
                        <div className="bracket-players-preview">
                            {players.map((p) => (
                                <span key={p.id} className={`player-tag ${p.isAI ? "ai" : ""} ${p.confirmed ? "" : "pending"}`}>
                                    {p.isAI && "🤖 "}{p.name}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                    <div className="bracket-svg-wrapper">
                        <div className="bracket-round-headers">
                            {matchesByRound.map((_, idx) => (
                                <div key={idx} className="round-title"
                                    style={{ width: MATCH_W, marginRight: ROUND_GAP }}>
                                  {getRoundName(idx + 1, rounds)}
                                </div>
                            ))}
                        </div>
                        <div className="bracket-svg-scroll">
                            <svg width={svgWidth} height={svgHeight}
                                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                                className="bracket-svg">
                              <ConnectorLines boxes={layout}/>
                              {layout.map((roundBoxes, rIdx) =>
                                    roundBoxes.map((box, mIdx) =>(
                                        <MatchSVG key={`${rIdx}-${mIdx}`} box={box}/>
                                    ))
                                )}
                            </svg>
                        </div>
                    </div>
                )}

                <button className="tournament-start-btn" onClick={onStart}>Jouer</button>
        </div>
    );
}
