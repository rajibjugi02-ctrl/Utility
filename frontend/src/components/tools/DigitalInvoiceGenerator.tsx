'use client';

import React, { useState, useRef } from 'react';
import {
  Receipt,
  Plus,
  Trash2,
  Download,
  Printer,
  PenTool,
  CheckCircle2,
  Building,
  User,
  CreditCard,
  Sparkles,
  RotateCcw,
  Upload,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

interface InvoiceItem {
  id: string;
  name: string;
  qty: number;
  price: number;
}

export default function DigitalInvoiceGenerator() {
  const { addHistory } = useAppStore();

  // Document Config
  const [docType, setDocType] = useState<'invoice' | 'kwitansi' | 'nota'>('invoice');
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-001`);
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [currency, setCurrency] = useState('IDR');

  // Sender & Client info
  const [senderName, setSenderName] = useState('Studio Desain & Kreatif');
  const [senderContact, setSenderContact] = useState('halo@studiokreatif.id | 0812-3456-7890');
  const [senderAddress, setSenderAddress] = useState('Jl. Jenderal Sudirman No. 42, Jakarta');
  const [logoSrc, setLogoSrc] = useState<string | null>(null);

  const [clientName, setClientName] = useState('PT Maju Bersama');
  const [clientContact, setClientContact] = useState('finance@majubersama.com');
  const [clientAddress, setClientAddress] = useState('Kuningan Cyber Tower Lt. 12, Jakarta Selatan');

  // Items
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', name: 'Jasa UI/UX Design Website & Design System', qty: 1, price: 3500000 },
    { id: '2', name: 'Frontend React & Tailwind Implementation', qty: 1, price: 4500000 },
    { id: '3', name: 'Maintenance & Cloud Optimization (1 Bulan)', qty: 1, price: 1000000 },
  ]);

  // Tax & Discount
  const [applyTax, setApplyTax] = useState(true);
  const [taxPercent, setTaxPercent] = useState(11);
  const [discountNominal, setDiscountNominal] = useState(0);

  // Bank Info
  const [bankName, setBankName] = useState('Bank Central Asia (BCA)');
  const [bankAccount, setBankAccount] = useState('123-456-7890');
  const [accountHolder, setAccountHolder] = useState('RAJIB ZAHIR');
  const [isPaidStamp, setIsPaidStamp] = useState(false);

  // Signature Pad State
  const sigCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hasSignature, setHasSignature] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  // Print ref
  const invoiceSheetRef = useRef<HTMLDivElement | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Add Item
  const addItem = () => {
    setItems([
      ...items,
      {
        id: String(Date.now()),
        name: 'Item Pekerjaan Baru',
        qty: 1,
        price: 500000,
      },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, val: any) => {
    setItems(
      items.map((it) => (it.id === id ? { ...it, [field]: val } : it))
    );
  };

  // Calculations
  const subtotal = items.reduce((acc, it) => acc + (it.qty || 0) * (it.price || 0), 0);
  const taxAmount = applyTax ? (subtotal * taxPercent) / 100 : 0;
  const grandTotal = Math.max(0, subtotal + taxAmount - discountNominal);

  // Format currency
  const formatMoney = (amount: number) => {
    if (currency === 'IDR') {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
      }).format(amount);
    }
    return `$${amount.toLocaleString()}`;
  };

  // Logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoSrc(URL.createObjectURL(file));
    }
  };

  // Signature pad methods
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // Export as PNG or Print
  const handleExportPng = async () => {
    if (!invoiceSheetRef.current) return;
    setIsExporting(true);

    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(invoiceSheetRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FFFFFF',
      });

      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoiceNumber}-${docType}.png`;
      a.click();

      addHistory({
        title: `${docType.toUpperCase()}: ${invoiceNumber}`,
        toolName: 'Digital Invoice Generator',
        category: 'docs',
        details: `${clientName} (${formatMoney(grandTotal)})`,
      });
    } catch (err) {
      console.error('Invoice PNG export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="card-brutal p-6 bg-surface print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center text-emerald-500">
              <Receipt className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-text">Invoice, Kwitansi & Nota Generator</h1>
                <span className="px-2 py-0.5 text-xs font-bold bg-emerald-500/20 text-emerald-600 rounded-full border border-emerald-500/30">
                  PDF & PNG
                </span>
              </div>
              <p className="text-sm text-text-muted mt-1">
                Buat invoice profesional, kwitansi lunas, atau nota digital dengan kalkulasi otomatis pajak dan tanda tangan digital.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl border-2 border-border bg-surface-elevated hover:bg-surface-hover text-xs font-bold text-text flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4 text-sky-500" />
              Cetak / Save PDF
            </button>
            <button
              onClick={handleExportPng}
              disabled={isExporting}
              className="btn-primary py-2 px-4 text-xs font-black flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 border-2 border-black"
            >
              <Download className="w-4 h-4" />
              Unduh Gambar PNG
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-5 space-y-5 print:hidden">
          {/* Doc Type Selector */}
          <div className="card-brutal p-5 bg-surface space-y-3">
            <label className="text-xs font-bold text-text uppercase tracking-wider block">Jenis Dokumen</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'invoice', label: 'Invoice Tagihan' },
                { id: 'kwitansi', label: 'Kwitansi Resmi' },
                { id: 'nota', label: 'Nota Pembelian' },
              ].map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDocType(d.id as any)}
                  className={`py-2 px-2 text-center rounded-xl border-2 text-xs font-black transition-all ${
                    docType === d.id
                      ? 'bg-emerald-500 text-white border-black'
                      : 'bg-surface-elevated border-border text-text'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sender & Receiver Info */}
          <div className="card-brutal p-5 bg-surface space-y-4">
            <label className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-500" />
              Data Pengirim (Bisnis Anda)
            </label>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Nama Toko / Nama Anda"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border-2 border-border bg-surface text-text text-xs font-bold"
              />
              <input
                type="text"
                placeholder="Kontak (Email / No HP)"
                value={senderContact}
                onChange={(e) => setSenderContact(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border-2 border-border bg-surface text-text text-xs font-bold"
              />
              <input
                type="text"
                placeholder="Alamat Pengirim"
                value={senderAddress}
                onChange={(e) => setSenderAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border-2 border-border bg-surface text-text text-xs font-bold"
              />
            </div>

            <label className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-2 pt-2 border-t border-border">
              <User className="w-4 h-4 text-emerald-500" />
              Data Penerima / Klien
            </label>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Nama Klien / Perusahaan"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border-2 border-border bg-surface text-text text-xs font-bold"
              />
              <input
                type="text"
                placeholder="Kontak Klien"
                value={clientContact}
                onChange={(e) => setClientContact(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border-2 border-border bg-surface text-text text-xs font-bold"
              />
            </div>
          </div>

          {/* Item Rows & Calculations */}
          <div className="card-brutal p-5 bg-surface space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-text uppercase tracking-wider">Daftar Item & Jasa</label>
              <button
                type="button"
                onClick={addItem}
                className="px-2.5 py-1 text-xs font-black bg-emerald-500 text-white rounded-lg flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah
              </button>
            </div>

            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {items.map((it, idx) => (
                <div key={it.id} className="p-3 rounded-xl border border-border bg-surface-elevated/40 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={it.name}
                      onChange={(e) => updateItem(it.id, 'name', e.target.value)}
                      placeholder="Nama Item / Jasa"
                      className="flex-1 px-2.5 py-1.5 rounded-lg border border-border bg-surface text-text text-xs font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(it.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-text-muted font-bold block">Qty</span>
                      <input
                        type="number"
                        min="1"
                        value={it.qty}
                        onChange={(e) => updateItem(it.id, 'qty', Number(e.target.value))}
                        className="w-full px-2 py-1 rounded-lg border border-border bg-surface text-text text-xs font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-text-muted font-bold block">Harga Satuan (Rp)</span>
                      <input
                        type="number"
                        step="1000"
                        value={it.price}
                        onChange={(e) => updateItem(it.id, 'price', Number(e.target.value))}
                        className="w-full px-2 py-1 rounded-lg border border-border bg-surface text-text text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tax & Discount settings */}
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-center justify-between text-xs font-bold">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={applyTax}
                    onChange={(e) => setApplyTax(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 border-border"
                  />
                  <span>PPN 11%</span>
                </label>
                {applyTax && <span>{formatMoney(taxAmount)}</span>}
              </div>

              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-text-muted">Diskon (Rp)</span>
                <input
                  type="number"
                  step="5000"
                  value={discountNominal}
                  onChange={(e) => setDiscountNominal(Number(e.target.value))}
                  className="w-28 px-2 py-1 text-right rounded-lg border border-border bg-surface text-text text-xs font-bold"
                />
              </div>
            </div>
          </div>

          {/* Signature & Payment info */}
          <div className="card-brutal p-5 bg-surface space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
                <PenTool className="w-4 h-4 text-emerald-500" />
                Tanda Tangan Digital
              </label>
              <button
                type="button"
                onClick={clearSignature}
                className="text-[11px] font-bold text-text-muted hover:text-rose-500 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Hapus
              </button>
            </div>

            <div className="border-2 border-dashed border-border rounded-xl bg-white overflow-hidden">
              <canvas
                ref={sigCanvasRef}
                width={380}
                height={120}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-[100px] cursor-crosshair touch-none"
              />
            </div>

            <label className="flex items-center gap-2 pt-1 text-xs font-bold text-text cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPaidStamp}
                onChange={(e) => setIsPaidStamp(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 border-border"
              />
              Bubuhi Stempel LUNAS / PAID Merah
            </label>
          </div>
        </div>

        {/* Right Column: Invoice Sheet Live Preview */}
        <div className="lg:col-span-7">
          <div className="sticky top-6">
            <div
              ref={invoiceSheetRef}
              className="bg-white text-stone-900 p-8 rounded-2xl shadow-xl border-2 border-black max-w-[650px] mx-auto min-h-[750px] relative font-sans"
            >
              {/* LUNAS Stamp Overlay */}
              {isPaidStamp && (
                <div className="absolute top-28 right-16 rotate-[-18deg] border-4 border-rose-600 px-6 py-2 rounded-lg text-rose-600 font-black text-2xl tracking-widest opacity-85 select-none pointer-events-none">
                  LUNAS / PAID
                </div>
              )}

              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-stone-200 pb-6 mb-6">
                <div>
                  <h2 className="text-3xl font-black uppercase tracking-tight text-stone-900">
                    {docType === 'invoice' ? 'INVOICE' : docType === 'kwitansi' ? 'KWITANSI' : 'NOTA PEMBELIAN'}
                  </h2>
                  <div className="text-xs font-mono font-bold text-stone-500 mt-1">No: {invoiceNumber}</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-base text-stone-900">{senderName}</div>
                  <div className="text-xs text-stone-600 mt-0.5">{senderContact}</div>
                  <div className="text-xs text-stone-500 mt-0.5 max-w-[200px]">{senderAddress}</div>
                </div>
              </div>

              {/* Meta & Client */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block mb-1">
                    Ditujukan Kepada:
                  </span>
                  <div className="font-bold text-sm text-stone-900">{clientName}</div>
                  <div className="text-xs text-stone-600">{clientContact}</div>
                  <div className="text-xs text-stone-500">{clientAddress}</div>
                </div>

                <div className="text-right space-y-1">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400">Tanggal Terbit:</span>
                    <div className="font-bold text-xs text-stone-800">{issueDate}</div>
                  </div>
                  {docType === 'invoice' && (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-stone-400">Jatuh Tempo:</span>
                      <div className="font-bold text-xs text-rose-600">{dueDate}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="border-t-2 border-stone-900 mb-6">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-300 font-black text-stone-700">
                      <th className="py-2.5">Deskripsi</th>
                      <th className="py-2.5 text-center w-12">Qty</th>
                      <th className="py-2.5 text-right w-28">Harga</th>
                      <th className="py-2.5 text-right w-28">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it) => (
                      <tr key={it.id} className="border-b border-stone-100">
                        <td className="py-2 font-bold text-stone-800">{it.name}</td>
                        <td className="py-2 text-center text-stone-600">{it.qty}</td>
                        <td className="py-2 text-right text-stone-600">{formatMoney(it.price)}</td>
                        <td className="py-2 text-right font-black text-stone-900">
                          {formatMoney(it.qty * it.price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total calculations block */}
              <div className="flex justify-end mb-8">
                <div className="w-56 space-y-1.5 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>Subtotal:</span>
                    <span className="font-bold">{formatMoney(subtotal)}</span>
                  </div>
                  {applyTax && (
                    <div className="flex justify-between text-stone-600">
                      <span>PPN ({taxPercent}%):</span>
                      <span>{formatMoney(taxAmount)}</span>
                    </div>
                  )}
                  {discountNominal > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Diskon:</span>
                      <span>-{formatMoney(discountNominal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black border-t-2 border-stone-900 pt-2 text-stone-900">
                    <span>Grand Total:</span>
                    <span className="text-base">{formatMoney(grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Footer: Bank info & Signature */}
              <div className="grid grid-cols-2 gap-6 items-end border-t border-stone-200 pt-6 mt-auto">
                <div className="text-xs text-stone-600">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block mb-1">
                    Informasi Pembayaran:
                  </span>
                  <div className="font-bold text-stone-800">{bankName}</div>
                  <div className="font-mono text-stone-700">{bankAccount}</div>
                  <div className="text-stone-500">a/n {accountHolder}</div>
                </div>

                <div className="text-center">
                  <div className="h-16 flex items-center justify-center">
                    {hasSignature && sigCanvasRef.current ? (
                      <img
                        src={sigCanvasRef.current.toDataURL()}
                        alt="Signature"
                        className="max-h-16 object-contain"
                      />
                    ) : (
                      <div className="text-xs text-stone-300 italic">(Tanda Tangan)</div>
                    )}
                  </div>
                  <div className="border-t border-stone-400 pt-1 text-xs font-bold text-stone-800">
                    {senderName}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
