export interface InvoiceData2 {
  company: {
    name: string;
    address: string;
    email: string;
    phone: string;
  };
  proposal: {
    number: string;
    date: string;
  };
  client: {
    name: string;
    address1: string;
    address2: string;
    pcn: string;
  };
  projectScope: string;
  description: string;
  amount: string;
  notes: string;
}