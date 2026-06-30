# Skill: Release & Publish — Ecosistema Klap

> Flujo completo para cerrar una release git flow, mergear a master/develop, tagear y publicar en GitHub Packages.

---

## Cuándo usar este skill

Cuando el dev pide ejecutar el finish de una release, publicar una nueva versión, o hacer el ciclo completo de release del ecosistema klap.

Frases que activan este skill:
- "ejecuta el finish del feature/release"
- "publica la nueva versión"
- "haz el release"
- "cierra la release y publica"

---

## Prerrequisitos — verificar antes de ejecutar

```bash
# 1. Verificar rama actual y branches existentes
git branch

# 2. Verificar que working tree está limpio
git status

# 3. Verificar conexión SSH con GitHub
ssh -o BatchMode=yes -o ConnectTimeout=8 -T git@github.com
# Respuesta esperada: "Hi <usuario>! You've successfully authenticated..."
```

Si falla el SSH → revisar `~/.ssh/config` y que la clave esté registrada en GitHub.

---

## Flujo completo

### PASO 1 — Bump de versión en la release branch

Siempre hacer el bump **antes** del finish, en la rama `release/x.x.x`:

```bash
git checkout release/x.x.x
npm version patch --no-git-tag-version   # o minor/major según corresponda
git add package.json
git commit -m "bump version to x.x.x"
```

> `--no-git-tag-version` evita que npm cree el tag (lo hace git flow después).

---

### PASO 2 — git flow release finish

**IMPORTANTE:** `git flow release finish` abre un editor por cada merge commit. Para evitarlo usar `GIT_MERGE_AUTOEDIT=no` y pasar el mensaje del tag con `-m`:

```bash
GIT_MERGE_AUTOEDIT=no git flow release finish -m "v{version} - {descripcion breve}" {version}
```

**Si el comando queda en background** (colgado esperando editor o fetch remoto), hacer el merge manual:

```bash
# Merge a master
git checkout master
git merge --no-ff release/{version} -m "Merge release/{version} into master"

# Tag
git tag -a {version} -m "v{version} - {descripcion breve}"

# Merge de vuelta a develop
git checkout develop
git merge --no-ff release/{version} -m "Merge release/{version} into develop"

# Borrar rama release
git branch -d release/{version}
```

---

### PASO 3 — Push a remoto

```bash
# Si master tiene divergencia con origin/master, hacer pull --rebase primero
git checkout master
git pull origin master --rebase

git push origin master
git push origin develop
git push origin {version}    # el tag
```

---

### PASO 4 — Publicar en GitHub Packages

```bash
cd {ruta-del-ecosistema-klap}
npm publish
```

Verificar que el `.npmrc` tiene el token de escritura configurado:
```
//npm.pkg.github.com/:_authToken=ghp_...
```

Si aparece `403 Forbidden` → el token solo tiene `read:packages`. Crear uno nuevo con `write:packages` en GitHub → Settings → Developer settings → Personal access tokens.

Salida esperada al publicar:
```
+ @rodriguezyanez/eco-team-brain@{version}
```

---

### PASO 5 — Fix de warnings npm (si aplica)

Si `npm publish` muestra warnings de `bin` paths:
```bash
npm pkg fix
git add package.json
git commit -m "fix: npm pkg fix bin paths"
git push origin develop
```

---

## Verificación final

```bash
# Confirmar estado limpio
git status
git branch        # solo deben quedar: develop, master
git tag -l        # debe aparecer la nueva versión
git log master --oneline -3
```

---

## Causas comunes de fallo

| Error | Causa | Solución |
|-------|-------|----------|
| `Permission denied (publickey)` | Clave SSH no registrada en GitHub | Agregar `~/.ssh/<clave>.pub` a GitHub → Settings → SSH keys |
| `Could not fetch from origin` | SSH no configurado | Verificar `~/.ssh/config` apunta a la clave correcta |
| `release/x.x.x - not something we can merge` | git flow ya borró la rama (terminó en background) | Verificar con `git log master --oneline` si el merge ya ocurrió |
| `rejected (fetch first)` | Remoto tiene commits locales no tienen | `git pull origin {rama} --rebase` antes del push |
| `403 Forbidden` en npm publish | Token sin permisos de escritura | Crear PAT con `write:packages` en GitHub |
| `diverged` en release finish | Bump commit diverge del remoto | Hacer el merge manual (Paso 2 alternativo) |

---

*Skill: release-publish · Ecosistema Klap · Abril 2026*
