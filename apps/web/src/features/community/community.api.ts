import { apiClient } from "../../services/api.js";
import type { ApiResponse } from "../../types/api.js";

export const postTypes = ["GENERAL", "ANNOUNCEMENT", "LOST_AND_FOUND"] as const;
export type PostType = (typeof postTypes)[number];

export interface AuthorSummary {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role?: string;
  department?: string | null;
}

export interface PostComment {
  id: string;
  postId: string;
  authorId: string;
  author: AuthorSummary;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityPost {
  id: string;
  authorId: string;
  author: AuthorSummary;
  title: string;
  content: string;
  type: PostType;
  isPinned: boolean;
  isModerated: boolean;
  createdAt: string;
  updatedAt: string;
  commentCount: number;
}

export interface CommunityPostDetail extends CommunityPost {
  comments: PostComment[];
}

export interface PollOptionResult {
  id: string;
  pollId: string;
  text: string;
  voteCount: number;
  percentage: number;
}

export interface PollItem {
  id: string;
  question: string;
  creatorId: string;
  creator: AuthorSummary;
  expiresAt: string;
  createdAt: string;
  isExpired: boolean;
  totalVotes: number;
  options: PollOptionResult[];
  userVotedOptionId?: string | null;
}

export interface CreatePostPayload {
  title: string;
  content: string;
  type?: PostType;
}

export interface UpdatePostPayload {
  title?: string;
  content?: string;
  type?: PostType;
  isPinned?: boolean;
  isModerated?: boolean;
}

export interface CreatePollPayload {
  question: string;
  options: string[];
  expiresAt: string;
}

export const communityApi = {
  // Posts
  async listPosts(params?: {
    type?: PostType;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ posts: CommunityPost[]; total: number; page: number; totalPages: number }> {
    const res = await apiClient.get<ApiResponse<CommunityPost[]>>("/community/posts", { params });
    return {
      posts: res.data.data,
      total: res.data.meta?.total ?? res.data.data.length,
      page: res.data.meta?.page ?? 1,
      totalPages: res.data.meta?.totalPages ?? 1,
    };
  },

  async getPostById(id: string): Promise<CommunityPostDetail> {
    const res = await apiClient.get<ApiResponse<CommunityPostDetail>>(`/community/posts/${id}`);
    return res.data.data;
  },

  async createPost(payload: CreatePostPayload): Promise<CommunityPost> {
    const res = await apiClient.post<ApiResponse<CommunityPost>>("/community/posts", payload);
    return res.data.data;
  },

  async updatePost(id: string, payload: UpdatePostPayload): Promise<CommunityPost> {
    const res = await apiClient.patch<ApiResponse<CommunityPost>>(`/community/posts/${id}`, payload);
    return res.data.data;
  },

  async deletePost(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(`/community/posts/${id}`);
  },

  // Comments
  async addComment(postId: string, content: string): Promise<PostComment> {
    const res = await apiClient.post<ApiResponse<PostComment>>(`/community/posts/${postId}/comments`, { content });
    return res.data.data;
  },

  async deleteComment(postId: string, commentId: string): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(`/community/posts/${postId}/comments/${commentId}`);
  },

  // Polls
  async listPolls(params?: {
    activeOnly?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ polls: PollItem[]; total: number; page: number; totalPages: number }> {
    const res = await apiClient.get<ApiResponse<PollItem[]>>("/community/polls", { params });
    return {
      polls: res.data.data,
      total: res.data.meta?.total ?? res.data.data.length,
      page: res.data.meta?.page ?? 1,
      totalPages: res.data.meta?.totalPages ?? 1,
    };
  },

  async getPollById(id: string): Promise<PollItem> {
    const res = await apiClient.get<ApiResponse<PollItem>>(`/community/polls/${id}`);
    return res.data.data;
  },

  async createPoll(payload: CreatePollPayload): Promise<PollItem> {
    const res = await apiClient.post<ApiResponse<PollItem>>("/community/polls", payload);
    return res.data.data;
  },

  async votePoll(pollId: string, optionId: string): Promise<PollItem> {
    const res = await apiClient.post<ApiResponse<PollItem>>(`/community/polls/${pollId}/vote`, { optionId });
    return res.data.data;
  },

  async deletePoll(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(`/community/polls/${id}`);
  },
};
