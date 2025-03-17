// import { NextResponse } from "next/server";
// import fs from "fs";
// import path from "path";

// export async function GET(req: Request) {
//     try {
//         const { searchParams } = new URL(req.url);
//         const fileName = searchParams.get("file");

//         if (!fileName) {
//             return NextResponse.json({ error: "Missing file parameter" }, { status: 400 });
//         }

//         const filePath = path.join(process.cwd(), "public/accident-frames", fileName);
//         if (!fs.existsSync(filePath)) {
//             return NextResponse.json({ error: "File not found" }, { status: 404 });
//         }

//         const fileBuffer = fs.readFileSync(filePath);
//         return new Response(fileBuffer, {
//             headers: { "Content-Type": "image/jpeg" },
//         });
//     } catch (error: any) {
//         console.error("❌ Error serving accident frame:", error.message);
//         return NextResponse.json({ error: error.message }, { status: 500 });
//     }
// }
