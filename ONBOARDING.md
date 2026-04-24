# Ecosistema Klap — Guía de Onboarding

Guía para desarrolladores que se incorporan al equipo KLAP BYSF y utilizan el Ecosistema Klap para estandarización y memoria compartida.

---

## ¿Cómo trabaja Claude con este equipo?

Claude asume conocimiento completo del stack (Spring Boot, Kafka, patrones del equipo). Va directo al punto, solo menciona contexto cuando hay algo no obvio o una decisión que rompe el estándar.

---

## Instalación y desinstalación

El ecosistema se gestiona a través del CLI global `klap`.

### Inicialización
Configura Neo4j, instala las habilidades y los hooks en un solo paso:
```bash
klap init
```

### Desinstalación
Revierte los cambios y detiene los contenedores:
```bash
klap rollback
```

---

## Primeros pasos al incorporarte

Al abrir Claude Code por primera vez, indica el proyecto en el que vas a trabajar. Claude carga el contexto desde Neo4j y aplica el Standard KLAP BYSF automáticamente.

---

## JavaDoc — por qué es obligatorio

Todos los métodos públicos deben tener JavaDoc. El equipo lo adoptó por tres razones:

1. Los microservicios tienen múltiples dominios y devs distintos los tocan — el JavaDoc reduce el tiempo de entendimiento.
2. Sirve como documentación viva: el IDE muestra el JavaDoc al hacer hover.
3. Obliga a pensar en el objetivo del método antes de implementarlo.

Formato esperado:
```java
/**
 * Procesa la orden de pago recibida desde Kafka y coordina el flujo completo.
 *
 * @param input DTO con los datos de la orden de pago.
 * @return DTO de salida con el resultado y estado final.
 * @throws XxxException si falla la persistencia.
 */
public XxxOutputDto procesarOrdenPago(XxxInputDto input) {
```

---

## Context7 — Documentación actualizada del stack

El equipo utiliza **Context7** para obtener documentación en tiempo real. Agrega `use context7` a cualquier prompt cuando necesites información precisa de una librería:

```
use context7, ¿cómo configuro un CircuitBreaker con Resilience4j 2.2.0?
```

---

## SDD — Cómo implementar features con el equipo

SDD (Spec-Driven Development) es el flujo de trabajo estándar para implementar cualquier feature. En lugar de pedir código directo, pide a Claude que guíe el proceso:

### Cómo activarlo
```
sdd: [descripción de lo que quieres construir]
```

### Las 5 fases
1. **Explorar** → Claude lee el dominio y mapea componentes.
2. **Proponer** → Claude presenta el enfoque arquitectónico.
3. **Validar** → Verificación contra reglas DO/DON'T.
4. **Implementar** → Escritura de código siguiendo templates.
5. **Verificar** → Confirmación de tests, JavaDoc y naming.

---

## Guardian Angel — Code review automático pre-commit

El hook pre-commit revisa cada commit contra las reglas del equipo antes de permitirlo.

### Instalación en tu proyecto
```bash
# Windows
.\scripts\windows\install-hooks.bat C:\ruta\a\tu\proyecto

# Linux / macOS
./scripts/linux/install-hooks.sh /ruta/a/tu/proyecto
```

### Bypass para urgencias
```bash
git commit --no-verify -m "hotfix urgente"
```

---

## Obsidian Vault — Visualizar el grafo de conocimiento

Puedes exportar el grafo completo para navegarlo visualmente en **Obsidian**.

### Exportar
```bash
# Windows
.\scripts\windows\export-obsidian.bat
```
*(Se genera una carpeta `vault/` con archivos Markdown).*

---

*Ecosistema Klap · Guía de onboarding v3.0 · Abril 2026*
