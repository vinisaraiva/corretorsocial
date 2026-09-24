import type { Campaign, Property } from "@/types";

export const properties: Property[] = [
  {
    id: "apt-taperapua",
    title: "Apartamento em Taperapuã",
    purpose: "Venda",
    price: 790000,
    location: "Taperapuã",
    city: "Porto Seguro - BA",
    bedrooms: 3,
    suites: 2,
    bathrooms: 3,
    parking: 2,
    area: 118,
    description:
      "Apartamento amplo, bem iluminado e próximo à praia, com varanda e área de lazer completa.",
    highlights: ["300 m da praia", "Varanda ampla", "Piscina", "2 vagas"],
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
    status: "ativo",
    campaigns: 4,
    lastPublished: "Hoje, 10:30",
  },
  {
    id: "casa-arraial",
    title: "Casa em Arraial d'Ajuda",
    purpose: "Venda",
    price: 1250000,
    location: "Arraial d'Ajuda",
    city: "Porto Seguro - BA",
    bedrooms: 4,
    suites: 3,
    bathrooms: 4,
    parking: 2,
    area: 210,
    description:
      "Casa com jardim, ambientes integrados e localização tranquila próxima ao centro de Arraial.",
    highlights: ["Jardim", "3 suítes", "Área gourmet", "Rua tranquila"],
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    status: "ativo",
    campaigns: 2,
    lastPublished: "Ontem, 18:15",
  },
  {
    id: "apt-centro",
    title: "Apartamento no Centro",
    purpose: "Aluguel",
    price: 3200,
    location: "Centro",
    city: "Porto Seguro - BA",
    bedrooms: 2,
    suites: 1,
    bathrooms: 2,
    parking: 1,
    area: 82,
    description:
      "Apartamento funcional no centro, perto de serviços, comércio e principais acessos.",
    highlights: ["Localização central", "1 suíte", "1 vaga", "Pronto para morar"],
    image:
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=80",
    status: "arquivado",
    campaigns: 1,
    lastPublished: "12 set, 09:10",
  },
];

export const campaigns: Campaign[] = [
  {
    id: "camp-001",
    propertyId: "apt-taperapua",
    propertyTitle: "Apartamento em Taperapuã",
    headline: "Viva a 300 m da praia",
    status: "publicada",
    channels: ["instagram", "facebook", "tiktok", "google"],
    date: "Hoje, 10:30",
    whatsappClicks: 24,
  },
  {
    id: "camp-002",
    propertyId: "casa-arraial",
    propertyTitle: "Casa em Arraial d'Ajuda",
    headline: "Espaço para viver bem em Arraial",
    status: "agendada",
    channels: ["instagram", "facebook"],
    date: "Amanhã, 18:00",
  },
  {
    id: "camp-003",
    propertyId: "apt-taperapua",
    propertyTitle: "Apartamento em Taperapuã",
    headline: "3 suítes perto da praia",
    status: "rascunho",
    channels: ["instagram", "tiktok"],
    date: "Não agendada",
  },
  {
    id: "camp-004",
    propertyId: "apt-centro",
    propertyTitle: "Apartamento no Centro",
    headline: "Praticidade no centro de Porto Seguro",
    status: "erro",
    channels: ["facebook"],
    date: "12 set, 09:10",
  },
];

export const channelLabels = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  google: "Google",
} as const;
