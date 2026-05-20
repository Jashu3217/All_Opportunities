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
