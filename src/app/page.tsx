"use client";

import React, { useState } from "react";
import { parsePostTXT, Video, Photo } from "./parser";

export default function HomePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const [posts, setPosts] = useState<(Video | Photo)[]>([]);
  const [currentPostIndex, setCurrentPostIndex] = useState<number>(0);
  const [currentPhotoIndices, setCurrentPhotoIndices] = useState<number[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setError("");
      setPosts([]);
      setCurrentPostIndex(0);
      setCurrentPhotoIndices([]);
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

      const data = await response.json();
      if (data.postContent) {
        let parsed = parsePostTXT(data.postContent);
        parsed = parsed.filter((p) => {
          if ("url" in p) {
            return p.url.trim().length > 0;
          } else {
            return p.links.length > 0;
          }
        });
        setPosts(parsed);
        setCurrentPhotoIndices(Array(parsed.length).fill(0));
        setError("");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during upload.");
    }
  };

  const showPreviousPost = () => {
    setCurrentPostIndex((prevIndex) => {
      const newIndex = prevIndex - 1;
      return newIndex < 0 ? posts.length - 1 : newIndex;
    });
  };

  const showNextPost = () => {
    setCurrentPostIndex((prevIndex) => (prevIndex + 1) % posts.length);
  };

  const handleUsePost = () => {
    // check if the post is a video or photo
    const currentPost = posts[currentPostIndex];
    if ("url" in currentPost) {
      console.log("Use video clicked (placeholder).");
    } else {
      console.log("Use photo clicked (placeholder).");
    }
  };

  const showNextPhoto = () => {
    const currentPost = posts[currentPostIndex];
    if (!("links" in currentPost)) return;

    setCurrentPhotoIndices((prev) => {
      const newIndices = [...prev];
      const totalPhotos = currentPost.links.length;
      const currentPhoto = prev[currentPostIndex];
      const nextPhoto = (currentPhoto + 1) % totalPhotos;
      newIndices[currentPostIndex] = nextPhoto;
      return newIndices;
    });
  };

  const showPrevPhoto = () => {
    const currentPost = posts[currentPostIndex];
    if (!("links" in currentPost)) return;

    setCurrentPhotoIndices((prev) => {
      const newIndices = [...prev];
      const totalPhotos = currentPost.links.length;
      const currentPhoto = prev[currentPostIndex];
      const prevPhoto =
        currentPhoto - 1 < 0 ? totalPhotos - 1 : currentPhoto - 1;
      newIndices[currentPostIndex] = prevPhoto;
      return newIndices;
    });
  };

  const renderCurrentPost = () => {
    if (posts.length === 0) return null;

    const currentPost = posts[currentPostIndex];
    if ("url" in currentPost) {
      return (
        <div className="flex flex-col items-center">
          <video
            src={currentPost.url}
            controls
            className="mb-4 max-w-full rounded"
            width={320}
          />
        </div>
      );
    }

    const totalPhotos = currentPost.links.length;
    const photoIndex = currentPhotoIndices[currentPostIndex];
    const currentPhotoUrl = currentPost.links[photoIndex];
    const currentPhotoSetUrl = currentPost.links;

    return (
      <div className="flex flex-col items-center">
        {/* Render Title if available */}
        {currentPost.title && (
          <h3 className="text-white text-lg font-semibold mb-2 text-center">
            {currentPost.title}
          </h3>
        )}
        <img
          key={currentPhotoUrl}
          src={currentPhotoUrl}
          alt={`Photo ${photoIndex + 1}`}
          className="mb-4 rounded max-w-full"
        />
        {totalPhotos > 1 && (
          <div className="flex space-x-2 mb-4">
            <button
              onClick={showPrevPhoto}
              className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-1 px-3 rounded-full"
            >
              Prev Photo
            </button>
            <button
              onClick={showNextPhoto}
              className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-1 px-3 rounded-full"
            >
              Next Photo
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <main className="w-full min-h-screen flex flex-col items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-lg p-8 w-full max-w-md flex flex-col items-center">
        <h1 className="text-3xl font-bold text-white mb-4">
          Upload Your .zip File
        </h1>
        <p className="text-white text-sm mb-6 text-center">
          This page extracts <code>Posts/Post.txt</code> from the ZIP.
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

        {posts.length > 0 && (
          <div className="mt-6 w-full bg-white/20 rounded-md p-4 flex flex-col items-center">
            <h2 className="text-white text-lg font-bold mb-2">
              Post {currentPostIndex + 1} of {posts.length}
            </h2>
            {renderCurrentPost()}
            <div className="mt-4 flex space-x-4">
              <button
                onClick={showPreviousPost}
                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-1 px-3 rounded-full"
              >
                &lt;
              </button>
              <button
                onClick={handleUsePost}
                className="bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-3 rounded-full transition duration-300 ease-in-out"
              >
                Use
              </button>
              <button
                onClick={showNextPost}
                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-1 px-3 rounded-full"
              >
                &gt;
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
