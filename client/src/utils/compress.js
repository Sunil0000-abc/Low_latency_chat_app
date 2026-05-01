import imageCompression from "browser-image-compression";

export const imageCompresser = async(file)=>{
    const options = {
        maxSizeMB: 0.5,           
        maxWidthOrHeight: 1024,   
        useWebWorker: true,
    }

    try {
        const compressedFile = await imageCompression(file,options);
        return compressedFile;
    } catch (error) {
        console.error("Compression error:", error);
        return file;    
    }
}