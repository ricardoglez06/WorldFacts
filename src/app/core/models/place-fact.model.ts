export type FactCategory = 'curioso' | 'escalofriante' | 'raro';

export interface PlaceFact {
  id: string;
  locationName: string;
  country: string;
  imageUrl: string;
  imageThumbUrl: string;
  imageAuthor?: string;
  imageAuthorUrl?: string;
  fact: string;
  category: FactCategory;
  source?: string;
}

export interface SeedPlace {
  slug: string;
  wikiTitle: string;
  displayName: string;
  country: string;
  category: FactCategory;
  photoKeywords: string;
}
