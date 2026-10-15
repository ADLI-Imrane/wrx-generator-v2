/**
 * Client logos and testimonials. Only add entries you have permission to publish;
 * the section stays out of the page while both lists are empty.
 */
export interface ProofLogo {
  name: string;
  src: string;
  width: number;
  height: number;
}

export interface ProofQuote {
  quote: { fr: string; en: string };
  name: string;
  role: { fr: string; en: string };
}

export const proofLogos: ProofLogo[] = [];
export const proofQuotes: ProofQuote[] = [];
