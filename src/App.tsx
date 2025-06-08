import '@aws-amplify/ui-react/styles.css';
import { CustomFileUploader } from "./components/FileUploader";
import outputs from "../amplify_outputs.json";
import { Amplify } from "aws-amplify";
import { fetchUserAttributes, UserAttributeKey, fetchAuthSession, AuthSession } from 'aws-amplify/auth';
import { useEffect, useState } from 'react';
import {
  createAmplifyAuthAdapter,
  createStorageBrowser
} from '@aws-amplify/ui-react-storage/browser';
import '@aws-amplify/ui-react-storage/styles.css';
import { useAuthenticator } from '@aws-amplify/ui-react';
 
Amplify.configure(outputs);
 
function App() {
  // Force remount of the entire app when this key changes
  const [currentUser, setCurrentUser] = useState<Partial<Record<UserAttributeKey, string>>>();
  const [session, setSession] = useState<AuthSession>();
  const [authUsername, setAuthUsername] = useState<string | undefined>();
  const { signOut, user } = useAuthenticator();
 
  // Fetch user data when auth username changes
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user.username) return;
      const userAttributes = await fetchUserAttributes();
      setCurrentUser(userAttributes);
      setAuthUsername(user.username);
      const session = await fetchAuthSession();
      setSession(session);
    }
    fetchUserData();
  }, [authUsername, user.username]);
 
  const { StorageBrowser } = createStorageBrowser({
    config: createAmplifyAuthAdapter()
  });
 
  return (
    <main className="p-4">
      <div className="space-y-8">
        <h1>{currentUser?.given_name} at {currentUser?.["custom:university"]}</h1>
        <p>Identity ID: {session?.identityId}</p>
        <div>
          <h2>Upload your data here</h2>
          <CustomFileUploader />
          <h2>See your data here</h2>
          <div>
            <StorageBrowser />
          </div>
        </div>
        <button onClick={() => {
          signOut();
          setAuthUsername(undefined);
        }}>Sign out</button>
      </div>
    </main>)
}
 
 
export default App;