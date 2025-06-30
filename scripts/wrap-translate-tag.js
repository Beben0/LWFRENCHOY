/*
 * Codemod: wrap-translate-tag
 * Usage: npx jscodeshift -t scripts/wrap-translate-tag.js "app/**/*.{tsx,jsx}" "components/**/*.{tsx,jsx}"
 */

// @ts-nocheck

module.exports = function (fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  // Ensure we have the import.
  const importDecl = root.find(j.ImportDeclaration, {
    source: { value: '@/components/ui/translate' },
  });
  if (importDecl.size() === 0) {
    root.get().node.program.body.unshift(
      j.importDeclaration(
        [j.importSpecifier(j.identifier('Translate'))],
        j.literal('@/components/ui/translate')
      )
    );
  }

  // Wrap bare string literals that are direct children of JSXElements.
  root
    .find(j.JSXElement)
    .forEach((path) => {
      path.node.children = path.node.children.map((child) => {
        if (child.type === 'Literal' && typeof child.value === 'string' && child.value.trim()) {
          return j.jsxElement(
            j.jsxOpeningElement(j.jsxIdentifier('Translate'), [], false),
            j.jsxClosingElement(j.jsxIdentifier('Translate')),
            [j.literal(child.value)]
          );
        }
        return child;
      });
    });

  return root.toSource();
}; 