# Ecosistema Klap 🚀

Herramientas y scripts centralizados para el equipo KLAP BYSF, empaquetados como un CLI de Node.js para estandarización de desarrollo y memoria compartida.

## Instalación

Para instalarlo de forma global en tu máquina (recomendado):

```bash
# Desde la carpeta local donde descargaste el código
npm install -g ./ecosistema-klap

# O desde el repositorio Git (una vez publicado)
npm install -g git+ssh://github.com/rodriguezyanez/eco-team-brain.git
```

## Comandos del CLI `klap`

### 1. Inicialización
Configura el entorno inicial: base de datos Neo4j (constraints, índices, nodos base), instala hooks de git y habilidades locales.
```bash
klap init
```

### 2. Sincronización
Sincroniza memorias locales pendientes (guardadas cuando Neo4j no estaba disponible) con la base de datos central.
```bash
klap sync
```

### 3. Actualización de Arquitectura
Actualiza los nodos del Standard KLAP BYSF en Neo4j de forma incremental, preservando la memoria acumulada por el equipo (Decisiones, Bugs, Patterns).
```bash
klap update
```

### 4. Rollback / Desinstalación
Revierte los cambios en la configuración de Claude, detiene el contenedor Neo4j y restaura los backups.
```bash
klap rollback
```

## Estructura del Paquete
- `bin/`: Orquestadores CLI en Node.js (comandos `klap-*`).
- `scripts/`: Motores de ejecución (.ps1 para Windows, .sh para Linux).
- `skills/`: Definiciones de habilidades y prompts (Templates).
- `docs/`: Documentación técnica y planes de ejecución.
- `docker-compose.yml`: Configuración de Neo4j y volúmenes.

## Actualización
Para obtener la última versión del ecosistema:
```bash
npm update -g ecosistema-klap
```

---
*Ecosistema Klap · v1.0.0 · 2026*
