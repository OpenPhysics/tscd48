/**
 * @fileoverview Data export utilities for CD48 measurements
 * @module export
 *
 * Provides export functionality for measurement data in various formats:
 * - JSON: Native JavaScript object format
 * - CSV: Comma-separated values for spreadsheets
 * - MAT: MATLAB-compatible format (simplified ASCII version)
 *
 * Note: Full HDF5 support would require an external library like h5wasm.
 * This module provides a basic structure that can be extended.
 */

import type {
  CountData,
  RateMeasurement,
  CoincidenceMeasurement,
} from './cd48.js';
import { JSON_INDENT_SPACES } from './constants.js';

/**
 * Supported export formats
 */
export type ExportFormat = 'json' | 'csv' | 'mat';

/**
 * Generic measurement data for export
 */
export interface ExportableMeasurement {
  timestamp: string;
  type: 'count' | 'rate' | 'coincidence';
  data: CountData | RateMeasurement | CoincidenceMeasurement;
}

/**
 * Export options
 */
export interface ExportOptions {
  /** Include headers in CSV output (default: true) */
  includeHeaders?: boolean;
  /** Field separator for CSV (default: ',') */
  separator?: string;
  /** Line ending for CSV (default: '\n') */
  lineEnding?: string;
  /** Decimal precision for numbers (default: 6) */
  precision?: number;
  /** Variable name for MAT format (default: 'cd48_data') */
  matVariableName?: string;
}

/**
 * Default export options
 */
const DEFAULT_OPTIONS: Required<ExportOptions> = {
  includeHeaders: true,
  separator: ',',
  lineEnding: '\n',
  precision: 6,
  matVariableName: 'cd48_data',
};

/**
 * Data export utilities for CD48 measurements
 */
export const DataExport = {
  /**
   * Export count data to JSON string
   * @param data - Array of count data
   * @returns JSON string
   */
  countsToJSON(data: CountData[]): string {
    return JSON.stringify(data, null, JSON_INDENT_SPACES);
  },

  /**
   * Export rate measurements to JSON string
   * @param data - Array of rate measurements
   * @returns JSON string
   */
  ratesToJSON(data: RateMeasurement[]): string {
    return JSON.stringify(data, null, JSON_INDENT_SPACES);
  },

  /**
   * Export coincidence measurements to JSON string
   * @param data - Array of coincidence measurements
   * @returns JSON string
   */
  coincidencesToJSON(data: CoincidenceMeasurement[]): string {
    return JSON.stringify(data, null, JSON_INDENT_SPACES);
  },

  /**
   * Export count data to CSV string
   * @param data - Array of count data
   * @param options - Export options
   * @returns CSV string
   */
  countsToCSV(data: CountData[], options: ExportOptions = {}): string {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const lines: string[] = [];

    if (opts.includeHeaders) {
      const headers = [
        'ch0',
        'ch1',
        'ch2',
        'ch3',
        'ch4',
        'ch5',
        'ch6',
        'ch7',
        'overflow',
      ];
      lines.push(headers.join(opts.separator));
    }

    for (const item of data) {
      const values = [...item.counts.map(String), String(item.overflow)];
      lines.push(values.join(opts.separator));
    }

    return lines.join(opts.lineEnding);
  },

  /**
   * Export rate measurements to CSV string
   * @param data - Array of rate measurements
   * @param options - Export options
   * @returns CSV string
   */
  ratesToCSV(data: RateMeasurement[], options: ExportOptions = {}): string {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const lines: string[] = [];

    if (opts.includeHeaders) {
      const headers = [
        'channel',
        'counts',
        'duration',
        'rate',
        'uncertainty_counts',
        'uncertainty_rate',
        'uncertainty_relative',
      ];
      lines.push(headers.join(opts.separator));
    }

    for (const item of data) {
      const values = [
        String(item.channel),
        String(item.counts),
        item.duration.toFixed(opts.precision),
        item.rate.toFixed(opts.precision),
        item.uncertainty.counts.toFixed(opts.precision),
        item.uncertainty.rate.toFixed(opts.precision),
        item.uncertainty.relative.toFixed(opts.precision),
      ];
      lines.push(values.join(opts.separator));
    }

    return lines.join(opts.lineEnding);
  },

  /**
   * Export coincidence measurements to CSV string
   * @param data - Array of coincidence measurements
   * @param options - Export options
   * @returns CSV string
   */
  coincidencesToCSV(
    data: CoincidenceMeasurement[],
    options: ExportOptions = {}
  ): string {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const lines: string[] = [];

    if (opts.includeHeaders) {
      const headers = [
        'singlesA',
        'singlesB',
        'coincidences',
        'duration',
        'rateA',
        'rateB',
        'coincidenceRate',
        'accidentalRate',
        'trueCoincidenceRate',
        'unc_singlesA',
        'unc_singlesB',
        'unc_coincidences',
        'unc_rateA',
        'unc_rateB',
        'unc_coincidenceRate',
        'unc_accidentalRate',
        'unc_trueCoincidenceRate',
      ];
      lines.push(headers.join(opts.separator));
    }

    for (const item of data) {
      const values = [
        String(item.singlesA),
        String(item.singlesB),
        String(item.coincidences),
        item.duration.toFixed(opts.precision),
        item.rateA.toFixed(opts.precision),
        item.rateB.toFixed(opts.precision),
        item.coincidenceRate.toFixed(opts.precision),
        item.accidentalRate.toFixed(opts.precision),
        item.trueCoincidenceRate.toFixed(opts.precision),
        item.uncertainty.singlesA.toFixed(opts.precision),
        item.uncertainty.singlesB.toFixed(opts.precision),
        item.uncertainty.coincidences.toFixed(opts.precision),
        item.uncertainty.rateA.toFixed(opts.precision),
        item.uncertainty.rateB.toFixed(opts.precision),
        item.uncertainty.coincidenceRate.toFixed(opts.precision),
        item.uncertainty.accidentalRate.toFixed(opts.precision),
        item.uncertainty.trueCoincidenceRate.toFixed(opts.precision),
      ];
      lines.push(values.join(opts.separator));
    }

    return lines.join(opts.lineEnding);
  },

  /**
   * Export count data to MATLAB-compatible ASCII format
   * This creates a simple ASCII file that can be loaded with MATLAB's load() function
   * @param data - Array of count data
   * @param options - Export options
   * @returns MAT-compatible string
   */
  countsToMAT(data: CountData[], options: ExportOptions = {}): string {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const lines: string[] = [];

    // MATLAB ASCII format: space-separated values, one row per line
    lines.push(`% ${opts.matVariableName} - CD48 count data`);
    lines.push('% Columns: ch0 ch1 ch2 ch3 ch4 ch5 ch6 ch7 overflow');
    lines.push(`% Generated: ${new Date().toISOString()}`);
    lines.push('');

    for (const item of data) {
      const values = [...item.counts, item.overflow];
      lines.push(values.join(' '));
    }

    return lines.join('\n');
  },

  /**
   * Export rate measurements to MATLAB-compatible ASCII format
   * @param data - Array of rate measurements
   * @param options - Export options
   * @returns MAT-compatible string
   */
  ratesToMAT(data: RateMeasurement[], options: ExportOptions = {}): string {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const lines: string[] = [];

    lines.push(`% ${opts.matVariableName} - CD48 rate measurements`);
    lines.push(
      '% Columns: channel counts duration rate unc_counts unc_rate unc_relative'
    );
    lines.push(`% Generated: ${new Date().toISOString()}`);
    lines.push('');

    for (const item of data) {
      const values = [
        item.channel,
        item.counts,
        item.duration,
        item.rate,
        item.uncertainty.counts,
        item.uncertainty.rate,
        item.uncertainty.relative,
      ];
      lines.push(values.join(' '));
    }

    return lines.join('\n');
  },

  /**
   * Export coincidence measurements to MATLAB-compatible ASCII format
   * @param data - Array of coincidence measurements
   * @param options - Export options
   * @returns MAT-compatible string
   */
  coincidencesToMAT(
    data: CoincidenceMeasurement[],
    options: ExportOptions = {}
  ): string {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const lines: string[] = [];

    lines.push(`% ${opts.matVariableName} - CD48 coincidence measurements`);
    lines.push(
      '% Columns: singlesA singlesB coincidences duration rateA rateB'
    );
    lines.push('%          coincidenceRate accidentalRate trueCoincidenceRate');
    lines.push('%          unc_singlesA unc_singlesB unc_coincidences');
    lines.push('%          unc_rateA unc_rateB unc_coincidenceRate');
    lines.push('%          unc_accidentalRate unc_trueCoincidenceRate');
    lines.push(`% Generated: ${new Date().toISOString()}`);
    lines.push('');

    for (const item of data) {
      const values = [
        item.singlesA,
        item.singlesB,
        item.coincidences,
        item.duration,
        item.rateA,
        item.rateB,
        item.coincidenceRate,
        item.accidentalRate,
        item.trueCoincidenceRate,
        item.uncertainty.singlesA,
        item.uncertainty.singlesB,
        item.uncertainty.coincidences,
        item.uncertainty.rateA,
        item.uncertainty.rateB,
        item.uncertainty.coincidenceRate,
        item.uncertainty.accidentalRate,
        item.uncertainty.trueCoincidenceRate,
      ];
      lines.push(values.join(' '));
    }

    return lines.join('\n');
  },

  /**
   * Export measurements to a Blob for download
   * @param content - String content to export
   * @param format - Export format
   * @returns Blob with appropriate MIME type
   */
  toBlob(content: string, format: ExportFormat): Blob {
    const mimeTypes: Record<ExportFormat, string> = {
      json: 'application/json',
      csv: 'text/csv',
      mat: 'text/plain',
    };
    return new Blob([content], { type: mimeTypes[format] });
  },

  /**
   * Create a download link for exported data
   * @param content - String content to export
   * @param filename - Desired filename
   * @param format - Export format
   * @returns Object URL that can be used for download
   */
  createDownloadUrl(content: string, format: ExportFormat): string {
    const blob = this.toBlob(content, format);
    return URL.createObjectURL(blob);
  },

  /**
   * Trigger a file download in the browser
   * @param content - String content to export
   * @param filename - Desired filename (should include extension)
   * @param format - Export format
   */
  download(content: string, filename: string, format: ExportFormat): void {
    const url = this.createDownloadUrl(content, format);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Get recommended file extension for a format
   * @param format - Export format
   * @returns File extension (including dot)
   */
  getFileExtension(format: ExportFormat): string {
    const extensions: Record<ExportFormat, string> = {
      json: '.json',
      csv: '.csv',
      mat: '.mat',
    };
    return extensions[format];
  },
};

export default DataExport;
