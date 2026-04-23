// services/socketService.ts
// 📡 WebSocket temps réel — Position GPS du livreur en direct

import { Server as HttpServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import { prisma } from "../../prisma/prisma.config";
import { recalculerRoute, calculerDistanceHaversine, type Coordonnees } from "./mapboxService";

// ─── Instance globale Socket.IO ───────────────────────────────────────────────

let io: SocketServer;

// Stockage en mémoire des sessions de navigation actives
// Map<livreurId → SessionNavigation>
const sessionsActives = new Map<number, SessionNavigation>();

interface SessionNavigation {
  livraisonId: number;
  destination: Coordonnees;
  dernierePosition: Coordonnees;
  routeActuelle: any;
  dernierRecalcul: Date;
}

// ─── Initialisation ───────────────────────────────────────────────────────────

export const initSocket = (httpServer: HttpServer): SocketServer => {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log(`🔌 Client connecté : ${socket.id}`);

    // ── Le livreur rejoint sa salle privée ──
    // Événement émis depuis l'app mobile du livreur
    socket.on("livreur:rejoindre", async ({ livreurId, livraisonId }) => {
      const salle = `livreur_${livreurId}`;
      socket.join(salle);
      socket.join(`livraison_${livraisonId}`); // Salle partagée avec le client
      console.log(`🚗 Livreur ${livreurId} rejoint la salle ${salle}`);

      socket.emit("livreur:connecte", {
        message: "Navigation active",
        livreurId,
      });
    });

    // ── Le client suit sa livraison ──
    socket.on("client:suivre", ({ livraisonId }) => {
      socket.join(`livraison_${livraisonId}`);
      console.log(`👤 Client suit la livraison ${livraisonId}`);
    });

    // ── 📍 Mise à jour de position GPS (émis par l'app livreur en continu) ──
    socket.on("livreur:position", async (payload: {
      livreurId: number;
      livraisonId: number;
      lat: number;
      lng: number;
      vitesse?: number;       // km/h
      cap?: number;           // Orientation en degrés (pour rotation du marqueur)
    }) => {
      const { livreurId, livraisonId, lat, lng, vitesse, cap } = payload;
      const positionActuelle: Coordonnees = { lat, lng };

      try {
        // 1️⃣ Sauvegarde en base de données
        await prisma.livreur.update({
          where: { id: livreurId },
          data: {
            latActuelle: lat,
            lngActuelle: lng,
            derniereActivite: new Date(),
          },
        });

        // 2️⃣ Broadcast à tous les clients qui suivent cette livraison
        io.to(`livraison_${livraisonId}`).emit("livraison:position", {
          livreurId,
          lat,
          lng,
          vitesse,
          cap,
          timestamp: new Date().toISOString(),
        });

        // 3️⃣ 🔄 Vérification de déviation → recalcul automatique
        const session = sessionsActives.get(livreurId);
        if (session) {
          const maintenant = new Date();
          const secondesDepuisDernierRecalcul =
            (maintenant.getTime() - session.dernierRecalcul.getTime()) / 1000;

          // Recalcul max 1 fois toutes les 30 secondes pour éviter le spam API
          if (secondesDepuisDernierRecalcul > 30) {
            const { recalcule, route } = await recalculerRoute(
              positionActuelle,
              session.destination,
              50 // seuil 50 mètres
            );

            if (recalcule && route) {
              console.log(`🔄 Nouvelle route calculée pour livreur ${livreurId}`);

              // Mise à jour de la session
              session.routeActuelle = route;
              session.dernierRecalcul = maintenant;

              // Envoi de la nouvelle route au livreur
              io.to(`livreur_${livreurId}`).emit("navigation:recalcul", {
                route: route.geometry,
                etapes: route.etapes,
                eta: route.eta,
                congestionsDetectees: route.congestionsDetectees,
                distanceTotale: route.distanceTotale,
                dureeTotale: route.dureeTotale,
              });

              // 🔊 Déclencher instruction vocale après recalcul
              if (route.etapes.length > 0) {
                io.to(`livreur_${livreurId}`).emit("navigation:voix", {
                  instruction: "Itinéraire recalculé. " + route.etapes[0].instruction,
                  distance: route.etapes[0].distance,
                });
              }
            }
          }

          // 4️⃣ ETA mise à jour en temps réel
          const distanceRestante = calculerDistanceHaversine(
            positionActuelle,
            session.destination
          );

          const vitesseMoyenne = vitesse && vitesse > 0 ? vitesse * (1000 / 3600) : 8; // m/s
          const secondesRestantes = distanceRestante / vitesseMoyenne;
          const etaMiseAJour = new Date(Date.now() + secondesRestantes * 1000);

          io.to(`livraison_${livraisonId}`).emit("livraison:eta", {
            eta: etaMiseAJour,
            distanceRestanteMetres: Math.round(distanceRestante),
          });
        }
      } catch (err) {
        console.error("❌ Erreur position GPS :", err);
        socket.emit("erreur", { message: "Erreur mise à jour position" });
      }
    });

    // ── Démarrer une session de navigation ──
    socket.on("navigation:demarrer", (payload: {
      livreurId: number;
      livraisonId: number;
      destination: Coordonnees;
      positionDepart: Coordonnees;
      route: any;
    }) => {
      sessionsActives.set(payload.livreurId, {
        livraisonId: payload.livraisonId,
        destination: payload.destination,
        dernierePosition: payload.positionDepart,
        routeActuelle: payload.route,
        dernierRecalcul: new Date(),
      });

      console.log(`🧭 Navigation démarrée — Livreur ${payload.livreurId}`);
      socket.emit("navigation:active", { message: "Navigation en cours" });
    });

    // ── Arrêter la navigation (livraison terminée) ──
    socket.on("navigation:terminer", ({ livreurId }) => {
      sessionsActives.delete(livreurId);
      console.log(`✅ Navigation terminée — Livreur ${livreurId}`);
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Client déconnecté : ${socket.id}`);
    });
  });

  return io;
};

// ─── Export de l'instance (utilisable dans les autres services) ────────────────

export const getIO = (): SocketServer => {
  if (!io) throw new Error("Socket.IO non initialisé. Appeler initSocket() d'abord.");
  return io;
};