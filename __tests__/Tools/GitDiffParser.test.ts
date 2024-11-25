import { describe, it, expect } from '@jest/globals'
import { GitDiff, GitDiffParser, GitOperation } from '../../src/Tools/GitDiffParser'

describe('GitDiffParser', () => {
    const parser = new GitDiffParser();

    describe('Basic Parsing', () => {
        it('should parse a simple diff', () => {
            const diff = `diff --git a/src/main.ts b/src/main.ts
index 4291e7f..f664044 100644
--- a/src/main.ts
+++ b/src/main.ts
@@ -5,4 +5,4 @@ export async function run(): Promise<void> {
   const engine = new Engine()
 
   await engine process()
`
            const result = parser.parse(diff);

            expect(result).toHaveLength(1)
            expect(result[0].fileName).toBe('src/main.ts')
            expect(result[0].diff).toEqual(diff)
            expect(result[0].operation).toBeUndefined()
        })
    })

    describe('File Operations', () => {
        it('should parse new file', () => {
            const diff = `diff --git a/newfile.ts b/newfile.ts
new file mode 100644
index 0000000..f664044
--- /dev/null
+++ b/newfile.ts
@@ -0,0 +1,4 @@
+export function newFunction() {
+    console.log('New function')
+}
`
            const result = parser.parse(diff);

            expect(result).toHaveLength(1)
            expect(result[0].fileName).toBe('newfile.ts')
            expect(result[0].operation).toBe(GitOperation.NEW)
            expect(result[0].diff).toEqual(diff)
        })

        it('should parse deleted file', () => {
            const diff = `diff --git a/deletedfile.ts b/deletedfile.ts
deleted file mode 100644
index f664044..0000000
--- a/deletedfile.ts
+++ /dev/null
@@ -1,4 +0,0 @@
-export function deletedFunction() {
-    console.log('Deleted function')
-}
`
            const result = parser.parse(diff);

            expect(result).toHaveLength(1)
            expect(result[0].fileName).toBe('deletedfile.ts')
            expect(result[0].operation).toBe(GitOperation.DELETED)
            expect(result[0].diff).toEqual(diff)
        })

        it('should parse renamed file', () => {
            const diff = `diff --git a/oldname.ts b/newname.ts
rename from oldname.ts
rename to newname.ts
index f664044..abcd1234 100644
`
            const result = parser.parse(diff);

            expect(result).toHaveLength(1)
            expect(result[0].fileName).toBe('newname.ts')
            expect(result[0].operation).toBe(GitOperation.RENAMED)
            expect(result[0].diff).toEqual(diff)
        })
    })

    describe('Multiple Diffs', () => {
        it('should parse multiple diffs in one input', () => {
            const multipleDiffs = `diff --git a/file1.ts b/file1.ts
index 4291e7f..f664044 100644
--- a/file1.ts
+++ b/file1.ts
@@ -1,4 +1,4 @@
 console.log('file1')

diff --git a/file2.ts b/file2.ts
index abcd1234..5678efgh 100644
--- a/file2.ts
+++ b/file2.ts
@@ -1,4 +1,4 @@
 console.log('file2')
`
            const result = parser.parse(multipleDiffs);

            expect(result).toHaveLength(2)
            expect(result[0].fileName).toBe('file1.ts')
            expect(result[1].fileName).toBe('file2.ts')
        })
    })

    describe('Edge Cases', () => {
        it('should handle diff with unknown file path', () => {
            const diff = `diff --git a/ b/
new file mode 100644
index 0000000..f664044
--- /dev/null
+++ b/newfile.ts
@@ -0,0 +1,4 @@
+export function newFunction() {
+    console.log('New function')
+}
`
            const result = parser.parse(diff);

            expect(result).toHaveLength(1)
            expect(result[0].fileName).toBe('newfile.ts')
            expect(result[0].operation).toBe(GitOperation.NEW)
        })

        it('should handle empty diff', () => {
            const result = parser.parse('');

            expect(result).toHaveLength(0)
        })

        it('should handle diff with /dev/null references', () => {
            const diff = `diff --git a/dev/null b/src/newfile.ts
new file mode 100644
index 0000000..f664044
--- /dev/null
+++ b/src/newfile.ts
@@ -0,0 +1,4 @@
+export function newFunction() {
+    console.log('New function')
+}
`
            const result = parser.parse(diff);

            expect(result).toHaveLength(1)
            expect(result[0].fileName).toBe('src/newfile.ts')
            expect(result[0].operation).toBe(GitOperation.NEW)
        })
    })

    describe('File Name Parsing', () => {
        it('should correctly parse file name with full path', () => {
            const diff = `diff --git a/path/to/some/file.ts b/path/to/some/file.ts
index 4291e7f..f664044 100644
--- a/path/to/some/file.ts
+++ b/path/to/some/file.ts
@@ -1,4 +1,4 @@
 console.log('test')
`
            const result = parser.parse(diff);

            expect(result).toHaveLength(1)
            expect(result[0].fileName).toBe('path/to/some/file.ts')
        })

        it('should handle file names with special characters', () => {
            const diff = `diff --git a/path/to/some/file-with_special.chars.ts b/path/to/some/file-with_special.chars.ts
index 4291e7f..f664044 100644
--- a/path/to/some/file-with_special.chars.ts
+++ b/path/to/some/file-with_special.chars.ts
@@ -1,4 +1,4 @@
 console.log('test')
`
            const result = parser.parse(diff);

            expect(result).toHaveLength(1)
            expect(result[0].fileName).toBe('path/to/some/file-with_special.chars.ts')
        })
    })

    describe('Binary File Detection', () => {
        it('should detect a deleted binary file', () => {
            const diff = `diff --git a/doc/renegade-diff.png b/doc/renegade-diff.png
deleted file mode 100644
index a4efcdd..0000000
Binary files a/doc/renegade-diff.png and /dev/null differ`
            
            const result = parser.parse(diff);

            expect(result).toHaveLength(1)
            expect(result[0].fileName).toBe('doc/renegade-diff.png')
            expect(result[0].operation).toBe(GitOperation.DELETED)
            expect(result[0].isBinary).toBe(true)
            expect(result[0].diff).toEqual(diff)
        })

        it('should detect a new binary file', () => {
            const diff = `diff --git a/doc/new-image.png b/doc/new-image.png
new file mode 100644
index 0000000..a4efcdd
Binary files /dev/null and b/doc/new-image.png differ`
            
            const result = parser.parse(diff);

            expect(result).toHaveLength(1)
            expect(result[0].fileName).toBe('doc/new-image.png')
            expect(result[0].operation).toBe(GitOperation.NEW)
            expect(result[0].isBinary).toBe(true)
            expect(result[0].diff).toEqual(diff)
        })

        it('should handle mixed binary and text file diffs', () => {
            const multipleDiffs = `diff --git a/doc/renegade-diff.png b/doc/renegade-diff.png
deleted file mode 100644
index a4efcdd..0000000
Binary files a/doc/renegade-diff.png and /dev/null differ
diff --git a/src/Tools/Diff.ts b/src/Tools/Diff.ts
new file mode 100644
index 0000000..1066309
--- /dev/null
+++ b/src/Tools/Diff.ts
+export class Diff {
+    
+}
+
diff --git a/src/main.ts b/src/main.ts
index 4291e7f..f664044 100644
--- a/src/main.ts
+++ b/src/main.ts
@@ -5,4 +5,4 @@ export async function run(): Promise<void> {
   const engine = new Engine()
 
   await engine process()
`
            const result = parser.parse(multipleDiffs);

            expect(result).toHaveLength(3)
            expect(result[0].fileName).toBe('doc/renegade-diff.png')
            expect(result[0].isBinary).toBe(true)
            expect(result[0].operation).toBe(GitOperation.DELETED)

            expect(result[1].fileName).toBe('src/Tools/Diff.ts')
            expect(result[1].isBinary).toBe(false)
            expect(result[1].operation).toBe(GitOperation.NEW)

            expect(result[2].fileName).toBe('src/main.ts')
            expect(result[2].isBinary).toBe(false)
            expect(result[2].operation).toBeUndefined()
        })
    })
})
