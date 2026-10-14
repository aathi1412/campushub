import type { FastifySchema } from "fastify";

export const registerSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["email", "name", "password"],
    additionalProperties: false,
    properties: {
      email: {
        type: "string",
        format: "email",
        maxLength: 255,
      },
      name: {
        type: "string",
        minLength: 2,
        maxLength: 100,
      },
      password: {
        type: "string",
        minLength: 8,
        maxLength: 100,
      },
      department: {
        type: "string",
        maxLength: 100,
      },
      yearOfStudy: {
        type: "integer",
        minimum: 1,
        maximum: 6,
      },
      bio: {
        type: "string",
        maxLength: 1000,
      },
    },
  },
};

export const loginSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["email", "password"],
    additionalProperties: false,
    properties: {
      email: {
        type: "string",
        format: "email",
        maxLength: 255,
      },
      password: {
        type: "string",
        minLength: 1,
        maxLength: 100,
      },
    },
  },
};

export const changePasswordSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["currentPassword", "newPassword"],
    additionalProperties: false,
    properties: {
      currentPassword: {
        type: "string",
        minLength: 1,
      },
      newPassword: {
        type: "string",
        minLength: 8,
        maxLength: 100,
      },
    },
  },
};

export const updateProfileSchema: FastifySchema = {
  body: {
    type: "object",
    additionalProperties: false,
    properties: {
      name: {
        type: "string",
        minLength: 2,
        maxLength: 100,
      },
      department: {
        type: "string",
        maxLength: 100,
      },
      yearOfStudy: {
        type: "integer",
        minimum: 1,
        maximum: 6,
      },
      bio: {
        type: "string",
        maxLength: 1000,
      },
      avatarUrl: {
        type: "string",
        maxLength: 500,
      },
    },
  },
};

export interface RegisterBody {
  email: string;
  name: string;
  password: string;
  department?: string;
  yearOfStudy?: number;
  bio?: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileBody {
  name?: string;
  department?: string;
  yearOfStudy?: number;
  bio?: string;
  avatarUrl?: string;
}
