import { Octokit } from "@octokit/rest";
import fs from "fs";
import path from "path";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Create a GitHub Personal Access Token with repo permissions
const REPO_OWNER = "NMSebake";
const REPO_NAME = "funding-requests";

const octokit = new Octokit({
  auth: GITHUB_TOKEN,
});

/**
 * Uploads files to a folder in GitHub
 * @param folderName - Name of folder (e.g., CompanyName-Department)
 * @param files - Array of { name: string, path: string }
 */
export async function uploadFilesToGithub(folderName: string, files: { name: string; path: string }[]) {
  for (const file of files) {
    const content = fs.readFileSync(file.path, { encoding: "base64" }); // GitHub API requires base64 content
    const githubPath = `${folderName}/${file.name}`;

    try {
      await octokit.repos.createOrUpdateFileContents({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: githubPath,
        message: `Add ${file.name} for request ${folderName}`,
        content,
      });
      console.log(`Uploaded ${file.name} to GitHub`);
    } catch (err) {
      console.error(`Failed to upload ${file.name}:`, err);
    }
  }
}
