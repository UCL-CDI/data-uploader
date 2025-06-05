export interface ProcessFileInput {
    file: File;
    key: string;
    userId?: string;
}
 
export interface ProcessFileOutput {
    file: File;
    key: string;
    metadata?: Record<string, string>;
}
 
const generateHashKey = async (fileName: string): Promise<string> => {
    const timestamp = new Date().getTime();
    const randomString = Math.random().toString(36).substring(7);
    const hashInput = `${fileName}-${timestamp}-${randomString}`;
 
    const encoder = new TextEncoder();
    const data = encoder.encode(hashInput);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
 
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
        .substring(0, 16);
 
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
    const timePrefix = Date.now().toString(36);
 
    return `${timePrefix}-${hashHex}.${fileExtension}`;
};
 
const removeExifData = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
 
        reader.onload = async () => {
            try {
                const arrayBuffer = reader.result as ArrayBuffer;
                const view = new DataView(arrayBuffer);
 
                // Check for JPEG SOI marker
                if (view.getUint16(0) === 0xFFD8) {
                    // Process JPEG file
                    let offset = 2;
                    let markerLength;
                    const newArray: number[] = [];
 
                    // Copy SOI marker
                    newArray.push(0xFF, 0xD8);
 
                    // Scan through JPEG segments
                    while (offset < view.byteLength) {
                        const marker = view.getUint16(offset);
 
                        // Check for APP1 marker (where EXIF data lives)
                        if (marker === 0xFFE1) {
                            markerLength = view.getUint16(offset + 2) + 2;
                            offset += markerLength;
                            continue;
                        }
 
                        // Copy other markers
                        if ((marker & 0xFF00) !== 0xFF00) {
                            break;
                        }
 
                        markerLength = view.getUint16(offset + 2) + 2;
 
                        // Copy segment
                        for (let i = 0; i < markerLength; i++) {
                            newArray.push(view.getUint8(offset + i));
                        }
 
                        offset += markerLength;
                    }
 
                    // Copy remaining data
                    while (offset < view.byteLength) {
                        newArray.push(view.getUint8(offset));
                        offset += 1;
                    }
 
                    // Create new file without EXIF
                    const newFile = new File([new Uint8Array(newArray)], file.name, {
                        type: file.type,
                        lastModified: file.lastModified
                    });
 
                    resolve(newFile);
                    return;
                }
 
                // Check for PNG signature
                if (view.getUint32(0) === 0x89504E47 && view.getUint32(4) === 0x0D0A1A0A) {
                    // Create a clean PNG with only essential chunks
                    const pngSignature = new Uint8Array(arrayBuffer.slice(0, 8));
                    let offset = 8; // Start after signature
                    
                    // We'll keep only these critical chunks
                    const essentialChunks = ['IHDR', 'IDAT', 'PLTE', 'IEND'];
                    const newPNG = [pngSignature];
                    
                    // First pass: find and keep only essential chunks
                    while (offset < view.byteLength) {
                        const chunkLength = view.getUint32(offset);
                        const chunkType = new Uint8Array(arrayBuffer.slice(offset + 4, offset + 8));
                        const chunkTypeStr = String.fromCharCode(...chunkType);
                        
                        // Calculate chunk size including length, type, data and CRC
                        const fullChunkSize = 12 + chunkLength; // 4 (length) + 4 (type) + chunkLength + 4 (CRC)
                        
                        // Keep only essential chunks
                        if (essentialChunks.includes(chunkTypeStr)) {
                            const chunk = new Uint8Array(arrayBuffer.slice(offset, offset + fullChunkSize));
                            newPNG.push(chunk);
                        }
                        
                        offset += fullChunkSize;
                    }
                    
                    // Create new file with only essential chunks
                    const newFile = new File([...newPNG], file.name, {
                        type: file.type,
                        lastModified: file.lastModified
                    });
                    
                    resolve(newFile);
                    return;
                }
 
                // Not a JPEG or PNG, or format we don't handle
                resolve(file);
            } catch (error) {
                console.error('Error processing image metadata:', error);
                resolve(file); // Return original file on error
            }
        };
 
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(file);
    });
};
 
export const processFile = async (params: ProcessFileInput): Promise<ProcessFileOutput> => {
    const { file, key, userId } = params;
 
    try {
        let processedFile = file;
 
        // Process JPEG files
        if (file.type === 'image/jpeg' || file.type === 'image/png') {
            try {
                processedFile = await removeExifData(file);
            } catch (error) {
                console.error('Error removing EXIF:', error);
                processedFile = file;
            }
        }
 
        // Generate hashed key while maintaining the path structure
        const pathParts = key.split('/');
        const fileName = pathParts.pop() || '';
        const hashedFileName = await generateHashKey(fileName);
        const newKey = [...pathParts, hashedFileName].join('/');
 
        return {
            file: processedFile,
            key: newKey,
            metadata: {
                userId: userId || ''
            }
        };
    } catch (error) {
        console.error('Error processing file:', error);
        throw error;
    }
};