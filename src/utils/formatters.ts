export function formatNaira(amount: number): string {
  if (!Number.isFinite(amount)) return '₦0';
  return `₦${Math.round(amount).toLocaleString('en-NG')}`;
}

export function calculateDiscountPercent(originalPrice: number, ongoingPrice: number): number {
  if (!originalPrice || originalPrice <= ongoingPrice || ongoingPrice < 0) return 0;
  return Math.round(((originalPrice - ongoingPrice) / originalPrice) * 100);
}

export function normalizeNigerianWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '2348168779732';
  if (digits.startsWith('234')) return digits;
  if (digits.startsWith('0') && digits.length >= 10) {
    return `234${digits.slice(1)}`;
  }
  return digits;
}

export function buildWhatsAppLink(whatsappNumber: string, message: string): string {
  const cleanNumber = normalizeNigerianWhatsApp(whatsappNumber);
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function formatShortDate(isoString: string): string {
  try {
    return new Date(isoString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return isoString;
  }
}

export function formatTime12h(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return hhmm;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

export function formatBusinessScheduleLines(
  schedule: Array<{ day: string; is_off: boolean; open_time: string; close_time: string }>
): string[] {
  if (!schedule?.length) return [];

  const shortDay = (day: string) => day.slice(0, 3);
  const keyOf = (item: { is_off: boolean; open_time: string; close_time: string }) =>
    item.is_off ? 'OFF' : `${item.open_time}-${item.close_time}`;

  const groups: Array<{
    startDay: string;
    endDay: string;
    is_off: boolean;
    open_time: string;
    close_time: string;
  }> = [];

  for (const item of schedule) {
    const prev = groups[groups.length - 1];
    if (prev && keyOf(prev) === keyOf(item)) {
      prev.endDay = item.day;
    } else {
      groups.push({
        startDay: item.day,
        endDay: item.day,
        is_off: item.is_off,
        open_time: item.open_time,
        close_time: item.close_time,
      });
    }
  }

  return groups.map((g) => {
    const dayRange =
      g.startDay === g.endDay ? shortDay(g.startDay) : `${shortDay(g.startDay)} – ${shortDay(g.endDay)}`;
    if (g.is_off) {
      return `${dayRange}: Off Day (Closed)`;
    }
    return `${dayRange}: ${formatTime12h(g.open_time)} – ${formatTime12h(g.close_time)}`;
  });
}

export async function compressImageFile(file: File, maxWidth = 1200, quality = 0.84): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read selected file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file.'));
      img.onload = () => {
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const targetWidth = Math.round(img.width * scale);
        const targetHeight = Math.round(img.height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        const outputMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const output =
          outputMime === 'image/png'
            ? canvas.toDataURL('image/png')
            : canvas.toDataURL('image/jpeg', quality);
        resolve(output);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

export function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

