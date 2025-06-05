import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";
import { Authenticator } from '@aws-amplify/ui-react';
 
Amplify.configure(outputs);
const formFields = {
  signUp: {
    "custom:university": {
      label: "University",
      placeholder: "Enter your University Name",
      required: true,
    },
  },
};
 
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Authenticator formFields={formFields}>
      <App />
    </Authenticator>
  </React.StrictMode>
);