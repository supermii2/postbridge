export interface Video {
  url: string;
}

export interface Photo {
  title?: string;
  links: string[];
}

function parseSinglePost(block: string): Video | Photo | null {
  const lines = block
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let title: string | undefined;
  const linkList: string[] = [];

  for (const line of lines) {
    const match = line.match(/^([^:]+):\s*(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (key.toLowerCase() === "title") {
        title = value;
      } else if (key.toLowerCase() === "link") {
        if (value.startsWith("https://")) {
          linkList.push(value);
        }
      }
    } else if (line.startsWith("https://")) {
      linkList.push(line);
    }
  }

  if (linkList.length === 0) {
    return null;
  }

  const firstLink = linkList[0];
  if (firstLink.startsWith("https://video")) {
    return { url: firstLink };
  }

  return {
    title,
    links: linkList,
  };
}

export function parsePostTXT(fullText: string): Array<Video | Photo> {
  const rawPosts = fullText
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);

  const parsedPosts = rawPosts
    .map((block) => parseSinglePost(block))
    .filter((item): item is Video | Photo => item !== null);

  return parsedPosts;
}
