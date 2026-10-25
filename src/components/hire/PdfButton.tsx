import { useState } from 'react';
// Only the URLs are bundled here; the font bytes are fetched on click.
import regularUrl from '@fontsource/inter/files/inter-latin-400-normal.woff?url';
import boldUrl from '@fontsource/inter/files/inter-latin-700-normal.woff?url';
import type { Assessment, HireAnswers } from '../../lib/hire/types';
import { BTN_PRIMARY, ERROR } from './styles';

async function fontBytes(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`font ${res.status}`);
  return res.arrayBuffer();
}

// Fetched on the first click and kept for later ones; a failed fetch is retried on the next click.
let fonts: Promise<[ArrayBuffer, ArrayBuffer]> | null = null;
function loadFonts(): Promise<[ArrayBuffer, ArrayBuffer]> {
  if (!fonts) {
    fonts = Promise.all([fontBytes(regularUrl), fontBytes(boldUrl)]);
    fonts.catch(() => {
      fonts = null;
    });
  }
  return fonts;
}

/**
 * Builds the report in the browser: the report module, pdf-lib, fontkit and the two Inter files load only on the first click. Nothing
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
    // Loading (modules and fonts over the network) and building fail for different reasons: say which.
    let phase: 'load' | 'build' = 'load';
    try {
      const [report, PDFLib, fontkitModule, [regular, bold]] = await Promise.all([
        import('../../lib/hire/pdf'), // the report layout, so the island doesn't carry it either
        import('pdf-lib'),
        import('@pdf-lib/fontkit'),
        loadFonts(),
      ]);
      phase = 'build';
      const fontkit = (fontkitModule as { default?: unknown }).default ?? fontkitModule;
      const bytes = await report.buildReportPdf({ PDFLib, fontkit, regular, bold }, answers, assessment);
      const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = report.reportFileName(answers.name, answers.assessmentDate);
      document.body.append(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setStatus('PDF report ready');
    } catch {
      setStatus('');
      setError(
        phase === 'load'
          ? "The PDF couldn't be built: its files didn't load. Check your connection (they load on first use) and try again."
          : "The PDF couldn't be built from these answers. Try again; if it still fails, share the report link instead.",
      );
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
