import * as pinyinLib from "pinyin";
import path from "path";

const pinyinInstance = new pinyinLib.Pinyin();

function getWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getWeekRange(date: Date): {
  week: number;
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
} {
  const week = getWeekNumber(date);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const startDate = new Date(date);
  startDate.setDate(diff);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  return {
    week,
    startMonth: startDate.getMonth() + 1,
    startDay: startDate.getDate(),
    endMonth: endDate.getMonth() + 1,
    endDay: endDate.getDate(),
  };
}

export async function slugify(text: string): Promise<string> {
  const py = pinyinInstance.pinyin(text, { style: 0 });
  const words = py.map((p: string[]) => p.join("")).join(" ");
  return words
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/\.{2,}/g, "-") // Prevent path traversal
    .replace(/^-|-$/g, "");
}

export async function generateOutputDirectory(
  basePath: string,
  title: string,
  date?: Date,
): Promise<string> {
  const d = date || new Date();
  const year = d.getFullYear();
  const range = getWeekRange(d);
  const weekDir = `${range.week}-${range.startMonth}_${range.startDay}-${range.endMonth}_${range.endDay}`;
  const slug = await slugify(title);
  return path.join(basePath, String(year), weekDir, slug);
}
