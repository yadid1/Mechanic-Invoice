"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface ScannedData {
  customerName: string;
  customerPhone: string;
  carModel: string;
  date: string;
  lineItems: { description: string; price: number }[];
  warranty: string | null;
  notes: string | null;
}

export default function ScanInvoicePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannedData, setScannedData] = useState<ScannedData | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setScannedData(null);

    // Show preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleScan = async () => {
    if (!preview) return;

    setScanning(true);
    setError(null);

    try {
      // Extract base64 data and mime type from the data URL
      const [header, base64Data] = preview.split(",");
      const mimeMatch = header.match(/data:(.*?);/);
      const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

      const response = await fetch("/api/scan-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Data, mimeType }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to scan invoice");
      }

      const data: ScannedData = await response.json();
      setScannedData(data);
    } catch (err) {
      console.error("Scan error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to scan invoice"
      );
    } finally {
      setScanning(false);
    }
  };

  const handleUseData = () => {
    if (!scannedData) return;
    // Store scanned data in sessionStorage and redirect to form
    sessionStorage.setItem("scannedInvoice", JSON.stringify(scannedData));
    router.push("/?from=scan");
  };

  const handleRetry = () => {
    setPreview(null);
    setScannedData(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Scan Invoice</h2>
        <p className="text-gray-500 mt-1">
          Take a photo or upload an image of a handwritten invoice to
          auto-fill the form.
        </p>
      </div>

      {/* Step 1: Upload / Take Photo */}
      {!preview && (
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Upload Invoice Photo
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Take a photo with your phone camera or upload an existing image
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
              id="invoice-photo"
            />

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <label
                htmlFor="invoice-photo"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-light transition shadow-sm cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" />
                </svg>
                Take Photo / Upload
              </label>
            </div>

            <p className="text-xs text-gray-400 mt-4">
              Supported formats: JPG, PNG, HEIC. Best results with a clear,
              well-lit photo.
            </p>
          </div>
        </section>
      )}

      {/* Step 2: Preview & Scan */}
      {preview && !scannedData && (
        <div className="space-y-6">
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-500 uppercase">
                Photo Preview
              </h3>
              <button
                onClick={handleRetry}
                className="text-sm text-gray-500 hover:text-gray-700 transition"
              >
                Choose different photo
              </button>
            </div>
            <div className="p-4 flex justify-center bg-gray-50">
              <img
                src={preview}
                alt="Invoice photo"
                className="max-h-96 rounded-lg shadow-sm"
              />
            </div>
          </section>

          {error && (
            <div className="p-4 rounded-lg text-sm font-medium bg-red-50 text-red-800 border border-red-200">
              {error}
            </div>
          )}

          <div className="flex justify-center gap-4">
            <button
              onClick={handleRetry}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Retake
            </button>
            <button
              onClick={handleScan}
              disabled={scanning}
              className="px-8 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-light transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {scanning ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Reading invoice...
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                  </svg>
                  Scan with AI
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review Scanned Data */}
      {scannedData && (
        <div className="space-y-6">
          <div className="p-4 rounded-lg bg-green-50 text-green-800 border border-green-200 text-sm font-medium">
            Invoice scanned successfully! Review the extracted data below.
          </div>

          {/* Preview the scanned data */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">
              Extracted Data
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400">Customer Name</p>
                <p className="text-base font-medium text-gray-900">
                  {scannedData.customerName || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Phone</p>
                <p className="text-base font-medium text-gray-900">
                  {scannedData.customerPhone || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Vehicle</p>
                <p className="text-base font-medium text-gray-900">
                  {scannedData.carModel || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Date</p>
                <p className="text-base font-medium text-gray-900">
                  {scannedData.date || "—"}
                </p>
              </div>
            </div>
          </section>

          {scannedData.lineItems && scannedData.lineItems.length > 0 && (
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-500 uppercase">
                  Work Items Found
                </h3>
              </div>
              <table className="w-full">
                <tbody className="divide-y divide-gray-100">
                  {scannedData.lineItems.map((item, i) => (
                    <tr key={i}>
                      <td className="px-6 py-3 text-sm text-gray-900">
                        {item.description}
                      </td>
                      <td className="px-6 py-3 text-sm font-semibold text-gray-900 text-right">
                        ${Number(item.price).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 border-t border-gray-200">
                    <td className="px-6 py-3 text-sm font-bold text-gray-900">
                      Total
                    </td>
                    <td className="px-6 py-3 text-lg font-bold text-gray-900 text-right">
                      $
                      {scannedData.lineItems
                        .reduce((sum, item) => sum + Number(item.price), 0)
                        .toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </section>
          )}

          {(scannedData.warranty || scannedData.notes) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {scannedData.warranty && (
                <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <p className="text-xs text-gray-400">Warranty</p>
                  <p className="text-base text-gray-900">
                    {scannedData.warranty}
                  </p>
                </section>
              )}
              {scannedData.notes && (
                <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <p className="text-xs text-gray-400">Notes</p>
                  <p className="text-base text-gray-900">
                    {scannedData.notes}
                  </p>
                </section>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={handleRetry}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Scan a Different Photo
            </button>
            <button
              onClick={handleUseData}
              className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition shadow-sm"
            >
              Use This Data — Go to Invoice Form
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
