import type { ApiEndpointMap } from './entity-repository'

const withEntityDefaults = (entity: string): ApiEndpointMap => ({
  list: `/${entity}`,
  getById: `/${entity}/{id}`,
  create: `/${entity}`,
  update: `/${entity}/{id}`,
  remove: `/${entity}/{id}`,
  replaceAll: `/${entity}/bulk`,
  importItems: `/${entity}/import`,
  exportItems: `/${entity}/export`,
})

export const API_ENTITY_ENDPOINTS: Record<string, ApiEndpointMap> = {
  teams: withEntityDefaults('teams'),
  athletes: withEntityDefaults('athletes'),
  registration: withEntityDefaults('registration'),
  results: withEntityDefaults('results'),
  schedule: withEntityDefaults('schedule'),
  arenas: withEntityDefaults('arenas'),
  referees: withEntityDefaults('referees'),
  appeals: withEntityDefaults('appeals'),
  'weigh-ins': withEntityDefaults('weigh-ins'),
  'combat-matches': withEntityDefaults('combat-matches'),
  'form-performances': withEntityDefaults('form-performances'),
  'content-categories': withEntityDefaults('content-categories'),
  'referee-assignments': withEntityDefaults('referee-assignments'),
  'tournament-config': withEntityDefaults('tournament-config'),
}

export type ApiEntityName = keyof typeof API_ENTITY_ENDPOINTS

export const resolveEntityEndpoints = (entity: ApiEntityName): ApiEndpointMap =>
  API_ENTITY_ENDPOINTS[entity] ?? {}
