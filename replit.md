# Transcendance

## Overview
A React/Vite frontend application with authentication features. A web application for playing Pong with login functionality supporting email/password and "42" authentication. Features matchmaking, tournaments, and real-time chat.

## Project Structure
- `webapp/` - React frontend application (Vite + TypeScript)
  - `src/components/game/` - Game-related components (GameBox, GameCard, GameArea, TournamentBracket, TournamentList)
  - `src/components/chat/` - Chat and user list components
  - `src/components/homePage/` - Main homepage with game and chat integration
  - `src/hooks/` - Custom hooks (useGameInvites, useTournament, useNotifications, etc.)
  - `src/style/` - CSS files organized by component
- `server/` - Backend services (auth, chat, matches, tournament, users)
- `ELK/` - ELK stack configuration (Docker-based, not used in Replit)
- `monitoring/` - Monitoring configuration
- `reverse-proxy/` - Nginx reverse proxy configuration (Docker-based)

## Development Setup
- **Frontend**: Runs on port 5000 using Vite dev server
- **Command**: `cd webapp && npm run dev`

## Technologies
- React 19 with TypeScript
- Vite 7 for bundling
- Ionic React for UI components
- React Router for navigation
- Socket.io for real-time communication

## Game Features
- **Play vs AI**: Single player against AI opponent
- **Play vs Random**: Queue for random matchmaking
- **Play with Player**: Invite specific players via chat
- **Tournament Mode**: Activated when 2+ players are invited, shows bracket organigram
- **Tournament List**: Join existing open tournaments

## Component Flow
1. HomePage displays GameBox (left) and ChatBox (right)
2. GameBox shows two cards: "Play vs AI" and "Play vs Random" by default
3. When a player invitation is sent via ChatBox, AI card changes to "Play with [name]"
4. When 2+ players are invited, switches to TournamentBracket view
5. TournamentBracket shows organigram with rounds and matches
6. Tournaments sidebar shows available tournaments to join

## Deployment
- Static deployment using Vite build
- Build command: `cd webapp && npm run build`
- Output directory: `webapp/dist`

## Tournament System
- **Fixed 4 players**: Tournaments always have exactly 4 players (2 semi-finals + 1 final = 3 matches)
- **No AI in tournaments**: AI players are not used in tournament mode, only real accounts or human guests
- **"Jouer" disabled**: Button is greyed out and unclickable until all 4 player slots are filled
- **Name validation**: Printable ASCII only, no whitespace, max 20 characters
- **Sender auto-included**: Invite sender is automatically a tournament member (2 invites = 3 players)
- **Open access**: Any participant can edit name, start tournament, and invite more players
- **Tournament list**: Shows all active tournaments (waiting + in_progress) until they finish
- **SVG bracket**: Challonge-style visualization with match boxes, seed numbers, and connecting lines
- **ELO**: Noob (0-1199, K=32), Mid (1200-1599, K=24), Pro (1600+, K=16)

## Recent Changes
- 2026-02-23: Match history now persists locally (localStorage) — saves results from AI, invite, random, and tournament games; falls back to local when server unavailable
- 2026-02-23: Added TournamentNotification component: shows "PLAYER1 VS. PLAYER2" for next match, auto-closes after 5s, pauses game when visible
- 2026-02-23: Fixed settings/history modal title word-breaking: responsive width with clamp(), word-break: keep-all
- 2026-02-23: Ball no longer resets to center on unpause (resumeOnly flag in main.ts)
- 2026-02-23: Game pauses when clicking profile-area/menu (menuOpen added to pause condition)
- 2026-02-11: Fixed WIN_SCORE from 1 to 11 (games now require 11 points to win)
- 2026-02-11: Fixed AI/TBD in tournaments: TBD slots now get proper AI player objects (negative IDs), display as "🤖 AI", green highlight works on AI wins
- 2026-02-11: "Fermer le tournoi" button replaces "Jouer" when all matches done; clears tournament state
- 2026-02-11: Fixed exitGame clearing tournament state prematurely (checks tournamentMatches.length)
- 2026-02-11: Victory screen (renderGameOver) now displays for all tournament matches including final
- 2026-02-11: "Jouer" button starts first unplayed tournament match; TBD players play as AI
- 2026-02-11: Match results recorded in bracket with winner advancement to next round
- 2026-02-11: Fixed TournamentMatch shape: fetchTournamentBracket now creates proper playerA/playerB objects
- 2026-02-11: Added /tournament/list backend endpoint for active tournaments (WAITING + IN_PROGRESS)
- 2026-02-10: SVG tournament bracket with challonge-style boxes and connector lines
- 2026-02-10: Tournament name validation (printable, no whitespace, 20 char max)
- 2026-02-10: Auto-include invite sender in tournament player list
- 2026-02-10: Integrated TournamentList into homepage, filters out finished tournaments
- 2026-02-10: Fixed TournamentMatch shape alignment between hook and bracket component
- 2026-02-10: Normalized tournament status from API to lowercase enum values
- 2026-01-28: Configured for Replit environment (port 5000, allowed hosts)
- 2026-01-28: Added GameBox, GameCard, GameArea components for game mode selection
- 2026-01-28: Added TournamentBracket component with organigram visualization
- 2026-01-28: Added TournamentList component for joining existing tournaments
- 2026-01-28: Added useTournament hook for managing game state and invites
- 2026-01-28: Integrated all game components into HomePage
