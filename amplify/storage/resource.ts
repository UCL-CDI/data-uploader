import { defineStorage } from '@aws-amplify/backend';
 
export const storage = defineStorage({
    name: 'userUploads',
    access: (allow) => ({
        'media/{entity_id}/*': [
            allow.entity('identity').to(['read', 'write', 'delete'])
        ],
        //'picture-submissions/*': [
        //    allow.authenticated.to(['read','write'])]
    })
});