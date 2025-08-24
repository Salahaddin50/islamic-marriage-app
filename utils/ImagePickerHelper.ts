import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export interface MediaPickerResult {
    uri: string;
    mimeType?: string;
    fileName?: string;
}

export const launchImagePicker = async (): Promise<string | undefined> => {
    await checkMediaPermissions();

    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
    });

    if (!result.canceled) {
        return result.assets[0].uri;
    }
};

export const launchMediaPicker = async (mediaType: 'photo' | 'video' = 'photo'): Promise<MediaPickerResult | undefined> => {
    await checkMediaPermissions();

    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: mediaType === 'video' ? ["videos"] : ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
    });

    if (!result.canceled) {
        const asset = result.assets[0];
        
        // Determine MIME type from file extension or asset info
        let mimeType = asset.mimeType;
        if (!mimeType && asset.uri) {
            const extension = asset.uri.split('.').pop()?.toLowerCase();
            if (mediaType === 'photo') {
                mimeType = extension === 'png' ? 'image/png' : 
                          extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' :
                          extension === 'webp' ? 'image/webp' : 'image/jpeg';
            } else {
                mimeType = extension === 'mp4' ? 'video/mp4' :
                          extension === 'mov' ? 'video/quicktime' :
                          extension === 'webm' ? 'video/webm' : 'video/mp4';
            }
        }
        
        return {
            uri: asset.uri,
            mimeType: mimeType || (mediaType === 'photo' ? 'image/jpeg' : 'video/mp4'),
            fileName: asset.fileName
        };
    }
};

const checkMediaPermissions = async (): Promise<void> => {
    if (Platform.OS !== 'web') {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            return Promise.reject('We need permission to access your photos');
        }
    }

    return Promise.resolve();
};
