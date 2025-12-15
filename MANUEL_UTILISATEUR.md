# Manuel Utilisateur - Système de Gestion MAC ASSURANCE

## Table des matières

1. [Introduction](#1-introduction)
2. [Connexion et Authentification](#2-connexion-et-authentification)
3. [Tableau de Bord](#3-tableau-de-bord)
4. [Gestion des Souscriptions](#4-gestion-des-souscriptions)
5. [Gestion des Assurés](#5-gestion-des-assurés)
6. [Gestion des Ayants Droit](#6-gestion-des-ayants-droit)
7. [Gestion des Cotisations](#7-gestion-des-cotisations)
8. [Gestion des Remboursements](#8-gestion-des-remboursements)
9. [Gestion des Prestataires de Santé](#9-gestion-des-prestataires-de-santé)
10. [Gestion des Documents](#10-gestion-des-documents)
11. [Journal d'Audit](#11-journal-daudit)
12. [Gestion des Utilisateurs](#12-gestion-des-utilisateurs)
13. [Paramètres](#13-paramètres)
14. [Rôles et Permissions](#14-rôles-et-permissions)

---

## 1. Introduction

### 1.1 Présentation du système

Le système de gestion MAC ASSURANCE est une application web complète destinée à la gestion d'une mutuelle de santé. Il permet de gérer l'ensemble du cycle de vie des assurés, depuis la souscription jusqu'au remboursement des frais médicaux.

### 1.2 Fonctionnalités principales

- **Gestion des souscriptions** : Création et suivi des contrats d'assurance
- **Gestion des assurés** : Fiche complète des assurés principaux
- **Gestion des ayants droit** : Membres de famille couverts par l'assurance
- **Gestion des cotisations** : Suivi des paiements et contributions
- **Gestion des remboursements** : Traitement des demandes de remboursement
- **Gestion des prestataires** : Référencement des établissements de santé
- **Gestion documentaire** : Archivage et génération de documents PDF
- **Audit et traçabilité** : Historique complet des actions

### 1.3 Configuration requise

- Navigateur web moderne (Chrome, Firefox, Safari, Edge)
- Connexion internet stable
- Résolution d'écran minimale : 1024x768

---

## 2. Connexion et Authentification

### 2.1 Accès à l'application

1. Ouvrez votre navigateur web
2. Accédez à l'URL de l'application
3. La page de connexion s'affiche

### 2.2 Connexion

1. Entrez votre **adresse email**
2. Entrez votre **mot de passe**
3. Cliquez sur le bouton **"Se connecter"**

### 2.3 Création de compte

1. Cliquez sur **"Créer un compte"**
2. Remplissez le formulaire :
   - Prénom
   - Nom
   - Email
   - Mot de passe (minimum 6 caractères)
3. Cliquez sur **"S'inscrire"**

> **Note importante** : Après création du compte, un administrateur doit vous attribuer un rôle pour accéder aux fonctionnalités de l'application.

### 2.4 Déconnexion

1. Cliquez sur l'icône utilisateur en haut à droite
2. Sélectionnez **"Déconnexion"**

---

## 3. Tableau de Bord

### 3.1 Vue d'ensemble

Le tableau de bord affiche les statistiques clés de l'activité :

- **Total des contrats** : Nombre de contrats actifs
- **Total des assurés** : Nombre d'assurés enregistrés
- **Remboursements du mois** : Montant total remboursé
- **Cotisations du mois** : Montant total des cotisations

### 3.2 Graphiques

- **Évolution des remboursements** : Graphique mensuel des remboursements
- **Répartition par statut** : Diagramme circulaire des remboursements par statut

### 3.3 Activités récentes

Liste des dernières actions effectuées dans le système avec :
- Type d'action
- Description
- Date et heure
- Utilisateur concerné

### 3.4 Notifications

L'icône de cloche en haut de page affiche les notifications :
- Souscriptions en attente de validation
- Remboursements à traiter
- Cotisations impayées
- Réserves médicales en cours

---

## 4. Gestion des Souscriptions

### 4.1 Accès au module

Menu latéral → **Souscriptions**

### 4.2 Liste des souscriptions

La page affiche tous les contrats avec :
- Code client
- Numéro de contrat
- Raison sociale
- Date de début
- Statut
- Actions disponibles

### 4.3 Créer une nouvelle souscription

1. Cliquez sur **"Nouvelle souscription"**
2. Remplissez le formulaire :

#### Informations du contractant
- **Code Client** : Généré automatiquement
- **N° Contrat (SCM)** : Généré automatiquement
- **Raison sociale** : Nom de l'entreprise ou particulier
- **Téléphone**
- **Email**
- **Adresse**

#### Informations de l'assuré principal
- **Matricule** : Identifiant unique de l'assuré
- **Nom et Prénom**
- **Date de naissance**
- **Lieu de naissance**
- **Genre**
- **Situation matrimoniale**
- **Téléphone et Email**
- **Employeur et Fonction**
- **Lieu de travail**

#### Informations du conjoint (si applicable)
- Mêmes informations que l'assuré principal

#### Enfants à charge
- Ajoutez chaque enfant avec : nom, prénom, date de naissance, genre

#### Questionnaire de santé
- Répondez aux questions médicales obligatoires
- Renseignez : taille, poids, tension artérielle

3. Cliquez sur **"Soumettre la souscription"**

### 4.4 Statuts des souscriptions

| Statut | Description |
|--------|-------------|
| En attente | Souscription créée, en attente de validation |
| Validée | Souscription approuvée et active |
| Rejetée | Souscription refusée |
| Réserve médicale | En attente d'informations médicales complémentaires |

### 4.5 Actions sur une souscription

- **Voir les détails** : Consulter les informations complètes
- **Modifier** : Éditer les informations (si en attente)
- **Télécharger PDF** : Générer le formulaire de souscription en PDF
- **Changer le statut** : Valider, rejeter ou mettre en réserve

### 4.6 Export des données

- Cliquez sur **"Exporter"** pour télécharger la liste au format Excel
- Cliquez sur **"Récapitulatif PDF"** pour un résumé en PDF

---

## 5. Gestion des Assurés

### 5.1 Accès au module

Menu latéral → **Assurés**

### 5.2 Liste des assurés

Affiche tous les assurés principaux avec :
- Photo
- Matricule
- Nom complet
- Date de naissance
- Téléphone
- Statut
- Contrat associé

### 5.3 Recherche et filtrage

- **Barre de recherche** : Recherche par nom, matricule ou téléphone
- **Filtres** : Par statut, par contrat

### 5.4 Fiche assuré

Cliquez sur un assuré pour voir sa fiche complète :

#### Informations personnelles
- Identité complète
- Coordonnées
- Informations professionnelles

#### Informations d'assurance
- Matricule
- Dates de couverture
- Statut

#### Historique
- Remboursements demandés
- Documents associés

### 5.5 Actions sur un assuré

- **Modifier** : Éditer les informations
- **Télécharger la carte** : Générer la carte d'assuré en PDF
- **Voir les ayants droit** : Accéder aux bénéficiaires

### 5.6 Carte d'assuré

La carte d'assuré générée en PDF contient :
- Logo MAC ASSURANCE
- Photo de l'assuré
- Nom et prénom
- Matricule
- Dates de validité
- Informations du contrat

---

## 6. Gestion des Ayants Droit

### 6.1 Accès au module

Menu latéral → **Ayants droit**

> **Important** : Les ayants droit ne sont accessibles que si l'assuré principal a payé sa cotisation.

### 6.2 Liste des ayants droit

Affiche tous les bénéficiaires avec :
- Photo
- Nom complet
- Lien de parenté
- Date de naissance
- Assuré principal
- Actions

### 6.3 Ajouter un ayant droit

1. Cliquez sur **"Ajouter un ayant droit"**
2. Sélectionnez l'**assuré principal** (seuls les assurés ayant payé apparaissent)
3. Remplissez le formulaire :
   - Nom et prénom
   - Date de naissance
   - Lieu de naissance
   - Genre
   - Lien de parenté (conjoint, enfant, parent, autre)
   - Téléphone
   - Adresse
4. Cliquez sur **"Enregistrer"**

### 6.4 Liens de parenté

| Type | Description |
|------|-------------|
| Conjoint | Époux/Épouse de l'assuré |
| Enfant | Enfant à charge |
| Parent | Père ou mère à charge |
| Autre | Autre lien familial |

### 6.5 Actions sur un ayant droit

- **Modifier** : Éditer les informations
- **Télécharger la carte** : Générer la carte d'ayant droit en PDF
- **Supprimer** : Retirer le bénéficiaire

### 6.6 Carte d'ayant droit

La carte générée contient :
- Logo MAC ASSURANCE
- Photo du bénéficiaire
- Nom et prénom
- Lien de parenté
- Référence à l'assuré principal
- Dates de validité

---

## 7. Gestion des Cotisations

### 7.1 Accès au module

Menu latéral → **Cotisations**

### 7.2 Liste des cotisations

Affiche toutes les cotisations avec :
- Contrat (raison sociale)
- Période couverte
- Montant dû
- Montant payé
- Statut de paiement
- Actions

### 7.3 Créer une cotisation

1. Cliquez sur **"Nouvelle cotisation"**
2. Remplissez le formulaire :
   - **Contrat** : Sélectionnez le contrat concerné
   - **Période de début** : Date de début de couverture
   - **Période de fin** : Date de fin de couverture
   - **Montant** : Montant de la cotisation
   - **Notes** : Informations complémentaires (optionnel)
3. Cliquez sur **"Enregistrer"**

### 7.4 Statuts de paiement

| Statut | Description |
|--------|-------------|
| En attente | Cotisation créée, aucun paiement reçu |
| Partiel | Paiement partiel effectué |
| Payé | Cotisation entièrement réglée |
| Annulé | Cotisation annulée |

### 7.5 Enregistrer un paiement

1. Cliquez sur l'icône **paiement** de la cotisation concernée
2. Dans la fenêtre de paiement :
   - **Référence** : Générée automatiquement (PAY-YYYYMMDD-XXXX)
   - **Montant** : Montant du paiement
   - **Notes** : Informations sur le paiement
3. Cliquez sur **"Enregistrer le paiement"**

> **Note** : Lorsqu'une cotisation est marquée comme "Payé", le contrat et l'assuré passent automatiquement au statut "Validé".

### 7.6 Historique des paiements

1. Cliquez sur l'icône **historique** d'une cotisation
2. Visualisez tous les paiements effectués avec :
   - Date du paiement
   - Montant
   - Référence
   - Notes

### 7.7 Télécharger un reçu

1. Pour une cotisation payée, cliquez sur **"Télécharger reçu"**
2. Un PDF est généré avec :
   - Détails du contrat
   - Période couverte
   - Montant payé
   - Référence de paiement

### 7.8 Export des paiements

1. Cliquez sur **"Exporter paiements"**
2. Sélectionnez la période (date début et fin)
3. Cliquez sur **"Télécharger Excel"**

---

## 8. Gestion des Remboursements

### 8.1 Accès au module

Menu latéral → **Remboursements**

### 8.2 Workflow des remboursements

```
Soumis → Vérification → Validé → Payé
                ↓
             Rejeté
```

### 8.3 Liste des remboursements

Affiche toutes les demandes avec :
- Numéro de remboursement
- Assuré/Bénéficiaire
- Type de soin
- Montant demandé
- Montant approuvé
- Statut
- Actions

### 8.4 Créer une demande de remboursement

1. Cliquez sur **"Nouvelle demande"**
2. Remplissez le formulaire :

#### Informations générales
- **Assuré** : Sélectionnez l'assuré concerné
- **Bénéficiaire** : L'assuré lui-même ou un ayant droit
- **Date des soins** : Date de la consultation/acte médical

#### Informations médicales
- **Type de soin** : Consultation, hospitalisation, pharmacie, etc.
- **Prestataire** : Établissement de santé (filtré selon le type de soin)
- **Montant demandé** : Montant total des frais

#### Justificatifs
- Glissez-déposez les documents justificatifs
- Formats acceptés : PDF, images (JPG, PNG)

3. Cliquez sur **"Soumettre"**

### 8.5 Statuts des remboursements

| Statut | Description |
|--------|-------------|
| Soumis | Demande créée, en attente de traitement |
| Vérification | En cours d'analyse par le service médical |
| Validé | Demande approuvée, en attente de paiement |
| Payé | Remboursement effectué |
| Rejeté | Demande refusée |

### 8.6 Traiter une demande

1. Ouvrez la demande en cliquant sur **"Voir détails"**
2. Consultez les informations et justificatifs
3. Choisissez une action :
   - **Passer en vérification** : Transmettre au médecin-conseil
   - **Valider** : Approuver avec le montant calculé
   - **Rejeter** : Refuser la demande
   - **Marquer comme payé** : Confirmer le paiement

### 8.7 Calcul automatique du remboursement

Le système calcule automatiquement le montant approuvé selon :
- **Type de soin** : Barème configuré dans les paramètres
- **Taux de remboursement** : Pourcentage appliqué
- **Plafond** : Montant maximum remboursable

Formule : `Montant approuvé = min(Montant demandé × Taux, Plafond)`

### 8.8 Télécharger la fiche de remboursement

1. Cliquez sur **"Télécharger PDF"**
2. La fiche contient :
   - Informations de l'assuré
   - Détails de la demande
   - Montants (demandé, approuvé, payé)
   - Prestataire de santé
   - Statut et dates

### 8.9 Export et récapitulatif

- **Exporter** : Télécharger la liste au format Excel
- **Récapitulatif PDF** : Générer un résumé mensuel

---

## 9. Gestion des Prestataires de Santé

### 9.1 Accès au module

Menu latéral → **Prestataires**

### 9.2 Types de prestataires

| Type | Description |
|------|-------------|
| Hôpital | Établissement hospitalier public ou privé |
| Clinique | Clinique privée |
| Laboratoire | Laboratoire d'analyses médicales |
| Pharmacie | Officine pharmaceutique |
| Médecin | Cabinet médical individuel |
| Autre | Autre type de prestataire |

### 9.3 Liste des prestataires

Affiche tous les prestataires avec :
- Nom
- Type
- Ville
- Téléphone
- Conventionné (oui/non)
- Actions

### 9.4 Ajouter un prestataire

1. Cliquez sur **"Nouveau prestataire"**
2. Remplissez le formulaire :
   - **Nom** : Raison sociale de l'établissement
   - **Type** : Catégorie du prestataire
   - **Ville**
   - **Adresse**
   - **Téléphone**
   - **Email**
   - **Conventionné** : Cochez si conventionné avec MAC ASSURANCE
   - **N° Convention** : Si conventionné
   - **Notes** : Informations complémentaires
3. Cliquez sur **"Enregistrer"**

### 9.5 Prestataires conventionnés

Les prestataires conventionnés bénéficient d'accords tarifaires avec MAC ASSURANCE. Ils sont identifiés par un badge spécifique dans la liste.

---

## 10. Gestion des Documents

### 10.1 Accès au module

Menu latéral → **Documents**

### 10.2 Types de documents

| Type | Description |
|------|-------------|
| Souscription | Documents liés aux contrats |
| Remboursement | Justificatifs de frais médicaux |
| Prise en charge | Autorisations de soins |
| Quittance | Reçus de paiement |
| Justificatif | Documents justificatifs divers |
| Autre | Autres documents |

### 10.3 Liste des documents

Affiche tous les documents avec :
- Nom du fichier
- Type
- Entité liée
- Date de création
- Taille
- Actions

### 10.4 Uploader un document

1. Cliquez sur **"Nouveau document"**
2. Glissez-déposez le fichier ou cliquez pour parcourir
3. Remplissez les informations :
   - **Nom** : Intitulé du document
   - **Type** : Catégorie du document
   - **Entité liée** : Contrat, assuré ou remboursement associé
4. Cliquez sur **"Téléverser"**

### 10.5 Actions sur un document

- **Télécharger** : Récupérer le fichier
- **Supprimer** : Retirer le document du système

### 10.6 Statistiques

La page affiche des statistiques par catégorie :
- Nombre de documents par type
- Espace de stockage utilisé

---

## 11. Journal d'Audit

### 11.1 Accès au module

Menu latéral → **Journal d'audit**

### 11.2 Informations tracées

Chaque action enregistre :
- **Date et heure** : Horodatage précis
- **Utilisateur** : Qui a effectué l'action
- **Action** : Type d'opération (création, modification, suppression)
- **Entité** : Type d'objet concerné
- **Détails** : Description de l'action
- **Valeurs précédentes** : État avant modification
- **Nouvelles valeurs** : État après modification

### 11.3 Recherche et filtrage

- **Barre de recherche** : Recherche par utilisateur, action ou entité
- **Filtres** : Par période, par type d'action, par entité

### 11.4 Export

Cliquez sur **"Exporter"** pour télécharger le journal au format Excel.

---

## 12. Gestion des Utilisateurs

### 12.1 Accès au module

Menu latéral → **Utilisateurs**

> **Note** : Accessible uniquement aux administrateurs.

### 12.2 Liste des utilisateurs

Affiche tous les utilisateurs avec :
- Nom complet
- Email
- Rôle
- Date de création
- Actions

### 12.3 Attribuer un rôle

1. Cliquez sur **"Modifier"** pour l'utilisateur concerné
2. Sélectionnez le rôle approprié :
   - Administrateur
   - Agent
   - Médecin-conseil
   - Comptabilité
   - Dirigeant
3. Cliquez sur **"Enregistrer"**

> **Important** : L'attribution de rôle est tracée dans le journal d'audit.

---

## 13. Paramètres

### 13.1 Accès au module

Menu latéral → **Paramètres**

> **Note** : Accessible uniquement aux administrateurs.

### 13.2 Barèmes de remboursement

Configuration des taux et plafonds par type de soin :

| Paramètre | Description |
|-----------|-------------|
| Type de soin | Catégorie de l'acte médical |
| Taux de remboursement | Pourcentage remboursé (0-100%) |
| Plafond | Montant maximum remboursable |
| Description | Détails sur le barème |
| Actif | Barème en vigueur ou non |

### 13.3 Modifier un barème

1. Cliquez sur **"Modifier"** pour le barème concerné
2. Ajustez les valeurs :
   - Taux de remboursement
   - Montant plafond
   - Description
   - Statut actif/inactif
3. Cliquez sur **"Enregistrer"**

### 13.4 Ajouter un barème

1. Cliquez sur **"Nouveau barème"**
2. Remplissez les informations
3. Cliquez sur **"Enregistrer"**

---

## 14. Rôles et Permissions

### 14.1 Rôles disponibles

| Rôle | Description |
|------|-------------|
| **Administrateur** | Accès complet à toutes les fonctionnalités |
| **Agent** | Gestion des souscriptions, assurés, ayants droit, documents |
| **Médecin-conseil** | Gestion des remboursements et documents médicaux |
| **Comptabilité** | Gestion des cotisations, remboursements et documents |
| **Dirigeant** | Consultation de tous les modules (sauf utilisateurs et paramètres) |

### 14.2 Matrice des accès

| Module | Admin | Agent | Médecin | Compta | Dirigeant |
|--------|:-----:|:-----:|:-------:|:------:|:---------:|
| Tableau de bord | ✅ | ✅ | ✅ | ✅ | ✅ |
| Souscriptions | ✅ | ✅ | ❌ | ❌ | ✅ |
| Assurés | ✅ | ✅ | ❌ | ❌ | ✅ |
| Ayants droit | ✅ | ✅ | ❌ | ❌ | ✅ |
| Cotisations | ✅ | ❌ | ❌ | ✅ | ✅ |
| Remboursements | ✅ | ❌ | ✅ | ✅ | ✅ |
| Prestataires | ✅ | ❌ | ✅ | ❌ | ✅ |
| Documents | ✅ | ✅ | ✅ | ✅ | ✅ |
| Journal d'audit | ✅ | ❌ | ❌ | ❌ | ✅ |
| Utilisateurs | ✅ | ❌ | ❌ | ❌ | ❌ |
| Paramètres | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## Annexes

### A. Raccourcis clavier

| Raccourci | Action |
|-----------|--------|
| `Ctrl + S` | Sauvegarder le formulaire en cours |
| `Échap` | Fermer la fenêtre modale |
| `Entrée` | Valider/Soumettre |

### B. Formats de fichiers acceptés

- **Documents** : PDF, DOC, DOCX
- **Images** : JPG, JPEG, PNG, GIF
- **Tableurs** : XLS, XLSX

### C. Limites du système

- Taille maximale par fichier : 10 Mo
- Nombre maximal d'ayants droit par assuré : Illimité
- Durée de conservation des logs : Illimitée

### D. Contact support

Pour toute assistance technique :
- Email : support@macassurance.km
- Téléphone : +269 XX XX XX XX

---

**Version du manuel** : 1.0  
**Date de mise à jour** : Décembre 2024  
**Éditeur** : MAC ASSURANCE Comores

---

*Ce manuel est la propriété de MAC ASSURANCE. Toute reproduction sans autorisation est interdite.*
