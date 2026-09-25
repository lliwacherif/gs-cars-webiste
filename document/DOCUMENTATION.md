# 🚗 Tunisia Car Rental — Documentation Technique Complete

![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)
![NestJS](https://img.shields.io/badge/NestJS-v11-red.svg)
![React](https://img.shields.io/badge/React-v19-blue.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-v6%2B-brightgreen.svg)
![Vite](https://img.shields.io/badge/Vite-v8-purple.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

> **Tunisia Car Rental** est une plateforme web moderne et full-stack de réservation et de gestion de location de véhicules en Tunisie. La plateforme combine un visualiseur 3D interactif de véhicules côté client et une API REST robuste bâtie sous NestJS et MongoDB.

---

## 📋 Table des matières

1. [Introduction](#1-introduction)
2. [Prérequis](#2-prérequis)
3. [Installation](#3-installation)
4. [Configuration](#4-configuration)
5. [Utilisation](#5-utilisation)
6. [Structure du projet](#6-structure-du-projet)
7. [API & Fonctions principales](#7-api--fonctions-principales)
8. [FAQ & Dépannage courant](#8-faq--dépannage-courant)
9. [Contribution](#9-contribution)
10. [Licence](#10-licence)

---

## 1. Introduction

### À quoi sert le projet ?
**Tunisia Car Rental** permet de numériser et de simplifier l'expérience de location de véhicules pour les agences et les clients en Tunisie. La plateforme offre aux utilisateurs la possibilité de consulter le catalogue des voitures (avec modélisation 3D interactive et filtres avancés par parc/agence), de vérifier la disponibilité en temps réel et d'effectuer des réservations sécurisées.

### Problèmes résolus
- **Visualisation réaliste** : Grâce au composant `@google/model-viewer`, les clients peuvent inspecter les véhicules sous tous les angles en 3D avant de réserver.
- **Gestion multi-agences** : Module dédié à la gestion des parcs automobiles répartis sur plusieurs agences régionales.
- **Contrôle des réservations et blocages temporaires** : Système de verrouillage temporaire (*holds*) pour éviter les doubles réservations simultanées.
- **Sécurité et Rôles** : Authentification JWT complète avec contrôle d'accès basé sur les rôles (`admin` vs `customer`).

---

## 2. Prérequis

Avant de commencer, assurez-vous d'avoir installé les outils suivants sur votre machine :

| Outil | Version Minimale Recommandée |
| :--- | :--- |
| **Node.js** | `v18.x` ou `v20.x+` |
| **npm** | `v9.x+` |
| **MongoDB** | `v6.0+` (ou instance [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)) |
| **Git** | `v2.x+` |

---

## 3. Installation

Le projet est divisé en deux parties principales : la racine (**Frontend React**) et le dossier `backend` (**Backend NestJS**).

### Étape 1 : Cloner le dépôt

```bash
git clone https://github.com/Guezguezahmed/Tunisia-Car-Rental.git
cd Tunisia-Car-Rental
```

### Étape 2 : Installation du Backend (NestJS)

```bash
# Se déplacer dans le dossier backend
cd backend

# Installer les dépendances du serveur
npm install

# (Optionnel) Initialiser la base de données avec des données de test
npm run seed
```

### Étape 3 : Installation du Frontend (React + Vite)

```bash
# Revenir à la racine du projet
cd ..

# Installer les dépendances du client
npm install
```

---

## 4. Configuration

### 4.1. Variables d'environnement Backend (`backend/.env`)

Créez un fichier `.env` dans le dossier `backend/` :

```env
# Serveur
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Base de données
MONGODB_URI=mongodb://localhost:27017/tunisia-car-rental

# Authentification
JWT_SECRET=votre_cle_secrete_jwt_hyper_securisee
JWT_EXPIRES_IN=7d

# Stockage d'images / fichiers (Cloudinary & Supabase)
CLOUDINARY_CLOUD_NAME=votre_cloud_name
CLOUDINARY_API_KEY=votre_api_key
CLOUDINARY_API_SECRET=votre_api_secret

SUPABASE_URL=votre_supabase_url
SUPABASE_KEY=votre_supabase_key
SUPABASE_SERVICE_KEY=votre_supabase_service_key
```

### 4.2. Variables d'environnement Frontend (`.env`)

Créez un fichier `.env` à la racine du projet :

```env
VITE_API_URL=http://localhost:3000/api
```

---

## 5. Utilisation

### 5.1. Démarrage en mode Développement

#### 1. Lancer le backend NestJS :
```bash
cd backend
npm run start:dev
```
*Le serveur démarrera sur `http://localhost:3000/api`. La documentation Swagger interactive sera accessible sur `http://localhost:3000/api/docs`.*

#### 2. Lancer le frontend React + Vite :
```bash
# Depuis la racine du projet
npm run dev
```
*L'application web sera accessible sur `http://localhost:5173` (ou le port indiqué par Vite).*

### 5.2. Extraits de code fonctionnels

#### Client API avec Axios (`src/services/api.js`)
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour inclure le jeton JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

#### Visualiseur 3D dans le Frontend React
```jsx
import React from 'react';
import '@google/model-viewer';

export default function Car3DViewer({ modelUrl, altText }) {
  return (
    <div className="car-3d-container">
      <model-viewer
        src={modelUrl}
        alt={altText || "Modèle 3D de la voiture"}
        auto-rotate
        camera-controls
        shadow-intensity="1"
        style={{ width: '100%', height: '400px' }}
      >
      </model-viewer>
    </div>
  );
}
```

---

## 6. Structure du projet

```text
Tunisia-Car-Rental/
├── document/                    # Documentation du projet
│   └── DOCUMENTATION.md
├── public/                      # Assets statiques frontend
├── src/                         # Application Frontend (React 19 + Vite)
│   ├── assets/                  # Images, logos et fichiers 3D (models GLB/GLTF)
│   ├── components/              # Composants UI réutilisables (Navbar, Footer, Car3D, etc.)
│   ├── context/                 # Contextes React (AuthContext, ReservationContext)
│   ├── pages/                   # Pages principales (Home, Vehicles, Contact, Booking)
│   ├── services/                # Services API client (Axios HTTP client)
│   ├── translations/            # Fichiers de traduction i18n (FR, AR, EN)
│   ├── App.jsx                  # Composant racine & Routage
│   ├── index.css                # Styles globaux
│   └── main.jsx                 # Point d'entrée React
├── backend/                     # Application Backend (NestJS)
│   ├── src/
│   │   ├── auth/                # Module d'authentification (JWT, Guards, Strategies)
│   │   ├── common/              # Filtres d'exception et intercepteurs globaux
│   │   ├── config/              # Configuration dynamique d'environnement
│   │   ├── holds/               # Verrouillage temporaire des véhicules
│   │   ├── mail/                # Service d'envoi d'emails (Nodemailer)
│   │   ├── parcs/               # Module de gestion des agences / parcs
│   │   ├── reservations/        # Module de gestion des réservations
│   │   ├── upload/              # Services d'upload d'images & modèles 3D (Cloudinary/Supabase)
│   │   ├── users/               # Module de gestion des utilisateurs & rôles
│   │   ├── vehicles/            # Module des véhicules (catalogue, statut, modèles 3D)
│   │   ├── app.module.ts        # Module racine NestJS
│   │   ├── main.ts              # Point d'entrée serveur & Swagger
│   │   └── seed.ts              # Script de population initiale des données
│   ├── package.json
│   └── tsconfig.json
├── package.json                 # Dépendances Frontend
├── vite.config.js               # Configuration Vite
└── README.md
```

---

## 7. API & Fonctions principales

La documentation complète et interactive Swagger est générée automatiquement et disponible sur `http://localhost:3000/api/docs`.

### 7.1. Principaux Endpoints REST

| Domaine | Méthode | Route | Description | Accès |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/register` | Inscription d'un nouvel utilisateur | Public |
| **Auth** | `POST` | `/api/auth/login` | Connexion & Obtention du token JWT | Public |
| **Vehicles** | `GET` | `/api/vehicles` | Liste des véhicules avec filtres | Public |
| **Vehicles** | `POST` | `/api/vehicles` | Création d'un véhicule (avec modèle 3D) | Admin |
| **Reservations**| `POST` | `/api/reservations` | Création d'une demande de réservation | Authentifié |
| **Reservations**| `GET` | `/api/reservations/user`| Obtenir les réservations du client | Authentifié |
| **Parcs** | `GET` | `/api/parcs` | Liste des agences/parcs disponibles | Public |
| **Upload** | `POST` | `/api/upload` | Upload d'images ou fichiers GLB | Admin |

### 7.2. Exemple de requête / réponse

#### Inscription (`POST /api/auth/register`)

**Requête Body (`application/json`) :**
```json
{
  "name": "Mohamed Ben Ali",
  "email": "mohamed@example.tn",
  "password": "Password123!",
  "phone": "+21627908060"
}
```

**Réponse (`201 Created`) :**
```json
{
  "statusCode": 201,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "name": "Mohamed Ben Ali",
      "email": "mohamed@example.tn",
      "role": "customer"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 8. FAQ & Dépannage courant

### Q1 : Le backend refuse les fichiers 3D (.glb) volumineux.
> **Solution** : Le limiteur d'Express dans `backend/src/main.ts` a été configuré à `100mb` pour autoriser les uploads de modèles 3D complexes. Vérifiez que `CLOUDINARY` ou `SUPABASE` disposent des autorisations nécessaires pour stocker les fichiers binaires.

### Q2 : Erreur CORS lors des appels depuis le Frontend React.
> **Solution** : Assurez-vous que la variable `FRONTEND_URL` dans `backend/.env` correspond exactement à l'URL sur laquelle tourne Vite (par ex: `http://localhost:5173`).

### Q3 : Impossible de se connecter à la base de données MongoDB.
> **Solution** : Vérifiez que le service MongoDB local est bien démarré (`brew services start mongodb-community` sur macOS) ou que votre URI MongoDB Atlas dans `MONGODB_URI` inclut les identifiants d'accès valides.

---

## 9. Contribution

Les contributions sont les bienvenues ! Pour contribuer au projet :

1. **Forkez** le projet.
2. Créez votre branche de fonctionnalité (`git checkout -b feature/NouvelleFonctionnalite`).
3. Appliquez les règles de formatage et de vérification du code :
   - **Frontend** : `npm run lint` (Oxlint)
   - **Backend** : `npm run lint` & `npm run format` (ESLint & Prettier)
4. Commitez vos changements (`git commit -m 'feat: Ajout de la nouvelle fonctionnalité'`).
5. Pushez vers votre branche (`git push origin feature/NouvelleFonctionnalite`).
6. Ouvrez une **Pull Request**.

---

## 10. Licence

Ce projet est sous licence **MIT**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---
*Documentation générée pour le projet **Tunisia Car Rental**.*
