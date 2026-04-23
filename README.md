# Ecosistema Klap 🚀

Herramientas y scripts centralizados para el equipo KLAP BYSF, empaquetados como un CLI de Node.js para estandarización de desarrollo y memoria compartida.

## Instalación

Para instalarlo de forma global en tu máquina (recomendado):

```bash
# Desde la carpeta local donde descargaste el código
npm install -g .

# O desde GitHub Packages (una vez publicado)
npm install -g @rodriguezyanez/eco-team-brain
```

> **Nota para GitHub Packages:** Asegúrate de tener configurado tu `.npmrc` con el token de acceso correspondiente para el scope `@rodriguezyanez`.

## Comandos del CLI `klap`

### Operaciones Principales
- `klap init`: Configura el entorno inicial (DB + Estándares + Skills).
- `klap sync`: Sincroniza memorias locales pendientes con Neo4j.
- `klap update`: Actualiza el Standard KLAP BYSF de forma incremental.
- `klap rollback`: Revierte la instalación y restaura backups.

### Operaciones Avanzadas
- `klap export [file]`: Exporta el grafo completo a un archivo JSON.
- `klap import <file>`: Importa y mergea un JSON de otro dev.
- `klap obsidian`: Exporta el grafo a Markdown para Obsidian.
- `klap backup <cmd>`: Gestión de backups (`backup`, `list`, `restore`).

### Gestión de Neo4j
- `klap up`, `klap down`, `klap status`, `klap logs`, `klap browser`.

## Estructura del Paquete
- `bin/`: Orquestadores CLI en Node.js (comandos `klap-*`).
- `scripts/`: Motores de ejecución (.ps1 para Windows, .sh para Linux).
- `skills/`: Definiciones de habilidades y prompts (Templates).
- `docs/`: Documentación técnica y planes de ejecución.
- `docker-compose.yml`: Configuración de Neo4j y volúmenes.

## Actualización
Para obtener la última versión del ecosistema:
```bash
npm update -g @rodriguezyanez/eco-team-brain
```

---
*Ecosistema Klap · v1.0.0 · 2026*
