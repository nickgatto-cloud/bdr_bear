// Builds a Word (.docx) report — scores + coaching + transcript — for the Export
// buttons on Post-call analysis and Practice scenario, and downloads it. A .docx
// imports cleanly into Google Docs (File → Open) or Word.
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
} from "docx";
import {
  FANT,
  VESTT,
  type FantKey,
  type VesttKey,
  type TranscriptAnalysis,
} from "@/lib/coaching";

function assessment(overall: number): string {
  if (overall >= 80) return "Strong call";
  if (overall >= 60) return "Solid — close the gaps";
  return "Needs work";
}

const fantLabel = (k: FantKey) => FANT.find((f) => f.key === k)?.label ?? k;
const vesttLabel = (k: VesttKey) => VESTT.find((v) => v.key === k)?.label ?? k;

const ACCENT = "2F6FED"; // denim, for moment tags

export function buildReportDoc(opts: {
  heading: string;
  meta?: string[];
  analysis: TranscriptAnalysis | null;
  transcriptTitle: string;
  transcript: string;
  exportedAt: string;
}): Document {
  const { heading, meta = [], analysis, transcriptTitle, transcript, exportedAt } =
    opts;
  const body: Paragraph[] = [];

  body.push(new Paragraph({ text: heading, heading: HeadingLevel.HEADING_1 }));
  body.push(
    new Paragraph({
      children: [new TextRun({ text: `Exported: ${exportedAt}`, italics: true, color: "888888" })],
    })
  );
  for (const m of meta) {
    body.push(new Paragraph({ children: [new TextRun({ text: m, color: "555555" })] }));
  }

  if (analysis) {
    body.push(new Paragraph({ text: "Scores", heading: HeadingLevel.HEADING_2 }));
    body.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `FANT ${analysis.fantScore}/4 · VESTT ${analysis.vesttScore}/5 · Overall ${analysis.overall}%`,
            bold: true,
          }),
        ],
      })
    );
    body.push(new Paragraph({ text: `Assessment: ${assessment(analysis.overall)}` }));

    const fMissing = FANT.filter((f) => !analysis.fantCovered.includes(f.key)).map((f) => f.label);
    const vMissing = VESTT.filter((v) => !analysis.vesttCovered.includes(v.key)).map((v) => v.label);
    body.push(new Paragraph({ text: `FANT covered: ${analysis.fantCovered.map(fantLabel).join(", ") || "—"}` }));
    if (fMissing.length) body.push(new Paragraph({ text: `FANT missing: ${fMissing.join(", ")}` }));
    body.push(new Paragraph({ text: `VESTT covered: ${analysis.vesttCovered.map(vesttLabel).join(", ") || "—"}` }));
    if (vMissing.length) body.push(new Paragraph({ text: `VESTT missing: ${vMissing.join(", ")}` }));

    if (analysis.moments.length) {
      body.push(
        new Paragraph({
          text: `Key moments (${analysis.moments.length})`,
          heading: HeadingLevel.HEADING_2,
        })
      );
      for (const m of analysis.moments) {
        body.push(
          new Paragraph({
            children: [
              new TextRun({ text: `[${m.card.tag}] `, bold: true, color: ACCENT }),
              new TextRun({ text: m.card.heading, bold: true }),
            ],
          })
        );
        if (m.line) {
          body.push(new Paragraph({ children: [new TextRun({ text: `“${m.line}”`, italics: true })] }));
        }
        body.push(
          new Paragraph({
            children: [
              new TextRun({ text: "Ideal play: ", bold: true }),
              new TextRun({ text: m.card.talkTrack }),
            ],
          })
        );
      }
    }

    if (analysis.gaps.length) {
      body.push(
        new Paragraph({ text: "Coach — work on this", heading: HeadingLevel.HEADING_2 })
      );
      for (const g of analysis.gaps) {
        body.push(new Paragraph({ text: g, bullet: { level: 0 } }));
      }
    }
  }

  body.push(new Paragraph({ text: transcriptTitle, heading: HeadingLevel.HEADING_2 }));
  const lines = (transcript.trim() || "(none)").split(/\r?\n/);
  for (const ln of lines) body.push(new Paragraph({ text: ln }));

  return new Document({ sections: [{ children: body }] });
}

/** YYYY-MM-DD-HHMM, safe for filenames. */
export function stamp(d: Date): string {
  const p = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(
    d.getMinutes()
  )}`;
}

export async function downloadDocx(filename: string, doc: Document): Promise<void> {
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
