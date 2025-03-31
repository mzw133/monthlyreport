import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineUpload, HiOutlineDocumentText } from 'react-icons/hi';
import * as XLSX from 'xlsx';

export default function LandingPage({ onFileProcessed, onError }) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = (file) => {
    if (!file) {
      setError('Keine Datei ausgewählt');
      return;
    }

    if (!file.name.match(/\.(xlsx|xls)$/)) {
      setError('Bitte lade dne KURABU Monatsbericht hoch (.xlsx oder .xls)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (!data || data.length < 2) {
          setError('Die Excel-Datei enthält keine gültigen Daten');
          return;
        }

        onFileProcessed(data);
      } catch (err) {
        setError('Fehler beim Verarbeiten der Datei: ' + err.message);
      }
    };

    reader.onerror = () => {
      setError('Fehler beim Lesen der Datei');
    };

    reader.readAsBinaryString(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    setError('');
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  const handleFileSelect = (e) => {
    setError('');
    const file = e.target.files[0];
    processFile(file);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Mitglieder Metriken Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Laden Sie Ihre Excel-Datei hoch, um die Mitgliederstatistiken zu analysieren
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`border-2 border-dashed rounded-lg p-12 text-center ${
            isDragging
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-primary-500'
          } transition-colors`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center">
            <HiOutlineDocumentText className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-lg text-gray-600 mb-4">
              Ziehen Sie Ihre Excel-Datei hierher oder
            </p>
            <label className="relative">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center px-6 py-3 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                onClick={() => document.getElementById('file-upload').click()}
                type="button"
              >
                <HiOutlineUpload className="w-5 h-5 mr-2" />
                Datei auswählen
              </motion.button>
              <input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <p className="text-red-600">{error}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
} 