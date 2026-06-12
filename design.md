# AquaSachet — Design de l'Application Mobile

## Concept

Application de gestion pour une entreprise de production d'eau en sachet (AquaSachet) au Sénégal. L'application permet de saisir et suivre la production, les ventes, les dépenses, la caisse, les tournées de livreurs, le stock, le recouvrement des crédits clients et la rentabilité.

---

## Screen List

| Écran | Description |
|-------|-------------|
| **Tableau de bord** | Vue d'ensemble avec KPI : production du jour, CA, dépenses, bénéfice, stock |
| **Production** | Saisie quotidienne de la production (packs produits par jour) |
| **Ventes** | Enregistrement des ventes : date, client, quantité, mode paiement (cash/crédit) |
| **Dépenses** | Saisie des dépenses par catégorie (variable, fixe, distribution, ponctuel) |
| **Caisse** | Suivi journalier : solde initial, recettes, recouvrement, dépenses, solde fin |
| **Clients** | Liste des clients avec coordonnées et zone |
| **Tournées** | Suivi des livreurs : packs sortis, rendus, vendus, cash attendu vs remis |
| **Stock** | État du stock et valorisation |
| **Recouvrement** | Suivi des crédits clients avec statut (en cours, payé, en retard) |
| **Rapports** | Synthèse mensuelle : compte de résultat, rentabilité |
| **Paramètres** | Configuration : prix de vente, coûts, commerciaux, paramètres production |

---

## Primary Content and Functionality

### Tableau de bord (Home)
- **Cartes KPI** : Production du jour, CA du jour, Dépenses du jour, Bénéfice brut
- **Stock restant** : Barre de progression avec alerte si bas
- **Graphique** : Évolution CA sur 7 derniers jours
- **Alertes** : Stock bas, crédits en retard, écarts caisse

### Production
- **Formulaire** : Date, Nombre de packs produits
- **Liste** : Historique de production par jour
- **Total mensuel** affiché en haut

### Ventes
- **Formulaire** : Date, Client (sélection), Quantité (packs), Mode (Cash/Crédit), Commercial
- **Liste** : Historique des ventes avec filtre par date/client
- **Totaux** : Packs vendus, CA cash, CA crédit

### Dépenses
- **Formulaire** : Date, Catégorie (Variable/Fixe/Distribution/Ponctuel), Désignation, Montant, Fournisseur
- **Liste** : Historique avec filtre par catégorie
- **Répartition** : Totaux par type

### Caisse
- **Vue journalière** : Solde initial, Recettes, Recouvrement, Dépenses, Solde fin
- **Navigation** : Par date (calendrier)
- **Solde d'ouverture** : Saisie manuelle début de mois

### Clients
- **Liste** : Nom, Zone, Téléphone, Statut
- **Formulaire ajout** : Nom, Zone, Téléphone
- **Détail** : Historique achats, solde crédit

### Tournées
- **Formulaire** : Livreur, Packs sortis, Packs rendus, Cash remis
- **Calculs auto** : Vendus = Sortis - Rendus, Cash attendu = Vendus × Prix, Écart
- **Liste** : Par date

### Stock
- **Indicateurs** : Total produit, Total vendu, Stock restant
- **Valorisation** : Prix vente/pack, Coût revient/pack, Valeur stock

### Recouvrement
- **Liste** : Client, Montant dû, Date vente, Statut (En cours/Payé/En retard)
- **Action** : Marquer comme payé (avec date paiement)
- **Totaux** : À recouvrer, Recouvré, En retard

### Rapports
- **Compte de résultat** : CA, Charges détaillées, Résultat net
- **Rentabilité** : Coût de revient, Marge, Seuil de rentabilité

### Paramètres
- **Prix de vente par pack** (défaut : 650 FCFA)
- **Coûts de production** : Rouleaux, Antiscalant, Eau, Membrane, Électricité, Loyer, Salaires
- **Commission commerciaux** : Montant par pack
- **Liste commerciaux** : Nom, Téléphone, Zone

---

## Key User Flows

### Saisie production quotidienne
1. Ouvrir onglet Production → Bouton "+" → Formulaire
2. Saisir date + quantité → Valider
3. Stock mis à jour automatiquement

### Enregistrer une vente
1. Onglet Ventes → Bouton "+" → Formulaire
2. Sélectionner client → Quantité → Mode paiement → Commercial
3. Si Cash : Caisse mise à jour
4. Si Crédit : Ajout automatique dans Recouvrement

### Suivi tournée livreur
1. Onglet Tournées → Bouton "+" → Formulaire
2. Sélectionner livreur → Packs sortis → Packs rendus → Cash remis
3. Calcul automatique : Vendus, Cash attendu, Écart

### Recouvrement crédit
1. Onglet Recouvrement → Sélectionner crédit "En cours"
2. Action "Marquer payé" → Saisir montant reçu
3. Caisse mise à jour (colonne Recouvrement)

---

## Color Choices

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| primary | #0077B6 | #48CAE4 | Bleu eau — couleur principale de la marque |
| background | #F8FBFF | #0A1628 | Fond d'écran |
| surface | #EBF5FF | #142238 | Cartes et surfaces élevées |
| foreground | #1B2838 | #E8F0F8 | Texte principal |
| muted | #5A7A94 | #7FA3BF | Texte secondaire |
| border | #D1E3F0 | #1E3A54 | Bordures et séparateurs |
| success | #10B981 | #34D399 | Bénéfice positif, paiement reçu |
| warning | #F59E0B | #FBBF24 | Stock bas, crédit en cours |
| error | #EF4444 | #F87171 | Écart négatif, retard paiement |

---

## Navigation Structure

**Tab Bar (5 onglets principaux)**
1. Accueil (Tableau de bord)
2. Ventes
3. Production
4. Dépenses
5. Plus (accès à : Clients, Tournées, Stock, Recouvrement, Rapports, Paramètres)

---

## Typography & Spacing

- Titres : 24px bold
- Sous-titres : 18px semibold
- Corps : 16px regular
- Labels : 14px medium, couleur muted
- Espacement cartes : 12px
- Padding écran : 16px horizontal
- Border radius cartes : 12px
