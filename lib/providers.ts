export const PROVIDERS = [
  {
    id: "deepinfra",
    label: "DeepInfra",
    price: "$0.09/1M in · $0.19/1M out",
    server: "https://api.deepinfra.com/v1/openai",
    model: "allenai/olmOCR-2-7B-1025",
  },
  {
    id: "parasail",
    label: "Parasail",
    price: "$0.10/1M in · $0.20/1M out",
    server: "https://api.parasail.io/v1",
    model: "allenai/olmOCR-2-7B-1025",
  },
  {
    id: "cirrascale",
    label: "Cirrascale",
    price: "$0.07/1M in · $0.15/1M out",
    server: "https://ai2endpoints.cirrascale.ai/api",
    model: "olmOCR-2-7B-1025",
  },
] as const

export type ProviderId = (typeof PROVIDERS)[number]["id"]
