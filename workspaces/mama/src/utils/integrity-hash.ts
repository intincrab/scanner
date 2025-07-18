// Import Third-party Dependencies
import hash from "object-hash";
import type {
  PackumentVersion, PackageJSON, WorkspacesPackageJSON
} from "@nodesecure/npm-types";

export interface PackageJSONIntegrityHashOptions {
  /**
   * Indicates whether the document originates from the NPM registry.
   *
   * @default false
   */
  isFromRemoteRegistry?: boolean;
}

export function packageJSONIntegrityHash(
  document: PackumentVersion | PackageJSON | WorkspacesPackageJSON,
  options: PackageJSONIntegrityHashOptions = {}
) {
  const { isFromRemoteRegistry = false } = options;
  const { dependencies = {}, license = "NONE", scripts = {} } = document;

  if (isFromRemoteRegistry) {
    // See https://github.com/npm/cli/issues/5234
    if ("install" in dependencies && dependencies.install === "node-gyp rebuild") {
      delete dependencies.install;
    }
  }

  return hash({
    name: document.name,
    version: document.version,
    dependencies,
    license,
    scripts
  });
}
