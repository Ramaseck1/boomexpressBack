import { OpenAPIV3 } from "openapi-types";

export const swaggerDocument: OpenAPIV3.Document = {
  openapi: "3.0.3",

  info: {
    title: "MOTO EXPRESS API",
    version: "1.6.0",
    description:
      "API livraison moto - Dakar et Saint-Louis (gestion commandes, clients, livreurs, paiements, blocages, navigation Mapbox)",
  },

  servers: [{ url: "http://localhost:3000/api" }],

  tags: [
    { name: "Auth" },
    { name: "Admin" },
    { name: "Livreur" },
    { name: "Navigation", description: "🗺️ Navigation Mapbox GPS temps réel" },
    { name: "Clients" },
    { name: "Commandes" },
    { name: "Paiements" },
    { name: "Blocages" },
  ],

  paths: {
    // ═══════════════════════════════════════════
    // AUTH
    // ═══════════════════════════════════════════
    "/auth/login/admin": {
      post: {
        tags: ["Auth"],
        summary: "Login admin / superadmin",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", example: "admin@motoexpress.sn" },
                  password: { type: "string", example: "Admin1234!" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Login réussi — copier le token dans Authorize 🔐",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { token: { type: "string" } },
                },
              },
            },
          },
        },
      },
    },

    "/auth/login/livreur": {
      post: {
        tags: ["Auth"],
        summary: "Login livreur",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["telephone", "password"],
                properties: {
                  telephone: { type: "string", example: "771234567" },
                  password: { type: "string", example: "Livreur1234!" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Login réussi — copier le token dans Authorize 🔐",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { token: { type: "string" } },
                },
              },
            },
          },
        },
      },
    },

    "/auth/register/admin": {
      post: {
        tags: ["Auth"],
        summary: "Créer admin (SUPERADMIN)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/RegisterAdmin" } },
          },
        },
        responses: { "201": { description: "Admin créé" } },
      },
    },

    "/auth/register/livreur": {
      post: {
        tags: ["Auth"],
        summary: "Créer livreur",
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/RegisterLivreur" } },
          },
        },
        responses: { "201": { description: "Livreur créé" } },
      },
    },

    // ═══════════════════════════════════════════
    // ADMIN — CLIENTS
    // ═══════════════════════════════════════════
    "/admin/clients": {
      get: {
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        summary: "Liste tous les clients",
        responses: {
          "200": {
            description: "Liste des clients",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Client" } },
              },
            },
          },
        },
      },
      post: {
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        summary: "Créer ou récupérer un client (par téléphone)",
        description:
          "Si un client avec ce numéro de téléphone existe déjà, le retourne. Sinon, le crée.",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ClientCreate" } },
          },
        },
        responses: {
          "200": {
            description: "Client créé ou existant retourné",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Client" } },
            },
          },
          "400": { description: "Champs manquants ou invalides" },
        },
      },
    },

    "/admin/clients/{clientId}": {
      put: {
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        summary: "Mettre à jour un client",
        parameters: [
          {
            name: "clientId",
            in: "path",
            required: true,
            schema: { type: "integer", example: 1 },
            description: "ID du client à mettre à jour",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ClientUpdate" } },
          },
        },
        responses: {
          "200": {
            description: "Client mis à jour",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Client" } },
            },
          },
          "400": { description: "Erreur de mise à jour" },
          "404": { description: "Client introuvable" },
        },
      },
      delete: {
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        summary: "Supprimer un client",
        parameters: [
          {
            name: "clientId",
            in: "path",
            required: true,
            schema: { type: "integer", example: 1 },
            description: "ID du client à supprimer",
          },
        ],
        responses: {
          "200": { description: "Client supprimé avec succès" },
          "400": { description: "Erreur lors de la suppression" },
          "404": { description: "Client introuvable" },
        },
      },
    },

    "/admin/clients/{clientId}/historique": {
      get: {
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        summary: "Historique des commandes d'un client",
        parameters: [
          {
            name: "clientId",
            in: "path",
            required: true,
            schema: { type: "integer", example: 1 },
            description: "ID du client",
          },
        ],
        responses: {
          "200": {
            description: "Liste des commandes du client",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Commande" } },
              },
            },
          },
          "400": { description: "Erreur" },
        },
      },
    },

    // ═══════════════════════════════════════════
    // ADMIN — CLIENT + COMMANDE (endpoint combiné)
    // ═══════════════════════════════════════════
    "/admin/clients-commandes": {
      post: {
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        summary: "Créer client + commande en une seule requête",
        description:
          "Crée un **nouveau client** sans vérifier si le numéro de téléphone existe déjà, puis crée automatiquement une commande associée. Le montant et la commission (10%) sont calculés automatiquement selon la distance entre l'adresse du client et l'adresse de livraison.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ClientEtCommandeCreate" },
              example: {
                nom: "Diallo",
                prenom: "Fatou",
                telephone: "771234567",
                adresse: "Guet Ndar, Saint-Louis",
                adresseLivraison: "Sor, Saint-Louis",
                telephoneDestinataire: "761234567",
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Client et commande créés avec succès",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ClientEtCommandeResponse" },
              },
            },
          },
          "400": {
            description: "Champs manquants ou erreur de géocodage / adresse hors zone",
          },
        },
      },
    },

    // ═══════════════════════════════════════════
    // ADMIN — COMMANDES
    // ═══════════════════════════════════════════
    "/admin/commandes": {
      get: {
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        summary: "Liste des commandes (filtres optionnels)",
        parameters: [
          {
            name: "statut",
            in: "query",
            required: false,
            schema: {
              type: "string",
              enum: ["en_attente", "en_cours", "livree"],
              example: "en_attente",
            },
            description: "Filtrer par statut",
          },
          {
            name: "dateDebut",
            in: "query",
            required: false,
            schema: { type: "string", format: "date", example: "2025-01-01" },
            description: "Filtrer à partir de cette date",
          },
          {
            name: "dateFin",
            in: "query",
            required: false,
            schema: { type: "string", format: "date", example: "2025-12-31" },
            description: "Filtrer jusqu'à cette date",
          },
        ],
        responses: {
          "200": {
            description: "Liste des commandes",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Commande" } },
              },
            },
          },
        },
      },
      post: {
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        summary: "Créer une commande pour un client existant",
        description:
          "Montant et commission (10%) calculés automatiquement selon la distance. Si `adresseLivraison` n'est pas fournie, l'adresse de livraison enregistrée du client est utilisée.",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/CommandeCreate" } },
          },
        },
        responses: {
          "200": {
            description: "Commande créée",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Commande créée avec succès" },
                    commande: { $ref: "#/components/schemas/Commande" },
                  },
                },
              },
            },
          },
          "400": { description: "clientId manquant ou adresse invalide" },
          "404": { description: "Client introuvable" },
        },
      },
    },

    "/admin/commandes/{commandeId}": {
      put: {
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        summary: "Mettre à jour une commande",
        parameters: [
          {
            name: "commandeId",
            in: "path",
            required: true,
            schema: { type: "integer", example: 1 },
            description: "ID de la commande à mettre à jour",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CommandeUpdate" },
            },
          },
        },
        responses: {
          "200": {
            description: "Commande mise à jour",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Commande" } },
            },
          },
          "400": { description: "Erreur de mise à jour" },
          "404": { description: "Commande introuvable" },
        },
      },
      delete: {
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        summary: "Supprimer une commande",
        description:
          "⚠️ Les livraisons associées doivent être supprimées au préalable si `onDelete: Cascade` n'est pas configuré dans le schéma Prisma.",
        parameters: [
          {
            name: "commandeId",
            in: "path",
            required: true,
            schema: { type: "integer", example: 1 },
            description: "ID de la commande à supprimer",
          },
        ],
        responses: {
          "200": { description: "Commande supprimée avec succès" },
          "400": { description: "Erreur lors de la suppression (ex: livraisons liées)" },
          "404": { description: "Commande introuvable" },
        },
      },
    },

    "/admin/commandes/assigner": {
      post: {
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        summary: "Assigner une commande à un livreur",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["commandeId", "livreurId"],
                properties: {
                  commandeId: { type: "integer", example: 1 },
                  livreurId: { type: "integer", example: 2 },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Commande assignée avec succès",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Commande assignée avec succès" },
                    livraison: { $ref: "#/components/schemas/Livraison" },
                  },
                },
              },
            },
          },
          "400": { description: "commandeId ou livreurId manquant" },
          "404": { description: "Commande introuvable" },
        },
      },
    },

    // ═══════════════════════════════════════════
    // ADMIN — LIVREURS
    // ═══════════════════════════════════════════
    "/admin/livreurs": {
      get: {
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        summary: "Liste de tous les livreurs",
        responses: {
          "200": {
            description: "Liste des livreurs avec leurs infos utilisateur",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/LivreurWithUser" } },
              },
            },
          },
        },
      },
    },

    "/admin/livreurs/{livreurId}": {
      get: {
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        summary: "Profil détaillé d'un livreur",
        parameters: [
          {
            name: "livreurId",
            in: "path",
            required: true,
            schema: { type: "integer", example: 2 },
          },
        ],
        responses: {
          "200": {
            description: "Profil livreur",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LivreurWithUser" },
              },
            },
          },
          "400": { description: "Erreur" },
        },
      },
    },

    "/admin/livreurs/{livreurId}/toggle": {
      patch: {
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        summary: "Activer / désactiver le compte d'un livreur",
        parameters: [
          {
            name: "livreurId",
            in: "path",
            required: true,
            schema: { type: "integer", example: 2 },
          },
        ],
        responses: {
          "200": { description: "Statut du compte basculé" },
          "400": { description: "Erreur" },
        },
      },
    },

    "/admin/livreurs/bloquer": {
      post: {
        tags: ["Blocages"],
        security: [{ bearerAuth: [] }],
        summary: "Bloquer un livreur",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["livreurId", "raison"],
                properties: {
                  livreurId: { type: "integer", example: 2 },
                  raison: { type: "string", example: "Comportement inapproprié signalé" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Livreur bloqué et compte désactivé" },
          "400": { description: "Livreur introuvable" },
        },
      },
    },

    // ═══════════════════════════════════════════
    // ADMIN — PAIEMENTS
    // ═══════════════════════════════════════════
    "/admin/paiements/payer": {
      post: {
        tags: ["Paiements"],
        security: [{ bearerAuth: [] }],
        summary: "Marquer les commissions d'un livreur pour un jour donné comme payées",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["livreurId", "date"],
                properties: {
                  livreurId: { type: "integer", example: 2 },
                  date: { type: "string", format: "date", example: "2025-04-15" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Commissions du jour marquées comme payées",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Commissions du 2025-04-15 marquées comme payées" },
                    data: { $ref: "#/components/schemas/PaiementJourResponse" },
                  },
                },
              },
            },
          },
          "400": { description: "livreurId ou date manquant / format date invalide / aucune commission en attente" },
        },
      },
    },

    // ═══════════════════════════════════════════
    // LIVREUR — PROFIL & DISPONIBILITÉ
    // ═══════════════════════════════════════════
    "/livreur/profil": {
      get: {
        tags: ["Livreur"],
        security: [{ bearerAuth: [] }],
        summary: "Voir mon profil",
        responses: {
          "200": {
            description: "Profil livreur",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LivreurWithUser" },
              },
            },
          },
        },
      },
    },

    "/livreur/disponibilite": {
      put: {
        tags: ["Livreur"],
        security: [{ bearerAuth: [] }],
        summary: "Activer / désactiver ma disponibilité",
        responses: {
          "200": {
            description: "Disponibilité modifiée",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LivreurWithUser" },
              },
            },
          },
        },
      },
    },

    // ═══════════════════════════════════════════
    // LIVREUR — MISSIONS
    // ═══════════════════════════════════════════
    "/livreur/missions": {
      get: {
        tags: ["Livreur"],
        security: [{ bearerAuth: [] }],
        summary: "Voir les missions disponibles (statut en_attente)",
        responses: {
          "200": {
            description: "Liste des commandes disponibles",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Commande" } },
              },
            },
          },
        },
      },
    },

    "/livreur/missions/accepter": {
      post: {
        tags: ["Livreur"],
        security: [{ bearerAuth: [] }],
        summary: "Accepter une mission",
        description:
          "Accepte la commande et **démarre automatiquement la navigation Mapbox** si `lat`/`lng` sont fournis. La réponse inclut alors la route GeoJSON, les étapes turn-by-turn et l'ETA.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AccepterMissionBody" },
              examples: {
                "Avec navigation": {
                  summary: "✅ Démarre la nav automatiquement",
                  value: { commandeId: 1, lat: 14.6928, lng: -17.4467 },
                },
                "Sans navigation": {
                  summary: "⚠️ Accepte sans démarrer la nav",
                  value: { commandeId: 1 },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Mission acceptée",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AccepterMissionResponse" },
              },
            },
          },
          "400": { description: "Livreur bloqué ou introuvable" },
        },
      },
    },

    // ═══════════════════════════════════════════
    // LIVREUR — LIVRAISON
    // ═══════════════════════════════════════════
    "/livreur/livraison/confirmer": {
      post: {
        tags: ["Livreur"],
        security: [{ bearerAuth: [] }],
        summary: "Confirmer une livraison effectuée",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["livraisonId"],
                properties: {
                  livraisonId: {
                    type: "integer",
                    example: 5,
                    description: "ID retourné lors de l'acceptation de mission",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Livraison confirmée",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Livraison" },
              },
            },
          },
        },
      },
    },

    // ═══════════════════════════════════════════
    // LIVREUR — HISTORIQUE & REVENUS
    // ═══════════════════════════════════════════
    "/livreur/historique": {
      get: {
        tags: ["Livreur"],
        security: [{ bearerAuth: [] }],
        summary: "Historique de mes livraisons",
        responses: {
          "200": {
            description: "Toutes les livraisons du livreur connecté",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Livraison" } },
              },
            },
          },
        },
      },
    },

    "/livreur/revenus": {
      get: {
        tags: ["Livreur"],
        security: [{ bearerAuth: [] }],
        summary: "Voir mes revenus",
        responses: {
          "200": {
            description: "Revenus du livreur",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RevenusResponse" },
              },
            },
          },
        },
      },
    },

    "/livreur/commandes": {
      get: {
        tags: ["Livreur"],
        security: [{ bearerAuth: [] }],
        summary: "Liste commandes assignées au livreur",
        responses: {
          "200": {
            description: "Commandes du livreur",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Commande" } },
              },
            },
          },
        },
      },
    },

    "/livreur/commandes/historique": {
      get: {
        tags: ["Livreur"],
        security: [{ bearerAuth: [] }],
        summary: "Historique des commandes livrées",
        responses: {
          "200": {
            description: "Historique complet",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Commande" } },
              },
            },
          },
        },
      },
    },

    // ═══════════════════════════════════════════
    // NAVIGATION MAPBOX 🗺️
    // ═══════════════════════════════════════════
    "/livreur/navigation/demarrer": {
      post: {
        tags: ["Navigation"],
        security: [{ bearerAuth: [] }],
        summary: "🚀 Démarrer la navigation manuellement",
        description:
          "Géocode l'adresse de la commande, calcule la route avec trafic temps réel et sauvegarde la destination. Appeler après `accepter` si la position n'était pas fournie.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/DemarrerNavigationBody" },
              example: { livraisonId: 5, lat: 14.6928, lng: -17.4467 },
            },
          },
        },
        responses: {
          "200": {
            description: "Route calculée avec succès",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/NavigationResponse" },
              },
            },
          },
          "400": { description: "Adresse de livraison manquante" },
          "500": { description: "Erreur Mapbox API" },
        },
      },
    },

    "/livreur/navigation/{livraisonId}/instruction": {
      get: {
        tags: ["Navigation"],
        security: [{ bearerAuth: [] }],
        summary: "🧭 Prochaine instruction turn-by-turn",
        description:
          "Retourne la prochaine instruction de navigation et l'instruction vocale formatée. À appeler en continu (toutes les 5-10 secondes) depuis l'app mobile.",
        parameters: [
          {
            name: "livraisonId",
            in: "path",
            required: true,
            schema: { type: "integer", example: 5 },
            description: "ID de la livraison en cours",
          },
          {
            name: "lat",
            in: "query",
            required: true,
            schema: { type: "number", example: 14.6928 },
            description: "Latitude GPS actuelle du livreur",
          },
          {
            name: "lng",
            in: "query",
            required: true,
            schema: { type: "number", example: -17.4467 },
            description: "Longitude GPS actuelle du livreur",
          },
        ],
        responses: {
          "200": {
            description: "Instruction de navigation",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/InstructionResponse" },
              },
            },
          },
          "400": { description: "Navigation pas encore démarrée pour cette livraison" },
        },
      },
    },

    "/livreur/navigation/{livraisonId}/eta": {
      get: {
        tags: ["Navigation"],
        security: [{ bearerAuth: [] }],
        summary: "🚦 ETA mis à jour avec le trafic temps réel",
        description:
          "Recalcule l'heure d'arrivée estimée en tenant compte du trafic Mapbox en temps réel. Utiliser pour afficher l'ETA côté client.",
        parameters: [
          {
            name: "livraisonId",
            in: "path",
            required: true,
            schema: { type: "integer", example: 5 },
          },
          {
            name: "lat",
            in: "query",
            required: true,
            schema: { type: "number", example: 14.6935 },
            description: "Latitude GPS actuelle",
          },
          {
            name: "lng",
            in: "query",
            required: true,
            schema: { type: "number", example: -17.4450 },
            description: "Longitude GPS actuelle",
          },
        ],
        responses: {
          "200": {
            description: "ETA calculé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ETAResponse" },
              },
            },
          },
          "400": { description: "Destination non définie — démarrez d'abord la navigation" },
        },
      },
    },

    "/livreur/navigation/geocode": {
      get: {
        tags: ["Navigation"],
        security: [{ bearerAuth: [] }],
        summary: "📍 Convertir une adresse en coordonnées GPS",
        description: "Utilise l'API Geocoding Mapbox pour transformer une adresse texte en lat/lng.",
        parameters: [
          {
            name: "adresse",
            in: "query",
            required: true,
            schema: { type: "string", example: "12 Rue Moussé Diop, Dakar" },
            description: "Adresse complète à géocoder",
          },
        ],
        responses: {
          "200": {
            description: "Coordonnées GPS",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    lat: { type: "number", example: 14.6928 },
                    lng: { type: "number", example: -17.4467 },
                  },
                },
              },
            },
          },
          "400": { description: "Adresse introuvable" },
        },
      },
    },
  },

  // ═══════════════════════════════════════════
  // COMPONENTS / SCHEMAS
  // ═══════════════════════════════════════════
  components: {
    securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },

    schemas: {
      // ── Auth ────────────────────────────────
      RegisterAdmin: {
        type: "object",
        required: ["nom", "prenom", "email", "password", "role"],
        properties: {
          nom:      { type: "string", example: "Diallo" },
          prenom:   { type: "string", example: "Moussa" },
          email:    { type: "string", example: "admin@motoexpress.sn" },
          password: { type: "string", example: "Admin1234!" },
          role:     { type: "string", enum: ["SUPERADMIN", "ADMIN"] },
        },
      },

      RegisterLivreur: {
        type: "object",
        required: ["nom", "prenom", "telephone", "password", "role"],
        properties: {
          nom:        { type: "string", example: "Ndiaye" },
          prenom:     { type: "string", example: "Ibrahima" },
          telephone:  { type: "string", example: "771234567" },
          password:   { type: "string", example: "Livreur1234!" },
          role:       { type: "string", enum: ["LIVREUR"] },
          statut:     { type: "string", enum: ["actif", "inactif"] },
          disponible: { type: "boolean", example: true },
        },
      },

      // ── Client ──────────────────────────────
      Client: {
        type: "object",
        properties: {
          id:                    { type: "integer", example: 1 },
          nom:                   { type: "string", example: "Diallo" },
          prenom:                { type: "string", example: "Fatou" },
          telephone:             { type: "string", example: "771234567" },
          adresse:               { type: "string", example: "Guet Ndar, Saint-Louis" },
          adresseLivraison:      { type: "string", example: "Sor, Saint-Louis" },
          telephoneDestinataire: { type: "string", example: "761234567" },
          createdAt:             { type: "string", format: "date-time" },
        },
      },

      ClientCreate: {
        type: "object",
        required: ["nom", "prenom", "telephone", "adresse", "adresseLivraison", "telephoneDestinataire"],
        properties: {
          nom:                   { type: "string", example: "Fall" },
          prenom:                { type: "string", example: "Fatou" },
          telephone:             { type: "string", example: "781234567" },
          adresse:               { type: "string", example: "Guet Ndar, Saint-Louis" },
          adresseLivraison:      { type: "string", example: "Sor, Saint-Louis" },
          telephoneDestinataire: { type: "string", example: "761234567" },
        },
      },

      ClientUpdate: {
        type: "object",
        description: "Tous les champs sont optionnels pour la mise à jour",
        properties: {
          nom:                   { type: "string", example: "Fall" },
          prenom:                { type: "string", example: "Fatou" },
          telephone:             { type: "string", example: "781234567" },
          adresse:               { type: "string", example: "Guet Ndar, Saint-Louis" },
          adresseLivraison:      { type: "string", example: "Sor, Saint-Louis" },
          telephoneDestinataire: { type: "string", example: "761234567" },
        },
      },

      // ── Client + Commande combiné ────────────
      ClientEtCommandeCreate: {
        type: "object",
        required: ["nom", "prenom", "telephone", "adresse", "adresseLivraison", "telephoneDestinataire"],
        properties: {
          nom:                   { type: "string", example: "Diallo" },
          prenom:                { type: "string", example: "Fatou" },
          telephone:             { type: "string", example: "771234567" },
          adresse:               { type: "string", example: "Guet Ndar, Saint-Louis" },
          adresseLivraison:      { type: "string", example: "Sor, Saint-Louis" },
          telephoneDestinataire: { type: "string", example: "761234567" },
        },
      },

      ClientEtCommandeResponse: {
        type: "object",
        properties: {
          message:  { type: "string", example: "Client et commande créés avec succès" },
          client:   { $ref: "#/components/schemas/Client" },
          commande: { $ref: "#/components/schemas/Commande" },
        },
      },

      // ── Commande ────────────────────────────
      Commande: {
        type: "object",
        properties: {
          id:             { type: "integer", example: 1 },
          clientId:       { type: "integer", example: 3 },
          montant:        { type: "number", example: 2500 },
          commission:     { type: "number", example: 250 },
          commissionPaye: { type: "boolean", example: false },
          statut: {
            type: "string",
            enum: ["en_attente", "en_cours", "livree"],
            example: "en_attente",
          },
          createdAt: { type: "string", format: "date-time" },
        },
      },

      CommandeCreate: {
        type: "object",
        required: ["clientId"],
        properties: {
          clientId: { type: "integer", example: 3 },
          adresseLivraison: {
            type: "string",
            example: "Sor, Saint-Louis",
            description: "Optionnel — utilise l'adresse de livraison du client si absent",
          },
        },
      },

      CommandeUpdate: {
        type: "object",
        description: "Tous les champs sont optionnels pour la mise à jour",
        properties: {
          statut: {
            type: "string",
            enum: ["en_attente", "en_cours", "livree"],
            example: "en_cours",
          },
          commissionPaye: { type: "boolean", example: true },
        },
      },

      // ── Livraison ───────────────────────────
      Livraison: {
        type: "object",
        properties: {
          id:             { type: "integer", example: 5 },
          commandeId:     { type: "integer", example: 1 },
          livreurId:      { type: "integer", example: 2 },
          statut:         { type: "string", enum: ["en_cours", "livree"], example: "livree" },
          dateLivraison:  { type: "string", format: "date-time", nullable: true },
          destinationLat: { type: "number", example: 14.6789, nullable: true },
          destinationLng: { type: "number", example: -17.4412, nullable: true },
        },
      },

      // ── Livreur ─────────────────────────────
      LivreurWithUser: {
        type: "object",
        properties: {
          id:            { type: "integer" },
          disponible:    { type: "boolean" },
          estBloque:     { type: "boolean" },
          commissionDue: { type: "number" },
          latActuelle:   { type: "number", nullable: true, description: "📍 Position GPS temps réel" },
          lngActuelle:   { type: "number", nullable: true },
          user:          { $ref: "#/components/schemas/RegisterLivreur" },
        },
      },

      // ── Paiements ───────────────────────────
      PaiementCommission: {
        type: "object",
        properties: {
          id:        { type: "integer" },
          livreurId: { type: "integer" },
          montant:   { type: "number" },
          statut:    { type: "string", enum: ["en_attente", "payee"] },
        },
      },

      PaiementJourResponse: {
        type: "object",
        properties: {
          livreurId:       { type: "integer", example: 2 },
          date:            { type: "string", format: "date", example: "2025-04-15" },
          montantTotal:    { type: "number", example: 1500.50 },
          commandesPayees: { type: "integer", example: 6 },
        },
      },

      RevenusResponse: {
        type: "object",
        properties: {
          total:         { type: "number", example: 25000, description: "Total brut des montants livrés" },
          commissionDue: { type: "number", example: 2500 },
          net:           { type: "number", example: 22500, description: "Total - commission" },
        },
      },

      // ── Navigation ──────────────────────────
      AccepterMissionBody: {
        type: "object",
        required: ["commandeId"],
        properties: {
          commandeId: { type: "integer", example: 1 },
          lat: {
            type: "number",
            example: 14.6928,
            description: "Latitude GPS actuelle (optionnel — déclenche la navigation si fourni)",
          },
          lng: {
            type: "number",
            example: -17.4467,
            description: "Longitude GPS actuelle (optionnel)",
          },
        },
      },

      AccepterMissionResponse: {
        type: "object",
        properties: {
          livraison: { $ref: "#/components/schemas/Livraison" },
          navigation: {
            nullable: true,
            description: "Null si lat/lng non fournis",
            type: "object",
            properties: {
              route: {
                type: "object",
                description: "Géométrie GeoJSON LineString à afficher sur la carte Mapbox",
                properties: {
                  type: { type: "string", example: "LineString" },
                  coordinates: {
                    type: "array",
                    items: { type: "array", items: { type: "number" } },
                    example: [[-17.4467, 14.6928], [-17.4450, 14.6935]],
                  },
                },
              },
              etapes: {
                type: "array",
                items: { $ref: "#/components/schemas/EtapeNavigation" },
              },
              eta:         { type: "string", format: "date-time", example: "2025-04-06T10:32:00.000Z" },
              destination: {
                type: "object",
                properties: {
                  lat: { type: "number", example: 14.6789 },
                  lng: { type: "number", example: -17.4412 },
                },
              },
              resume: { $ref: "#/components/schemas/ResumeNavigation" },
            },
          },
        },
      },

      DemarrerNavigationBody: {
        type: "object",
        required: ["livraisonId", "lat", "lng"],
        properties: {
          livraisonId: { type: "integer", example: 5 },
          lat:         { type: "number", example: 14.6928 },
          lng:         { type: "number", example: -17.4467 },
        },
      },

      NavigationResponse: {
        type: "object",
        properties: {
          destination: {
            type: "object",
            properties: {
              lat: { type: "number", example: 14.6789 },
              lng: { type: "number", example: -17.4412 },
            },
          },
          route: {
            type: "object",
            properties: {
              geometry: {
                type: "object",
                properties: {
                  type:        { type: "string", example: "LineString" },
                  coordinates: { type: "array", items: { type: "array", items: { type: "number" } } },
                },
              },
              etapes:               { type: "array", items: { $ref: "#/components/schemas/EtapeNavigation" } },
              distanceTotale:       { type: "number", example: 3400 },
              dureeTotale:          { type: "number", example: 720 },
              eta:                  { type: "string", format: "date-time" },
              congestionsDetectees: { type: "boolean", example: false },
            },
          },
          resume: { $ref: "#/components/schemas/ResumeNavigation" },
        },
      },

      InstructionResponse: {
        type: "object",
        properties: {
          instruction:             { type: "string", example: "Tournez à gauche sur Avenue Bourguiba" },
          distanceProchainVirage:  { type: "integer", example: 180, description: "en mètres" },
          eta:                     { type: "string", format: "date-time" },
          instructionVocale: {
            type: "string",
            example: "Dans 180 mètres, tournez à gauche sur avenue bourguiba",
            description: "🔊 Texte prêt à passer en Text-to-Speech",
          },
        },
      },

      ETAResponse: {
        type: "object",
        properties: {
          eta:                     { type: "string", format: "date-time", example: "2025-04-06T10:38:00.000Z" },
          distanceRestanteMetres:  { type: "integer", example: 1200 },
          dureeRestanteSecondes:   { type: "integer", example: 420 },
          congestionsDetectees: {
            type: "boolean",
            example: true,
            description: "🚦 True si trafic chargé sur le reste du trajet",
          },
        },
      },

      EtapeNavigation: {
        type: "object",
        properties: {
          instruction: { type: "string", example: "Continuez tout droit sur la RN1" },
          distance:    { type: "integer", example: 450, description: "en mètres" },
          duree:       { type: "integer", example: 90, description: "en secondes" },
          coordonnees: {
            type: "object",
            properties: {
              lat: { type: "number", example: 14.693 },
              lng: { type: "number", example: -17.445 },
            },
          },
        },
      },

      ResumeNavigation: {
        type: "object",
        properties: {
          distanceKm:    { type: "string", example: "3.4" },
          dureeMinutes:  { type: "integer", example: 12 },
          eta:           { type: "string", format: "date-time" },
          nombreEtapes:  { type: "integer", example: 8 },
          alerte: {
            type: "string",
            nullable: true,
            example: "⚠️ Trafic chargé sur votre itinéraire",
          },
        },
      },
    },
  },
};