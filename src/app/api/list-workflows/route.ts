import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs/promises";
import * as path from "path";
import { validateWorkflowPath } from "@/utils/pathValidation";

interface WorkflowListEntry {
  name: string;
  directoryPath: string;
  nodeCount: number;
  lastModified: number;
}

export async function GET(request: NextRequest) {
  const parentPath = request.nextUrl.searchParams.get("path");

  if (!parentPath) {
    return NextResponse.json(
      { success: false, error: "Path parameter required" },
      { status: 400 }
    );
  }

  const pathValidation = validateWorkflowPath(parentPath);
  if (!pathValidation.valid) {
    return NextResponse.json(
      { success: false, error: pathValidation.error },
      { status: 400 }
    );
  }

  try {
    const entries = await fs.readdir(parentPath, { withFileTypes: true });
    const directories = entries.filter((e) => e.isDirectory());

    const workflows: WorkflowListEntry[] = [];

    for (const dir of directories) {
      const dirPath = path.join(parentPath, dir.name);
      try {
        const files = await fs.readdir(dirPath);
        const jsonFiles = files.filter((f) => f.endsWith(".json"));

        for (const jsonFile of jsonFiles) {
          try {
            const filePath = path.join(dirPath, jsonFile);
            const content = await fs.readFile(filePath, "utf-8");
            const parsed = JSON.parse(content);

            if (parsed.version && parsed.nodes && parsed.edges) {
              const stat = await fs.stat(filePath);
              workflows.push({
                name: parsed.name || dir.name,
                directoryPath: dirPath,
                nodeCount: parsed.nodes.length,
                lastModified: stat.mtimeMs,
              });
              break; // Use first valid workflow file per directory
            }
          } catch {
            continue;
          }
        }
      } catch {
        // Skip directories we can't read
        continue;
      }
    }

    // Sort by most recently modified first
    workflows.sort((a, b) => b.lastModified - a.lastModified);

    return NextResponse.json({ success: true, workflows });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to list workflows",
      },
      { status: 500 }
    );
  }
}
