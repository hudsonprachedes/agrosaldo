import { addMonths } from 'date-fns';
import { EpidemiologyAnswer, EpidemiologySurveyDTO } from '@/types';

const STORAGE_KEY_PREFIX = 'agrosaldo_epidemiology_surveys_';

function getStorageKey(propertyId: string) {
  return `${STORAGE_KEY_PREFIX}${propertyId}`;
}

function generateId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `survey_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function safeParseJson<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function listEpidemiologySurveys(propertyId: string): EpidemiologySurveyDTO[] {
  const raw = localStorage.getItem(getStorageKey(propertyId));
  const parsed = safeParseJson<EpidemiologySurveyDTO[]>(raw);
  if (!parsed) return [];

  return parsed
    .filter((s) => s && s.propertyId === propertyId)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
}

export function getEpidemiologySurveyById(propertyId: string, surveyId: string): EpidemiologySurveyDTO | null {
  const all = listEpidemiologySurveys(propertyId);
  return all.find((s) => s.id === surveyId) ?? null;
}

export function getLatestEpidemiologySurvey(propertyId: string): EpidemiologySurveyDTO | null {
  return listEpidemiologySurveys(propertyId)[0] ?? null;
}

export function saveEpidemiologySurvey(propertyId: string, answers: EpidemiologyAnswer[]): EpidemiologySurveyDTO {
  const now = new Date();
  const submittedAt = now.toISOString();
  const nextDueAt = addMonths(now, 6).toISOString();

  const newSurvey: EpidemiologySurveyDTO = {
    id: generateId(),
    propertyId,
    version: 1,
    answers,
    submittedAt,
    nextDueAt,
  };

  const current = listEpidemiologySurveys(propertyId);
  const updated = [newSurvey, ...current];
  localStorage.setItem(getStorageKey(propertyId), JSON.stringify(updated));

  return newSurvey;
}
