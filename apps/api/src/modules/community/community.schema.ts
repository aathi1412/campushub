import type { FastifySchema } from "fastify";

export const postTypes = ["ANNOUNCEMENT", "GENERAL", "LOST_AND_FOUND"] as const;
export type PostType = (typeof postTypes)[number];

// 1. Create Post Schema
export const createPostSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["title", "content"],
    additionalProperties: false,
    properties: {
      title: { type: "string", minLength: 3, maxLength: 255 },
      content: { type: "string", minLength: 5 },
      type: { type: "string", enum: postTypes, default: "GENERAL" },
      isPinned: { type: "boolean" },
    },
  },
};

// 2. Update Post Schema
export const updatePostSchema: FastifySchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
    },
  },
  body: {
    type: "object",
    additionalProperties: false,
    properties: {
      title: { type: "string", minLength: 3, maxLength: 255 },
      content: { type: "string", minLength: 5 },
      type: { type: "string", enum: postTypes },
      isPinned: { type: "boolean" },
      isModerated: { type: "boolean" },
    },
  },
};

// 3. Get Post Params Schema
export const getPostParamsSchema: FastifySchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
    },
  },
};

// 4. List Posts Query Schema
export const listPostsQuerySchema: FastifySchema = {
  querystring: {
    type: "object",
    additionalProperties: false,
    properties: {
      page: { type: "integer", minimum: 1, default: 1 },
      limit: { type: "integer", minimum: 1, maximum: 100, default: 15 },
      type: { type: "string", enum: postTypes },
      search: { type: "string", maxLength: 100 },
      authorId: { type: "string" },
      sortBy: { type: "string", enum: ["createdAt", "updatedAt", "title"], default: "createdAt" },
      sortOrder: { type: "string", enum: ["asc", "desc"], default: "desc" },
    },
  },
};

// 5. Create Comment Schema
export const createCommentSchema: FastifySchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
    },
  },
  body: {
    type: "object",
    required: ["content"],
    additionalProperties: false,
    properties: {
      content: { type: "string", minLength: 2, maxLength: 2000 },
    },
  },
};

// 6. Delete Comment Params Schema
export const deleteCommentParamsSchema: FastifySchema = {
  params: {
    type: "object",
    required: ["id", "commentId"],
    properties: {
      id: { type: "string" },
      commentId: { type: "string" },
    },
  },
};

// 7. Create Poll Schema
export const createPollSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["question", "options", "expiresAt"],
    additionalProperties: false,
    properties: {
      question: { type: "string", minLength: 5, maxLength: 300 },
      options: {
        type: "array",
        minItems: 2,
        maxItems: 10,
        items: { type: "string", minLength: 1, maxLength: 200 },
      },
      expiresAt: { type: "string", format: "date-time" },
    },
  },
};

// 8. List Polls Query Schema
export const listPollsQuerySchema: FastifySchema = {
  querystring: {
    type: "object",
    additionalProperties: false,
    properties: {
      page: { type: "integer", minimum: 1, default: 1 },
      limit: { type: "integer", minimum: 1, maximum: 100, default: 10 },
      status: { type: "string", enum: ["active", "expired", "all"], default: "all" },
      search: { type: "string", maxLength: 100 },
    },
  },
};

// 9. Vote Poll Schema
export const votePollSchema: FastifySchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
    },
  },
  body: {
    type: "object",
    required: ["optionId"],
    additionalProperties: false,
    properties: {
      optionId: { type: "string" },
    },
  },
};

// 10. Poll Params Schema
export const pollParamsSchema: FastifySchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
    },
  },
};

export interface CreatePostBody {
  title: string;
  content: string;
  type?: PostType;
  isPinned?: boolean;
}

export interface UpdatePostBody {
  title?: string;
  content?: string;
  type?: PostType;
  isPinned?: boolean;
  isModerated?: boolean;
}

export interface ListPostsQuery {
  page?: number;
  limit?: number;
  type?: PostType;
  search?: string;
  authorId?: string;
  sortBy?: "createdAt" | "updatedAt" | "title";
  sortOrder?: "asc" | "desc";
}

export interface CreateCommentBody {
  content: string;
}

export interface CreatePollBody {
  question: string;
  options: string[];
  expiresAt: string;
}

export interface ListPollsQuery {
  page?: number;
  limit?: number;
  status?: "active" | "expired" | "all";
  search?: string;
}

export interface VotePollBody {
  optionId: string;
}
