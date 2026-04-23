import { OpenAPIV3 } from "openapi-types";

export const swaggerDocument: OpenAPIV3.Document = {
  openapi: "3.0.3",

  info: {
    title: "MOTO EXPRESS API",
    version: "1.5.0",
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
    // ADMIN
    // ═══════════════════════════════════════════
    "/admin/clients": {
      get: {
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        summary: "Liste clients",
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
        summary: "Créer client",
        description:
          "Lat/lng récupérés automatiquement depuis la carte pour adresse et adresseLivraison",
        requestBody: {
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ClientCreate" } },
          },
        },
        responses: { "201": { description: "Client créé" } },
      },
    },

    "/admin/commandes": {
      get: {
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        summary: "Liste commandes",
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
        summary: "Créer commande",
        description: "Montant et commission (10%) calculés automatiquement selon la distance",
        requestBody: {
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/CommandeCreate" } },
          },
        },
        responses: { "201": { description: "Commande créée" } },
      },
    },

    "/admin/commandes/assigner": {
      post: {
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        summary: "Assigner commande à livreur",
        requestBody: {
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
        responses: { "200": { description: "Commande assignée" } },
      },
    },

    "/admin/commandes/payer-commission": {
      put: {
        tags: ["Paiements"],
        security: [{ bearerAuth: [] }],
        summary: "Marquer la commission d'une commande comme payée",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CommandeCommissionUpdate" },
            },
          },
        },
        responses: { "200": { description: "Commission marquée comme payée" } },
      },
    },

    "/admin/paiements": {
      post: {
        tags: ["Paiements"],
        security: [{ bearerAuth: [] }],
        summary: "Valider un paiement de commission livreur",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["paiementId"],
                properties: { paiementId: { type: "integer", example: 3 } },
              },
            },
          },
        },
        responses: { "200": { description: "Paiement validé" } },
      },
    },

    "/admin/blocages": {
      get: {
        tags: ["Blocages"],
        security: [{ bearerAuth: [] }],
        summary: "Liste livreurs bloqués",
        responses: {
          "200": {
            description: "Liste des livreurs bloqués",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/LivreurWithUser" },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Blocages"],
        security: [{ bearerAuth: [] }],
        summary: "Bloquer ou débloquer un livreur",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["livreurId", "bloquer"],
                properties: {
                  livreurId: { type: "integer", example: 2 },
                  bloquer: { type: "boolean", example: true },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Statut de blocage modifié" } },
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

    // ═══════════════════════════════════════════
    // LIVREUR (héritage swagger v1)
    // ═══════════════════════════════════════════
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
  },

  // ═══════════════════════════════════════════
  // SCHEMAS
  // ═══════════════════════════════════════════
  components: {
    securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },

    schemas: {
      RegisterAdmin: {
        type: "object",
        required: ["nom", "prenom", "email", "password", "role"],
        properties: {
          nom: { type: "string", example: "Diallo" },
          prenom: { type: "string", example: "Moussa" },
          email: { type: "string", example: "admin@motoexpress.sn" },
          password: { type: "string", example: "Admin1234!" },
          role: { type: "string", enum: ["SUPERADMIN", "ADMIN"] },
        },
      },

      RegisterLivreur: {
        type: "object",
        required: ["nom", "prenom", "telephone", "password", "role"],
        properties: {
          nom: { type: "string", example: "Ndiaye" },
          prenom: { type: "string", example: "Ibrahima" },
          telephone: { type: "string", example: "771234567" },
          password: { type: "string", example: "Livreur1234!" },
          role: { type: "string", enum: ["LIVREUR"] },
          statut: { type: "string", enum: ["actif", "inactif"] },
          disponible: { type: "boolean", example: true },
        },
      },

      Client: {
        type: "object",
        properties: {
          nom: { type: "string" },
          prenom: { type: "string" },
          telephone: { type: "string" },
          adresse: { type: "string" },
          adresseLivraison: { type: "string" },
          telephoneDestinataire: { type: "string" },
          lat: { type: "number" },
          lng: { type: "number" },
          latLivraison: { type: "number" },
          lngLivraison: { type: "number" },
        },
      },

      ClientCreate: {
        type: "object",
        required: ["nom", "prenom", "telephone", "adresse", "adresseLivraison", "telephoneDestinataire"],
        properties: {
          nom: { type: "string", example: "Fall" },
          prenom: { type: "string", example: "Fatou" },
          telephone: { type: "string", example: "781234567" },
          adresse: { type: "string", example: "Almadies, Dakar" },
          adresseLivraison: { type: "string", example: "Plateau, Dakar" },
          telephoneDestinataire: { type: "string", example: "761234567" },
        },
      },

      Commande: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          clientId: { type: "integer", example: 3 },
          montant: { type: "number", example: 2500 },
          commission: { type: "number", example: 250 },
          commissionPaye: { type: "boolean", example: false },
          statut: { type: "string", enum: ["en_attente", "en_cours", "livree"] },
          createdAt: { type: "string", format: "date-time" },
        },
      },

      CommandeCreate: {
        type: "object",
        required: ["clientId", "adresseLivraison"],
        properties: {
          clientId: { type: "integer", example: 3 },
          adresseLivraison: { type: "string", example: "Medina, Dakar" },
        },
      },

      CommandeCommissionUpdate: {
        type: "object",
        required: ["commandeId"],
        properties: {
          commandeId: { type: "integer", example: 1 },
        },
      },

      Livraison: {
        type: "object",
        properties: {
          id: { type: "integer", example: 5 },
          commandeId: { type: "integer", example: 1 },
          livreurId: { type: "integer", example: 2 },
          statut: { type: "string", enum: ["en_cours", "livree"], example: "livree" },
          dateLivraison: { type: "string", format: "date-time", nullable: true },
          destinationLat: { type: "number", example: 14.6789, nullable: true },
          destinationLng: { type: "number", example: -17.4412, nullable: true },
        },
      },

      LivreurWithUser: {
        type: "object",
        properties: {
          id: { type: "integer" },
          disponible: { type: "boolean" },
          estBloque: { type: "boolean" },
          commissionDue: { type: "number" },
          latActuelle: { type: "number", nullable: true, description: "📍 Position GPS temps réel" },
          lngActuelle: { type: "number", nullable: true },
          user: { $ref: "#/components/schemas/RegisterLivreur" },
        },
      },

      PaiementCommission: {
        type: "object",
        properties: {
          id: { type: "integer" },
          livreurId: { type: "integer" },
          montant: { type: "number" },
          statut: { type: "string", enum: ["en_attente", "payé"] },
        },
      },

      RevenusResponse: {
        type: "object",
        properties: {
          total: { type: "number", example: 25000, description: "Total brut des montants livrés" },
          commissionDue: { type: "number", example: 2500 },
          net: { type: "number", example: 22500, description: "Total - commission" },
        },
      },

      // ── Navigation Schemas ────────────────────

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
              eta: { type: "string", format: "date-time", example: "2025-04-06T10:32:00.000Z" },
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
          lat: { type: "number", example: 14.6928 },
          lng: { type: "number", example: -17.4467 },
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
                  type: { type: "string", example: "LineString" },
                  coordinates: { type: "array", items: { type: "array", items: { type: "number" } } },
                },
              },
              etapes: { type: "array", items: { $ref: "#/components/schemas/EtapeNavigation" } },
              distanceTotale: { type: "number", example: 3400 },
              dureeTotale: { type: "number", example: 720 },
              eta: { type: "string", format: "date-time" },
              congestionsDetectees: { type: "boolean", example: false },
            },
          },
          resume: { $ref: "#/components/schemas/ResumeNavigation" },
        },
      },

      InstructionResponse: {
        type: "object",
        properties: {
          instruction: {
            type: "string",
            example: "Tournez à gauche sur Avenue Bourguiba",
          },
          distanceProchainVirage: { type: "integer", example: 180, description: "en mètres" },
          eta: { type: "string", format: "date-time" },
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
          eta: { type: "string", format: "date-time", example: "2025-04-06T10:38:00.000Z" },
          distanceRestanteMetres: { type: "integer", example: 1200 },
          dureeRestanteSecondes: { type: "integer", example: 420 },
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
          distance: { type: "integer", example: 450, description: "en mètres" },
          duree: { type: "integer", example: 90, description: "en secondes" },
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
          distanceKm: { type: "string", example: "3.4" },
          dureeMinutes: { type: "integer", example: 12 },
          eta: { type: "string", format: "date-time" },
          nombreEtapes: { type: "integer", example: 8 },
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