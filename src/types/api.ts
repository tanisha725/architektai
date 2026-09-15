export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiEndpoint {
  method: HttpMethod;
  path: string;
  purpose: string;
  requestBody?: string; // short description, e.g. "{ username, email, password }"
  response: string; // short description, e.g. "201 { id, username, email }"
  requiresAuth: boolean;
  possibleErrors: string[];
}
