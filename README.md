# Ecosistema Klap 🚀

Este paquete contiene las herramientas y scripts del Team Brain centralizados para el equipo Klap.

## Instalación

Para instalarlo de forma global en tu máquina (recomendado):

```bash
# Desde la carpeta local (para pruebas)
npm install -g ./ecosistema-klap

# O si se publica en un repositorio Git
npm install -g git+ssh://github.com/tu-org/team-brain.git
```

## Comandos Disponibles

### 1. Comando Maestro
Puedes usar el comando raíz para ver las opciones:
```bash
klap
```

### 2. Sincronización
Sincroniza el cerebro con el repositorio central:
```bash
klap-sync
# o
klap sync
```

### 3. Inicialización
Configura el entorno inicial, hooks de git y habilidades:
```bash
klap-init
# o
klap init
```

## Estructura del Paquete
- `bin/`: Orquestadores CLI en Node.js.
- `scripts/`: Motores de ejecución (.ps1 para Windows, .sh para Linux).
- `skills/`: Definiciones de habilidades y prompts.
- `docs/`: Documentación técnica.

## Actualización
Para obtener la última versión del ecosistema:
```bash
npm update -g ecosistema-klap
```
