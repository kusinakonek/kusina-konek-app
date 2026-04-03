export type RuntimeRole = 'DONOR' | 'RECIPIENT' | null;

let runtimeRole: RuntimeRole = null;
let runtimeAccessToken: string | null = null;

export const setRuntimeRole = (role: RuntimeRole) => {
  runtimeRole = role;
};

export const getRuntimeRole = (): RuntimeRole => runtimeRole;

export const setRuntimeAccessToken = (token: string | null) => {
  runtimeAccessToken = token;
};

export const getRuntimeAccessToken = (): string | null => runtimeAccessToken;

export const clearRuntimeAuth = () => {
  runtimeRole = null;
  runtimeAccessToken = null;
};
