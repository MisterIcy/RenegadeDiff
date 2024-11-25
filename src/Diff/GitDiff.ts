export enum GitOperation {
  NEW = 'new',
  DELETED = 'deleted',
  RENAMED = 'renamed',
  MODIFIED = 'modified',
  COPIED = 'copied'
}

export type DiffObject = {
  /**
   * The Git Operation that took place on the file
   */
  operation?: GitOperation

  /**
   * The name of the file for which the diff is created
   */
  fileName: string
  oldFileName?: string

  /**
   * The actual git diff
   */
  diff: string

  /**
   * Whether the file is a binary one
   */
  isBinary: boolean
}

export class DiffFactory {
  /**
   * Creates an array of Diff Objects
   *
   * @param {string} diff The diff for the Pull Request
   * @returns {DiffObject[]} An array of DiffObjects that contain extra information about the diff
   * @link https://git-scm.com/docs/git-diff#generate_patch_text_with_p
   */
  public create(diff: string): DiffObject[] {
    const diffList: DiffObject[] = []
    const diffLines = diff.split('\n')

    let currentObj: DiffObject | null = null
    let currentLines: string[] = []

    for (const line of diffLines) {
      if (line.startsWith('diff --git')) {
        // We have a new diff! Check if we have a currentObject and store it into the list
        if (currentObj !== null) {
          currentObj.diff = currentLines.join('\n')
          diffList.push(currentObj)
          currentLines = []
        }

        // Obtain filename
        currentObj = {
          fileName: this.getFileNameFromDiffLine(line),
          diff: '',
          isBinary: false
        }

        currentLines = [line]
      } else if (line.startsWith('deleted file')) {
        currentObj!.operation = GitOperation.DELETED
        currentLines.push(line)
      } else if (line.startsWith('new file')) {
        currentObj!.operation = GitOperation.NEW
        currentLines.push(line)
      } else if (line.startsWith('copy from')) {
        currentObj!.operation = GitOperation.COPIED
        currentLines.push(line)
      } else if (line.startsWith('rename from')) {
        currentObj!.operation = GitOperation.RENAMED
        currentLines.push(line)
      } else if (line.startsWith('--- ')) {
        // Check old file
        const localFilePath = line.substring(4)
        if (localFilePath !== '/dev/null') {
          // For deletions, we keep the original file name
          currentObj!.oldFileName = localFilePath.startsWith('a/')
            ? localFilePath.substring(2)
            : localFilePath
        }

        currentLines.push(line)
      } else if (line.startsWith('+++ ')) {
        // Check new file
        const localFilePath = line.substring(4)
        if (localFilePath !== '/dev/null') {
          // For other operations, we keep the new file name
          currentObj!.fileName = localFilePath.startsWith('a/')
            ? localFilePath.substring(2)
            : localFilePath
        }

        currentLines.push(line)
      } else if (line.startsWith('Binary')) {
        currentObj!.isBinary = true
        currentLines.push(line)
      } else {
        currentLines.push(line)
      }
    }

    if (currentObj !== null) {
      currentObj.diff = currentLines.join('\n')
      diffList.push(currentObj)
    }

    return diffList
  }

  private getFileNameFromDiffLine(line: string): string {
    const match = /diff --git a\/(.+?) b\/(.+)/.exec(line)

    if (!match) {
      return 'unknown'
    }

    return match[2]
  }
}
