// Shapes used by the adapted Starlight 0.42.5 Search component.
// Runtime values are provided by the installed Starlight integration.
declare module 'virtual:starlight/project-context' {
  const project: { trailingSlash: 'always' | 'never' | 'ignore' };
  export default project;
}
declare module 'virtual:starlight/pagefind-config' {
  export const pagefindUserConfig: Record<string, unknown>;
}
