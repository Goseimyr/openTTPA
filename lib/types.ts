export type CampaignStatus = "draft" | "active" | "archived";

export type Campaign = {
  id: string;
  organization_id: string;
  slug: string;
  status: CampaignStatus;
  language: string;
  name: string;
  sponsor_name: string;
  sponsor_contact: string;
  controlling_entity: string | null;
  publisher_name: string | null;
  publisher_contact: string | null;
  period_start: string;
  period_end: string;
  amount_message: number | null;
  amount_campaign: number | null;
  funds_origin: string;
  calculation_method: string;
  linked_process: string | null;
  targeting_used: boolean;
  targeting_description: string | null;
  delivery_description: string | null;
  consent_withdrawal_url: string | null;
  complaint_contact: string;
  complaint_url: string | null;
  ad_channels: string[] | null;
  created_at: string;
  updated_at: string;
  organizations?: Organization | null;
};

export type Organization = {
  id: string;
  name: string;
  org_number: string | null;
  website: string | null;
  created_at: string;
};
