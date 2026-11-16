'use client';

import React, { useState, useRef } from 'react';
import JSZip from 'jszip';
import {
  Upload,
  Download,
  FileArchive,
  RefreshCw,
  Trash2,
  CheckCircle2,
  ArrowRight,
  Sliders,
  FileText,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

interface FileToRename {
  id: string;
  originalName: string;
  extension: string;
  rawFile: File;
}

export const BatchRenamerZip: React.FC = () => {
  const [files, setFiles] = useState<FileToRename[]>([]);
  const [prefix, setPrefix] = useState('Asset_');
  const [suffix, setSuffix] = useState('');
  const [useNumbering, setUseNumbering] = useState(true);
  const [startNumber, setStartNumber] = useState(1);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [casing, setCasing] = useState<'none' | 'lower' | 'upper'>('none');

  const [isZipping, setIsZipping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addHistoryItem } = useAppStore();

  const handleFilesAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = Array.from(e.target.files || []);
    if (uploaded.length === 0) return;

    const mapped: FileToRename[] = uploaded.map((f, i) => {
      const parts = f.name.split('.');
      const ext = parts.length > 1 ? '.' + parts.pop() : '';
      const base = parts.join('.');
      return {
        id: `${Date.now()}_${i}_${Math.random()}`,
        originalName: base,
        extension: ext,
        rawFile: f,
      };
    });

    setFiles((prev) => [...prev, ...mapped]);
  };

  const computeNewName = (file: FileToRename, index: number): string => {
    let name = file.originalName;

    // Search & Replace
    if (findText.trim()) {
      name = name.replaceAll(findText, replaceText);
    }

    // Casing
    if (casing === 'lower') name = name.toLowerCase();
    if (casing === 'upper') name = name.toUpperCase();

    // Numbering
    const numPart = useNumbering ? String(startNumber + index).padStart(2, '0') : '';
    const numStr = numPart ? `_${numPart}` : '';

    return `${prefix}${name}${suffix}${numStr}${file.extension}`;
  };

  const handleDownloadZip = async () => {
    if (files.length === 0) return;
    setIsZipping(true);

    try {
      const zip = new JSZip();

      for (let i = 0; i < files.length; i++) {
        const item = files[i];
        const newName = computeNewName(item, i);
        const arrayBuffer = await item.rawFile.arrayBuffer();
        zip.file(newName, arrayBuffer);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Batch_Renamed_${files.length}_Files.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      addHistoryItem({
        toolId: 'batch-renamer-zip',
        toolName: 'Batch Renamer & ZIP Bundler',
        title: `Ubah Nama & ZIP ${files.length} File`,
        type: 'docs',
        downloadUrl: '#',
      });
    } catch (err) {
      console.error('ZIP bundling failed:', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Box */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-[var(--neo-border)] rounded-2xl p-6 text-center hover:border-[var(--neo-border-active)] transition-colors cursor-pointer bg-[var(--neo-bg)] space-y-2"
      >
        <div className="w-12 h-12 mx-auto rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-surface)] flex items-center justify-center text-indigo-500 shadow-neo">
          <FileArchive className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-bold text-[var(--neo-text)]">
            Tambah File untuk Diubah Namanya Sekaligus
          </p>
          <p className="text-[11px] text-[var(--neo-text-muted)] mt-0.5">
            Pilih multi-file gambar, dokumen, atau aset lalu unduh rapi dalam 1 file .ZIP
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFilesAdd}
        />
      </div>

      {files.length > 0 && (
        <div className="neo-card p-5 sm:p-6 rounded-2xl bg-[var(--neo-surface)] space-y-5">
          {/* Rules Configuration */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[var(--neo-text)] flex items-center gap-2 pb-2 border-b-2 border-[var(--neo-border)]">
              <Sliders className="w-4 h-4 text-indigo-500" />
              <span>Aturan Penamaan Baru</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-xs font-bold text-[var(--neo-text)]">Awalan (Prefix):</span>
                <input
                  type="text"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  placeholder="Asset_"
                  className="neo-input w-full px-3 py-1.5 text-xs font-mono rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-[var(--neo-text)]">Akhiran (Suffix):</span>
                <input
                  type="text"
                  value={suffix}
                  onChange={(e) => setSuffix(e.target.value)}
                  placeholder="_v1"
                  className="neo-input w-full px-3 py-1.5 text-xs font-mono rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-[var(--neo-text)]">Cari Teks:</span>
                <input
                  type="text"
                  value={findText}
                  onChange={(e) => setFindText(e.target.value)}
                  placeholder="Ketik teks yang ingin diganti..."
                  className="neo-input w-full px-3 py-1.5 text-xs font-mono rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-[var(--neo-text)]">Ganti Menjadi:</span>
                <input
                  type="text"
                  value={replaceText}
                  onChange={(e) => setReplaceText(e.target.value)}
                  placeholder="Teks pengganti..."
                  className="neo-input w-full px-3 py-1.5 text-xs font-mono rounded-lg"
                />
              </div>
            </div>

            {/* Checkbox Numbering */}
            <div className="flex items-center gap-4 text-xs font-bold pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useNumbering}
                  onChange={(e) => setUseNumbering(e.target.checked)}
                  className="w-4 h-4 accent-indigo-500 rounded"
                />
                <span>Penomoran Otomatis (_01, _02, ...)</span>
              </label>

              <button
                type="button"
                onClick={() => setFiles([])}
                className="text-rose-500 hover:underline ml-auto"
              >
                Hapus Semua File
              </button>
            </div>
          </div>

          {/* Real-time Preview Table */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-[var(--neo-text)]">
              Preview Perubahan Nama ({files.length} File):
            </span>

            <div className="max-h-60 overflow-y-auto rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] divide-y divide-[var(--neo-border)] text-xs font-mono">
              {files.map((f, i) => (
                <div key={f.id} className="p-2.5 flex items-center justify-between gap-3">
                  <div className="truncate flex-1">
                    <span className="text-[var(--neo-text-muted)] line-clamp-1">
                      {f.originalName}{f.extension}
                    </span>
                  </div>

                  <ArrowRight className="w-3.5 h-3.5 text-indigo-500 shrink-0" />

                  <div className="truncate flex-1 text-right">
                    <span className="font-bold text-[var(--neo-text)] line-clamp-1">
                      {computeNewName(f, i)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFiles(files.filter((item) => item.id !== f.id))}
                    className="p-1 text-rose-500 hover:bg-rose-500/10 rounded shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Action: Bundle into ZIP */}
          <button
            type="button"
            onClick={handleDownloadZip}
            disabled={isZipping || files.length === 0}
            className="neo-btn neo-btn-primary w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
          >
            <FileArchive className="w-4 h-4" />
            <span>
              {isZipping
                ? 'Mengemas ke dalam ZIP...'
                : `Bungkus & Download Semua (${files.length} File) dalam 1 File .ZIP`}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
