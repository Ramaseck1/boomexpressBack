"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerDocument = void 0;
exports.swaggerDocument = {
    openapi: "3.0.3",
    info: {
        title: "MOTO EXPRESS API",
        version: "1.7.0",
        description: "API livraison moto - Dakar et Saint-Louis (gestion commandes, clients, livreurs, paiements, blocages, navigation Mapbox)",
    },
    servers: [{ url: "http://localhost:3000/api" }],
    tags: [
        { name: "Auth" },
        { name: "Admin" },
        { name: "Livreur" },
        { name: "Documents", description: "📄 Gestion des documents livreurs (CNI, permis, assurance)" },
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
                    { name: "clientId", in: "path", required: true, schema: { type: "integer", example: 1 } },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": { schema: { $ref: "#/components/schemas/ClientUpdate" } },
                    },
                },
                responses: {
                    "200": { description: "Client mis à jour", content: { "application/json": { schema: { $ref: "#/components/schemas/Client" } } } },
                    "400": { description: "Erreur de mise à jour" },
                    "404": { description: "Client introuvable" },
                },
            },
            delete: {
                tags: ["Admin"],
                security: [{ bearerAuth: [] }],
                summary: "Supprimer un client",
                parameters: [
                    { name: "clientId", in: "path", required: true, schema: { type: "integer", example: 1 } },
                ],
                responses: {
                    "200": { description: "Client supprimé avec succès" },
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
                    { name: "clientId", in: "path", required: true, schema: { type: "integer", example: 1 } },
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
                },
            },
        },
        "/admin/clients-commandes": {
            post: {
                tags: ["Admin"],
                security: [{ bearerAuth: [] }],
                summary: "Créer client + commande en une seule requête",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ClientEtCommandeCreate" },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "Client et commande créés avec succès",
                        content: {
                            "application/json": { schema: { $ref: "#/components/schemas/ClientEtCommandeResponse" } },
                        },
                    },
                    "400": { description: "Champs manquants ou erreur de géocodage" },
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
                    { name: "statut", in: "query", schema: { type: "string", enum: ["en_attente", "en_cours", "livree"] } },
                    { name: "dateDebut", in: "query", schema: { type: "string", format: "date" } },
                    { name: "dateFin", in: "query", schema: { type: "string", format: "date" } },
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
                requestBody: {
                    required: true,
                    content: {
                        "application/json": { schema: { $ref: "#/components/schemas/CommandeCreate" } },
                    },
                },
                responses: {
                    "200": { description: "Commande créée" },
                    "400": { description: "clientId manquant ou adresse invalide" },
                },
            },
        },
        "/admin/commandes/{commandeId}": {
            put: {
                tags: ["Admin"],
                security: [{ bearerAuth: [] }],
                summary: "Mettre à jour une commande",
                parameters: [
                    { name: "commandeId", in: "path", required: true, schema: { type: "integer", example: 1 } },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": { schema: { $ref: "#/components/schemas/CommandeUpdate" } },
                    },
                },
                responses: {
                    "200": { description: "Commande mise à jour" },
                    "404": { description: "Commande introuvable" },
                },
            },
            delete: {
                tags: ["Admin"],
                security: [{ bearerAuth: [] }],
                summary: "Supprimer une commande",
                parameters: [
                    { name: "commandeId", in: "path", required: true, schema: { type: "integer", example: 1 } },
                ],
                responses: {
                    "200": { description: "Commande supprimée avec succès" },
                    "400": { description: "Erreur lors de la suppression" },
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
                    "200": { description: "Commande assignée avec succès" },
                    "400": { description: "commandeId ou livreurId manquant" },
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
                        description: "Liste des livreurs",
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
                    { name: "livreurId", in: "path", required: true, schema: { type: "integer", example: 2 } },
                ],
                responses: {
                    "200": {
                        description: "Profil livreur",
                        content: {
                            "application/json": { schema: { $ref: "#/components/schemas/LivreurWithUser" } },
                        },
                    },
                },
            },
        },
        "/admin/livreurs/{livreurId}/toggle": {
            patch: {
                tags: ["Admin"],
                security: [{ bearerAuth: [] }],
                summary: "Activer / désactiver le compte d'un livreur",
                parameters: [
                    { name: "livreurId", in: "path", required: true, schema: { type: "integer", example: 2 } },
                ],
                responses: { "200": { description: "Statut du compte basculé" } },
            },
        },
        // ═══════════════════════════════════════════
        // ADMIN — DOCUMENTS LIVREUR ✅ NOUVEAU
        // ═══════════════════════════════════════════
        "/admin/livreurs/{livreurId}/documents": {
            post: {
                tags: ["Documents"],
                security: [{ bearerAuth: [] }],
                summary: "📤 Uploader les documents d'un livreur",
                description: "Upload les documents vers **Cloudinary**. La CNI recto + verso est **obligatoire** lors du premier upload. Les autres documents sont optionnels. Les fichiers acceptés sont : JPEG, PNG, WEBP, PDF (max 5 MB par fichier).",
                parameters: [
                    {
                        name: "livreurId",
                        in: "path",
                        required: true,
                        schema: { type: "integer", example: 2 },
                        description: "ID du livreur",
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: {
                                type: "object",
                                required: ["cni_recto", "cni_verso"],
                                properties: {
                                    cni_recto: {
                                        type: "string",
                                        format: "binary",
                                        description: "🪪 CNI recto — OBLIGATOIRE (JPEG, PNG, WEBP, PDF)",
                                    },
                                    cni_verso: {
                                        type: "string",
                                        format: "binary",
                                        description: "🪪 CNI verso — OBLIGATOIRE (JPEG, PNG, WEBP, PDF)",
                                    },
                                    permis: {
                                        type: "string",
                                        format: "binary",
                                        description: "🚗 Permis de conduire — optionnel",
                                    },
                                    assurance: {
                                        type: "string",
                                        format: "binary",
                                        description: "📋 Attestation d'assurance — optionnel",
                                    },
                                    recepisse_moto: {
                                        type: "string",
                                        format: "binary",
                                        description: "🏍️ Récépissé moto — optionnel",
                                    },
                                },
                            },
                            encoding: {
                                cni_recto: { contentType: "image/jpeg, image/png, image/webp, application/pdf" },
                                cni_verso: { contentType: "image/jpeg, image/png, image/webp, application/pdf" },
                                permis: { contentType: "image/jpeg, image/png, image/webp, application/pdf" },
                                assurance: { contentType: "image/jpeg, image/png, image/webp, application/pdf" },
                                recepisse_moto: { contentType: "image/jpeg, image/png, image/webp, application/pdf" },
                            },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Documents uploadés avec succès sur Cloudinary",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string", example: "Documents uploadés avec succès" },
                                        documents: { $ref: "#/components/schemas/DocumentLivreur" },
                                    },
                                },
                            },
                        },
                    },
                    "400": {
                        description: "CNI manquant (premier upload) ou format de fichier invalide",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        error: { type: "string", example: "CNI recto et verso sont obligatoires" },
                                    },
                                },
                            },
                        },
                    },
                    "404": { description: "Livreur introuvable" },
                },
            },
            get: {
                tags: ["Documents"],
                security: [{ bearerAuth: [] }],
                summary: "📄 Voir les documents d'un livreur",
                description: "Retourne les URLs Cloudinary de tous les documents du livreur.",
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
                        description: "Documents du livreur",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/DocumentLivreur" },
                            },
                        },
                    },
                    "404": { description: "Livreur ou documents introuvables" },
                },
            },
            delete: {
                tags: ["Documents"],
                security: [{ bearerAuth: [] }],
                summary: "🗑️ Supprimer un document spécifique",
                description: "Supprime le fichier de Cloudinary et met le champ à `null` en base.",
                parameters: [
                    {
                        name: "livreurId",
                        in: "path",
                        required: true,
                        schema: { type: "integer", example: 2 },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["type"],
                                properties: {
                                    type: {
                                        type: "string",
                                        enum: ["cni_recto", "cni_verso", "permis", "assurance", "recepisse_moto"],
                                        example: "permis",
                                        description: "Type du document à supprimer",
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Document supprimé",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string", example: "Document supprimé" },
                                        document: { $ref: "#/components/schemas/DocumentLivreur" },
                                    },
                                },
                            },
                        },
                    },
                    "400": { description: "type manquant ou document introuvable" },
                },
            },
        },
        "/admin/livreurs/{livreurId}/valider": {
            post: {
                tags: ["Documents"],
                security: [{ bearerAuth: [] }],
                summary: "✅ Valider le profil d'un livreur",
                description: "Passe `profilValide` à `true` et `estVerifie` à `true`. **Nécessite que le CNI recto et verso soient uploadés.** Une fois validé, le livreur peut activer/désactiver sa disponibilité.",
                parameters: [
                    {
                        name: "livreurId",
                        in: "path",
                        required: true,
                        schema: { type: "integer", example: 2 },
                        description: "ID du livreur à valider",
                    },
                ],
                responses: {
                    "200": {
                        description: "Profil validé — le livreur peut désormais toggle sa disponibilité",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string", example: "Profil validé avec succès" },
                                        livreur: { $ref: "#/components/schemas/LivreurWithUser" },
                                    },
                                },
                            },
                        },
                    },
                    "400": {
                        description: "CNI manquant — impossible de valider",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        error: { type: "string", example: "CNI recto et verso obligatoires avant validation" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        // ═══════════════════════════════════════════
        // ADMIN — BLOCAGES & PAIEMENTS
        // ═══════════════════════════════════════════
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
                    "400": { description: "livreurId ou date manquant / aucune commission en attente" },
                },
            },
        },
        // ═══════════════════════════════════════════
        // LIVREUR
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
                            "application/json": { schema: { $ref: "#/components/schemas/LivreurWithUser" } },
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
                description: "⚠️ Bloqué si `profilValide = false` — l'admin doit d'abord valider le profil.",
                responses: {
                    "200": {
                        description: "Disponibilité modifiée",
                        content: {
                            "application/json": { schema: { $ref: "#/components/schemas/LivreurWithUser" } },
                        },
                    },
                    "400": {
                        description: "Profil non validé par l'admin",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        error: { type: "string", example: "Votre profil n'est pas encore validé par l'admin" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/livreur/missions": {
            get: {
                tags: ["Livreur"],
                security: [{ bearerAuth: [] }],
                summary: "Voir les missions disponibles",
                responses: {
                    "200": {
                        description: "Liste des missions",
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
                requestBody: {
                    required: true,
                    content: {
                        "application/json": { schema: { $ref: "#/components/schemas/AccepterMissionBody" } },
                    },
                },
                responses: {
                    "200": {
                        description: "Mission acceptée",
                        content: {
                            "application/json": { schema: { $ref: "#/components/schemas/AccepterMissionResponse" } },
                        },
                    },
                    "400": { description: "Livreur bloqué ou introuvable" },
                },
            },
        },
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
                                    livraisonId: { type: "integer", example: 5 },
                                },
                            },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Livraison confirmée",
                        content: {
                            "application/json": { schema: { $ref: "#/components/schemas/Livraison" } },
                        },
                    },
                },
            },
        },
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
                            "application/json": { schema: { $ref: "#/components/schemas/RevenusResponse" } },
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
                            "application/json": { schema: { $ref: "#/components/schemas/NavigationResponse" } },
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
                parameters: [
                    { name: "livraisonId", in: "path", required: true, schema: { type: "integer", example: 5 } },
                    { name: "lat", in: "query", required: true, schema: { type: "number", example: 14.6928 } },
                    { name: "lng", in: "query", required: true, schema: { type: "number", example: -17.4467 } },
                ],
                responses: {
                    "200": {
                        description: "Instruction de navigation",
                        content: {
                            "application/json": { schema: { $ref: "#/components/schemas/InstructionResponse" } },
                        },
                    },
                },
            },
        },
        "/livreur/navigation/{livraisonId}/eta": {
            get: {
                tags: ["Navigation"],
                security: [{ bearerAuth: [] }],
                summary: "🚦 ETA mis à jour avec le trafic temps réel",
                parameters: [
                    { name: "livraisonId", in: "path", required: true, schema: { type: "integer", example: 5 } },
                    { name: "lat", in: "query", required: true, schema: { type: "number", example: 14.6935 } },
                    { name: "lng", in: "query", required: true, schema: { type: "number", example: -17.4450 } },
                ],
                responses: {
                    "200": {
                        description: "ETA calculé",
                        content: {
                            "application/json": { schema: { $ref: "#/components/schemas/ETAResponse" } },
                        },
                    },
                },
            },
        },
        "/livreur/navigation/geocode": {
            get: {
                tags: ["Navigation"],
                security: [{ bearerAuth: [] }],
                summary: "📍 Convertir une adresse en coordonnées GPS",
                parameters: [
                    { name: "adresse", in: "query", required: true, schema: { type: "string", example: "12 Rue Moussé Diop, Dakar" } },
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
                    disponible: { type: "boolean", example: false },
                },
            },
            // ── Client ──────────────────────────────
            Client: {
                type: "object",
                properties: {
                    id: { type: "integer", example: 1 },
                    nom: { type: "string", example: "Diallo" },
                    prenom: { type: "string", example: "Fatou" },
                    telephone: { type: "string", example: "771234567" },
                    adresse: { type: "string", example: "Guet Ndar, Saint-Louis" },
                    adresseLivraison: { type: "string", example: "Sor, Saint-Louis" },
                    telephoneDestinataire: { type: "string", example: "761234567" },
                    createdAt: { type: "string", format: "date-time" },
                },
            },
            ClientCreate: {
                type: "object",
                required: ["nom", "prenom", "telephone", "adresse", "adresseLivraison", "telephoneDestinataire"],
                properties: {
                    nom: { type: "string", example: "Fall" },
                    prenom: { type: "string", example: "Fatou" },
                    telephone: { type: "string", example: "781234567" },
                    adresse: { type: "string", example: "Guet Ndar, Saint-Louis" },
                    adresseLivraison: { type: "string", example: "Sor, Saint-Louis" },
                    telephoneDestinataire: { type: "string", example: "761234567" },
                },
            },
            ClientUpdate: {
                type: "object",
                properties: {
                    nom: { type: "string", example: "Fall" },
                    prenom: { type: "string", example: "Fatou" },
                    telephone: { type: "string", example: "781234567" },
                    adresse: { type: "string", example: "Guet Ndar, Saint-Louis" },
                    adresseLivraison: { type: "string", example: "Sor, Saint-Louis" },
                    telephoneDestinataire: { type: "string", example: "761234567" },
                },
            },
            ClientEtCommandeCreate: {
                type: "object",
                required: ["nom", "prenom", "telephone", "adresse", "adresseLivraison", "telephoneDestinataire"],
                properties: {
                    nom: { type: "string", example: "Diallo" },
                    prenom: { type: "string", example: "Fatou" },
                    telephone: { type: "string", example: "771234567" },
                    adresse: { type: "string", example: "Guet Ndar, Saint-Louis" },
                    adresseLivraison: { type: "string", example: "Sor, Saint-Louis" },
                    telephoneDestinataire: { type: "string", example: "761234567" },
                },
            },
            ClientEtCommandeResponse: {
                type: "object",
                properties: {
                    message: { type: "string", example: "Client et commande créés avec succès" },
                    client: { $ref: "#/components/schemas/Client" },
                    commande: { $ref: "#/components/schemas/Commande" },
                },
            },
            // ── Commande ────────────────────────────
            Commande: {
                type: "object",
                properties: {
                    id: { type: "integer", example: 1 },
                    clientId: { type: "integer", example: 3 },
                    montant: { type: "number", example: 2500 },
                    commission: { type: "number", example: 250 },
                    commissionPaye: { type: "boolean", example: false },
                    statut: { type: "string", enum: ["en_attente", "en_cours", "livree"], example: "en_attente" },
                    createdAt: { type: "string", format: "date-time" },
                },
            },
            CommandeCreate: {
                type: "object",
                required: ["clientId"],
                properties: {
                    clientId: { type: "integer", example: 3 },
                    adresseLivraison: { type: "string", example: "Sor, Saint-Louis" },
                },
            },
            CommandeUpdate: {
                type: "object",
                properties: {
                    statut: { type: "string", enum: ["en_attente", "en_cours", "livree"] },
                    commissionPaye: { type: "boolean", example: true },
                },
            },
            // ── Livraison ───────────────────────────
            Livraison: {
                type: "object",
                properties: {
                    id: { type: "integer", example: 5 },
                    commandeId: { type: "integer", example: 1 },
                    livreurId: { type: "integer", example: 2 },
                    statut: { type: "string", enum: ["en_cours", "livree"] },
                    dateLivraison: { type: "string", format: "date-time", nullable: true },
                    destinationLat: { type: "number", nullable: true },
                    destinationLng: { type: "number", nullable: true },
                },
            },
            // ── Livreur ─────────────────────────────
            LivreurWithUser: {
                type: "object",
                properties: {
                    id: { type: "integer" },
                    disponible: { type: "boolean" },
                    profilValide: { type: "boolean", description: "✅ true = peut toggle sa disponibilité" },
                    estBloque: { type: "boolean" },
                    commissionDue: { type: "number" },
                    latActuelle: { type: "number", nullable: true },
                    lngActuelle: { type: "number", nullable: true },
                    user: { $ref: "#/components/schemas/RegisterLivreur" },
                    documents: { $ref: "#/components/schemas/DocumentLivreur", nullable: true },
                },
            },
            // ── Documents Livreur ✅ NOUVEAU ─────────
            DocumentLivreur: {
                type: "object",
                properties: {
                    id: { type: "integer", example: 1 },
                    livreurId: { type: "integer", example: 2 },
                    cniRectoUrl: { type: "string", format: "uri", example: "https://res.cloudinary.com/xxx/image/upload/cni_recto.jpg" },
                    cniRectoPublicId: { type: "string", example: "boom-express/livreurs/2/cni_recto" },
                    cniVersoUrl: { type: "string", format: "uri", example: "https://res.cloudinary.com/xxx/image/upload/cni_verso.jpg" },
                    cniVersoPublicId: { type: "string", example: "boom-express/livreurs/2/cni_verso" },
                    permisUrl: { type: "string", format: "uri", nullable: true, example: null },
                    permisPublicId: { type: "string", nullable: true, example: null },
                    assuranceUrl: { type: "string", format: "uri", nullable: true, example: null },
                    assurancePublicId: { type: "string", nullable: true, example: null },
                    recepisseUrl: { type: "string", format: "uri", nullable: true, example: null },
                    recepissePublicId: { type: "string", nullable: true, example: null },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                },
            },
            // ── Paiements ───────────────────────────
            PaiementCommission: {
                type: "object",
                properties: {
                    id: { type: "integer" },
                    livreurId: { type: "integer" },
                    montant: { type: "number" },
                    statut: { type: "string", enum: ["en_attente", "payee"] },
                },
            },
            PaiementJourResponse: {
                type: "object",
                properties: {
                    livreurId: { type: "integer", example: 2 },
                    date: { type: "string", format: "date", example: "2025-04-15" },
                    montantTotal: { type: "number", example: 1500.50 },
                    commandesPayees: { type: "integer", example: 6 },
                },
            },
            RevenusResponse: {
                type: "object",
                properties: {
                    total: { type: "number", example: 25000 },
                    commissionDue: { type: "number", example: 2500 },
                    net: { type: "number", example: 22500 },
                },
            },
            // ── Navigation ──────────────────────────
            AccepterMissionBody: {
                type: "object",
                required: ["commandeId"],
                properties: {
                    commandeId: { type: "integer", example: 1 },
                    lat: { type: "number", example: 14.6928 },
                    lng: { type: "number", example: -17.4467 },
                },
            },
            AccepterMissionResponse: {
                type: "object",
                properties: {
                    livraison: { $ref: "#/components/schemas/Livraison" },
                    navigation: { nullable: true, type: "object" },
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
                    destination: { type: "object", properties: { lat: { type: "number" }, lng: { type: "number" } } },
                    route: { type: "object" },
                    resume: { $ref: "#/components/schemas/ResumeNavigation" },
                },
            },
            InstructionResponse: {
                type: "object",
                properties: {
                    instruction: { type: "string", example: "Tournez à gauche sur Avenue Bourguiba" },
                    distanceProchainVirage: { type: "integer", example: 180 },
                    eta: { type: "string", format: "date-time" },
                    instructionVocale: { type: "string" },
                },
            },
            ETAResponse: {
                type: "object",
                properties: {
                    eta: { type: "string", format: "date-time" },
                    distanceRestanteMetres: { type: "integer", example: 1200 },
                    dureeRestanteSecondes: { type: "integer", example: 420 },
                    congestionsDetectees: { type: "boolean", example: true },
                },
            },
            EtapeNavigation: {
                type: "object",
                properties: {
                    instruction: { type: "string" },
                    distance: { type: "integer" },
                    duree: { type: "integer" },
                    coordonnees: { type: "object", properties: { lat: { type: "number" }, lng: { type: "number" } } },
                },
            },
            ResumeNavigation: {
                type: "object",
                properties: {
                    distanceKm: { type: "string", example: "3.4" },
                    dureeMinutes: { type: "integer", example: 12 },
                    eta: { type: "string", format: "date-time" },
                    nombreEtapes: { type: "integer", example: 8 },
                    alerte: { type: "string", nullable: true },
                },
            },
        },
    },
};
