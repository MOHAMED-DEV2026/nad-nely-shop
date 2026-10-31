// Règles de gestion partagées entre plusieurs fichiers.

// RG02 : 8 caractères minimum, dont une majuscule, une minuscule et un chiffre
const POLITIQUE_MDP = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const MESSAGE_MDP = 'Le mot de passe doit contenir au moins 8 caractères, dont une majuscule, une minuscule et un chiffre';

module.exports = { POLITIQUE_MDP, MESSAGE_MDP };
