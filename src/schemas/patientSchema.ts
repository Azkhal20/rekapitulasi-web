import { z } from "zod";

// Schema for dropdown options explicitly (optional but good for strictness)
export const PoliTypeSchema = z.enum(["umum", "gigi"]);
export type PoliType = z.infer<typeof PoliTypeSchema>;

// Input Transformation Helper for "numeric" strings that might be empty
const numericString = z.string().transform((val) => val.trim()).optional();

// Main Patient Schema
// We make most fields optional or default to string because Google Sheets data is often unstructured strings.
// However, we enforce strictness where it matters.
export const PatientSchema = z.object({
  id: z.number().optional(), // ID might be missing before creation
  TANGGAL: z.string().min(1, "Tanggal wajib diisi"),
  TAHUN: numericString,
  BULAN: z.string().optional(),
  HARI: z.string().optional(),
  ENAM_BELAS_LIMA_BELAS: z.string().optional().or(z.null()), // 16-15
  L: numericString, // Usia L
  P: numericString, // Usia P
  BARU: numericString, // Pasien Baru
  LAMA: numericString, // Pasien Lama
  NAMA: z.string().min(1, "Nama pasien wajib diisi"),
  USIA: z.string().optional(), // Often calculated or just a string
  NIP: z.string().optional(),
  OBS_TTV: z.string().optional(),
  KELUHAN: z.string().optional(),
  DIAGNOSIS: z.string().optional(),
  ICD10: z.string().optional(),
  TINDAKAN: z.string().optional(), // Bisa jadi TINDAKAN atau TINDAKAN (spasi)
  OBAT: z.string().optional(),
  // Kolom Rujukan (Q-Z)
  RUJUK_FASKES_PERTAMA_PB: numericString,
  RUJUK_FASKES_PERTAMA_PL: numericString,
  RUJUK_FKRTL_PB: numericString,
  RUJUK_FKRTL_PL: numericString,
  PTM_RUJUK_FKRTL_PB: numericString,
  PTM_RUJUK_FKRTL_PL: numericString,
  DIRUJUK_BALIK_PUSKESMAS_PB: numericString,
  DIRUJUK_BALIK_PUSKESMAS_PL: numericString,
  DIRUJUK_BALIK_FKRTL_PB: numericString,
  DIRUJUK_BALIK_FKRTL_PL: numericString,
});

export type Patient = z.infer<typeof PatientSchema>;

// Schema specifically for the Form (might slightly differ if we want better validation messages)
export const PatientFormSchema = PatientSchema.extend({
  // Add specific validations if needed, e.g. NIP format
});
