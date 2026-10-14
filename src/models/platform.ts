import { Schema } from "mongoose";
import { objectId, registerModel } from "@/models/helpers";

const deadlineSchema = new Schema(
  {
    entityType: { type: String, required: true },
    entityId: { type: objectId, required: true },
    subEntityType: { type: String, default: "" },
    subEntityId: { type: objectId, default: null },
    deadlineType: { type: String, required: true },
    label: { type: String, default: "" },
    openingDate: { type: Date, default: null },
    closingDate: { type: Date, default: null },
    timezone: { type: String, default: "UTC" },
    sourceUrl: { type: String, default: "" },
    verificationStatus: { type: String, default: "not_checked" },
    notes: { type: String, default: "" },
    countryId: { type: objectId, ref: "Country", default: null },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true },
);
deadlineSchema.index({ entityType: 1, entityId: 1 });
deadlineSchema.index({ closingDate: 1, archivedAt: 1 });
deadlineSchema.index({ openingDate: 1, archivedAt: 1 });

const sourceSchema = new Schema(
  {
    entityType: { type: String, required: true },
    entityId: { type: objectId, required: true },
    sourceName: { type: String, required: true, trim: true },
    sourceType: { type: String, default: "official" },
    url: { type: String, required: true },
    description: { type: String, default: "" },
    verified: { type: Boolean, default: false },
    lastChecked: { type: Date, default: null },
    createdBy: { type: objectId, ref: "User" },
  },
  { timestamps: true },
);
sourceSchema.index({ entityType: 1, entityId: 1 });

const assignmentSchema = new Schema(
  {
    entityType: { type: String, required: true },
    entityId: { type: objectId, required: true },
    assignmentType: {
      type: String,
      enum: ["researcher", "verifier", "content_manager", "designer", "editor", "publisher"],
      required: true,
    },
    userId: { type: objectId, ref: "User", required: true },
    status: { type: String, enum: ["active", "completed", "cancelled"], default: "active" },
    assignedBy: { type: objectId, ref: "User", required: true },
    assignedAt: { type: Date, default: () => new Date() },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);
assignmentSchema.index({ entityType: 1, entityId: 1 });
assignmentSchema.index({ userId: 1, status: 1 });

const noteSchema = new Schema(
  {
    entityType: { type: String, required: true },
    entityId: { type: objectId, required: true },
    category: { type: String, enum: ["general", "internal", "research", "important", "additional"], default: "general" },
    body: { type: String, required: true },
    authorId: { type: objectId, ref: "User", required: true },
  },
  { timestamps: true },
);
noteSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

const templateSchema = new Schema(
  {
    entityType: { type: String, required: true, index: true },
    name: { type: String, required: true },
    active: { type: Boolean, default: true },
    items: [
      {
        key: { type: String, required: true },
        label: { type: String, required: true },
        required: { type: Boolean, default: false },
        displayOrder: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true },
);

const runSchema = new Schema(
  {
    entityType: { type: String, required: true },
    entityId: { type: objectId, required: true },
    templateId: { type: objectId, ref: "VerificationTemplate", default: null },
    verifierId: { type: objectId, ref: "User", default: null },
    items: [
      {
        key: String,
        label: String,
        required: Boolean,
        state: { type: String, enum: ["checked", "not_checked", "needs_correction", "not_applicable"], default: "not_checked" },
        note: { type: String, default: "" },
      },
    ],
    updatedBy: { type: objectId, ref: "User" },
  },
  { timestamps: true },
);
runSchema.index({ entityType: 1, entityId: 1, updatedAt: -1 });

const customFieldSchema = new Schema(
  {
    entityType: { type: String, required: true },
    fieldKey: { type: String, required: true },
    label: { type: String, required: true },
    type: { type: String, required: true },
    description: { type: String, default: "" },
    required: { type: Boolean, default: false },
    defaultValue: { type: Schema.Types.Mixed, default: null },
    options: { type: [String], default: [] },
    displayOrder: { type: Number, default: 0 },
    visibility: { type: String, enum: ["visible", "hidden"], default: "visible" },
    editable: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
    createdBy: { type: objectId, ref: "User" },
  },
  { timestamps: true },
);
customFieldSchema.index({ entityType: 1, fieldKey: 1 }, { unique: true });
customFieldSchema.index({ entityType: 1, active: 1, displayOrder: 1 });

const savedViewSchema = new Schema(
  {
    entityType: { type: String, required: true },
    name: { type: String, required: true },
    ownerId: { type: objectId, ref: "User", required: true },
    shared: { type: Boolean, default: false },
    query: { type: Schema.Types.Mixed, default: {} },
    columns: { type: [String], default: [] },
    pageSize: { type: Number, default: 25 },
  },
  { timestamps: true },
);
savedViewSchema.index({ ownerId: 1, entityType: 1 });

const notificationSchema = new Schema(
  {
    userId: { type: objectId, ref: "User", required: true, index: true },
    category: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, default: "" },
    href: { type: String, default: "" },
    readAt: { type: Date, default: null },
    notificationKey: { type: String, default: "" },
  },
  { timestamps: true },
);
notificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });
notificationSchema.index({ notificationKey: 1 }, { unique: true, sparse: true });

const dailyWorkSchema = new Schema(
  {
    userId: { type: objectId, ref: "User", required: true },
    workDate: { type: String, required: true },
    entryType: { type: String, enum: ["note", "work"], required: true },
    category: { type: String, default: "general" },
    title: { type: String, required: true },
    notes: { type: String, default: "" },
    durationMinutes: { type: Number, default: null },
    entityType: { type: String, default: "" },
    entityId: { type: objectId, default: null },
  },
  { timestamps: true },
);
dailyWorkSchema.index({ userId: 1, workDate: -1 });

const activitySchema = new Schema(
  {
    actorUserId: { type: objectId, ref: "User", required: true },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: String, required: true },
    changes: {
      type: [
        {
          field: String,
          oldValue: Schema.Types.Mixed,
          newValue: Schema.Types.Mixed,
        },
      ],
      default: [],
    },
    metadata: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: () => new Date(), index: true },
  },
  { timestamps: false },
);
activitySchema.index({ entityType: 1, entityId: 1, timestamp: -1 });
activitySchema.index({ actorUserId: 1, timestamp: -1 });

const importJobSchema = new Schema(
  {
    entityType: { type: String, required: true },
    status: { type: String, default: "preview" },
    createdBy: { type: objectId, ref: "User", required: true },
    summary: { type: Schema.Types.Mixed, default: {} },
    rowErrors: { type: [Schema.Types.Mixed], default: [] },
  },
  { timestamps: true },
);
importJobSchema.index({ createdBy: 1, createdAt: -1 });

export const Deadline = registerModel("Deadline", deadlineSchema);
export const Source = registerModel("Source", sourceSchema);
export const Assignment = registerModel("Assignment", assignmentSchema);
export const Note = registerModel("Note", noteSchema);
export const VerificationTemplate = registerModel("VerificationTemplate", templateSchema);
export const VerificationRun = registerModel("VerificationRun", runSchema);
export const CustomFieldDefinition = registerModel("CustomFieldDefinition", customFieldSchema);
export const SavedView = registerModel("SavedView", savedViewSchema);
export const Notification = registerModel("Notification", notificationSchema);
export const DailyWorkEntry = registerModel("DailyWorkEntry", dailyWorkSchema);
export const ActivityLog = registerModel("ActivityLog", activitySchema);
export const ImportJob = registerModel("ImportJob", importJobSchema);
