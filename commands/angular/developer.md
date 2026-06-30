---
name: angular-developer
description: Generates Angular code and provides architectural guidance. Trigger when creating projects, components, or services, or for best practices on reactivity (signals, linkedSignal, resource), forms, dependency injection, routing, SSR, accessibility (ARIA), animations, styling (component styles, Tailwind CSS), testing, or CLI tooling.
license: MIT
metadata:
  author: Copyright 2026 Google LLC
  version: '1.0'
---

# Angular Developer Guidelines

1. Always analyze the project's Angular version before providing guidance, as best practices and available features can vary significantly between versions. If creating a new project with Angular CLI, do not specify a version unless prompted by the user.

2. When generating code, follow Angular's style guide and best practices for maintainability and performance. Use the Angular CLI for scaffolding components, services, directives, pipes, and routes to ensure consistency.

3. Once you finish generating code, run `ng build` to ensure there are no build errors. If there are errors, analyze the error messages and fix them before proceeding. Do not skip this step, as it is critical for ensuring the generated code is correct and functional.

## Creating New Projects

If no guidelines are provided by the user, here are some default rules to follow when creating a new Angular project:

1. Use the latest stable version of Angular unless the user specifies otherwise.
2. Use Signals Forms for form management in new projects (available in Angular v21 and newer).

**Execution Rules for `ng new`:**

**Step 1: Check for an explicit user version.**
- IF the user requests a specific version (e.g., Angular 15), bypass local installations and strictly use `npx`.
- Command: `npx @angular/cli@<requested_version> new <project-name>`

**Step 2: Check for an existing Angular installation.**
- IF no specific version is requested, run `ng version` to check if the Angular CLI is already installed.
- IF the command succeeds, use the local/global installation directly.
- Command: `ng new <project-name>`

**Step 3: Fallback to Latest.**
- IF no specific version is requested AND `ng version` fails, use `npx` to fetch the latest version.
- Command: `npx @angular/cli@latest new <project-name>`

## Components

- **Fundamentals**: Anatomy, metadata, core concepts, and template control flow (@if, @for, @switch).
- **Inputs**: Signal-based inputs, transforms, and model inputs.
- **Outputs**: Signal-based outputs and custom event best practices.
- **Host Elements**: Host bindings and attribute injection.

## Reactivity and Data Management

Use Angular Signals for state and data reactivity:

- **Signals Overview**: Core signal concepts (`signal`, `computed`), reactive contexts, and `untracked`.
- **Dependent State (`linkedSignal`)**: Creating writable state linked to source signals.
- **Async Reactivity (`resource`)**: Fetching asynchronous data directly into signal state.
- **Side Effects (`effect`)**: Logging, third-party DOM manipulation (`afterRenderEffect`), and when NOT to use effects.

## Forms

In most cases for new apps, **prefer signal forms**:

- If the application is using v21 or newer and this is a new form, **prefer signal forms**.
- For older applications or when working with existing forms, use the appropriate form type that matches the application's current form strategy.
- **Signal Forms**: Use signals for form state management.
- **Template-driven forms**: Use for simple forms.
- **Reactive forms**: Use for complex forms.

## Dependency Injection

- **Fundamentals**: Overview of DI, services, and the `inject()` function.
- **Creating and Using Services**: `providedIn: 'root'` option, injecting into components or other services.
- **Defining Dependency Providers**: `InjectionToken`, `useClass`, `useValue`, `useFactory`, and scopes.
- **Injection Context**: Where `inject()` is allowed, `runInInjectionContext`, and `assertInInjectionContext`.
- **Hierarchical Injectors**: `EnvironmentInjector` vs `ElementInjector`, resolution rules, modifiers (`optional`, `skipSelf`).

## Routing

- **Define Routes**: URL paths, static vs dynamic segments, wildcards, and redirects.
- **Route Loading Strategies**: Eager vs lazy loading, and context-aware loading.
- **Show Routes with Outlets**: Using `<router-outlet>`, nested outlets, and named outlets.
- **Navigate to Routes**: Declarative navigation with `RouterLink` and programmatic navigation with `Router`.
- **Control Route Access with Guards**: `CanActivate`, `CanMatch`, and other guards for security.
- **Data Resolvers**: Pre-fetching data before route activation with `ResolveFn`.

## Styling and Animations

- **Using Tailwind CSS with Angular**: Run `npx ng add tailwindcss` to integrate. Follow Tailwind v4 best practices.
- **Angular Animations**: Using native CSS (recommended) or the legacy DSL for dynamic effects.
- **Styling components**: Best practices for component styles and encapsulation.

## Testing

- **Fundamentals**: Best practices for unit testing (Vitest), async patterns, and `TestBed`.
- **Component Harnesses**: Standard patterns for robust component interaction.
- **Router Testing**: Using `RouterTestingHarness` for reliable navigation tests.
- **End-to-End (E2E) Testing**: Best practices for E2E tests with Cypress.

## Tooling

- **Angular CLI**: Creating applications, generating code (components, routes, services), serving, and building.
- **Code Modernization**: Automatically refactoring to modern standards using migrations (`ng update`).
