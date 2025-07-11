<p align="center"><h1 align="center">
  @nodesecure/mama
</h1>

<p align="center">
  Manifest Manager
</p>

## Requirements
- [Node.js](https://nodejs.org/en/) v20 or higher

## Getting Started

This package is available in the Node Package Repository and can be easily installed with [npm](https://docs.npmjs.com/getting-started/what-is-npm) or [yarn](https://yarnpkg.com).

```bash
$ npm i @nodesecure/mama
# or
$ yarn add @nodesecure/mama
```

## Usage example

```ts
import { ManifestManager } from "@nodesecure/mama";

const mama = await ManifestManager.fromPackageJSON(
  process.cwd()
);
console.log(mama.document);
console.log(mama.integrity);
```

## Utils

This package exports a set of standalone utilities that are internally used by the ManifestManager class, but may also be useful independently for various tasks:

- [packageJSONIntegrityHash](./docs/packageJSONIntegrityHash.md)
- [parseNpmSpec](./docs/parseNpmSpec.md)
- [inspectModuleType](./docs/inspectModuleType.md)

## ManifestManager API

### (static) fromPackageJSON(locationOrManifest: string | ManifestManager): Promise< ManifestManager >

Load a `ManifestManager` from a given location or return the instance if one is provided.

The **locationOrManifest** parameter can either be a `string` (representing a path) or a `ManifestManager` instance.

- If it is a `string`, it can either be a full path to a `package.json` or the path to the directory where one is located.
- If it is a `ManifestManager` instance, the method will return the instance directly.

> [!NOTE]
> When a `location` string is provided, it is automatically dispatched to the ManifestManager constructor options.

### (static) fromPackageJSONSync(locationOrManifest: string | ManifestManager): ManifestManager

Same as `fromPackageJSON` but using synchronous FS API.

### (static) isLocated<T>(mama: ManifestManager<T>): mama is LocatedManifestManager<T>

A TypeScript type guard to check if a `ManifestManager` instance has a location. This is particularly useful when working with manifests that may or may not have been loaded from the filesystem.

When the type guard is successful, the `location` property is available on the instance.

```ts
import { ManifestManager, type LocatedManifestManager } from "@nodesecure/mama";
import { expectType } from "tsd";

const locatedManifest = new ManifestManager(
  { name: "test", version: "1.0.0" },
  { location: "/tmp/path" }
);

if (ManifestManager.isLocated(locatedManifest)) {
  // locatedManifest is now of type LocatedManifestManager
  expectType<string>(locatedManifest.location);
}
```

### constructor(document: ManifestManagerDocument, options?: ManifestManagerOptions)

document is described by the following type:
```ts
import type {
  PackumentVersion,
  PackageJSON,
  WorkspacesPackageJSON
} from "@nodesecure/npm-types";

type ManifestManagerDocument =
  PackageJSON |
  WorkspacesPackageJSON |
  PackumentVersion;
```

And the `options` interface

```ts
export interface ManifestManagerOptions {
  /**
   * Optional absolute location (directory) to the manifest
   */
  location?: string;
}
```

---

Default values are injected if they are not present in the document. This behavior is necessary for the correct operation of certain functions, such as integrity recovery.

```js
{
  dependencies: {},
  devDependencies: {},
  scripts: {},
  gypfile: false
}
```

> [!NOTE]
> document is deep cloned (there will no longer be any reference to the object supplied as an argument)

### getEntryFiles(): IterableIterator< string >
Deeply extract entry files from package `main` and Node.js `exports` fields.

### moduleType

Return the type of the module

```ts
type PackageModuleType = "dts" | "faux" | "dual" | "esm" | "cjs";
```

### spec
Return the NPM specification (which is the combinaison of `name@version`).

> [!CAUTION]
> This property may not be available for Workspaces (if 'name' or 'version' properties are missing, it will throw an error).

### integrity
Return an integrity hash (which is a **string**) of the following properties:

```js
{
  name,
  version,
  dependencies,
  license: license ?? "NONE",
  scripts
}
```

If `dependencies` and `scripts` are missing, they are defaulted to an empty object `{}`

> [!CAUTION]
> This is not available for Workspaces

### author
Return the author parsed as a **Contact** (or `null` if the property is missing).

```ts
interface Contact {
  email?: string;
  url?: string;
  name: string;
}
```

### dependencies and devDependencies
Return the (dev) dependencies as an Array (of string)

```json
{
  "dependencies": {
    "kleur": "1.0.0"
  }
}
```

The above JSON will produce `["kleur"]`

### isWorkspace
Return true if `workspaces` property is present

> [!NOTE]
> Workspace are described by the interface `WorkspacesPackageJSON` (from @nodesecure/npm-types)

### location

A string representing the absolute path to the manifest file's directory, if it was provided in the constructor options. Otherwise, it is `undefined`.

```ts
const mama = new ManifestManager(
  { name: "test", version: "1.0.0" },
  { location: "/home/user/my-project/package.json" }
);

console.log(mama.location); //-> /home/user/my-project
```

### hasZeroSemver
Return true if `version` is starting with `0.x`

### flags

Since we've created this package for security purposes, the instance contains various flags indicating threats detected in the content:

- **isNative**: Contain an identified native package to build or provide N-API features like `node-gyp`.
- **hasUnsafeScripts**: Contain unsafe scripts like `install`, `preinstall`, `postinstall`...

```ts
import assert from "node:assert";

const mama = new ManifestManager({
  name: "hello",
  version: "1.0.0",
  scripts: {
    postinstall: "node malicious.js"
  }
});

assert.ok(mama.flags.hasUnsafeScripts);
```

The flags property is sealed (It is not possible to extend the list of flags)

> [!IMPORTANT]
> Read more about unsafe scripts [here](https://www.nerdycode.com/prevent-npm-executing-scripts-security/)

