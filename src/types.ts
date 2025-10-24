
export interface CompanyInfo {
  name: string;
  address1: string;
  address2: string;
  phone: string;
  emails: string;
}

export interface ClientInfo {
  proposalNum: string;
  date: string;
  name: string;
  email: string;
  address: string;
}

export interface InvoiceData {
  company: CompanyInfo;
  client: ClientInfo;
  scopeOfWork: string;
  lumpSumTotal: string;
  notes: string[];
  disclaimer: string;
}