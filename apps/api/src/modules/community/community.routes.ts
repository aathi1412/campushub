import type { FastifyPluginAsync } from "fastify";
import { CommunityService } from "./community.service.js";
import {
  createPostSchema,
  updatePostSchema,
  getPostParamsSchema,
  listPostsQuerySchema,
  createCommentSchema,
  deleteCommentParamsSchema,
  createPollSchema,
  listPollsQuerySchema,
  votePollSchema,
  pollParamsSchema,
} from "./community.schema.js";
import type {
  CreatePostBody,
  UpdatePostBody,
  ListPostsQuery,
  CreateCommentBody,
  CreatePollBody,
  ListPollsQuery,
  VotePollBody,
} from "./community.schema.js";
import { sendSuccess, sendCreated } from "../../common/utils/response.js";

export const communityRoutes: FastifyPluginAsync = async (fastify) => {
  const communityService = new CommunityService(fastify.prisma);

  // Helper for optional JWT verification
  const optionalAuthenticate = async (request: any) => {
    try {
      if (request.headers.authorization) {
        await request.jwtVerify();
      }
    } catch {
      // Ignored for optional authentication
    }
  };

  // ==========================================
  // 1. COMMUNITY POSTS
  // ==========================================

  // List posts (Public with optional auth)
  fastify.get<{ Querystring: ListPostsQuery }>(
    "/posts",
    {
      schema: listPostsQuerySchema,
      preHandler: [optionalAuthenticate],
    },
    async (request, reply) => {
      const currentUserId = request.user?.sub;
      const currentUserRole = request.user?.role;

      const { posts, meta } = await communityService.listPosts(
        request.query,
        currentUserId,
        currentUserRole
      );

      return sendSuccess(reply, posts, "Posts retrieved successfully", 200, meta);
    }
  );

  // Create post (Authenticated)
  fastify.post<{ Body: CreatePostBody }>(
    "/posts",
    {
      schema: createPostSchema,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const currentUserId = request.user.sub;
      const currentUserRole = request.user.role;

      const post = await communityService.createPost(
        currentUserId,
        currentUserRole,
        request.body
      );

      return sendCreated(reply, post, "Post published successfully");
    }
  );

  // Get single post by ID (Public with optional auth)
  fastify.get<{ Params: { id: string } }>(
    "/posts/:id",
    {
      schema: getPostParamsSchema,
      preHandler: [optionalAuthenticate],
    },
    async (request, reply) => {
      const currentUserId = request.user?.sub;
      const currentUserRole = request.user?.role;

      const post = await communityService.getPostById(
        request.params.id,
        currentUserId,
        currentUserRole
      );

      return sendSuccess(reply, post, "Post retrieved successfully");
    }
  );

  // Update post (Author or Admin)
  fastify.patch<{ Params: { id: string }; Body: UpdatePostBody }>(
    "/posts/:id",
    {
      schema: updatePostSchema,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const currentUserId = request.user.sub;
      const currentUserRole = request.user.role;

      const updated = await communityService.updatePost(
        request.params.id,
        currentUserId,
        currentUserRole,
        request.body
      );

      return sendSuccess(reply, updated, "Post updated successfully");
    }
  );

  // Delete post (Author or Admin)
  fastify.delete<{ Params: { id: string } }>(
    "/posts/:id",
    {
      schema: getPostParamsSchema,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const currentUserId = request.user.sub;
      const currentUserRole = request.user.role;

      const result = await communityService.deletePost(
        request.params.id,
        currentUserId,
        currentUserRole
      );

      return sendSuccess(reply, result, result.message);
    }
  );

  // ==========================================
  // 2. COMMENTS
  // ==========================================

  // Add comment to post
  fastify.post<{ Params: { id: string }; Body: CreateCommentBody }>(
    "/posts/:id/comments",
    {
      schema: createCommentSchema,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const currentUserId = request.user.sub;

      const comment = await communityService.createComment(
        request.params.id,
        currentUserId,
        request.body
      );

      return sendCreated(reply, comment, "Comment added successfully");
    }
  );

  // Delete comment (Author, Post Author, or Admin)
  fastify.delete<{ Params: { id: string; commentId: string } }>(
    "/posts/:id/comments/:commentId",
    {
      schema: deleteCommentParamsSchema,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const currentUserId = request.user.sub;
      const currentUserRole = request.user.role;

      const result = await communityService.deleteComment(
        request.params.id,
        request.params.commentId,
        currentUserId,
        currentUserRole
      );

      return sendSuccess(reply, result, result.message);
    }
  );

  // ==========================================
  // 3. CAMPUS POLLS & VOTING
  // ==========================================

  // List polls (Public with optional auth)
  fastify.get<{ Querystring: ListPollsQuery }>(
    "/polls",
    {
      schema: listPollsQuerySchema,
      preHandler: [optionalAuthenticate],
    },
    async (request, reply) => {
      const currentUserId = request.user?.sub;

      const { polls, meta } = await communityService.listPolls(
        request.query,
        currentUserId
      );

      return sendSuccess(reply, polls, "Polls retrieved successfully", 200, meta);
    }
  );

  // Create poll (Authenticated)
  fastify.post<{ Body: CreatePollBody }>(
    "/polls",
    {
      schema: createPollSchema,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const currentUserId = request.user.sub;

      const poll = await communityService.createPoll(
        currentUserId,
        request.body
      );

      return sendCreated(reply, poll, "Poll published successfully");
    }
  );

  // Get poll by ID (Public with optional auth)
  fastify.get<{ Params: { id: string } }>(
    "/polls/:id",
    {
      schema: pollParamsSchema,
      preHandler: [optionalAuthenticate],
    },
    async (request, reply) => {
      const currentUserId = request.user?.sub;

      const poll = await communityService.getPollById(
        request.params.id,
        currentUserId
      );

      return sendSuccess(reply, poll, "Poll retrieved successfully");
    }
  );

  // Vote in a poll (Authenticated student / user)
  fastify.post<{ Params: { id: string }; Body: VotePollBody }>(
    "/polls/:id/vote",
    {
      schema: votePollSchema,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const currentUserId = request.user.sub;

      const poll = await communityService.votePoll(
        request.params.id,
        currentUserId,
        request.body.optionId
      );

      return sendSuccess(reply, poll, "Vote recorded successfully");
    }
  );

  // Delete poll (Creator or Admin)
  fastify.delete<{ Params: { id: string } }>(
    "/polls/:id",
    {
      schema: pollParamsSchema,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const currentUserId = request.user.sub;
      const currentUserRole = request.user.role;

      const result = await communityService.deletePoll(
        request.params.id,
        currentUserId,
        currentUserRole
      );

      return sendSuccess(reply, result, result.message);
    }
  );
};
