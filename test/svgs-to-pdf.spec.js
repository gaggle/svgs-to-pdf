import * as tmp from "tmp-promise"
import shellac from "shellac"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const fixtures = join(__dirname, "fixtures")

describe("svgs-to-pdf docker image", function () {
  const runCmd = "docker run --rm -i --user \"$(id -u):$(id -g)\" -v \"$(pwd)\":/code -w /code svgs-to-pdf"
  const expectedUsageText = [
    "Usage: svgs-to-pdf -o output files_to_merge...",
    "",
    "   -o, --output       Path of output file, e.g. merged.pdf",
    "   -h, --help         This help text",
    "",
  ].join("\n")
  let dir

  beforeEach(async () => {
    dir = await tmp.dir({ unsafeCleanup: true })
    await shellac.default.in(dir.path)`
      $ cp -r ${fixtures}/* .
    `
  })

  for (const arg of [
    "--help",
    "-h",
  ]) {
    it(`should show help when called with ${arg}`, async () => {
      await expect(shellac.default.in(dir.path)`
        $ ${runCmd} ${arg}
      `).resolves.toEqual(expect.objectContaining({ stdout: expectedUsageText }))
    })
  }

  for (const [key, arg] of Object.entries({
    "with unknown arguments": "--foo",
    "without arguments": "",
  })) {
    describe(key, () => {
      it("should fail and exit 1", async () => {
        await expect(shellac.default.in(dir.path)`
          $ ${runCmd} ${arg}
        `).rejects.toEqual(expect.objectContaining({ retCode: 1 }))
      })

      it.skip("should fail and show help", async () => {
        await expect(shellac.default.in(dir.path)`
          $ ${runCmd} ${arg}
        `).rejects.toEqual(expect.objectContaining({ stderr: expectedUsageText }))
      })
    })
  }

  for (const [key, { arg, expectedMsg }] of Object.entries({
    "with missing output": { arg: "*.svg", expectedMsg: "missing output" },
    "with missing files to merge": { arg: "-o merged.pdf", expectedMsg: "missing files to merge" },
  })) {
    describe(key, () => {
      it(`should fail and mention '${expectedMsg}'`, async () => {
        await expect(shellac.default.in(dir.path)`
        $ ${runCmd} ${arg}
      `).rejects.toEqual(expect.objectContaining({ retCode: 1 }))
      })
    })
  }

  it("should merge svg file pattern to the specified pdf", async () => {
    await expect(shellac.default.in(dir.path)`
    $ ${runCmd} -o merged.pdf *.svg
    $ du -h *.pdf
  `).resolves.toEqual(expect.objectContaining({ stdout: "4.0K\tmerged.pdf" }))
  })
})
