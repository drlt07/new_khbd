import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Lớp trừu tượng lưu trữ tệp. Môi trường phát triển dùng ổ đĩa cục bộ;
 * môi trường triển khai thay bằng object storage (S3/R2/GCS) bằng cách cài đặt cùng interface.
 */
export interface StorageAdapter {
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
}

class LocalStorage implements StorageAdapter {
  constructor(private root: string) {}

  private resolve(key: string) {
    // Chống path traversal: key chỉ gồm ký tự an toàn và phải nằm trong thư mục gốc
    if (!/^[a-z0-9/_.-]+$/i.test(key) || key.includes("..")) throw new Error("Khóa lưu trữ không hợp lệ");
    const full = path.resolve(this.root, key);
    if (!full.startsWith(path.resolve(this.root) + path.sep)) throw new Error("Khóa lưu trữ không hợp lệ");
    return full;
  }
  async put(key: string, data: Buffer) {
    const full = this.resolve(key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, data, { mode: 0o600 });
  }
  async get(key: string) {
    return readFile(this.resolve(key));
  }
  async delete(key: string) {
    await rm(this.resolve(key), { force: true });
  }
}

let instance: StorageAdapter | null = null;
export function getStorage(): StorageAdapter {
  if (!instance) {
    const driver = process.env.STORAGE_DRIVER ?? "local";
    if (driver !== "local") throw new Error(`STORAGE_DRIVER "${driver}" chưa được cài đặt — hiện chỉ hỗ trợ "local"`);
    instance = new LocalStorage(path.resolve(process.env.UPLOAD_DIR ?? "./storage/uploads"));
  }
  return instance;
}

/** Tên lưu trữ ngẫu nhiên — không bao giờ dùng tên tệp người dùng gửi lên. */
export function newStorageKey(scope: string, ext: string) {
  const d = new Date();
  return `${scope}/${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${randomUUID()}.${ext}`;
}
