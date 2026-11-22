'use strict';
const { z } = require('zod');

const id = z.coerce.number().int().positive();
const idParam = z.object({ id });

/** Hanya tautan YouTube yang diterima (tidak ada upload file video). */
const youtubeUrl = z
  .string()
  .trim()
  .max(300)
  .regex(
    /^https:\/\/(www\.|m\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]+/,
    'Harus berupa tautan YouTube (https://www.youtube.com/watch?v=... atau https://youtu.be/...)'
  );

const slug = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Slug hanya huruf kecil, angka, dan tanda hubung');

const nonEmpty = (schema) =>
  schema.refine((obj) => Object.keys(obj).length > 0, { message: 'Minimal satu field harus diisi' });

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

module.exports = { z, id, idParam, youtubeUrl, slug, nonEmpty, slugify };
