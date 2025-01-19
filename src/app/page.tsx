"use client";

import React, { useState } from "react";
import { parsePostTXT } from "./parser";
import { Video } from "./types";
import Script from "next/script";

declare global {
  interface Window {
    xhs?: {
      share: (config: {
        shareInfo: {
          type: string;
          title: string;
          images?: Array<string>;
          video?: string;
          cover: string;
        };
        verifyConfig: {
          appKey: string;
          nonce: string;
          timestamp: string;
          signature: string;
        };
        fail: (error: { message: string }) => void;
      }) => void;
    };
  }
}

export default function HomePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const [postContent, setPostContent] = useState<Array<Video>>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setError("");
      setPostContent([]);
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
        const content: Array<Video> = parsePostTXT(data.postContent);
        setPostContent(content);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during upload.");
    }
  };

  const handleShareVideo = async(videoUrl : string) => {
    try {
        const response = await fetch('/api/getAccessToken', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
        });

        const data = await response.json();
        
        if (!response.ok || data.code !== 0 || !data.success) {
            throw new Error(data.msg || 'Failed to fetch access token.');
        }

        if (typeof window.xhs === 'undefined') {
            throw new Error('Xiaohongshu SDK not loaded');
        }

        window.xhs.share({
            shareInfo: {
                type: 'video',
                title: 'Check out this video!',
                video: videoUrl,
                cover: 'https://example.com/cover.jpg', // Replace with your cover image URL
            },
            verifyConfig: {
                appKey: data.app_key,
                nonce: data.nonce,
                timestamp: data.timestamp,
                signature: data.signature,
            },
            fail: (error) => {
                console.error('Share failed:', error);
            },
        });           
    } catch (error) {
        console.error('Error:', error);
    }
  };

  const handleSharePhotos = async(photoUrls : Array<string>) => {
    try {
        const response = await fetch('/api/getAccessToken', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
        });

        const data = await response.json();
        
        if (!response.ok || data.code !== 0 || !data.success) {
            throw new Error(data.msg || 'Failed to fetch access token.');
        }

        if (typeof window.xhs === 'undefined') {
            throw new Error('Xiaohongshu SDK not loaded');
        }

        window.xhs.share({
            shareInfo: {
                type: 'normal',
                title: 'Check out this video!',
                images: photoUrls,
                cover: 'https://example.com/cover.jpg', // Replace with your cover image URL
            },
            verifyConfig: {
                appKey: data.app_key,
                nonce: data.nonce,
                timestamp: data.timestamp,
                signature: data.signature,
            },
            fail: (error) => {
                console.error('Share failed:', error);
            },
          });           
        } catch (error) {
            console.error('Error:', error);
        }
      };

  return (
    <>
    <Script src="https://fe-static.xhscdn.com/biz-static/goten/xhs-1.0.1.js" />
    <main className="w-full min-h-screen flex flex-col items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-lg p-8 w-full max-w-md flex flex-col items-center">
        <h1 className="text-3xl font-bold text-white mb-4">Upload Your .zip File</h1>
        <p className="text-white text-sm mb-6 text-center">
          This page extracts <code>Posts/Post.txt</code> from the ZIP
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

        {postContent.length > 0 && (
          <div className="mt-6 w-full bg-white/20 rounded-md p-4">
            <h2 className="text-white text-lg font-bold mb-2">Contents of Posts/Post.txt:</h2>
            <ul className="text-white space-y-4">
              {postContent.map((video, index) => (
                <li key={index} className="flex items-center justify-between">
                  <video src={video.url} controls className="w-1/2 h-auto"></video>
                  <button
                    className="ml-4 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-full transition duration-300 ease-in-out"
                    onClick={() => handleShareVideo(video.url)}
                  >
                    Use
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
    </>
  );
}
