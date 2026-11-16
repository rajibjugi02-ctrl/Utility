'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import ImageExtension from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ImageIcon,
  Undo2,
  Redo2,
  Minus,
  Sparkles,
  Download,
  Eye,
  FileCheck,
  Layers,
  Palette,
  Trash2,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ProcessCard } from '../common/ProcessCard';

type PaperSize = 'a4' | 'letter' | 'legal';
type Orientation = 'portrait' | 'landscape';
type MarginType = 'normal' | 'narrow' | 'wide';
type FontFamily = 'sans' | 'serif' | 'mono';

export const PdfStudio: React.FC = () => {
  const { pdfStudioContent, setPdfStudioContent, addHistoryItem } = useAppStore();

  // Page Setup State
  const [fileName, setFileName] = useState('Dokumen_Saya.pdf');
  const [paperSize, setPaperSize] = useState<PaperSize>('a4');
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [marginType, setMarginType] = useState<MarginType>('normal');

  // Toolbar Formatting State
  const [fontFamily, setFontFamily] = useState<FontFamily>('sans');
  const [fontSize, setFontSize] = useState<string>('14px');
  const [textColor, setTextColor] = useState<string>('#121212');
  const [highlightColor, setHighlightColor] = useState<string>('#FEF08A');

  // PDF Preview & Render State
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderStage, setRenderStage] = useState('');
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  const paperRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Initialize editor completely blank with zero red spellcheck lines
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Underline,
      ImageExtension.configure({
        inline: true,
        allowBase64: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: pdfStudioContent || '',
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[520px] leading-relaxed text-black',
        spellcheck: 'false',
        autocorrect: 'off',
        autocapitalize: 'off',
        'data-gramm': 'false',
      },
    },
  });

  // Clear shared OCR text once mounted
  useEffect(() => {
    if (pdfStudioContent && editor) {
      editor.commands.setContent(pdfStudioContent);
      setPdfStudioContent(null);
    }
  }, [pdfStudioContent, editor, setPdfStudioContent]);

  // Live document statistics
  const getDocStats = () => {
    if (!editor) return { words: 0, characters: 0, pages: 1 };
    const text = editor.getText();
    const characters = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const pages = Math.max(1, Math.ceil(words / 450));
    return { words, characters, pages };
  };

  const docStats = getDocStats();

  // Template apply actions
  const applyTemplate = (type: 'letter' | 'essay' | 'cv' | 'notes') => {
    if (!editor) return;

    if (type === 'letter') {
      editor.commands.setContent(`
        <h2 style="text-align: center;"><strong>SURAT PERNYATAAN RESMI</strong></h2>
        <p style="text-align: center; color: #52525B;">Nomor: 018/SP/DIR/XI/2026</p>
        <hr />
        <p>Yang bertanda tangan di bawah ini:</p>
        <p><strong>Nama:</strong> Budi Pratama<br /><strong>Jabatan:</strong> Project Lead<br /><strong>Perusahaan:</strong> PT Inovasi Digital Nusantara</p>
        <p>Menyatakan dengan sesungguhnya bahwa seluruh modul perangkat lunak telah memenuhi standar kelayakan, keamanan data, dan siap digunakan untuk kebutuhan operasional.</p>
        <p>Demikian surat pernyataan ini dibuat untuk dipergunakan sebagaimana mestinya.</p>
        <br />
        <p style="text-align: right;">Jakarta, 15 November 2026<br />Hormat kami,<br /><br /><br /><strong>( Budi Pratama )</strong></p>
      `);
      setFileName('Surat_Resmi.pdf');
    } else if (type === 'essay') {
      editor.commands.setContent(`
        <h1 style="text-align: center;"><strong>LAPORAN ANALISIS SISTEM KOMPUTASI CLIENT-SIDE</strong></h1>
        <p style="text-align: center; color: #52525B;">Disusun oleh: Tim Pengembang Aplikasi</p>
        <hr />
        <h3><strong>ABSTRAK</strong></h3>
        <p>Makalah ini meneliti efisiensi pemrosesan media berbasis browser menggunakan Web Audio DSP, Canvas API, dan Tesseract OCR. Hasil pengujian menunjukkan penurunan beban server hingga 80% dengan waktu respons real-time.</p>
        <h3><strong>BAB I: PENDAHULUAN</strong></h3>
        <p>Dalam era komputasi modern, pengguna menuntut privasi data dan kecepatan tanpa latensi jaringan yang berulang.</p>
        <h3><strong>BAB II: KESIMPULAN</strong></h3>
        <p>Implementasi teknologi client-side terbukti mandiri, tangguh, dan ramah privasi pengguna.</p>
      `);
      setFileName('Makalah_Laporan.pdf');
    } else if (type === 'cv') {
      editor.commands.setContent(`
        <h2><strong>CURRICULUM VITAE</strong></h2>
        <p><strong>Nama:</strong> Ahmad Fadhil | <strong>Email:</strong> fadhil@example.com | <strong>Lokasi:</strong> Jakarta, Indonesia</p>
        <hr />
        <h3><strong>PROFIL PROFESIONAL</strong></h3>
        <p>Senior Full Stack Developer dengan spesialisasi Next.js, Web Audio DSP, dan sistem desain modern berorientasi performa tinggi.</p>
        <h3><strong>KEAHLIAN TEKNIS</strong></h3>
        <ul>
          <li>React, Next.js 14, TypeScript, Tailwind CSS, Framer Motion</li>
          <li>Web Audio API, Canvas Processing, IndexedDB Storage</li>
          <li>REST API Integration, Python FastAPI, Web Scraping</li>
        </ul>
        <h3><strong>PENGALAMAN KERJA</strong></h3>
        <p><strong>Lead Frontend Engineer</strong>, Tech Innovations (2023 - Sekarang)<br />Mengembangkan platform utilitas serbaguna dengan arsitektur responsif dan live preview interaktif.</p>
      `);
      setFileName('Curriculum_Vitae.pdf');
    } else if (type === 'notes') {
      editor.commands.setContent(`
        <h2><strong>NOTULEN RAPAT KOORDINASI MINGGUAN</strong></h2>
        <p><strong>Hari/Tanggal:</strong> Senin, 15 November 2026<br /><strong>Peserta:</strong> UI/UX Designer, Frontend Dev, Backend Lead</p>
        <hr />
        <h3><strong>Agenda Utama:</strong></h3>
        <ul>
          <li>Review perombakan sistem desain Soft Neo-Brutalism</li>
          <li>Uji fungsionalitas CapCut Trend Finder & Audio DSP</li>
          <li>Pembersihan kanvas PDF Studio bebas bug fokus</li>
        </ul>
        <h3><strong>Tindak Lanjut (Action Items):</strong></h3>
        <ol>
          <li>Rilis versi produksi ke lingkungan deployment</li>
          <li>Verifikasi responsivitas pada layar ponsel</li>
        </ol>
      `);
      setFileName('Catatan_Rapat.pdf');
    }
  };

  const handleClearCanvas = () => {
    if (editor) {
      editor.commands.clearContent();
    }
  };

  // Insert image from local device
  const handleImageInsert = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editor) {
      const reader = new FileReader();
      reader.onload = () => {
        editor.chain().focus().setImage({ src: reader.result as string }).run();
      };
      reader.readAsDataURL(file);
    }
  };

  // Generate PDF with html2canvas and jsPDF
  const handleBuildAndPreviewPdf = async () => {
    if (!paperRef.current) return;

    setIsRendering(true);
    setRenderProgress(15);
    setRenderStage('Menangkap snapshot kanvas kertas fisik...');

    try {
      const timer1 = setTimeout(() => {
        setRenderProgress(50);
        setRenderStage('Mengompilasi elemen teks, margin, dan grafik...');
      }, 400);

      const timer2 = setTimeout(() => {
        setRenderProgress(80);
        setRenderStage('Menyusun lembar halaman format PDF murni...');
      }, 900);

      const canvas = await html2canvas(paperRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF',
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      const pdf = new jsPDF({
        orientation: orientation === 'landscape' ? 'landscape' : 'portrait',
        unit: 'mm',
        format: paperSize === 'legal' ? 'legal' : paperSize === 'letter' ? 'letter' : 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

      const blob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(blob);

      setPdfBlobUrl(blobUrl);
      setRenderProgress(100);
      setRenderStage('PDF berhasil dibuat!');

      addHistoryItem({
        type: 'pdf',
        title: fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`,
        subtitle: `${paperSize.toUpperCase()} · ${orientation} · Margin ${marginType}`,
        downloadUrl: blobUrl,
      });
    } catch (err: any) {
      console.error('PDF Render Error:', err);
      setRenderStage('Gagal membuat preview PDF.');
    } finally {
      setIsRendering(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!pdfBlobUrl) return;
    const cleanName = fileName.trim().endsWith('.pdf') ? fileName.trim() : `${fileName.trim()}.pdf`;
    const link = document.createElement('a');
    link.href = pdfBlobUrl;
    link.download = cleanName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getMarginStyle = () => {
    if (marginType === 'narrow') return 'p-6 sm:p-8';
    if (marginType === 'wide') return 'p-12 sm:p-16';
    return 'p-8 sm:p-12';
  };

  const getPaperDimensions = () => {
    if (orientation === 'landscape') {
      return 'w-full max-w-4xl min-h-[460px]';
    }
    return 'w-full max-w-2xl min-h-[680px]';
  };

  const getFontFamilyClass = () => {
    if (fontFamily === 'serif') return 'font-serif';
    if (fontFamily === 'mono') return 'font-mono';
    return 'font-sans';
  };

  if (!editor) {
    return <div className="p-6 text-center text-xs text-[var(--neo-text-muted)]">Memuat Studio PDF...</div>;
  }

  return (
    <div className="space-y-4">
      {/* 1. Page Setup Bar */}
      <div className="neo-card p-3 sm:p-4 rounded-2xl bg-[var(--neo-surface)] space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b-2 border-[var(--neo-border)]">
          <Layers className="w-4 h-4 text-[var(--neo-text)]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--neo-text)]">
            Pengaturan Halaman & Dokumen
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[var(--neo-text)]">Nama File (.pdf):</label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg neo-input text-xs font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[var(--neo-text)]">Ukuran Kertas:</label>
            <select
              value={paperSize}
              onChange={(e: any) => setPaperSize(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg neo-input text-xs font-bold"
            >
              <option value="a4">A4 (210 × 297 mm)</option>
              <option value="letter">Letter (8.5 × 11 in)</option>
              <option value="legal">Legal (8.5 × 14 in)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[var(--neo-text)]">Orientasi:</label>
            <select
              value={orientation}
              onChange={(e: any) => setOrientation(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg neo-input text-xs font-bold"
            >
              <option value="portrait">Tegak (Portrait)</option>
              <option value="landscape">Mendatar (Landscape)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[var(--neo-text)]">Margin Kertas:</label>
            <select
              value={marginType}
              onChange={(e: any) => setMarginType(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg neo-input text-xs font-bold"
            >
              <option value="normal">Normal (25 mm)</option>
              <option value="narrow">Sempit (12 mm)</option>
              <option value="wide">Lebar (35 mm)</option>
            </select>
          </div>
        </div>

        {/* Template Bar with Clear Button */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--neo-border)]">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-[var(--neo-text-muted)] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Template Opsional:
            </span>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyTemplate('letter')}
              className="neo-btn px-2.5 py-1 rounded-lg text-[11px] neo-btn-secondary"
            >
              Surat Resmi
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyTemplate('essay')}
              className="neo-btn px-2.5 py-1 rounded-lg text-[11px] neo-btn-secondary"
            >
              Makalah
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyTemplate('cv')}
              className="neo-btn px-2.5 py-1 rounded-lg text-[11px] neo-btn-secondary"
            >
              CV / Resume
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyTemplate('notes')}
              className="neo-btn px-2.5 py-1 rounded-lg text-[11px] neo-btn-secondary"
            >
              Catatan Rapat
            </button>
          </div>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleClearCanvas}
            className="neo-btn px-2.5 py-1 rounded-lg text-[11px] text-rose-500 bg-[var(--neo-surface)] hover:bg-rose-500/10 font-bold"
          >
            <Trash2 className="w-3 h-3" />
            <span>Kosongkan Kertas</span>
          </button>
        </div>
      </div>

      {/* 2. Functional Formatting Toolbar (with onMouseDown preventDefault to prevent losing selection) */}
      <div className="neo-card p-2.5 rounded-2xl bg-[var(--neo-surface)] flex flex-wrap items-center gap-1.5">
        <select
          value={fontFamily}
          onChange={(e: any) => setFontFamily(e.target.value)}
          className="px-2 py-1 rounded-lg neo-input text-xs font-bold"
        >
          <option value="sans">Sans-Serif</option>
          <option value="serif">Serif (Times)</option>
          <option value="mono">Monospace</option>
        </select>

        <select
          value={fontSize}
          onChange={(e) => setFontSize(e.target.value)}
          className="px-2 py-1 rounded-lg neo-input text-xs font-bold"
        >
          <option value="12px">12px</option>
          <option value="14px">14px</option>
          <option value="16px">16px</option>
          <option value="18px">18px</option>
          <option value="22px">22px</option>
          <option value="28px">28px</option>
        </select>

        <div className="h-5 w-px bg-[var(--neo-border)] mx-1" />

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`neo-btn p-1.5 rounded-lg text-xs ${
            editor.isActive('bold') ? 'neo-btn-primary' : 'neo-btn-secondary'
          }`}
          title="Tebal (Bold)"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`neo-btn p-1.5 rounded-lg text-xs ${
            editor.isActive('italic') ? 'neo-btn-primary' : 'neo-btn-secondary'
          }`}
          title="Miring (Italic)"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`neo-btn p-1.5 rounded-lg text-xs ${
            editor.isActive('underline') ? 'neo-btn-primary' : 'neo-btn-secondary'
          }`}
          title="Garis Bawah (Underline)"
        >
          <UnderlineIcon className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`neo-btn p-1.5 rounded-lg text-xs ${
            editor.isActive('strike') ? 'neo-btn-primary' : 'neo-btn-secondary'
          }`}
          title="Coret (Strikethrough)"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>

        <div className="h-5 w-px bg-[var(--neo-border)] mx-1" />

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`neo-btn px-2 py-1 rounded-lg text-xs font-bold ${
            editor.isActive('heading', { level: 1 }) ? 'neo-btn-primary' : 'neo-btn-secondary'
          }`}
        >
          H1
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`neo-btn px-2 py-1 rounded-lg text-xs font-bold ${
            editor.isActive('heading', { level: 2 }) ? 'neo-btn-primary' : 'neo-btn-secondary'
          }`}
        >
          H2
        </button>

        <div className="h-5 w-px bg-[var(--neo-border)] mx-1" />

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`neo-btn p-1.5 rounded-lg text-xs ${
            editor.isActive({ textAlign: 'left' }) ? 'neo-btn-primary' : 'neo-btn-secondary'
          }`}
          title="Rata Kiri"
        >
          <AlignLeft className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`neo-btn p-1.5 rounded-lg text-xs ${
            editor.isActive({ textAlign: 'center' }) ? 'neo-btn-primary' : 'neo-btn-secondary'
          }`}
          title="Rata Tengah"
        >
          <AlignCenter className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`neo-btn p-1.5 rounded-lg text-xs ${
            editor.isActive({ textAlign: 'right' }) ? 'neo-btn-primary' : 'neo-btn-secondary'
          }`}
          title="Rata Kanan"
        >
          <AlignRight className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={`neo-btn p-1.5 rounded-lg text-xs ${
            editor.isActive({ textAlign: 'justify' }) ? 'neo-btn-primary' : 'neo-btn-secondary'
          }`}
          title="Rata Kanan-Kiri"
        >
          <AlignJustify className="w-3.5 h-3.5" />
        </button>

        <div className="h-5 w-px bg-[var(--neo-border)] mx-1" />

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`neo-btn p-1.5 rounded-lg text-xs ${
            editor.isActive('bulletList') ? 'neo-btn-primary' : 'neo-btn-secondary'
          }`}
          title="Daftar Poin"
        >
          <List className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`neo-btn p-1.5 rounded-lg text-xs ${
            editor.isActive('orderedList') ? 'neo-btn-primary' : 'neo-btn-secondary'
          }`}
          title="Daftar Nomor"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>

        <div className="h-5 w-px bg-[var(--neo-border)] mx-1" />

        <div className="flex items-center gap-1.5">
          <input
            type="color"
            value={textColor}
            onChange={(e) => {
              setTextColor(e.target.value);
              editor.chain().focus().setColor(e.target.value).run();
            }}
            className="w-6 h-6 rounded cursor-pointer border border-[var(--neo-border)]"
            title="Warna Teks"
          />

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleHighlight({ color: highlightColor }).run()}
            className={`neo-btn p-1.5 rounded-lg text-xs ${
              editor.isActive('highlight') ? 'neo-btn-primary' : 'neo-btn-secondary'
            }`}
            title="Sorot Warna"
          >
            <Palette className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => imageInputRef.current?.click()}
          className="neo-btn p-1.5 rounded-lg text-xs neo-btn-secondary"
          title="Sisipkan Gambar dari Device"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageInsert}
          />
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="neo-btn p-1.5 rounded-lg text-xs neo-btn-secondary"
          title="Garis Horizontal"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <div className="h-5 w-px bg-[var(--neo-border)] mx-1" />

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="neo-btn p-1.5 rounded-lg text-xs neo-btn-secondary disabled:opacity-40"
          title="Undo"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="neo-btn p-1.5 rounded-lg text-xs neo-btn-secondary disabled:opacity-40"
          title="Redo"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3. Physical Paper Canvas (Clean Blank & Free of Spellcheck Red Lines) */}
      <div className="w-full flex flex-col items-center py-2 bg-neutral-900/10 rounded-2xl border-2 border-[var(--neo-border)] p-4 sm:p-6 overflow-x-auto">
        <div
          ref={paperRef}
          style={{ fontSize }}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          className={`bg-white text-black shadow-neo-lg rounded-sm border-2 border-[#121212] transition-all duration-200 relative ${getPaperDimensions()} ${getMarginStyle()} ${getFontFamilyClass()}`}
        >
          {editor.isEmpty && (
            <div className="absolute top-8 left-8 text-neutral-400 pointer-events-none select-none text-xs sm:text-sm">
              Mulai ketik dokumen Anda di sini...
            </div>
          )}
          <EditorContent editor={editor} />
        </div>

        {/* Live Status Bar */}
        <div className="w-full max-w-2xl mt-4 px-4 py-2 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-surface)] flex flex-wrap items-center justify-between text-xs font-mono font-bold text-[var(--neo-text)]">
          <div className="flex items-center gap-4">
            <span>Kata: {docStats.words}</span>
            <span>Karakter: {docStats.characters}</span>
            <span>Estimasi: {docStats.pages} Halaman</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[var(--neo-text-muted)] uppercase text-[10px]">
              {paperSize} · {orientation}
            </span>
          </div>
        </div>
      </div>

      {/* Trigger: Buat & Preview PDF */}
      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={handleBuildAndPreviewPdf}
          disabled={isRendering}
          className="neo-btn neo-btn-primary px-6 py-3 rounded-xl text-xs font-bold"
        >
          <Eye className="w-4 h-4" />
          <span>{isRendering ? 'Sedang Merender Dokumen...' : 'Buat & Preview PDF'}</span>
        </button>
      </div>

      {/* Animated Process Card while rendering */}
      {(isRendering || (renderProgress > 0 && renderProgress < 100)) && (
        <ProcessCard
          stage={renderStage}
          progress={renderProgress}
          speed="28.4 MB/s"
          eta="00:01"
          isCompleted={renderProgress === 100}
        />
      )}

      {/* 4. Live PDF Preview & Export */}
      {pdfBlobUrl && renderProgress === 100 && (
        <div className="neo-card p-5 sm:p-6 rounded-2xl bg-[var(--neo-surface)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[var(--neo-border)]">
            <span className="neo-badge bg-emerald-500/10 text-emerald-500 border-emerald-500/40">
              <FileCheck className="w-4 h-4" /> Live PDF Preview Siap Diunduh
            </span>
            <span className="text-xs font-mono font-bold text-[var(--neo-text)]">
              {fileName}
            </span>
          </div>

          <div className="w-full h-[520px] rounded-xl overflow-hidden border-2 border-[var(--neo-border)] bg-neutral-900 shadow-neo">
            <iframe
              src={pdfBlobUrl}
              title="Live PDF Document Preview"
              className="w-full h-full border-0"
            />
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t-2 border-[var(--neo-border)]">
            <p className="text-xs text-[var(--neo-text-muted)] font-mono">
              Periksa lembaran PDF di atas sebelum mengunduh ke perangkat Anda.
            </p>

            <button
              type="button"
              onClick={handleDownloadPdf}
              className="neo-btn neo-btn-primary px-6 py-3 rounded-xl text-xs font-bold w-full sm:w-auto"
            >
              <Download className="w-4 h-4" />
              <span>Download File .PDF</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
