import { useState } from 'react';
// Only the URLs are bundled here; the font bytes are fetched on click.
import regularUrl from '@fontsource/inter/files/inter-latin-400-normal.woff?url';
import boldUrl from '@fontsource/inter/files/inter-latin-700-normal.woff?url';
import { buildReportPdf, reportFileName } from '../../lib/hire/pdf';
import type { Assessment, HireAnswers } from '../../lib/hire/types';
import { BTN_PRIMARY, ERROR } from './styles';

async function fontBytes(res: Response): Promise<ArrayBuffer> {
  if (!res.ok) throw new Error(`font ${res.status}`);
  return res.arrayBuffer();
}

/**
 * Builds the report in the browser: pdf-lib, fontkit and the two Inter files load only on the first click. Nothing
 * about the answers leaves the page; the font fetches carry no data.
 */
export default function PdfButton({ answers, assessment }: { answers: HireAnswers; assessment: Assessment }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const download = async () => {
    setBusy(true);
    setError('');
    setStatus('Building the PDF report');
    try {
      const [PDFLib, fontkitModule, regularRes, boldRes] = await Promise.all([
        import('pdf-lib'),
        import('@pdf-lib/fontkit'),
        fetch(regularUrl),
        fetch(boldUrl),
      ]);
      const [regular, bold] = await Promise.all([fontBytes(regularRes), fontBytes(boldRes)]);
      const fontkit = (fontkitModule as { default?: unknown }).default ?? fontkitModule;
      const bytes = await buildReportPdf({ PDFLib, fontkit, regular, bold }, answers, assessment);
      const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = reportFileName(answers.name, answers.assessmentDate);
      document.body.append(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setStatus('PDF report ready');
    } catch {
      setStatus('');
      setError("The PDF couldn't be built. Check your connection (the fonts load on first use) and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-w-0">
      <button type="button" className={BTN_PRIMARY} onClick={download} disabled={busy} aria-busy={busy} data-testid="hire-pdf">
        {busy ? 'Building the PDF…' : 'Download PDF report'}
      </button>
      <p role="status" className="sr-only" data-testid="hire-pdf-status">{status}</p>
      <p role="alert" className={error ? ERROR : 'sr-only'} data-testid="hire-pdf-error">{error}</p>
    </div>
  );
}
