import { describe, it, expect } from '@jest/globals'

import { DiffFactory, GitOperation, DiffObject } from '../../src/Diff/GitDiff'

describe('DiffFactory', () => {
  let diffFactory: DiffFactory

  beforeEach(() => {
    diffFactory = new DiffFactory()
  })

  describe('create', () => {
    it('should parse a new file diff correctly', () => {
      const diff = `diff --git a/newfile.txt b/newfile.txt
new file mode 100644
index 0000000..1234567
--- /dev/null
+++ b/newfile.txt
@@ -0,0 +1 @@
+This is a new file`

      const result = diffFactory.create(diff)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        operation: GitOperation.NEW,
        fileName: 'newfile.txt',
        diff: diff,
        isBinary: false
      })
    })

    it('should parse a deleted file diff correctly', () => {
      const diff = `diff --git a/deleted.txt b/deleted.txt
deleted file mode 100644
index 1234567..0000000
--- a/deleted.txt
+++ /dev/null
@@ -1 +0
-Deleted content`

      const result = diffFactory.create(diff)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        operation: GitOperation.DELETED,
        fileName: 'deleted.txt',
        oldFileName: 'deleted.txt',
        diff: diff,
        isBinary: false
      })
    })

    it('should parse a renamed file diff correctly', () => {
      const diff = `diff --git a/old.txt b/new.txt
rename from old.txt
rename to new.txt
index 1234567..89abcde 100644
--- a/old.txt
+++ b/new.txt
@@ -1 +1 @@
-Old content
+New content`

      const result = diffFactory.create(diff)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        operation: GitOperation.RENAMED,
        fileName: 'new.txt',
        oldFileName: 'old.txt',
        diff: diff,
        isBinary: false
      })
    })

    it('should parse a copied file diff correctly', () => {
      const diff = `diff --git a/original.txt b/copy.txt
copy from original.txt
copy to copy.txt
index 1234567..89abcde 100644
--- a/original.txt
+++ b/copy.txt
@@ -1 +1 @@
-Original content
+Copied content`

      const result = diffFactory.create(diff)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        operation: GitOperation.COPIED,
        fileName: 'copy.txt',
        oldFileName: 'original.txt',
        diff: diff,
        isBinary: false
      })
    })

    it('should parse a modified file diff correctly', () => {
      const diff = `diff --git a/file.txt b/file.txt
index 1234567..89abcde 100644
--- a/file.txt
+++ b/file.txt
@@ -1 +1 @@
-Old content
+Modified content`

      const result = diffFactory.create(diff)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        fileName: 'file.txt',
        oldFileName: 'file.txt',
        diff: diff,
        isBinary: false
      })
    })

    it('should parse a binary file diff correctly', () => {
      const diff = `diff --git a/image.png b/image.png
new file mode 100644
index 0000000..1234567
Binary files /dev/null and b/image.png differ`

      const result = diffFactory.create(diff)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        operation: GitOperation.NEW,
        fileName: 'image.png',
        diff: diff,
        isBinary: true
      })
    })

    it('should parse multiple file diffs correctly', () => {
      const diff = `diff --git a/file1.txt b/file1.txt
index 1234567..89abcde 100644
--- a/file1.txt
+++ b/file1.txt
@@ -1 +1 @@
-Old content
+New content
diff --git a/file2.txt b/file2.txt
new file mode 100644
index 0000000..1234567
--- /dev/null
+++ b/file2.txt
@@ -0,0 +1 @@
+This is new`

      const result = diffFactory.create(diff)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        fileName: 'file1.txt',
        oldFileName: 'file1.txt',
        diff: `diff --git a/file1.txt b/file1.txt
index 1234567..89abcde 100644
--- a/file1.txt
+++ b/file1.txt
@@ -1 +1 @@
-Old content
+New content`,
        isBinary: false
      })
      expect(result[1]).toEqual({
        operation: GitOperation.NEW,
        fileName: 'file2.txt',
        diff: `diff --git a/file2.txt b/file2.txt
new file mode 100644
index 0000000..1234567
--- /dev/null
+++ b/file2.txt
@@ -0,0 +1 @@
+This is new`,
        isBinary: false
      })
    })

    // Edge cases
    it('should handle empty diff string', () => {
      const result = diffFactory.create('')
      expect(result).toEqual([])
    })

    it('should handle malformed diff line with unknown filename', () => {
      const diff = 'diff --git malformed/diff/line'
      const result = diffFactory.create(diff)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        fileName: 'unknown',
        diff: diff,
        isBinary: false
      })
    })

    it('should handle diff with no file path prefix', () => {
      const diff = `diff --git file.txt file.txt
index 1234567..89abcde 100644
--- file.txt
+++ file.txt`

      const result = diffFactory.create(diff)

      expect(result).toHaveLength(1)
      expect(result[0].fileName).toBe('file.txt')
    })

    it('should handle diff with trailing newlines', () => {
      const diff = `diff --git a/file.txt b/file.txt
index 1234567..89abcde 100644
--- a/file.txt
+++ b/file.txt

`
      const result = diffFactory.create(diff)

      expect(result).toHaveLength(1)
      expect(result[0].diff).toBe(diff)
    })
  })
})
