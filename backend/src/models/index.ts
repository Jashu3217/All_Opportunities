import mongoose, { Schema, Document } from 'mongoose';
import { GovtFetchedData, ModuleId } from '../types';

// ─── Govt Job Cache (TTL auto-expire after 12h) ───────────────────────────────
export interface IGovtCache extends Document {
  orgId:     string;
  org:       string;
  fetched:   GovtFetchedData;
  fetchedAt: Date;
}

const GovtCacheSchema = new Schema<IGovtCache>({
  orgId:     { type: String, required: true, unique: true, index: true },
  org:       { type: String, required: true },
  fetched:   { type: Schema.Types.Mixed, required: true },
  fetchedAt: { type: Date, default: Date.now, expires: 43200 }, // TTL 12h
});

export const GovtCache = mongoose.model<IGovtCache>('GovtCache', GovtCacheSchema);

// ─── Search History ───────────────────────────────────────────────────────────
export interface ISearchHistory extends Document {
  moduleId:   string;
  location:   string;
  filters:    Record<string, string>;
  resultCount:number;
  createdAt:  Date;
}

const SearchHistorySchema = new Schema<ISearchHistory>({
  moduleId:    { type: String, required: true, index: true },
  location:    { type: String, default: 'hyderabad' },
  filters:     { type: Schema.Types.Mixed, default: {} },
  resultCount: { type: Number, default: 0 },
  createdAt:   { type: Date, default: Date.now, expires: 604800 }, // 7 days
});

export const SearchHistory = mongoose.model<ISearchHistory>('SearchHistory', SearchHistorySchema);

// ─── Module Config (feature flags, order, visibility) ────────────────────────
export interface IModuleConfig extends Document {
  moduleId:  ModuleId;
  label:     string;
  icon:      string;
  enabled:   boolean;
  order:     number;
  color:     string;
  badge:     string;
  updatedAt: Date;
}

const ModuleConfigSchema = new Schema<IModuleConfig>({
  moduleId: { type: String, required: true, unique: true },
  label:    { type: String, required: true },
  icon:     { type: String, default: '🔍' },
  enabled:  { type: Boolean, default: true },
  order:    { type: Number, default: 99 },
  color:    { type: String, default: '#00d4ff' },
  badge:    { type: String, default: 'LIVE' },
  updatedAt:{ type: Date, default: Date.now },
});

export const ModuleConfig = mongoose.model<IModuleConfig>('ModuleConfig', ModuleConfigSchema);

// ─── Application Tracker ──────────────────────────────────────────────────────
export type AppStatus = 'saved' | 'applied' | 'interview' | 'offer' | 'rejected' | 'ghosted';

export interface IApplication extends Document {
  jobId:       string;
  jobTitle:    string;
  company:     string;
  location:    string;
  salary:      string;
  applyUrl:    string;
  sourceUrl:   string;
  source:      string;
  skills:      string[];
  matchScore:  number;
  status:      AppStatus;
  appliedAt:   Date | null;
  interviewAt: Date | null;
  notes:       string;
  nextAction:  string;
  moduleId:    string;
  createdAt:   Date;
  updatedAt:   Date;
}

const ApplicationSchema = new Schema<IApplication>({
  jobId:       { type: String, required: true, unique: true },
  jobTitle:    { type: String, required: true },
  company:     { type: String, required: true },
  location:    { type: String, default: '' },
  salary:      { type: String, default: '' },
  applyUrl:    { type: String, default: '' },
  sourceUrl:   { type: String, default: '' },
  source:      { type: String, default: '' },
  skills:      [{ type: String }],
  matchScore:  { type: Number, default: 0 },
  status:      { type: String, enum: ['saved','applied','interview','offer','rejected','ghosted'], default: 'saved' },
  appliedAt:   { type: Date, default: null },
  interviewAt: { type: Date, default: null },
  notes:       { type: String, default: '' },
  nextAction:  { type: String, default: '' },
  moduleId:    { type: String, default: 'sde' },
  createdAt:   { type: Date, default: Date.now },
  updatedAt:   { type: Date, default: Date.now },
});

ApplicationSchema.index({ status: 1 });
ApplicationSchema.index({ company: 1 });
ApplicationSchema.index({ createdAt: -1 });

export const Application = mongoose.model<IApplication>('Application', ApplicationSchema);

// ─── Alert Config ─────────────────────────────────────────────────────────────
export interface IAlertConfig extends Document {
  email:      string;
  enabled:    boolean;
  modules:    string[];
  location:   string;
  minScore:   number;
  schedule:   string;
  lastSentAt: Date | null;
  createdAt:  Date;
}

const AlertConfigSchema = new Schema<IAlertConfig>({
  email:      { type: String, required: true, unique: true },
  enabled:    { type: Boolean, default: true },
  modules:    [{ type: String }],
  location:   { type: String, default: 'hyderabad' },
  minScore:   { type: Number, default: 75 },
  schedule:   { type: String, default: '0 9 * * *' }, // 9AM daily
  lastSentAt: { type: Date, default: null },
  createdAt:  { type: Date, default: Date.now },
});

export const AlertConfig = mongoose.model<IAlertConfig>('AlertConfig', AlertConfigSchema);
