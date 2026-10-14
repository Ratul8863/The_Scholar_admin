import { Schema } from "mongoose";
import { objectId, registerModel } from "@/models/helpers";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    roleId: { type: objectId, ref: "Role", required: true, index: true },
    active: { type: Boolean, default: true, index: true },
    responsibilities: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    sessionVersion: { type: Number, default: 0 },
    emailVerifiedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

const roleSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    permissions: { type: [String], default: [] },
    system: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const invitationSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    name: { type: String, default: "" },
    roleId: { type: objectId, ref: "Role", required: true },
    tokenHash: { type: String, required: true, unique: true },
    status: { type: String, enum: ["pending", "accepted", "revoked"], default: "pending", index: true },
    expiresAt: { type: Date, required: true, index: true },
    invitedBy: { type: objectId, ref: "User", required: true },
    acceptedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

const rateLimitSchema = new Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  windowStart: { type: Date, required: true },
});

export const User = registerModel("User", userSchema);
export const Role = registerModel("Role", roleSchema);
export const Invitation = registerModel("Invitation", invitationSchema);
export const RateLimit = registerModel("RateLimit", rateLimitSchema);
