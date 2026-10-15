import type { PrismaClient, Prisma } from "../../generated/prisma/client.js";
import type { PostType } from "../../generated/prisma/enums.js";
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from "../../common/errors/index.js";
import type {
  CreatePostBody,
  UpdatePostBody,
  ListPostsQuery,
  CreateCommentBody,
  CreatePollBody,
  ListPollsQuery,
} from "./community.schema.js";

export class CommunityService {
  constructor(private readonly prisma: PrismaClient) {}

  // ==========================================
  // 1. COMMUNITY POSTS
  // ==========================================

  /**
   * List community posts with search, filtering, and pinned prioritization
   */
  async listPosts(
    query: ListPostsQuery,
    currentUserId?: string,
    currentUserRole?: string
  ) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 15));
    const skip = (page - 1) * limit;

    const andConditions: Prisma.CommunityPostWhereInput[] = [];

    // Moderation: only ADMINs can see moderated posts
    if (currentUserRole !== "ADMIN") {
      andConditions.push({ isModerated: false });
    }

    // Filter by type
    if (query.type) {
      andConditions.push({ type: query.type });
    }

    // Filter by author
    if (query.authorId) {
      andConditions.push({ authorId: query.authorId });
    }

    // Search filter across title and content
    if (query.search?.trim()) {
      const term = query.search.trim();
      andConditions.push({
        OR: [
          { title: { contains: term } },
          { content: { contains: term } },
        ],
      });
    }

    const where: Prisma.CommunityPostWhereInput =
      andConditions.length > 0 ? { AND: andConditions } : {};

    const sortBy = query.sortBy || "createdAt";
    const sortOrder = query.sortOrder || "desc";

    // Pinned posts always appear at the top, then sort by specified field
    const orderBy: Prisma.CommunityPostOrderByWithRelationInput[] = [
      { isPinned: "desc" },
      { [sortBy]: sortOrder },
    ];

    const [total, posts] = await Promise.all([
      this.prisma.communityPost.count({ where }),
      this.prisma.communityPost.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
              department: true,
              role: true,
            },
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
      }),
    ]);

    const formatted = posts.map((p) => ({
      id: p.id,
      title: p.title,
      content: p.content,
      type: p.type,
      isPinned: p.isPinned,
      isModerated: p.isModerated,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      author: p.author,
      commentCount: p._count.comments,
    }));

    return {
      posts: formatted,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get post details by ID with chronological comments
   */
  async getPostById(postId: string, currentUserId?: string, currentUserRole?: string) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            department: true,
            role: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                department: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        _count: {
          select: { comments: true },
        },
      },
    });

    if (!post) {
      throw new NotFoundError("Post not found");
    }

    if (post.isModerated && currentUserRole !== "ADMIN") {
      throw new NotFoundError("Post not found or has been removed by moderator");
    }

    return {
      id: post.id,
      title: post.title,
      content: post.content,
      type: post.type,
      isPinned: post.isPinned,
      isModerated: post.isModerated,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: post.author,
      commentCount: post._count.comments,
      comments: post.comments.map((c) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        author: c.author,
      })),
    };
  }

  /**
   * Create a community post
   */
  async createPost(userId: string, userRole: string, body: CreatePostBody) {
    const postType: PostType = body.type || "GENERAL";

    // Permission guard: Only CLUB_LEADER or ADMIN can publish ANNOUNCEMENT
    if (
      postType === "ANNOUNCEMENT" &&
      userRole !== "CLUB_LEADER" &&
      userRole !== "ADMIN"
    ) {
      throw new ForbiddenError(
        "Only club leaders and administrators can publish official campus announcements"
      );
    }

    // Permission guard: Only ADMIN can pin posts
    const isPinned = userRole === "ADMIN" ? Boolean(body.isPinned) : false;

    const post = await this.prisma.communityPost.create({
      data: {
        authorId: userId,
        title: body.title.trim(),
        content: body.content.trim(),
        type: postType,
        isPinned,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            department: true,
            role: true,
          },
        },
      },
    });

    return {
      ...post,
      commentCount: 0,
      comments: [],
    };
  }

  /**
   * Update community post
   */
  async updatePost(
    postId: string,
    userId: string,
    userRole: string,
    body: UpdatePostBody
  ) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundError("Post not found");
    }

    const isAuthor = post.authorId === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isAuthor && !isAdmin) {
      throw new ForbiddenError("You do not have permission to edit this post");
    }

    // If changing type to ANNOUNCEMENT, verify permissions
    if (
      body.type === "ANNOUNCEMENT" &&
      post.type !== "ANNOUNCEMENT" &&
      userRole !== "CLUB_LEADER" &&
      !isAdmin
    ) {
      throw new ForbiddenError(
        "Only club leaders and administrators can publish campus announcements"
      );
    }

    // Only Admin can pin or moderate
    const updateData: Prisma.CommunityPostUpdateInput = {};
    if (body.title) updateData.title = body.title.trim();
    if (body.content) updateData.content = body.content.trim();
    if (body.type) updateData.type = body.type;

    if (isAdmin) {
      if (typeof body.isPinned === "boolean") updateData.isPinned = body.isPinned;
      if (typeof body.isModerated === "boolean") updateData.isModerated = body.isModerated;
    }

    const updated = await this.prisma.communityPost.update({
      where: { id: postId },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            department: true,
            role: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Delete community post
   */
  async deletePost(postId: string, userId: string, userRole: string) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundError("Post not found");
    }

    const isAuthor = post.authorId === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isAuthor && !isAdmin) {
      throw new ForbiddenError("You do not have permission to delete this post");
    }

    await this.prisma.communityPost.delete({
      where: { id: postId },
    });

    return { message: "Post deleted successfully" };
  }

  // ==========================================
  // 2. COMMENTS
  // ==========================================

  /**
   * Add comment to post and notify post author
   */
  async createComment(postId: string, authorId: string, body: CreateCommentBody) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
      select: { id: true, title: true, authorId: true, isModerated: true },
    });

    if (!post || post.isModerated) {
      throw new NotFoundError("Post not found");
    }

    const author = await this.prisma.user.findUnique({
      where: { id: authorId },
      select: { name: true },
    });

    const comment = await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const created = await tx.communityComment.create({
          data: {
            postId,
            authorId,
            content: body.content.trim(),
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                department: true,
                role: true,
              },
            },
          },
        });

        // Notify post author if different
        if (post.authorId !== authorId) {
          await tx.notification.create({
            data: {
              userId: post.authorId,
              type: "GENERAL",
              title: "New Post Comment",
              message: `${author?.name || "A student"} commented on your post '${post.title}'.`,
              link: `/community/posts/${postId}`,
            },
          });
        }

        return created;
      }
    );

    return comment;
  }

  /**
   * Delete comment
   */
  async deleteComment(
    postId: string,
    commentId: string,
    userId: string,
    userRole: string
  ) {
    const comment = await this.prisma.communityComment.findUnique({
      where: { id: commentId },
      include: { post: { select: { authorId: true } } },
    });

    if (!comment || comment.postId !== postId) {
      throw new NotFoundError("Comment not found");
    }

    const isCommentAuthor = comment.authorId === userId;
    const isPostAuthor = comment.post.authorId === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isCommentAuthor && !isPostAuthor && !isAdmin) {
      throw new ForbiddenError("You do not have permission to delete this comment");
    }

    await this.prisma.communityComment.delete({
      where: { id: commentId },
    });

    return { message: "Comment deleted successfully" };
  }

  // ==========================================
  // 3. CAMPUS POLLS & VOTING
  // ==========================================

  /**
   * List campus polls with vote percentages and user's vote status
   */
  async listPolls(query: ListPollsQuery, currentUserId?: string) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.PollWhereInput = {};
    const now = new Date();

    if (query.status === "active") {
      where.expiresAt = { gt: now };
    } else if (query.status === "expired") {
      where.expiresAt = { lte: now };
    }

    if (query.search?.trim()) {
      where.question = { contains: query.search.trim() };
    }

    const [total, polls] = await Promise.all([
      this.prisma.poll.count({ where }),
      this.prisma.poll.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
              department: true,
            },
          },
          options: {
            include: {
              _count: {
                select: { votes: true },
              },
            },
          },
          _count: {
            select: { votes: true },
          },
        },
      }),
    ]);

    // Check caller's voted option for each poll
    const userVoteMap = new Map<string, string>();
    if (currentUserId && polls.length > 0) {
      const pollIds = polls.map((p) => p.id);
      const userVotes = await this.prisma.pollVote.findMany({
        where: {
          pollId: { in: pollIds },
          userId: currentUserId,
        },
        select: {
          pollId: true,
          optionId: true,
        },
      });

      for (const v of userVotes) {
        userVoteMap.set(v.pollId, v.optionId);
      }
    }

    const formatted = polls.map((poll) => {
      const totalVotes = poll._count.votes;
      const isExpired = new Date() > poll.expiresAt;
      const userVotedOptionId = userVoteMap.get(poll.id) || null;

      const options = poll.options.map((opt) => {
        const count = opt._count.votes;
        const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        return {
          id: opt.id,
          text: opt.text,
          voteCount: count,
          percentage,
          isUserVote: userVotedOptionId === opt.id,
        };
      });

      return {
        id: poll.id,
        question: poll.question,
        expiresAt: poll.expiresAt,
        createdAt: poll.createdAt,
        isExpired,
        creator: poll.creator,
        totalVotes,
        userVotedOptionId,
        hasVoted: Boolean(userVotedOptionId),
        options,
      };
    });

    return {
      polls: formatted,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get single poll by ID
   */
  async getPollById(pollId: string, currentUserId?: string) {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            department: true,
          },
        },
        options: {
          include: {
            _count: {
              select: { votes: true },
            },
          },
        },
        _count: {
          select: { votes: true },
        },
      },
    });

    if (!poll) {
      throw new NotFoundError("Poll not found");
    }

    let userVotedOptionId: string | null = null;
    if (currentUserId) {
      const vote = await this.prisma.pollVote.findUnique({
        where: {
          pollId_userId: {
            pollId,
            userId: currentUserId,
          },
        },
        select: { optionId: true },
      });
      userVotedOptionId = vote?.optionId || null;
    }

    const totalVotes = poll._count.votes;
    const isExpired = new Date() > poll.expiresAt;

    const options = poll.options.map((opt) => {
      const count = opt._count.votes;
      const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
      return {
        id: opt.id,
        text: opt.text,
        voteCount: count,
        percentage,
        isUserVote: userVotedOptionId === opt.id,
      };
    });

    return {
      id: poll.id,
      question: poll.question,
      expiresAt: poll.expiresAt,
      createdAt: poll.createdAt,
      isExpired,
      creator: poll.creator,
      totalVotes,
      userVotedOptionId,
      hasVoted: Boolean(userVotedOptionId),
      options,
    };
  }

  /**
   * Create a new campus poll
   */
  async createPoll(creatorId: string, body: CreatePollBody) {
    const expiresAt = new Date(body.expiresAt);
    if (isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
      throw new BadRequestError("Poll expiration date must be in the future");
    }

    const trimmedOptions = body.options
      .map((o) => o.trim())
      .filter((o) => o.length > 0);

    if (trimmedOptions.length < 2) {
      throw new BadRequestError("Polls must have at least 2 non-empty options");
    }

    const poll = await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const createdPoll = await tx.poll.create({
          data: {
            question: body.question.trim(),
            expiresAt,
            creatorId,
          },
        });

        await tx.pollOption.createMany({
          data: trimmedOptions.map((text) => ({
            pollId: createdPoll.id,
            text,
          })),
        });

        return createdPoll;
      }
    );

    return this.getPollById(poll.id, creatorId);
  }

  /**
   * Vote in a poll (Single-vote atomic enforcement)
   */
  async votePoll(pollId: string, userId: string, optionId: string) {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: { select: { id: true } },
      },
    });

    if (!poll) {
      throw new NotFoundError("Poll not found");
    }

    // Expiration check
    if (new Date() > poll.expiresAt) {
      throw new BadRequestError("This poll has expired and is closed for voting");
    }

    // Option validity check
    const validOption = poll.options.some((o) => o.id === optionId);
    if (!validOption) {
      throw new BadRequestError("Selected option does not belong to this poll");
    }

    // Check if user has already voted
    const existingVote = await this.prisma.pollVote.findUnique({
      where: {
        pollId_userId: {
          pollId,
          userId,
        },
      },
    });

    if (existingVote) {
      throw new ConflictError("You have already voted in this poll");
    }

    // Record vote
    await this.prisma.pollVote.create({
      data: {
        pollId,
        optionId,
        userId,
      },
    });

    return this.getPollById(pollId, userId);
  }

  /**
   * Delete poll (Creator or Admin)
   */
  async deletePoll(pollId: string, userId: string, userRole: string) {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
    });

    if (!poll) {
      throw new NotFoundError("Poll not found");
    }

    if (poll.creatorId !== userId && userRole !== "ADMIN") {
      throw new ForbiddenError("Only the poll creator or an admin can delete this poll");
    }

    await this.prisma.poll.delete({
      where: { id: pollId },
    });

    return { message: "Poll deleted successfully" };
  }
}
