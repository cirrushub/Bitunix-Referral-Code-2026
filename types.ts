
export interface FeatureData {
  title: string;
  description: string;
  icon: string;
  badge?: string;
  tooltip?: string;
}

export interface MarketingContent {
  headline: string;
  subheadline: string;
  rankClaim: string;
  trustFactor: string;
  features: FeatureData[];
}
