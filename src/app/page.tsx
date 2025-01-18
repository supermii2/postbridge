// "use client";

// import React, { useState } from "react";
// import { parsePostTXT } from "./parser";
// import { parse } from "path";

// export default function HomePage() {
//   const [selectedFile, setSelectedFile] = useState<File | null>(null);
//   const [error, setError] = useState<string>("");
//   const [postContent, setPostContent] = useState<string>("");

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files.length > 0) {
//       setSelectedFile(e.target.files[0]);
//       setError("");
//       setPostContent("");
//     }
//   };

//   const handleUpload = async () => {
//     if (!selectedFile) {
//       setError("Please select a .zip file before uploading.");
//       return;
//     }

//     if (!selectedFile.name.toLowerCase().endsWith(".zip")) {
//       setError("Only .zip files are allowed.");
//       return;
//     }

//     try {
//       const formData = new FormData();
//       formData.append("file", selectedFile);

//       const response = await fetch("/api/upload", {
//         method: "POST",
//         body: formData,
//       });

//       if (!response.ok) {
//         const { error } = await response.json();
//         setError(error || "Upload failed.");
//         return;
//       }

//       const data = await response.json();
//       if (data.postContent) {
//         const content = parsePostTXT(data.postContent);
//         setPostContent(content[0]['url']); // TODO: Temporarily displays the first url. It should call the upload API in the final version.
//       }
//     } catch (err: any) {
//       setError(err.message || "An error occurred during upload.");
//     }
//   };

//   return (
//     <main className="w-full min-h-screen flex flex-col items-center justify-center p-4">
//       <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-lg p-8 w-full max-w-md flex flex-col items-center">
//         <h1 className="text-3xl font-bold text-white mb-4">
//           Upload Your .zip File
//         </h1>
//         <p className="text-white text-sm mb-6 text-center">
//           This page extracts <code>Posts/Post.txt</code> from the ZIP
//         </p>

//         <div className="flex flex-col items-center w-full mb-4">
//           <label className="w-full cursor-pointer flex flex-col items-center justify-center p-4 bg-white/20 rounded-md border-2 border-dashed border-white text-white hover:bg-white/30 transition">
//             <strong>Click or Drag &amp; Drop a .zip file here</strong>
//             <input
//               type="file"
//               accept=".zip"
//               className="hidden"
//               onChange={handleFileChange}
//             />
//           </label>
//         </div>

//         {selectedFile && (
//           <div className="text-white text-sm mb-4">
//             Selected file: <strong>{selectedFile.name}</strong>
//           </div>
//         )}

//         {error && <div className="text-red-300 text-sm mb-4">{error}</div>}

//         <button
//           onClick={handleUpload}
//           className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-full transition duration-300 ease-in-out"
//         >
//           Upload & Extract
//         </button>

//         {postContent && (
//           <div className="mt-6 w-full bg-white/20 rounded-md p-4">
//             <h2 className="text-white text-lg font-bold mb-2">
//               Contents of Posts/Post.txt:
//             </h2>
//             <div className="text-white whitespace-pre-wrap">{postContent}</div>
//           </div>
//         )}
//       </div>
//     </main>
//   );
// }
"use client";

import React, { useState } from "react";
import { parsePostTXT } from "./parser";
import { parse } from "path";

/* 
   Install the Firebase SDK:
   yarn add firebase
   or
   npm install firebase
*/
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Replace with your real Firebase config values:
const firebaseConfig = {
  apiKey: "AIzaSyA4fhBkZPwoq3JkLJ0O9CqWpfZMd3vpeYM",
  authDomain: "postbridge-99d4c.firebaseapp.com",
  projectId: "postbridge-99d4c",
  storageBucket: "postbridge-99d4c.firebasestorage.app",
  messagingSenderId: "771536906960",
  appId: "1:771536906960:web:569f5c935086358b83ccd5",
};

// Initialize Firebase app and storage:
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export default function HomePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const [postContent, setPostContent] = useState<string>("");
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setError("");
      setPostContent("");
      setUploadedVideoUrl("");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a .zip file before uploading.");
      return;
    }

    if (!selectedFile.name.toLowerCase().endsWith(".zip")) {
      setError("Only .zip files are allowed.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const { error } = await response.json();
        setError(error || "Upload failed.");
        return;
      }

      // data.postContent is assumed to be the raw content of Posts/Post.txt
      const data = await response.json();
      if (!data.postContent) {
        setError("No postContent found in the ZIP.");
        return;
      }

      // Parse the postContent to extract URLs (here, parsePostTXT is your custom parser)
      const parsedResults = parsePostTXT(data.postContent);
      if (!parsedResults.length || !parsedResults[0].url) {
        setError("No valid video URL found in Posts/Post.txt.");
        return;
      }

      const videoUrl = parsedResults[0].url;
      setPostContent(videoUrl);

      // Fetch the video from the extracted URL
      const videoResponse = await fetch(videoUrl);
      if (!videoResponse.ok) {
        setError("Unable to fetch video from the provided URL.");
        return;
      }

      // Get the video as a Blob
      const videoBlob = await videoResponse.blob();

      // Convert Blob to File for Firebase upload
      // (You can change 'uploadedVideo.mp4' to any desired filename.)
      const fileForUpload = new File([videoBlob], "uploadedVideo.mp4", {
        type: videoBlob.type,
      });

      // Create a reference to your desired location in Firebase Storage
      const storageRef = ref(storage, `videos/${fileForUpload.name}`);

      // Upload the file to Firebase
      await uploadBytes(storageRef, fileForUpload);

      // Get the download URL of the uploaded video
      const firebaseUrl = await getDownloadURL(storageRef);
      setUploadedVideoUrl(firebaseUrl);
    } catch (err: any) {
      setError(err.message || "An error occurred during upload.");
    }
  };

  return (
    <main className="w-full min-h-screen flex flex-col items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-lg p-8 w-full max-w-md flex flex-col items-center">
        <h1 className="text-3xl font-bold text-white mb-4">
          Upload Your .zip File
        </h1>
        <p className="text-white text-sm mb-6 text-center">
          This page extracts <code>Posts/Post.txt</code> from the ZIP and
          uploads the referenced video to Firebase.
        </p>

        <div className="flex flex-col items-center w-full mb-4">
          <label className="w-full cursor-pointer flex flex-col items-center justify-center p-4 bg-white/20 rounded-md border-2 border-dashed border-white text-white hover:bg-white/30 transition">
            <strong>Click or Drag &amp; Drop a .zip file here</strong>
            <input
              type="file"
              accept=".zip"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>

        {selectedFile && (
          <div className="text-white text-sm mb-4">
            Selected file: <strong>{selectedFile.name}</strong>
          </div>
        )}

        {error && <div className="text-red-300 text-sm mb-4">{error}</div>}

        <button
          onClick={handleUpload}
          className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-full transition duration-300 ease-in-out"
        >
          Upload & Extract
        </button>

        {postContent && (
          <div className="mt-6 w-full bg-white/20 rounded-md p-4">
            <h2 className="text-white text-lg font-bold mb-2">
              Video URL from Posts/Post.txt:
            </h2>
            <div className="text-white break-words">{postContent}</div>
          </div>
        )}

        {uploadedVideoUrl && (
          <div className="mt-6 w-full bg-white/20 rounded-md p-4">
            <h2 className="text-white text-lg font-bold mb-2">
              Firebase Download Link:
            </h2>
            <div className="text-white break-words">{uploadedVideoUrl}</div>
          </div>
        )}
      </div>
    </main>
  );
}
