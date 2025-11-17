import fs from "fs/promises";
import path from "path";
import { createReadStream } from "fs";

// Railway volume mount path - this will be configured in railway.json
const STORAGE_BASE_PATH = process.env.STORAGE_PATH || "/app/storage";
const UPLOADS_FOLDER = path.join(STORAGE_BASE_PATH, "uploads");

/**
 * Initialize storage directories
 * Creates the necessary directories if they don't exist
 */
export async function initializeStorage(): Promise<void> {
  try {
    await fs.mkdir(UPLOADS_FOLDER, { recursive: true });
    console.log("✅ Storage directories initialized:", UPLOADS_FOLDER);
  } catch (error) {
    console.error("❌ Error initializing storage directories:", error);
    throw new Error("Storage initialization failed");
  }
}

/**
 * Upload a file to local storage
 * @param buffer - File buffer to save
 * @param fileName - Original file name
 * @returns File path (relative to storage base)
 */
export async function uploadFile(buffer: Buffer, fileName: string): Promise<string> {
  try {
    // Ensure storage is initialized
    await initializeStorage();
    
    // Create unique filename with timestamp
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueFileName = `${timestamp}-${sanitizedFileName}`;
    
    // Full file path
    const filePath = path.join(UPLOADS_FOLDER, uniqueFileName);
    
    // Write file to disk
    await fs.writeFile(filePath, buffer);
    
    // Return relative path (what we'll store in database)
    const relativePath = `uploads/${uniqueFileName}`;
    console.log("✅ File uploaded:", relativePath);
    
    return relativePath;
  } catch (error) {
    console.error("❌ Error uploading file:", error);
    throw new Error("File upload failed");
  }
}

/**
 * Get the full file path for a stored file
 * @param relativePath - Relative path stored in database
 * @returns Full file path
 */
export async function getFilePath(relativePath: string): Promise<string> {
  try {
    const fullPath = path.join(STORAGE_BASE_PATH, relativePath);
    
    // Check if file exists
    await fs.access(fullPath);
    
    return fullPath;
  } catch (error) {
    console.error("❌ Error accessing file:", error);
    throw new Error("File not found");
  }
}

/**
 * Read file contents
 * @param relativePath - Relative path stored in database
 * @returns File buffer
 */
export async function readFile(relativePath: string): Promise<Buffer> {
  try {
    const fullPath = await getFilePath(relativePath);
    const buffer = await fs.readFile(fullPath);
    console.log("✅ File read:", relativePath);
    return buffer;
  } catch (error) {
    console.error("❌ Error reading file:", error);
    throw new Error("File read failed");
  }
}

/**
 * Delete a file from storage
 * @param relativePath - Relative path stored in database
 */
export async function deleteFile(relativePath: string): Promise<void> {
  try {
    const fullPath = path.join(STORAGE_BASE_PATH, relativePath);
    await fs.unlink(fullPath);
    console.log("✅ File deleted:", relativePath);
  } catch (error) {
    console.error("❌ Error deleting file:", error);
    // Don't throw - file might already be deleted
    console.warn("File deletion failed, but continuing...");
  }
}

/**
 * Rename a file in storage
 * @param oldPath - Old relative path
 * @param newFileName - New file name (not full path)
 * @returns New relative path
 */
export async function renameFile(oldPath: string, newFileName: string): Promise<string> {
  try {
    const oldFullPath = path.join(STORAGE_BASE_PATH, oldPath);
    
    // Create new filename with timestamp
    const timestamp = Date.now();
    const sanitizedFileName = newFileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueFileName = `${timestamp}-${sanitizedFileName}`;
    
    const newRelativePath = `uploads/${uniqueFileName}`;
    const newFullPath = path.join(STORAGE_BASE_PATH, newRelativePath);
    
    // Rename the file
    await fs.rename(oldFullPath, newFullPath);
    
    console.log("✅ File renamed:", oldPath, "→", newRelativePath);
    return newRelativePath;
  } catch (error) {
    console.error("❌ Error renaming file:", error);
    throw new Error("File rename failed");
  }
}

/**
 * Get content type based on file extension
 * @param fileName - File name
 * @returns MIME type
 */
export function getContentType(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop();
  switch (ext) {
    case 'pdf':
      return 'application/pdf';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'tiff':
    case 'tif':
      return 'image/tiff';
    default:
      return 'application/octet-stream';
  }
}

/**
 * Check if storage is properly configured
 */
export async function checkStorage(): Promise<boolean> {
  try {
    await fs.access(STORAGE_BASE_PATH);
    console.log("✅ Storage accessible at:", STORAGE_BASE_PATH);
    return true;
  } catch {
    console.warn("⚠️  Storage not yet accessible at:", STORAGE_BASE_PATH);
    console.log("Creating storage directory...");
    try {
      await initializeStorage();
      return true;
    } catch (error) {
      console.error("❌ Failed to initialize storage:", error);
      return false;
    }
  }
}
