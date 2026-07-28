# Rollback portada OVE 2026-07-28

La portada anterior del sitio OVE queda preservada en:

- Commit base antes del cambio: `f425d68ca135ed153bbbe6aa3a278ccfa13c6333`
- Tag local: `rollback-home-before-redesign-20260728-2334`
- Rama local: `rollback/home-before-redesign-20260728`

Para volver atras publicando un nuevo commit de reversión:

```bash
git revert HEAD
git push origin main
```

Si se necesita restaurar exactamente el estado anterior de la portada:

```bash
git checkout f425d68ca135ed153bbbe6aa3a278ccfa13c6333 -- index.html assets/ove-logo-white.png assets/venezuela-hero-optimized.jpg
git commit -m "Restore previous OVE homepage"
git push origin main
```
