import { FileUploader } from '@aws-amplify/ui-react-storage';
import '@aws-amplify/ui-react/styles.css';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { processFile, ProcessFileInput } from '../utils/ProcessFile';
 
export const CustomFileUploader = () => {
    const { user } = useAuthenticator();
 
    const processFileWithUser = ({ file, key }: Omit<ProcessFileInput, 'userId'>) => {
        return processFile({
            file,
            key,
            userId: user?.username
        });
    };
 
    return (
        <FileUploader
            acceptedFileTypes={['image/*']}
            path={({ identityId }) => `media/${identityId}/`}
            maxFileCount={10}
            isResumable={true}
            showThumbnails={true}
            processFile={processFileWithUser}
            onUploadSuccess={(event) => {
                console.log('Upload success:', event);
            }}
            onUploadError={(error) => {
                console.error('Upload error:', error);
            }}
        />
    );
};