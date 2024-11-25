export enum GitOperation {
    NEW = "new",
    DELETED = "deleted",
    RENAMED = "renamed",
    MODIFIED = "modified",  
}
export type GitDiff = {
    operation?: GitOperation;
    fileName: string;
    diff: string;
    isBinary: boolean
}

export class GitDiffParser {
    public parse(diff: string): GitDiff[] {
        const diffList: GitDiff[] = [];
        const diffLines = diff.split("\n");

        let currentDiffObject: GitDiff|null = null;
        let currentDiffLines: string[] = [];

        for (const line of diffLines) {
            if (line.startsWith("diff --git")) {
                if (currentDiffObject !== null) {
                    currentDiffObject.diff = currentDiffLines.join("\n");
                    diffList.push(currentDiffObject);
                }

                const match = /diff --git a\/(.+?) b\/(.+)/.exec(line);
                const fileName = match ? match[2] : "unknown";

                currentDiffObject = {
                    fileName: fileName,
                    diff: "",
                    isBinary: false
                };

                currentDiffLines = [line]
            } else if (line.startsWith("new file mode")) {
                currentDiffObject!.operation = GitOperation.NEW;
                currentDiffLines.push(line)
            } else if(line.startsWith("deleted file mode")) {
                currentDiffObject!.operation = GitOperation.DELETED;
                currentDiffLines.push(line)
            } else if (line.startsWith("rename from")) {
                currentDiffObject!.operation = GitOperation.RENAMED;
                currentDiffLines.push(line)
            } else if (line.startsWith("--- ")) {
                const filePath = line.substring(4);
                if (filePath !== "/dev/null") {
                  // For deletions, we keep the original file name
                  currentDiffObject!.fileName = filePath.startsWith("a/") ? filePath.substring(2) : filePath;
                }
                currentDiffLines.push(line);
            } else if (line.startsWith("+++ ")) {
                const filePath = line.substring(4);
                if (filePath !== "/dev/null") {
                    currentDiffObject!.fileName = filePath.startsWith("b/") ? filePath.substring(2) : filePath;
                }
                currentDiffLines.push(line);
            } else if(line.startsWith('Binary')) {
                currentDiffObject!.isBinary = true;
                currentDiffLines.push(line)
            } else {
                currentDiffLines.push(line);

            }
        }

        if (currentDiffObject) {
            currentDiffObject.diff = currentDiffLines.join("\n");
            diffList.push(currentDiffObject);
        }
        
        return diffList;
    }
}