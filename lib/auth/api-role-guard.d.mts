export const API_ROLE_ROUTES: ReadonlyArray<Readonly<{
  namespace: string; allowed: ReadonlyArray<string>;
}>>;
export function rolesForProtectedApiPath(pathname: string): ReadonlyArray<string> | undefined;
