
export function isNonNull(value: string | null): value is string {
    return value !== null;
}

export function isNullString(value: string | null | undefined): value is null {
    return value === null;
}

export function isUndefinedString(value?: string): value is undefined {
  return value === undefined;
}

export function isLoggedIn(jwt: string, userName: string): boolean {
    if (userName === '') {
        return false;
      }
      if (jwt === '') {
        return false;
      }
    return true;
}

export function useIsLoggedIn(): boolean {
  const jwt = useSelector(selectJWT);
  const userName = useSelector(selectUserName);

}