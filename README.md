# FrenchLang (.fl)

FrenchLang est un langage de programmation **100% en français**, simple et lisible, conçu pour le web et le backend.  
Il permet de créer des scripts facilement, avec une syntaxe compréhensible par tous.

---

## Objectifs

- **Lisible et intuitif** : écrire du code comme on parle en français.  
- **Polyvalent** : utilisable côté navigateur ou côté serveur.  
- **Accessible** : tout le monde peut apprendre à programmer avec FrenchLang.

---

## Syntaxe de base

Exemples :

```fl
console.msg("Bonjour !")       # Affiche un message normal
console.att("Attention !")     # Affiche un avertissement
console.err("Erreur !")        # Affiche une erreur

variable nom = "Alberto"

si (nom == "Alberto") {
    console.msg("Bienvenue créateur !")
} sinon {
    console.msg("Bienvenue visiteur.")
}

répète 3 fois {
    console.msg("Vive FrenchLang !")
}
