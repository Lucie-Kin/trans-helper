export type Language = "fr" | "en" | "es";

export const TEXTS = {
  fr: {
    home: {
      title: "Transcendance",
      loading: "Chargement…",
      denied: "Accès refusé.",
      loginLink: "Connecte-toi",
      welcome: "Bienvenue, {{name}}",
          language: "Français"
    },
    menu: {
                settings: "Paramètres",
                history: "Historique des parties",
                logout: "Déconnexion",
    },
    game: {
                mode: "Choisir un Mode de Jeu",
                ai: "Jouer contre l'IA",
                title: "Match 1v1",
                start: "Appuyez sur Espace pour commencer",
                quit: "Quitter la partie",
                random: "Jouer en local",
                victory: "VICTOIRE",
                rank: "Classsement: "
    },
        chat: {
                message: "Messages",
                select: "Sélectionnez une conversation",
                text_zone: "Ecrire un message",
                block: "Utilisateur bloqué...",
                blocked: "Vous avez été bloqué par cet utilisateur",
                online: "En ligne",
                offline: "Hors ligne",
                friend_request: "Faire une demande d'ami",
                accept_friend: "Accepter la demande d'ami",
                decline_friend: "Refuser la demande d'ami",
                invite_game: "Inviter à jouer",
                cancel_invite: "Annuler l'invitation",
                accept_invite: "Accepter la demande d'invitation",
                decline_invite: "Refuser la demande d'invitation"
        },
        tournament: {
                null: "Aucun tournoi en cours",
                title: "Tournois disponibles",
                for: "Par",
                player: "joueurs",
                join: "Rejoindre",
                status: "En cours"
        },
        settings: {
                title: "Paramètres",
                subtitle: "Nom d'affichage : ",
                current: "actuel",
                register: "Enregistrer le nom d'affichage",
                registering: "Enregistrement...",
                loading: "Chargement…",
                twofa: "Activer 2FA",
        },
        history: {
                load: "Chargement de l'historique des parties…",
                errload: "Erreur de chargement de l'historique des parties:",
                nullmatch: "Aucune partie n'a été joué.",
        },
        notification: {
                nextMatch: "MATCH SUIVANT",
        }
  },
  en: {
          home: {
                  title: "Transcendence",
                  loading: "Loading…",
                  denied: "Access denied.",
                  loginLink: "Log in",
                  welcome: "Welcome, {{name}}",
                  language: "English"
                },
    menu: {
                settings: "Settings",
                history: "Match History",
                logout: "Logout",
    },
    game: {
                mode: "Choose a Game Mode",
                ai: "Play against AI",
                title: "Random match",
                random: "Find a random opponent",
                start: "Press Space to start",
                quit: "Leave the game",
                victory: "VICTORY",
                rank: "Ranking: "
    },
        chat: {
                message: "Messages",
                select: "Select a conversation",
                text_zone: "Write a message",
                block: "User blocked...",
                blocked: "You have been blocked by this user",
                online: "Online",
                offline: "Offline",
                friend_request: "Send a friend request",
                accept_friend: "Accept friend request",
                decline_friend: "Decline friend request",
                invite_game: "Invite to play",
                cancel_invite: "Cancel the invitation",
                accept_invite: "Accept the invitation request",
                decline_invite: "Decline the invitation request"
        },
        tournament: {
                null: "No tournament currently running",
                title: "Available Tournaments",
                for: "By",
                player: "players",
                join: "Join",
                status: "In progress"
        },
        settings: {
                title: "Settings",
                subtitle: "Display name : ",
                current: "current",
                register: "Save the display name",
                registering: "Registering...",
                loading: "Loading…",
                twofa: "Enable 2FA",
        },
        history: {
                load: "Loading match history…",
                errload: "Error loading match history:",
                nullmatch: "No matches played yet.",
        },
        notification: {
                nextMatch: "NEXT MATCH",
        }
  },
  es: {
    home: {
      title: "Transcendencia",
      loading: "Cargando…",
      denied: "Acceso denegado.",
      loginLink: "Inicia sesión",
      welcome: "Bienvenido, {{name}}",
          language: "Español",
    },
    menu: {
      settings: "Ajustes",
          history: "Estadísticas del partidos",
      logout: "Cerrar sesión",
    },
    game: {
      mode: "Elige un modo de juego",
          ai: "Juega contra la IA",
          title: "Partido aleatorio",
          random: "Encuentra un oponente aleatorio",
          start: "Presione la barra espaciadora para comenzar",
          quit: "Dejar el juego",
          victory: "VICTORIA",
          rank: "Categoría: "
    },
        chat: {
                message: "Mensajes",
                select: "Seleccione una conversación",
                text_zone: "Escribe un mensaje",
                block: "Usuario bloqueado...",
                blocked: "Este usuario te ha bloqueado",
                online: "En línea",
                offline: "Desconectado",
                friend_request: "Enviar una solicitud de amistad",
                accept_friend: "Aceptar solicitud de amistad",
                decline_friend: "Rechazar solicitud de amistad",
                invite_game: "Invitar a jugar",
                cancel_invite: "Cancelar la invitación",
                accept_invite: "Aceptar la solicitud de invitación",
                decline_invite: "Rechazar la solicitud de invitación"
        },
        tournament: {
                null: "Ningún torneo accessible",
                title: "Torneos disponibles",
                for: "Para",
                player: "jugadores",
                join: "Unirse",
                status: "En progresso"
        },
        settings: {
                title: "Ajustes",
                subtitle: "Nombre para mostrar : ",
                current: "actual",
                register: "Guardar el nombre para mostrar",
                registering: "Registro...",
                loading: "Cargando…",
                twofa: "Permitir 2FA"
        },
        history: {
                load: "Cargando estadísticas del partidos…",
                errload: "Error al cargar los estadísticas del partidos",
                nullmatch: "No partidos jugando.",
        },
        notification: {
                nextMatch: "PRÓXIMO PARTIDO",
        }
  },
} as const;

function get(obj: any, path: string) {
  return path.split(".").reduce((acc, key) => acc?.[key], obj);
}

export function createTranslator(language: Language) {
  return function t(key: string, vars?: Record<string, string | number>) {
    const raw = get(TEXTS[language], key);

    if (typeof raw !== "string") {
      return key;
    }

    if (!vars) return raw;

    return raw.replace(/\{\{(\w+)\}\}/g, (_, v) => String(vars[v] ?? ""));
  };
}
