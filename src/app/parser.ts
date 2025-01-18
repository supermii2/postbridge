// Define the interfaces for Video and Photo
interface Video {
    url: string;
}

interface Photo {
    title?: string;
    links: string[];
}

// Function to parse individual post
const parsePost = (text: string): Video | Photo => {
    const lines = text.split('\n');  // Split input text into lines
    const vidObj: { [key: string]: string } = {};  // Object to store key-value pairs from each line
    let currentKey: string | null = null;  // Variable to keep track of the current key
  
    lines.forEach((line) => {
        const [key, value] = line.split(/:(.+)/).map((item, index) =>
            index === 0 ? item.trim() : item.trimStart()
        );
    
        if (value !== undefined) {
            // If the line is a key-value pair, update currentKey and add it to vidObj
            currentKey = key;
            vidObj[currentKey] = value;
        } else if (currentKey === 'Link' && line.trim()) {
            // If the line is an additional URL for Link, append it to the existing value
            vidObj[currentKey] += '\n' + line.trim();
        }
    });
  
    // Convert 'Link' values into an array, trimming and filtering out empty links
    const links = vidObj['Link']
        ? vidObj['Link']
            .split('\n')
            .map((link) => link.trim())
            .filter((link) => link.length > 0)
        : [];
  
    // Check if the 'Link' starts with 'https://video' to differentiate between video and photo
    if (links.length > 0 && links[0].startsWith('https://video')) {
        // If it's a video, return the 'url' of the video
        return { url: links[0] };
    } else {
        // If it's a photo, return 'Title' (if available) and 'Link'
        return {
            title: vidObj['Title']?.trim() || undefined,  // Optional 'Title' for photo
            links  // 'Link' is an array of URLs
        };
    }
};

// Function to parse multiple posts
export const parsePostTXT = (text: string): (Video | Photo)[] => {
    return text.split("\n\n")  // Split the input into individual posts
        .map(x => parsePost(x))  // Parse each post
        .filter((x): x is Video | Photo => {
            // Type guard: Check if 'url' exists for 'Video' or 'links' exists for 'Photo'
            return 'url' in x || 'links' in x;
        });  // Filter out invalid entries
};

// example output from parsePostTXT
// [
//     { 
//       title: "A Beautiful Sunset", 
//       links: ["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"] 
//     },
//     { 
//       url: "https://video.example.com/video.mp4" 
//     }
// ]
  