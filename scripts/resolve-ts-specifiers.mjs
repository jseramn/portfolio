const MODULE_EXT = /\.(?:ts|tsx|mts|cts|js|jsx|mjs|cjs|json|css|node)$/

/** Resolve relative specifiers to `.ts` unless they already have a module extension. */
export async function resolve(specifier, context, nextResolve) {
  const bare = specifier.split("?")[0]
  if (specifier.startsWith(".") && !MODULE_EXT.test(bare)) {
    try {
      return await nextResolve(`${specifier}.ts`, context)
    } catch {
      return nextResolve(specifier, context)
    }
  }
  return nextResolve(specifier, context)
}
