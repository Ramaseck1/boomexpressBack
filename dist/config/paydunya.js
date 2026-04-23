"use strict";
// src/config/paydunya.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.paydunyaConfig = void 0;
exports.paydunyaConfig = {
    mode: 'test', // ou 'live' pour la production
    masterKey: process.env.PAYDUNYA_MASTER_KEY || '',
    privateKey: process.env.PAYDUNYA_PRIVATE_KEY || '',
    token: process.env.PAYDUNYA_TOKEN || '',
    // Configuration de la boutique
    store: {
        name: process.env.STORE_NAME || 'Ma Bibliothèque',
        tagline: process.env.STORE_TAGLINE || 'Accès aux livres numériques',
        phoneNumber: process.env.STORE_PHONE || '',
        postalAddress: process.env.STORE_ADDRESS || 'Dakar, Sénégal',
        websiteUrl: process.env.STORE_WEBSITE || 'https://monsite.com',
        logoUrl: process.env.STORE_LOGO || ''
    },
    // URLs de callback
    callbackUrls: {
        returnUrl: process.env.PAYDUNYA_RETURN_URL || 'http://localhost:3000/paiement/success',
        cancelUrl: process.env.PAYDUNYA_CANCEL_URL || 'http://localhost:3000/paiement/cancel',
        callbackUrl: process.env.PAYDUNYA_CALLBACK_URL || 'http://localhost:3000/api/paiement/callback'
    },
    // API URLs
    apiUrls: {
        test: 'https://app.paydunya.com/sandbox-api/v1',
        live: 'https://app.paydunya.com/api/v1'
    },
    getApiUrl() {
        return this.mode === 'test' ? this.apiUrls.test : this.apiUrls.live;
    }
};
