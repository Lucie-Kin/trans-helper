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

## Recent Changes
- 2026-01-28: Configured for Replit environment (port 5000, allowed hosts)
- 2026-01-28: Added GameBox, GameCard, GameArea components for game mode selection
- 2026-01-28: Added TournamentBracket component with organigram visualization
- 2026-01-28: Added TournamentList component for joining existing tournaments
- 2026-01-28: Added useTournament hook for managing game state and invites
- 2026-01-28: Integrated all game components into HomePage
