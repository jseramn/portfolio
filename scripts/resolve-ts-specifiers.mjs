/** Resolve extensionless relative specifiers to `.ts` for Node type-stripping. */
export async function resolve(specifier, context, nextResolve) {
  const bare = specifier.split("?")[0]
  if (specifier.startsWith(".") && !/\.[A-Za-z0-9]+$/.test(bare)) {
    try {
      return await nextResolve(`${specifier}.ts`, context)
    } catch {
      return nextResolve(specifier, context)
    }
  }
  return nextResolve(specifier, context)
}
