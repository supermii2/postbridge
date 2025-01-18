import { NextRequest, NextResponse } from "next/server";
import AdmZip from "adm-zip";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();

    const allEntryNames = zipEntries.map((entry) => entry.entryName);
    console.log("All zip entries:", allEntryNames);

    let postEntry = zipEntries.find((entry) => {
      const normalized = entry.entryName.replace(/\\/g, "/").toLowerCase();
      return normalized === "posts/post.txt";
    });

    if (!postEntry) {
      postEntry = zipEntries.find((entry) => {
        const normalized = entry.entryName.replace(/\\/g, "/").toLowerCase();
        return normalized.endsWith("post.txt");
      });
    }

    if (!postEntry) {
      return NextResponse.json(
        {
          error:
            "Posts/Post.txt not found. See server logs for actual zip paths.",
          paths: allEntryNames,
        },
        { status: 404 }
      );
    }

    const postContent = postEntry.getData().toString("utf-8");

    return NextResponse.json({ postContent });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Something went wrong." },
      { status: 500 }
    );
  }
}
