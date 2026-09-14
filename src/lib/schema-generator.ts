import type { AnalyzedRequirements } from "@/lib/schemas/requirements-schema";
import type { DatabaseSchema, Relationship, Table } from "@/types/database";

interface EntityTemplate {
  keywords: RegExp;
  table: Table;
  relationships: Relationship[];
}

// Each entity is only included if its keyword appears in the functional
// requirements - the schema is a direct reflection of what was actually asked
// for, the same "traceable to a trigger" pattern as the architecture planner.
const ENTITY_TEMPLATES: EntityTemplate[] = [
  {
    keywords: /account|register|login|sign up|user/,
    table: {
      name: "users",
      reason: "User accounts are implied by account creation/login requirements.",
      columns: [
        { name: "id", type: "UUID", isPrimaryKey: true },
        { name: "username", type: "VARCHAR" },
        { name: "email", type: "VARCHAR" },
        { name: "password_hash", type: "VARCHAR" },
        { name: "created_at", type: "TIMESTAMP" },
      ],
    },
    relationships: [],
  },
  {
    keywords: /post|upload|photo|video|content/,
    table: {
      name: "posts",
      reason: "Posting/uploading content requires storing each post as a record.",
      columns: [
        { name: "id", type: "UUID", isPrimaryKey: true },
        { name: "user_id", type: "UUID", isForeignKey: true, references: "users.id" },
        { name: "media_url", type: "VARCHAR" },
        { name: "caption", type: "TEXT" },
        { name: "created_at", type: "TIMESTAMP" },
      ],
    },
    relationships: [
      { description: "Many posts belong to one user.", from: "posts.user_id", to: "users.id" },
    ],
  },
  {
    keywords: /follow/,
    table: {
      name: "follows",
      reason: "Following other users requires a record of who follows whom.",
      columns: [
        { name: "follower_id", type: "UUID", isPrimaryKey: true, isForeignKey: true, references: "users.id" },
        { name: "followee_id", type: "UUID", isPrimaryKey: true, isForeignKey: true, references: "users.id" },
        { name: "created_at", type: "TIMESTAMP" },
      ],
    },
    relationships: [
      { description: "Many-to-many: a user can follow many users and be followed by many.", from: "follows.follower_id", to: "users.id" },
      { description: "Many-to-many: a user can follow many users and be followed by many.", from: "follows.followee_id", to: "users.id" },
    ],
  },
  {
    keywords: /like/,
    table: {
      name: "likes",
      reason: "Liking posts is stored as one row per like, not a counter column - the count is derived (COUNT(*)), and stays accurate, and we retain who liked what.",
      columns: [
        { name: "user_id", type: "UUID", isPrimaryKey: true, isForeignKey: true, references: "users.id" },
        { name: "post_id", type: "UUID", isPrimaryKey: true, isForeignKey: true, references: "posts.id" },
        { name: "created_at", type: "TIMESTAMP" },
      ],
    },
    relationships: [
      { description: "Many-to-many: a user can like many posts, a post can be liked by many users.", from: "likes.user_id", to: "users.id" },
      { description: "Many-to-many: a user can like many posts, a post can be liked by many users.", from: "likes.post_id", to: "posts.id" },
    ],
  },
  {
    keywords: /comment/,
    table: {
      name: "comments",
      reason: "Commenting on posts requires each comment as its own record, linked to both its author and the post.",
      columns: [
        { name: "id", type: "UUID", isPrimaryKey: true },
        { name: "user_id", type: "UUID", isForeignKey: true, references: "users.id" },
        { name: "post_id", type: "UUID", isForeignKey: true, references: "posts.id" },
        { name: "content", type: "TEXT" },
        { name: "created_at", type: "TIMESTAMP" },
      ],
    },
    relationships: [
      { description: "Many comments belong to one user.", from: "comments.user_id", to: "users.id" },
      { description: "Many comments belong to one post.", from: "comments.post_id", to: "posts.id" },
    ],
  },
  {
    keywords: /message|chat/,
    table: {
      name: "messages",
      reason: "Direct messaging requires each message stored with its sender and recipient.",
      columns: [
        { name: "id", type: "UUID", isPrimaryKey: true },
        { name: "sender_id", type: "UUID", isForeignKey: true, references: "users.id" },
        { name: "recipient_id", type: "UUID", isForeignKey: true, references: "users.id" },
        { name: "content", type: "TEXT" },
        { name: "created_at", type: "TIMESTAMP" },
      ],
    },
    relationships: [
      { description: "Many messages are sent by one user.", from: "messages.sender_id", to: "users.id" },
      { description: "Many messages are received by one user.", from: "messages.recipient_id", to: "users.id" },
    ],
  },
  {
    keywords: /notif/,
    table: {
      name: "notifications",
      reason: "Receiving notifications requires a per-user record of each notification and its read state.",
      columns: [
        { name: "id", type: "UUID", isPrimaryKey: true },
        { name: "user_id", type: "UUID", isForeignKey: true, references: "users.id" },
        { name: "type", type: "VARCHAR" },
        { name: "content", type: "TEXT" },
        { name: "is_read", type: "BOOLEAN" },
        { name: "created_at", type: "TIMESTAMP" },
      ],
    },
    relationships: [
      { description: "Many notifications belong to one user.", from: "notifications.user_id", to: "users.id" },
    ],
  },
];

export function generateDatabaseSchema(requirements: AnalyzedRequirements): DatabaseSchema {
  const functionalText = requirements.functional.map((r) => r.text.toLowerCase()).join(" | ");

  const tables: Table[] = [];
  const relationships: Relationship[] = [];

  for (const entity of ENTITY_TEMPLATES) {
    if (entity.keywords.test(functionalText)) {
      tables.push(entity.table);
      relationships.push(...entity.relationships);
    }
  }

  // A schema with no users table doesn't make sense for any of our other
  // entities (they all reference it) - always include it as a safety net.
  if (!tables.some((t) => t.name === "users")) {
    tables.unshift(ENTITY_TEMPLATES[0].table);
  }

  return { tables, relationships };
}
