---
name: angular-new-app
description: Creates a new Angular app using the Angular CLI. This skill should be used whenever a user wants to create a new Angular application and contains important guidelines for how to effectively create a modern Angular application.
license: MIT
compatibility: Requires node, npm, and access to the internet
metadata:
  author: Angular Team @ Google
  version: '1.0'
---

# Angular New App

Eres un experto en TypeScript, Angular y desarrollo de aplicaciones web escalables. Escribes código funcional, mantenible, performante y accesible siguiendo las mejores prácticas de Angular y TypeScript.

Cuando crees una nueva aplicación Angular, sigue siempre estos pasos:

## Paso 1: Verificar Angular CLI

Confirma que el Angular CLI esté presente antes de continuar:
- En sistemas `*nix`: `which ng`
- En Windows (PowerShell): `gcm ng`

Si está presente, continúa al paso 2. Si no, pregunta al usuario si desea instalarlo globalmente:
```
npm install -g @angular/cli
```

## Paso 2: Crear la aplicación

Sugiere un nombre basado en el prompt del usuario o pregunta el nombre. Crea la aplicación con:

```
npx ng new <app-name> [flags] --interactive=false --ai-config=claude
```

Flags útiles según los requerimientos del usuario:
- `--style=scss|css|less` — formato de stylesheet
- `--routing` — agregar módulo de routing
- `--ssr` — habilitar server-side rendering
- `--prefix=<prefix>` — prefijo del selector de componentes
- `--skip-tests` — solo si el usuario lo solicita explícitamente

## Paso 3: No iniciar la app hasta tener features

No inicies la app hasta haber construido algunas funcionalidades. Pregunta al usuario si quiere iniciarla. Siempre puedes ejecutar `npx ng build` para verificar errores.

## Paso 4: Generar código con Angular CLI

Usa siempre el CLI para generar código:

```bash
npx ng generate component <component-name>
npx ng generate service <service-name>
npx ng generate pipe <pipe-name>
npx ng generate directive <directive-name>
npx ng generate interface <interface-name>
npx ng generate guard <guard-name>
npx ng generate interceptor <interceptor-name>
npx ng generate resolver <resolver-name>
npx ng generate enum <enum-name>
npx ng generate class <class-name>
```

**IMPORTANTE**: Toma nota de la ruta que devuelve cada comando `generate` para saber exactamente dónde quedan los archivos.

## Paso 5: Agregar Tailwind (si se requiere)

```
npx ng add tailwindcss
```

Después de esto puedes usar directamente las clases de Tailwind en tu aplicación Angular. Sigue las mejores prácticas de Tailwind v4.

## Mejores prácticas para código moderno Angular

- Usa **Signals** para el manejo de estado reactivo (`signal`, `computed`, `effect`)
- Usa **Signal Forms** para formularios en proyectos nuevos con Angular v21+
- Usa `inject()` en lugar del constructor para inyección de dependencias
- Usa el nuevo control flow (`@if`, `@for`, `@switch`) en templates
- Prefiere componentes standalone sobre NgModules en proyectos nuevos
