import type { AgentRun } from '../components/home/types';

// Illustrative agent runs for the hero console. Every identifier, amount and
// SKU below is made up. The last row of each run is the "done" row.
export const AGENT_RUNS: AgentRun[] = [
  {
    name: 'trade-pilot',
    rows: [
      { step: 'whatsapp', detail: '**"PO attached, pls quote"** + po_0412.pdf' },
      { step: 'extract', detail: 'gemini · **7 line items** · customer, qty, UOM' },
      { step: 'match', detail: 'autocount · customer **found** · 7/7 items mapped' },
      { step: 'draft', detail: 'quotation **QT-0412** prepared' },
      { step: 'review', detail: 'admin approved in portal **✓**' },
      { step: 'post', detail: 'sales order **SO-0412** created' },
    ],
  },
  {
    name: 'claim-pilot',
    rows: [
      { step: 'teams', detail: '**receipt.jpg** · "client lunch"' },
      { step: 'extract', detail: 'gemini · **RM 186.40** · merchant, date, tax' },
      { step: 'policy', detail: 'within entertainment limit **✓**' },
      { step: 'verify', detail: 'verifier approved **✓**' },
      { step: 'approve', detail: 'approver approved **✓**' },
      { step: 'post', detail: 'GL journal **JV-2291** posted' },
    ],
  },
  {
    name: 'warebot',
    rows: [
      { step: 'ask', detail: '**"how many A4 boxes left in WH2?"**' },
      { step: 'tool', detail: 'wms.stock_query(sku="A4-80G", wh="WH2")' },
      { step: 'answer', detail: '**142 boxes** · 3 bins · streaming via SSE' },
      { step: 'ask', detail: '**"move 40 to WH1"**' },
      { step: 'confirm', detail: 'write requires confirmation… **✓ confirmed**' },
      { step: 'done', detail: 'transfer **TR-778** created' },
    ],
  },
];
