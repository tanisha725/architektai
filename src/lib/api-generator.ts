import type { AnalyzedRequirements } from "@/lib/schemas/requirements-schema";
import type { DatabaseSchema } from "@/types/database";
import type { ApiEndpoint } from "@/types/api";

// Endpoints implied directly by a table existing in the generated schema -
// same "derive from data we already produced" approach as the schema itself.
const TABLE_ENDPOINTS: Record<string, ApiEndpoint[]> = {
  users: [
    {
      method: "POST",
      path: "/api/users",
      purpose: "Register a new user account.",
      requestBody: "{ username, email, password }",
      response: "201 { id, username, email }",
      requiresAuth: false,
      possibleErrors: ["400 invalid input", "409 email already registered"],
    },
    {
      method: "POST",
      path: "/api/auth/login",
      purpose: "Authenticate and receive a session/token.",
      requestBody: "{ email, password }",
      response: "200 { token }",
      requiresAuth: false,
      possibleErrors: ["401 invalid credentials"],
    },
    {
      method: "GET",
      path: "/api/users/:id",
      purpose: "Fetch a user's public profile.",
      response: "200 { id, username, createdAt }",
      requiresAuth: false,
      possibleErrors: ["404 user not found"],
    },
  ],
  posts: [
    {
      method: "POST",
      path: "/api/posts",
      purpose: "Create a new post.",
      requestBody: "{ mediaUrl, caption }",
      response: "201 { id, userId, mediaUrl, caption, createdAt }",
      requiresAuth: true,
      possibleErrors: ["400 invalid input", "401 not authenticated"],
    },
    {
      method: "GET",
      path: "/api/posts/:id",
      purpose: "Fetch a single post.",
      response: "200 { id, userId, mediaUrl, caption, createdAt }",
      requiresAuth: false,
      possibleErrors: ["404 post not found"],
    },
    {
      method: "DELETE",
      path: "/api/posts/:id",
      purpose: "Delete a post (author only).",
      response: "204 no content",
      requiresAuth: true,
      possibleErrors: ["403 not the post's author", "404 post not found"],
    },
  ],
  follows: [
    {
      method: "POST",
      path: "/api/users/:id/follow",
      purpose: "Follow a user.",
      response: "204 no content",
      requiresAuth: true,
      possibleErrors: ["401 not authenticated", "404 user not found", "409 already following"],
    },
    {
      method: "DELETE",
      path: "/api/users/:id/follow",
      purpose: "Unfollow a user.",
      response: "204 no content",
      requiresAuth: true,
      possibleErrors: ["401 not authenticated", "404 not following this user"],
    },
  ],
  likes: [
    {
      method: "POST",
      path: "/api/posts/:id/like",
      purpose: "Like a post.",
      response: "204 no content",
      requiresAuth: true,
      possibleErrors: ["401 not authenticated", "404 post not found", "409 already liked"],
    },
    {
      method: "DELETE",
      path: "/api/posts/:id/like",
      purpose: "Unlike a post.",
      response: "204 no content",
      requiresAuth: true,
      possibleErrors: ["401 not authenticated", "404 like not found"],
    },
  ],
  comments: [
    {
      method: "POST",
      path: "/api/posts/:id/comments",
      purpose: "Add a comment to a post.",
      requestBody: "{ content }",
      response: "201 { id, userId, postId, content, createdAt }",
      requiresAuth: true,
      possibleErrors: ["400 invalid input", "401 not authenticated", "404 post not found"],
    },
    {
      method: "GET",
      path: "/api/posts/:id/comments",
      purpose: "List comments on a post.",
      response: "200 [ { id, userId, content, createdAt } ]",
      requiresAuth: false,
      possibleErrors: ["404 post not found"],
    },
  ],
  messages: [
    {
      method: "POST",
      path: "/api/messages",
      purpose: "Send a direct message.",
      requestBody: "{ recipientId, content }",
      response: "201 { id, senderId, recipientId, content, createdAt }",
      requiresAuth: true,
      possibleErrors: ["400 invalid input", "401 not authenticated", "404 recipient not found"],
    },
    {
      method: "GET",
      path: "/api/messages/:userId",
      purpose: "Fetch the message history with another user.",
      response: "200 [ { id, senderId, content, createdAt } ]",
      requiresAuth: true,
      possibleErrors: ["401 not authenticated"],
    },
  ],
  notifications: [
    {
      method: "GET",
      path: "/api/notifications",
      purpose: "List the current user's notifications.",
      response: "200 [ { id, type, content, isRead, createdAt } ]",
      requiresAuth: true,
      possibleErrors: ["401 not authenticated"],
    },
    {
      method: "PATCH",
      path: "/api/notifications/:id",
      purpose: "Mark a notification as read.",
      requestBody: "{ isRead: true }",
      response: "200 { id, isRead }",
      requiresAuth: true,
      possibleErrors: ["401 not authenticated", "404 notification not found"],
    },
  ],
};

export function generateApiEndpoints(
  requirements: AnalyzedRequirements,
  schema: DatabaseSchema
): ApiEndpoint[] {
  const functionalText = requirements.functional.map((r) => r.text.toLowerCase()).join(" | ");
  const endpoints: ApiEndpoint[] = [];

  for (const table of schema.tables) {
    const tableEndpoints = TABLE_ENDPOINTS[table.name];
    if (tableEndpoints) endpoints.push(...tableEndpoints);
  }

  // Requirement-driven endpoints that aren't simple CRUD on one table.
  if (/feed/.test(functionalText)) {
    endpoints.push({
      method: "GET",
      path: "/api/feed",
      purpose: "Fetch the current user's personalized feed (posts from followed users).",
      response: "200 [ { id, userId, mediaUrl, caption, createdAt } ]",
      requiresAuth: true,
      possibleErrors: ["401 not authenticated"],
    });
  }

  if (/search/.test(functionalText)) {
    endpoints.push({
      method: "GET",
      path: "/api/search?q=",
      purpose: "Search for users or content matching a query.",
      response: "200 [ { type, id, snippet } ]",
      requiresAuth: false,
      possibleErrors: ["400 missing query parameter"],
    });
  }

  return endpoints;
}
