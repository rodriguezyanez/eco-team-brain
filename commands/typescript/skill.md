### Project Setup and Initialization (Shell)

Source: https://github.com/microsoft/typeScript-website/blob/v2/README.md

Commands to clone the TypeScript website repository, install dependencies using pnpm, and bootstrap the project. It also includes optional steps for pulling translations and starting the development server.

```shell
git clone https://github.com/microsoft/TypeScript-website
cd TypeScript-website
pnpm install
code .

pnpm bootstrap
# Optional, grab the translations:
pnpm docs-sync pull microsoft/TypeScript-Website-localizations#main 1

# Now you can start up the website
pnpm start
```

--------------------------------

### Start Gatsby Development Server

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/typescriptlang-org/README.md

Use this command to start the development server for the Gatsby site. Ensure pnpm is installed and configured.

```sh
pnpm start
```

--------------------------------

### Create Virtual File System for Node.js with TypeScript

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/typescript-vfs/README.md

Demonstrates setting up a virtual file system (fsMap) and a virtual TypeScript environment for Node.js projects. It shows how to use triple-slash directives for global setup and how to create an FS-backed system for resolving modules. This enables operations like getting code completions.

```typescript
const compilerOpts: ts.CompilerOptions = { target: ts.ScriptTarget.ES2016, esModuleInterop: true }
const fsMap = new Map<string, string>()

// If using imports where the types don't directly match up to their FS representation (like the
// imports for node) then use triple-slash directives to make sure globals are set up first.
const content = `/// <reference types="node" />\nimport * as path from 'path';\npath.`
fsMap.set("index.ts", content)

// By providing a project root, then the system knows how to resolve node_modules correctly
const projectRoot = path.join(__dirname, "..")
const system = createFSBackedSystem(fsMap, projectRoot)
const env = createVirtualTypeScriptEnvironment(system, ["index.ts"], ts, compilerOpts)

// Requests auto-completions at `path.|`
const completions = env.languageService.getCompletionsAtPosition("index.ts", content.length, {})
```

--------------------------------

### Start Development Server

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/create-typescript-playground-plugin/template/CONTRIBUTING.md

Command to initialize the development environment, starting the Rollup bundler and the local web server.

```shell
pnpm start
```

--------------------------------

### Workspace-Style tsconfig.json Configuration Example

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/release-notes/TypeScript 5.7.md

This example demonstrates a workspace-style tsconfig.json setup for monorepos. It uses 'files' and 'references' to manage configurations for different projects within the workspace, allowing for more flexible project organization and configuration file discovery by editors.

```json
// src/tsconfig.json
{
    "compilerOptions": {
        "outDir": "../dist"
    },
    "exclude": ["**/*.test.ts"]
}
```

```json
// src/tsconfig.test.json
{
    "compilerOptions": {
        "outDir": "../dist/test"
    },
    "include": ["**/*.test.ts"],
    "references": [
        { "path": "./tsconfig.json" }
    ]
}
```

```json
// tsconfig.json
{
    // This is a "workspace-style" or "solution-style" tsconfig.
    // Instead of specifying any files, it just references all the actual projects.
    "files": [],
    "references": [
        { "path": "./src/tsconfig.json" },
        { "path": "./src/tsconfig.test.json" },
    ]
}
```

--------------------------------

### Setup and Run ATA with Callbacks - TypeScript

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/ata/README.md

Demonstrates how to set up and run Automatic Type Acquisition (ATA) using a series of callbacks. This function facilitates the downloading of type definition files for Node.js modules. It takes configuration options like project name, TypeScript instance, logger, and a delegate object for handling events such as receiving files, starting, progress updates, and completion. The `ata` function is then called with the source code to initiate the type acquisition process.

```TypeScript
const ata = setupTypeAcquisition({
  projectName: "My ATA Project",
  typescript: ts,
  logger: console,
  delegate: {
    receivedFile: (code: string, path: string) => {
      // Add code to your runtime at the path...
    },
    started: () => {
      console.log("ATA start")
    },
    progress: (downloaded: number, total: number) => {
      console.log(`Got ${downloaded} out of ${total}`)
    },
    finished: vfs => {
      console.log("ATA done", vfs)
    },
  },
})

ata(`import danger from "danger"`)
```

--------------------------------

### Install reflect-metadata

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/reference/Decorators.md

Installs the `reflect-metadata` library, which is a polyfill for an experimental metadata API used with TypeScript decorators.

```shell
npm i reflect-metadata --save
```

--------------------------------

### Basic Decorator Example

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/reference/Decorators.md

A simple example demonstrating the basic syntax of a TypeScript decorator.

```APIDOC
## Basic Decorator

A _Decorator_ is a special kind of declaration that can be attached to a class declaration, method, accessor, property, or parameter.
Decorators use the form `@expression`, where `expression` must evaluate to a function that will be called at runtime with information about the decorated declaration.

### Example

```ts
function sealed(target) {
  // do something with 'target' ...
}
```
```

--------------------------------

### Initialize Plugin Development Environment

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/create-typescript-playground-plugin/template/README.md

Commands to clone the repository and install dependencies for local development.

```sh
git clone ...
yarn install
yarn start
```

--------------------------------

### Install Terser, Vinyl Buffer, and Gulp Sourcemaps

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/tutorials/Gulp.md

Installs Terser for code minification, vinyl-buffer to handle streaming vinyl files, and gulp-sourcemaps to manage source map generation during the build process.

```shell
npm install --save-dev gulp-terser vinyl-buffer gulp-sourcemaps
```

--------------------------------

### Install Watchify and Fancy Log for Background Compilation

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/tutorials/Gulp.md

Installs Watchify and fancy-log as development dependencies. Watchify enables efficient, incremental browserify builds, and fancy-log provides console logging for build events.

```shell
npm install --save-dev watchify fancy-log
```

--------------------------------

### JSON: Example package.json for lib Replacement

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/release-notes/TypeScript 5.8.md

An example of a package.json file demonstrating how to substitute default TypeScript lib files with custom versions from npm packages, specifically using `@typescript/lib-dom` to pin to a version of `@types/web`.

```json
{
    "devDependencies": {
       "@typescript/lib-dom": "npm:@types/web@0.0.199"
     }
}

```

--------------------------------

### Install Babel CLI and Presets

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/project-config/Integrating with Build Tools.md

Installs the necessary Babel command-line interface and TypeScript preset for transpiling TypeScript code. This is a development dependency.

```sh
npm install @babel/cli @babel/core @babel/preset-typescript --save-dev
```

--------------------------------

### Decorator Factory Example

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/reference/Decorators.md

An example illustrating how to use decorator factories to customize decorator behavior.

```APIDOC
## Decorator Factories

If we want to customize how a decorator is applied to a declaration, we can write a decorator factory. A _Decorator Factory_ is simply a function that returns the expression that will be called by the decorator at runtime.

### Example

```ts
function color(value: string) {
  // this is the decorator factory, it sets up
  // the returned decorator function
  return function (target) {
    // this is the decorator
    // do something with 'target' and 'value'...
  };
}
```
```

--------------------------------

### Full Example: Virtual TypeScript Environment with CDN and Compilation

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/typescript-vfs/README.md

Provides a comprehensive example of setting up a virtual TypeScript environment using `@typescript/vfs`. This includes creating a default map from CDN, setting up a virtual system and compiler host, and performing a program emit to generate declaration and JavaScript files. It also shows how to access the Abstract Syntax Tree (AST) of source files.

```typescript
import ts from "typescript"
import tsvfs from "@typescript/vfs"
import lzstring from "lz-string"

const fsMap = await tsvfs.createDefaultMapFromCDN(compilerOptions, ts.version, true, ts, lzstring)
fsMap.set("index.ts", "// main TypeScript file content")

const system = tsvfs.createSystem(fsMap)
const host = tsvfs.createVirtualCompilerHost(system, compilerOptions, ts)

const program = ts.createProgram({
  rootNames: [...fsMap.keys()],
  options: compilerOptions,
  host: host.compilerHost,
})

// This will update the fsMap with new files
// for the .d.ts and .js files
program.emit()

// Now I can look at the AST for the .ts file too
const index = program.getSourceFile("index.ts")
```

--------------------------------

### Install Babel and Gulp dependencies

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/tutorials/Gulp.md

Installs the required npm packages including Babelify, Babel core, presets, and Gulp utilities for sourcemaps and buffering.

```shell
npm install --save-dev babelify@8 babel-core babel-preset-es2015 vinyl-buffer gulp-sourcemaps
```

--------------------------------

### TypeScript Hello World Example

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/tutorials/Gulp.md

A basic TypeScript 'Hello World' program and its corresponding tsconfig.json configuration file.

```typescript
function hello(compiler: string) {
  console.log(`Hello from ${compiler}`);
}
hello("TypeScript");
```

```json
{
  "files": ["src/main.ts"],
  "compilerOptions": {
    "noImplicitAny": true,
    "target": "es5"
  }
}
```

--------------------------------

### Global Plugin Example (Extending Built-in Types)

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/declaration-files/templates/global-plugin.d.ts.md

Provides examples of global plugins that add new methods to built-in JavaScript types like String and Array, demonstrating how to identify them.

```javascript
var x = "hello, world";
// Creates new methods on built-in types
console.log(x.startsWithHello());

var y = [1, 2, 3];
// Creates new methods on built-in types
console.log(y.reverseAndSort());
```

--------------------------------

### Implement Getters and Setters

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/handbook-v2/Classes.md

Shows how to create accessors for class properties. It includes an example of using different types for getting and setting values, which is supported since TypeScript 4.3.

```typescript
class Thing {
  _size = 0;

  get size(): number {
    return this._size;
  }

  set size(value: string | number | boolean) {
    let num = Number(value);
    if (!Number.isFinite(num)) {
      this._size = 0;
      return;
    }
    this._size = num;
  }
}
```

--------------------------------

### Installing TypeScript Nightly Builds

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/release-notes/TypeScript 1.6.md

Command to install the latest nightly build of TypeScript globally using npm.

```shell
npm install -g typescript@next
```

--------------------------------

### Install Browserify and tsify for Bundling

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/tutorials/Gulp.md

Installs Browserify, tsify (a Browserify plugin for TypeScript), and vinyl-source-stream for integrating Browserify output with Gulp.

```shell
npm install --save-dev browserify tsify vinyl-source-stream
```

--------------------------------

### Install External Type Definitions

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/handbook-v2/Type Declarations.md

This command demonstrates how to install type definitions from the DefinitelyTyped repository using npm. It specifically shows the syntax for adding types for a library like React as a development dependency.

```bash
npm install --save-dev @types/react
```

--------------------------------

### Install gulp-typescript for Gulp

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/project-config/Integrating with Build Tools.md

Installs the gulp-typescript plugin, which allows Gulp to compile TypeScript files. This is a development dependency.

```sh
npm install gulp-typescript
```

--------------------------------

### Module Usage Patterns

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/declaration-files/Library Structures.md

Examples of how different types of modules are consumed, including function calls, class instantiation, and plugin registration.

```javascript
const x = require("foo");
const y = x(42);

const bar = require("bar");
const z = new bar("hello");

const jest = require("jest");
require("jest-matchers-files");
```

--------------------------------

### Example of Listing Emitted Files Output

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/tsconfig-reference/copy/en/options/listEmittedFiles.md

This example demonstrates the expected output when the 'listEmittedFiles' compiler option is enabled. After running the TypeScript compiler (e.g., via npm script), the console will display the paths of the generated JavaScript and declaration files.

```bash
$ npm run tsc

path/to/example/index.js
path/to/example/index.d.ts
```

--------------------------------

### Install TypeScript Compiler (npm)

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/handbook-v2/Basics.md

Installs the TypeScript Compiler `tsc` globally using npm. This makes the `tsc` command available in your terminal. Alternatively, `npx` can be used for local installations.

```shell
npm install -g typescript
```

--------------------------------

### TypeScript: Import Helpers Example

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/tsconfig-reference/copy/en/options/importHelpers.md

Demonstrates the effect of the `importHelpers` flag on TypeScript code. The first example shows the default behavior without `importHelpers`, where helpers are inlined. The second example, with `importHelpers` enabled, shows how helpers are imported from `tslib`, reducing code duplication.

```typescript
// @showEmit
// @target: ES5
// @downleveliteration
export function fn(arr: number[]) {
  const arr2 = [1, ...arr];
}
```

```typescript
// @showEmit
// @target: ES5
// @downleveliteration
// @importhelpers
// @noErrors
export function fn(arr: number[]) {
  const arr2 = [1, ...arr];
}
```

--------------------------------

### Install Gulp and TypeScript Dependencies

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/tutorials/Gulp.md

Installs Gulp CLI globally and project-specific development dependencies including TypeScript, Gulp, and the Gulp TypeScript plugin.

```shell
npm install -g gulp-cli
npm install --save-dev typescript gulp@4.0.0 gulp-typescript
```

--------------------------------

### Install tsify for Browserify

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/project-config/Integrating with Build Tools.md

Installs the tsify package, which is a Browserify transform that allows Browserify to process TypeScript files.

```sh
npm install tsify
```

--------------------------------

### Configure wildcard path mapping

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/tsconfig-reference/copy/en/options/paths.md

This example shows how to use wildcards to map entire directories to custom prefixes. This is useful for simplifying imports in large projects with complex folder structures.

```json
{
  "compilerOptions": {
    "paths": {
        "app/*": ["./src/app/*"],
        "config/*": ["./src/app/_config/*"],
        "environment/*": ["./src/environments/*"],
        "shared/*": ["./src/app/_shared/*"],
        "helpers/*": ["./src/helpers/*"],
        "tests/*": ["./src/tests/*"]
    }
  }
}
```

--------------------------------

### Configure simple module path mapping

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/tsconfig-reference/copy/en/options/paths.md

This example demonstrates how to map a specific module name to a local file path. It allows the use of 'import "jquery"' while resolving to a local vendor directory.

```json
{
  "compilerOptions": {
    "paths": {
      "jquery": ["./vendor/jquery/dist/jquery"]
    }
  }
}
```

--------------------------------

### Install grunt-browserify and tsify for Grunt

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/project-config/Integrating with Build Tools.md

Installs grunt-browserify and tsify, which are needed to use Browserify's bundling capabilities within a Grunt workflow for TypeScript projects. These are development dependencies.

```sh
npm install grunt-browserify tsify --save-dev
```

--------------------------------

### Example Output of tsc with explainFiles enabled

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/tsconfig-reference/copy/en/options/explainFiles.md

This is an example of the output generated when running the TypeScript compiler (`tsc`) with the `explainFiles` option enabled in `tsconfig.json`. It lists all files TypeScript includes in the compilation process, such as default library files and project files matched by include patterns, along with the specific reason for each file's inclusion.

```sh
❯ tsc
node_modules/typescript/lib/lib.d.ts
  Default library for target 'es5'
node_modules/typescript/lib/lib.es5.d.ts
  Library referenced via 'es5' from file 'node_modules/typescript/lib/lib.d.ts'
node_modules/typescript/lib/lib.dom.d.ts
  Library referenced via 'dom' from file 'node_modules/typescript/lib/lib.d.ts'
node_modules/typescript/lib/lib.webworker.importscripts.d.ts
  Library referenced via 'webworker.importscripts' from 
    file 'node_modules/typescript/lib/lib.d.ts'
node_modules/typescript/lib/lib.scripthost.d.ts
  Library referenced via 'scripthost' 
    from file 'node_modules/typescript/lib/lib.d.ts'
index.ts
  Matched by include pattern '**/*' in 'tsconfig.json'
```

--------------------------------

### Install grunt-ts for Grunt

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/project-config/Integrating with Build Tools.md

Installs the grunt-ts plugin, a Grunt task for compiling TypeScript. This is a development dependency.

```sh
npm install grunt-ts --save-dev
```

--------------------------------

### TypeScript Template String Pattern Index Signature

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/release-notes/TypeScript 4.4.md

Demonstrates the use of template string patterns in index signatures to allow properties that match a specific naming convention (e.g., starting with 'data-'). This example shows how to define an interface that accepts properties like 'data-blah' while still enforcing other known properties.

```typescript
// @errors: 2322 2375
interface Options {
    width?: number;
    height?: number;
}

let a: Options = {
    width: 100,
    height: 100,

    "data-blah": true,
};

interface OptionsWithDataProps extends Options {
    // Permit any property starting with 'data-'.
    [optName: `data-${string}`]: unknown;
}

let b: OptionsWithDataProps = {
    width: 100,
    height: 100,
    "data-blah": true,

    // Fails for a property which is not known, nor
    // starts with 'data-'
    "unknown-property": true,
};
```

--------------------------------

### Install Type Declarations via npm

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/declaration-files/Consumption.md

This command installs the type definition package for a specific library as a development dependency. It is the standard way to add missing type support for libraries that do not bundle their own declarations.

```cmd
npm install --save-dev @types/lodash
```

--------------------------------

### Install @rollup/plugin-typescript for Rollup

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/project-config/Integrating with Build Tools.md

Installs the @rollup/plugin-typescript plugin for Rollup. This plugin enables Rollup to bundle TypeScript code. Note that 'typescript' and 'tslib' are peer dependencies that must be installed separately.

```sh
npm install @rollup/plugin-typescript --save-dev
```

--------------------------------

### Basic Function Declaration Emit Example (TypeScript)

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/release-notes/TypeScript 5.5.md

Demonstrates a simple TypeScript function and its corresponding declaration file. This example illustrates the basic process of exporting variables and functions, and how TypeScript generates a declaration file (.d.ts) for them. It highlights the need for type inference even in simple cases.

```typescript
// util.ts
export let one = "1";
export let two = "2";

// add.ts
import { one, two } from "./util";
export function add() { return one + two; }
```

```typescript
// add.d.ts
export declare function add(): string;
```

--------------------------------

### Migrating from `baseUrl` to `paths`

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/release-notes/TypeScript 6.0.md

When migrating from `baseUrl`, update `paths` to include the prefix explicitly. This example shows how to adjust path mappings for `@app/*` and `@lib/*`.

```json
{
  "compilerOptions": {
    // ...
    "baseUrl": "./src",
    "paths": {
      "@app/*": ["app/*"],
      "@lib/*": ["lib/*"]
    }
  }
}
```

```json
{
  "compilerOptions": {
    // ...
    "paths": {
      "@app/*": ["./src/app/*"],
      "@lib/*": ["./src/lib/*"]
    }
  }
}
```

--------------------------------

### Module Augmentation Example

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/reference/Declaration Merging.md

Demonstrates how to augment an existing module ('./observable') by adding a new method ('map') to its interface.

```APIDOC
## Module Augmentation

This example shows how to augment an existing module to add new functionality recognized by the TypeScript compiler.

### Method
Module Augmentation

### Endpoint
N/A (Code-level feature)

### Parameters
N/A

### Request Body
N/A

### Request Example
```typescript
// observable.ts
export class Observable<T> {
  // ... implementation left as an exercise for the reader ...
}

// map.ts
import { Observable } from "./observable";
declare module "./observable" {
  interface Observable<T> {
    map<U>(f: (x: T) => U): Observable<U>;
  }
}
Observable.prototype.map = function (f) {
  // ... another exercise for the reader
};

// consumer.ts
import { Observable } from "./observable";
import "./map";
let o: Observable<number>;
o.map((x) => x.toFixed());
```

### Response
N/A

### Response Example
N/A

### Limitations
1. Cannot declare new top-level declarations.
2. Default exports cannot be augmented.
```

--------------------------------

### Example Output of Listed Files

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/tsconfig-reference/copy/en/options/listFiles.md

This shows the typical output when the `listFiles` option is enabled in `tsconfig.json`. The output includes paths to declaration files and your project's source files, demonstrating which files the compiler is processing.

```bash
$ npm run tsc
path/to/example/node_modules/typescript/lib/lib.d.ts
path/to/example/node_modules/typescript/lib/lib.es5.d.ts
path/to/example/node_modules/typescript/lib/lib.dom.d.ts
path/to/example/node_modules/typescript/lib/lib.webworker.importscripts.d.ts
path/to/example/node_modules/typescript/lib/lib.scripthost.d.ts
path/to/example/index.ts
```

--------------------------------

### Install Microsoft.TypeScript.MSBuild via NuGet

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/project-config/Integrating with Build Tools.md

Instructions for installing the Microsoft.TypeScript.MSBuild NuGet package through the Visual Studio Package Manager. This enables MSBuild to compile TypeScript projects.

```text
- Right-Click -> Manage NuGet Packages
- Search for `Microsoft.TypeScript.MSBuild`
- Hit `Install`
- When install is complete, rebuild!
```

--------------------------------

### Code Highlighting Example in TypeScript

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/ts-twoslasher/README.md

This example demonstrates code highlighting within a TypeScript snippet. It shows a `greet` function that takes a person's name and a date, and then logs a greeting. The comment `// ^^^^^^^^^^` indicates a specific part of the code that might be highlighted or inspected.

```typescript
function greet(person: string, date: Date) {
  console.log(`Hello ${person}, today is ${date.toDateString()}!`)
}

greet("Maddison", new Date())
//                ^^^^^^^^^^
```

--------------------------------

### Creating a Virtual File System

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/typescript-vfs/README.md

Demonstrates how to initialize a virtual file system using a Map to store files.

```APIDOC
## Creating a Virtual File System

### Description
This snippet shows the basic setup for creating a virtual file system (VFS) using a `Map` to hold file contents.

### Method
`createSystem(fsMap: Map<string, string>)`

### Endpoint
N/A (Library function)

### Parameters
#### Request Body
- **fsMap** (Map<string, string>) - Required - A Map where keys are file paths (strings) and values are file contents (strings).

### Request Example
```typescript
import { createSystem } from "@typescript/vfs"

const fsMap = new Map<string, string>()
fsMap.set("index.ts", 'const a = "Hello World"')

const system = createSystem(fsMap)
```

### Response
#### Success Response (200)
- **system** (object) - An object representing the virtual TypeScript system.

#### Response Example
```json
{
  "system": "[TypeScript VFS System Object]"
}
```
```

--------------------------------

### Install jspm for JavaScript Package Manager

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/project-config/Integrating with Build Tools.md

Installs the jspm package manager globally. Note that TypeScript support is experimental and available in the beta version.

```sh
npm install -g jspm@beta
```

--------------------------------

### TypeScript Code Completion Example

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/ts-twoslasher/README.md

Demonstrates code completion for the `console.log` function in TypeScript. It shows the available methods for console logging, such as assert, clear, count, error, info, log, table, time, trace, and warn. The example highlights the input code and the resulting completion suggestions.

```typescript
console.log
//       ^|
```

```typescript
console.log
```

```json
{
  "code": "See above",
  "extension": "ts",
  "highlights": [],
  "queries": [
    {
      "completions": [
        {
          "name": "assert",
          "kind": "method",
          "kindModifiers": "declare",
          "sortText": "11"
        },
        {
          "name": "clear",
          "kind": "method",
          "kindModifiers": "declare",
          "sortText": "11"
        },
        {
          "name": "count",
          "kind": "method",
          "kindModifiers": "declare",
          "sortText": "11"
        },
        {
          "name": "countReset",
          "kind": "method",
          "kindModifiers": "declare",
          "sortText": "11"
        },
        {
          "name": "debug",
          "kind": "method",
          "kindModifiers": "declare",
          "sortText": "11"
        },
        {
          "name": "dir",
          "kind": "method",
          "kindModifiers": "declare",
          "sortText": "11"
        },
        {
          "name": "dirxml",
          "kind": "method",
          "kindModifiers": "declare",
          "sortText": "11"
        },
        {
          "name": "error",
          "kind": "method",
          "kindModifiers": "declare",
          "sortText": "11"
        },
        {
          "name": "group",
          "kind": "method",
          "kindModifiers": "declare",
          "sortText": "11"
        },
        {
          "name": "groupCollapsed",
          "kind": "method",
          "kindModifiers": "declare",
          "sortText": "11"
        },
        {
          "name": "groupEnd",
          "kind": "method",
          "kindModifiers": "declare",
          "sortText": "11"
        },
        {
          "name": "info",
          "kind": "method",
          "kindModifiers": "declare",
          "sortText": "11"
        },
        {
          "name": "log",
          "kind": "method",
          "kindModifiers": "declare",
          "sortText": "11"
        },
        {
          "name": "table",
          "kind": "method",
          "kindModifiers": "declare",
          "sortText": "11"
        },
        {
          "name": "time",
          "kind": "method",
          "kindModifiers": "declare",
          "sortText": "11"
        },
        {
          "name": "timeEnd",
          "kind": "method",
          "kindModifiers": "declare",
          "sortText": "11"
        },
        {
          "name": "timeLog",
          "kind": "method",
          "kindModifiers": "declare",
          "sortText": "11"
        },
        {
          "name": "timeStamp",
          "kind": "method",
          "kindModifiers": "declare",
          "sortText": "11"
        },
        {
          "name": "trace",
          "kind": "method",
          "kindModifiers": "declare",
          "sortText": "11"
        },
        {
          "name": "warn",
          "kind": "method",
          "kindModifiers": "declare",
          "sortText": "11"
        }
      ],
      "kind": "completions",
      "start": 9,
      "completionsPrefix": "l",
      "length": 1,
      "offset": 9,
      "line": 1
    }
  ],
  "staticQuickInfos": "[ 2 items ]",
  "errors": [],
  "playgroundURL": "https://www.typescriptlang.org/play/#code/MYewdgziA2CmB00QHMBQB6dACHusD0AfVIA",
  "tags": []
}
```

--------------------------------

### TypeScript Mapped Type: Proxify

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/reference/Advanced Types.md

Creates a 'Proxify' type that wraps each property of an input type T with a Proxy object, providing 'get' and 'set' methods. This is an example of a more complex mapped type transformation.

```typescript
type Proxy<T> = {
  get(): T;
  set(value: T): void;
};

type Proxify<T> = {
  [P in keyof T]: Proxy<T[P]>;
};
```

--------------------------------

### TypeScript Module Import Examples with esModuleInterop

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/modules-reference/appendices/ESM-CJS-Interop.md

Demonstrates various import scenarios in TypeScript, showcasing how `esModuleInterop` affects the handling of CommonJS and ES modules. This includes examples of default imports from transpiled dependencies and true CommonJS modules, as well as imports from local TypeScript files.

```typescript
// @Filename: node_modules/transpiled-dependency/index.js
exports.__esModule = true;
exports.default = function doSomething() { /* ... */ };
exports.something = "something";

// @Filename: node_modules/true-cjs-dependency/index.js
module.exports = function doSomethingElse() { /* ... */ };

// @Filename: src/sayHello.ts
export default function sayHello() { /* ... */ }
export const hello = "hello";

// @Filename: src/main.ts
import doSomething from "transpiled-dependency";
import doSomethingElse from "true-cjs-dependency";
import sayHello from "./sayHello.js";
```

--------------------------------

### React Intl Setup with createInternational

Source: https://github.com/microsoft/typeScript-website/blob/v2/docs/How i18n Works For Site Copy.md

Demonstrates setting up internationalization within a React component using React Intl. It shows how to wrap a page with the Intl component and how to use the useIntl hook along with createInternational to provide type-safe access to localized copy.

```typescript
export default (props: Props) => (
  <Intl locale={props.pageContext.lang}>
    <Comm {...props} />
  </Intl>
)
```

```typescript
type Props = {
  data: CommunityPageQuery
  pageContext: any
}

export const Comm: React.FC<Props> = props => {
  const intl = useIntl()
  const i = createInternational<typeof comCopy>(intl)
  // ...
}
```

--------------------------------

### Install TypeScript Nightly Build with npm

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/Nightly Builds.md

Installs the latest nightly build of TypeScript as a development dependency using npm. This command fetches the 'next' tag from the npm registry, which typically points to the most recent pre-release version.

```shell
npm install -D typescript@next
```

--------------------------------

### Initialize npm Project

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/tutorials/Gulp.md

Initializes a new npm project, generating a package.json file. The entry point is specified as './dist/main.js'.

```shell
npm init
```

--------------------------------

### HTML Script Loading Example

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/modules-reference/Theory.md

Demonstrates the traditional method of loading multiple JavaScript files using script tags in HTML. This approach leads to all scripts sharing a single global scope, which can cause naming conflicts.

```html
<html>
  <head>
    <script src="a.js"></script>
    <script src="b.js"></script>
  </head>
  <body></body>
</html>
```

--------------------------------

### Creating a Virtual TypeScript Environment

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/typescript-vfs/README.md

Illustrates how to set up a complete virtual TypeScript environment with a language service.

```APIDOC
## Creating a Virtual TypeScript Environment

### Description
This snippet demonstrates how to create a virtual TypeScript environment, including a virtual file system and a TypeScript language service, allowing for code introspection and analysis.

### Method
`createVirtualTypeScriptEnvironment(system: any, files: string[], ts: any, compilerOpts: object)`

### Endpoint
N/A (Library function)

### Parameters
#### Request Body
- **system** (object) - Required - The virtual TypeScript system created by `createSystem`.
- **files** (string[]) - Required - An array of file paths to include in the environment.
- **ts** (object) - Required - The imported TypeScript module.
- **compilerOpts** (object) - Optional - TypeScript compiler options.

### Request Example
```typescript
import { createSystem, createVirtualTypeScriptEnvironment } from "@typescript/vfs"
import ts from "typescript"

const fsMap = new Map<string, string>()
const system = createSystem(fsMap)

const compilerOpts = {}
const env = createVirtualTypeScriptEnvironment(system, ["index.ts"], ts, compilerOpts)

// Example interaction with the language service:
env.languageService.getDocumentHighlights("index.ts", 0, ["index.ts"])
```

### Response
#### Success Response (200)
- **env** (object) - An object representing the virtual TypeScript environment, including a `languageService`.

#### Response Example
```json
{
  "env": "[Virtual TypeScript Environment Object]"
}
```
```

--------------------------------

### Install Type Declaration Files for Modules

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/tutorials/Migrating from JavaScript.md

Installs the necessary type declaration files (e.g., '@types/lodash') for a given npm package, enabling TypeScript to understand and provide type checking and autocompletion for external libraries.

```shell
npm install -S @types/lodash
```

--------------------------------

### Configure TypeScript project using include and exclude properties

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/project-config/tsconfig.json.md

This example shows how to use glob patterns to include all files in a directory while excluding specific test files, providing a more flexible configuration than listing files manually.

```json
{
  "compilerOptions": {
    "module": "system",
    "noImplicitAny": true,
    "removeComments": true,
    "preserveConstEnums": true,
    "outFile": "../../built/local/tsc.js",
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["**/*.spec.ts"]
}
```

--------------------------------

### Create Virtual File System from CDN (TypeScript)

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/typescript-vfs/README.md

Shows how to initialize a virtual file system by fetching TypeScript library files from a CDN. This method is suitable for web environments and includes options for caching and compression.

```typescript
import { createDefaultMapFromCDN } from "@typescript/vfs"
import ts from "typescript"
import lzstring from "lz-string"

const start = async () => {
  const shouldCache = true
  // This caches the lib files in the site's localStorage
  const fsMap = await createDefaultMapFromCDN({ target: ts.ScriptTarget.ES2015 }, "3.7.3", shouldCache, ts)

  // This stores the lib files as a zipped string to save space in the cache
  const otherMap = await createDefaultMapFromCDN({ target: ts.ScriptTarget.ES2015 }, "3.7.3", shouldCache, ts, lzstring)

  fsMap.set("index.ts", "const hello = 'hi'")
  // ...
}

start()
```

--------------------------------

### Configure TypeScript project using files property

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/project-config/tsconfig.json.md

This example demonstrates a tsconfig.json file that explicitly lists individual source files to be included in the compilation process using the 'files' property.

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "noImplicitAny": true,
    "removeComments": true,
    "preserveConstEnums": true,
    "sourceMap": true
  },
  "files": [
    "core.ts",
    "sys.ts",
    "types.ts",
    "scanner.ts",
    "parser.ts",
    "utilities.ts",
    "binder.ts",
    "checker.ts",
    "emitter.ts",
    "program.ts",
    "commandLineParser.ts",
    "tsc.ts",
    "diagnosticInformationMap.generated.ts"
  ]
}
```

--------------------------------

### Run TypeScript Website without Watchman

Source: https://github.com/microsoft/typeScript-website/blob/v2/docs/Setup Troubleshooting.md

To run the TypeScript website without relying on Watchman, particularly on Windows where its support is limited, use the 'pnpm run --filter=typescriptlang-org start' command. This command starts the Gatsby website directly.

```shell
pnpm run --filter=typescriptlang-org start
```

--------------------------------

### Install Webpack TypeScript Loaders

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/tutorials/Migrating from JavaScript.md

Installs the necessary npm packages for integrating TypeScript with Webpack: 'ts-loader' for compiling TypeScript and 'source-map-loader' for debugging.

```shell
npm install ts-loader source-map-loader
```

--------------------------------

### Configuring package imports

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/release-notes/TypeScript 5.7.md

Example of package.json imports field which is not affected by relative path rewriting.

```json
{
    "name": "my-package",
    "imports": {
        "#root/*": "./dist/*"
    }
}
```

--------------------------------

### Importing Library Modules

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/declaration-files/templates/global-plugin.d.ts.md

Demonstrates how to import various modules from a library structure mirroring the file system layout.

```javascript
var a = require("myLib");
var b = require("myLib/foo");
var c = require("myLib/bar");
var d = require("myLib/bar/baz");
```

--------------------------------

### Twoslash API Example: Inline Flags

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/ts-twoslasher/README.md

Illustrates the use of inline flags within Twoslash comments to control code sample behavior. This example shows the `ExampleOptions` interface, including flags like `noErrors`, `errors`, and `showEmit`.

```typescript
/** Available inline flags which are not compiler flags */
export interface ExampleOptions {
  /** Lets the sample suppress all error diagnostics */
  noErrors: boolean
  /** An array of TS error codes, which you write as space separated - this is so the tool can know about unexpected errors */
  errors: number[]
  /** Shows the JS equivalent of the TypeScript code instead */
  showEmit: boolean
  /**
   * Must be used with showEmit, lets you choose the file to present instead of the source - defaults to index.js which
   * means when you just use `showEmit` above it shows the transpiled JS.
   */
  showEmittedFile: string
  /** Whether to disable the pre-cache of LSP calls for interesting identifiers, defaults to false */
  noStaticSemanticInfo: boolean
  /** Declare that the TypeScript program should edit the fsMap which is passed in, this is only useful for tool-makers, defaults to false */
  emit: boolean
  /** Declare that you don't need to validate that errors have corresponding annotations, defaults to false */
  noErrorValidation: boolean
}
```

--------------------------------

### Basic Conditional Type Examples in TypeScript

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/handbook-v2/Type Manipulation/Conditional Types.md

Demonstrates the basic syntax of conditional types, showing how to determine a type based on a condition. It illustrates checking assignability between types.

```typescript
interface Animal {
  live(): void;
}
interface Dog extends Animal {
  woof(): void;
}

type Example1 = Dog extends Animal ? number : string;
//   ^?

type Example2 = RegExp extends Animal ? number : string;
//   ^?
```

--------------------------------

### Configuring package.json for Subpath Resolution

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/modules-reference/Reference.md

This example demonstrates how to define subpaths in the exports field of package.json to handle different module systems like import and require.

```json
{
  "name": "pkg",
  "exports": {
    ".": {
      "import": "./index.mjs",
      "require": "./index.cjs"
    },
    "./subpath": {
      "import": "./subpath/index.mjs",
      "require": "./subpath/index.cjs"
    }
  }
}
```

--------------------------------

### Global Augmentation Example

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/reference/Declaration Merging.md

Illustrates how to augment the global scope (e.g., Array.prototype) from within a module.

```APIDOC
## Global Augmentation

This example demonstrates augmenting the global scope, such as adding a method to the built-in Array type.

### Method
Global Augmentation

### Endpoint
N/A (Code-level feature)

### Parameters
N/A

### Request Body
N/A

### Request Example
```typescript
// observable.ts
export class Observable<T> {
  // ... still no implementation ...
}

declare global {
  interface Array<T> {
    toObservable(): Observable<T>;
  }
}

Array.prototype.toObservable = function () {
  // ...
};
```

### Response
N/A

### Response Example
N/A

### Limitations
Global augmentations share the same limitations as module augmentations.
```

--------------------------------

### Configure paths to node_modules (Not Recommended)

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/modules-reference/Reference.md

An example of using the 'paths' compiler option to point to node_modules packages. This approach is discouraged as it bypasses package.json resolution logic like 'exports' and 'types'.

```json
{
  "compilerOptions": {
    "paths": {
      "pkg": ["./node_modules/pkg/dist/index.d.ts"],
      "pkg/*": ["./node_modules/pkg/*"]
    }
  }
}
```

--------------------------------

### Asset Import Example with CSS in TSX

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/tsconfig-reference/copy/en/options/noUncheckedSideEffectImports.md

Shows how side effect imports can be used with bundlers to import assets like CSS files. This example uses TSX syntax to import a CSS file, which is then processed by a bundler.

```tsx
import "./button-component.css";

export function Button() {
    // ...
}
```

--------------------------------

### TypeScript Module Import Error Example

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/tsconfig-reference/copy/en/options/allowSyntheticDefaultImports.md

An example demonstrating a type error that occurs when attempting to use a default import on a CommonJS module without the allowSyntheticDefaultImports flag enabled.

```typescript
// @errors: 1259 1192
// @checkJs
// @allowJs
// @esModuleInterop: false
// @filename: utilFunctions.js
// @noImplicitAny: false
const getStringLength = (str) => str.length;

module.exports = {
  getStringLength,
};

// @filename: index.ts
import utils from "./utilFunctions";

const count = utils.getStringLength("Check JS");
```

--------------------------------

### TypeScript Pick Type Example

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/reference/Utility Types.md

Constructs a type by selecting a subset of properties from an existing type.

```typescript
interface Todo {
  title: string;
  description: string;
  completed: boolean;
}

type TodoPreview = Pick<Todo, "title" | "completed">

const todo: TodoPreview = {
  title: "Clean room",
  completed: false,
};

todo;
```

--------------------------------

### TypeScript Source Map Example

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/tsconfig-reference/copy/en/options/sourceMap.md

Demonstrates a simple TypeScript export and how it is compiled into JavaScript with a source map reference. This showcases the output when the `sourceMap` compiler option is enabled.

```typescript
// helloWorld.ts
export declare const helloWorld = "hi";
```

```javascript
// helloWorld.js
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.helloWorld = "hi";
//# sourceMappingURL=// helloWorld.js.map
```

```json
// helloWorld.js.map
{
  "version": 3,
  "file": "ex.js",
  "sourceRoot": "",
  "sources": ["../ex.ts"],
  "names": [],
  "mappings": ";;AAAa,QAAA,UAAU,GAAG,IAAI,CAAA"
}
```

--------------------------------

### Binding Methods with Constructors

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/release-notes/TypeScript 5.0.md

Examples of manual method binding in classes to ensure proper 'this' context.

```typescript
class Person {
    name: string;
    constructor(name: string) {
        this.name = name;
        this.greet = this.greet.bind(this);
    }
    greet() {
        console.log(`Hello, my name is ${this.name}.`);
    }
}
```

--------------------------------

### Configuring Module and Target for ES6 in TypeScript 1.7

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/release-notes/TypeScript 1.7.md

Example of a tsconfig.json file demonstrating how to set the module output to AMD while targeting ES6, providing flexibility for specific runtimes.

```json
{
  "compilerOptions": {
    "module": "amd",
    "target": "es6"
  }
}
```

--------------------------------

### URL Structures: Query Parameters

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/playground-handbook/copy/en/URL Structure.md

Modify the Playground's setup and compiler options using query parameters in the URL.

```APIDOC
## URL Structures: Query Parameters

### Description
Query parameters allow you to customize the TypeScript Playground's configuration, including the TypeScript version, compiler flags, and file type, from the default settings.

### Query Parameters

- `?ts=3.9.2` - Sets the TypeScript compiler version. Supported versions can be found in the [pre-releases.json](https://playgroundcdn.typescriptlang.org/indexes/pre-releases.json) and [releases.json](https://playgroundcdn.typescriptlang.org/indexes/releases.json) files.
  - `ts=next`: Uses the latest nightly build of TypeScript.
  - `ts=dev`: Uses a local developer build of TypeScript.
- `?flag=value` - Sets a specific compiler flag to a given value. Refer to TypeScript documentation for available flags.
- `?filetype=js|ts|dts` - Sets the language mode for the editor (JavaScript, TypeScript, or Declaration Files).
```

--------------------------------

### TypeScript Class Inheritance Example

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/release-notes/TypeScript 2.1.md

Demonstrates how classes inherit from a base class in TypeScript. The example shows a `Base` class with a constructor that returns an object, and a `Derived` class that extends it. This highlights a specific behavior related to constructor return values.

```typescript
class Base {
  x: number;
  constructor() {
    // return a new object other than `this`
    return {
      x: 1
    };
  }
}

class Derived extends Base {
  constructor() {
    super();
    this.x = 2;
  }
}
```

```javascript
var Derived = (function(_super) {
  __extends(Derived, _super);
  function Derived() {
    var _this = _super.call(this) || this;
    _this.x = 2;
    return _this;
  }
  return Derived;
})(Base);
```

--------------------------------

### Defining a Global Library in JavaScript

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/declaration-files/templates/global.d.ts.md

Examples of how global libraries expose functionality via top-level functions or by attaching properties to the window object.

```javascript
function createGreeting(s) {
  return "Hello, " + s;
}

window.createGreeting = function (s) {
  return "Hello, " + s;
};
```

--------------------------------

### Create HTML Entry Point

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/tutorials/Gulp.md

Defines the basic HTML structure for the application, including a placeholder element for dynamic content and a reference to the bundled JavaScript file.

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Hello World!</title>
  </head>
  <body>
    <p id="greeting">Loading ...</p>
    <script src="bundle.js"></script>
  </body>
</html>
```

--------------------------------

### Consume Libraries in TypeScript

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/declaration-files/Consumption.md

Demonstrates how to import and use a library after its type declarations have been installed. It covers both module-based imports and usage via global variables.

```ts
import * as _ from "lodash";
_.padStart("Hello TypeScript!", 20, " ");
```

```ts
_.padStart("Hello TypeScript!", 20, " ");
```

--------------------------------

### Create Virtual File System from Node Modules (TypeScript)

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/typescript-vfs/README.md

Demonstrates how to create a virtual file system map using local TypeScript library files found in `node_modules`. This is useful for environments with access to the local file system.

```typescript
import { createDefaultMapFromNodeModules } from "@typescript/vfs"
import ts from "typescript"

const fsMap = createDefaultMapFromNodeModules({ target: ts.ScriptTarget.ES2015 })
fsMap.set("index.ts", "const hello = 'hi'")
// ...
```

```typescript
const getLib = (name: string) => {
  const lib = dirname(require.resolve("typescript"))
  return readFileSync(join(lib, name), "utf8")
}

const addLib = (name: string, map: Map<string, string>) => {
  map.set("/" + name, getLib(name))
}

const createDefaultMap2015 = () => {
  const fsMap = new Map<string, string>()
  addLib("lib.es2015.d.ts", fsMap)
  addLib("lib.es2015.collection.d.ts", fsMap)
  addLib("lib.es2015.core.d.ts", fsMap)
  addLib("lib.es2015.generator.d.ts", fsMap)
  addLib("lib.es2015.iterable.d.ts", fsMap)
  addLib("lib.es2015.promise.d.ts", fsMap)
  addLib("lib.es2015.proxy.d.ts", fsMap)
  addLib("lib.es2015.reflect.d.ts", fsMap)
  addLib("lib.es2015.symbol.d.ts", fsMap)
  addLib("lib.es2015.symbol.wellknown.d.ts", fsMap)
  addLib("lib.es5.d.ts", fsMap)
  return fsMap
}
```

--------------------------------

### Initializing Tsconfig.json with --init

Source: https://github.com/microsoft/typeScript-website/blob/v2/packages/documentation/copy/en/release-notes/TypeScript 1.6.md

Command-line option to create an initial tsconfig.json file with default settings in the current directory. Allows passing additional command-line arguments to be stored in the generated file.

```shell
tsc --init
```