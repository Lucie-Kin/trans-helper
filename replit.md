# Transcendance

## Overview
A React/Vite frontend application with authentication features. The project appears to be a web application with login functionality supporting email/password and "42" authentication.

## Project Structure
- `webapp/` - React frontend application (Vite + TypeScript)
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

## Deployment
- Static deployment using Vite build
- Build command: `cd webapp && npm run build`
- Output directory: `webapp/dist`

## Recent Changes
- 2026-01-28: Configured for Replit environment (port 5000, allowed hosts)
