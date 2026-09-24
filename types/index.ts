export type PropertyStatus =
  | "ativo"
  | "pausado"
  | "vendido"
  | "alugado"
  | "arquivado";

export type CampaignStatus =
  | "rascunho"
  | "agendada"
  | "publicada"
  | "erro";

export type SocialChannel =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "google";

export interface Property {
  id: string;
  title: string;
  purpose: "Venda" | "Aluguel";
  price: number;
  location: string;
  city: string;
  bedrooms: number;
  suites: number;
  bathrooms: number;
  parking: number;
  area: number;
  description: string;
  highlights: string[];
  image?: string;
  status: PropertyStatus;
  campaigns: number;
  lastPublished?: string;
}

export interface Campaign {
  id: string;
  propertyId: string;
  propertyTitle: string;
  headline: string;
  status: CampaignStatus;
  channels: SocialChannel[];
  date: string;
  whatsappClicks?: number;
}
