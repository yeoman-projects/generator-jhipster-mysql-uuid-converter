const path = require("path");
const fse = require("fs-extra");
const assert = require("yeoman-assert");
const helpers = require("yeoman-test");

// eslint-disable-next-line no-undef
describe("JHipster generator mysqluuid-converter", () => {
    // eslint-disable-next-line no-undef
    describe("Test with Maven and AngularX", () => {
        // eslint-disable-next-line no-undef
        beforeEach(done => {
            helpers
                .run(path.join(__dirname, "../generators/app"))
                .inTmpDir(dir => {
                    fse.copySync(
                        path.join(
                            __dirname,
                            "../test/templates/maven-angularX"
                        ),
                        dir
                    );
                })
                .withOptions({
                    testmode: true
                })
                .withPrompts({
                    message: "simple message to say hello"
                })
                .on("end", done);
        });

        // eslint-disable-next-line no-undef
        it("generate dummy.txt file", () => {
            assert.file(["dummy-maven.txt", "dummy-angularX.txt"]);
        });
    });

    // eslint-disable-next-line no-undef
    describe("Test with Gradle and React", () => {
        // eslint-disable-next-line no-undef
        beforeEach(done => {
            helpers
                .run(path.join(__dirname, "../generators/app"))
                .inTmpDir(dir => {
                    fse.copySync(
                        path.join(__dirname, "../test/templates/gradle-react"),
                        dir
                    );
                })
                .withOptions({
                    testmode: true
                })
                .withPrompts({
                    message: "simple message to say hello"
                })
                .on("end", done);
        });

        // eslint-disable-next-line no-undef
        it("generate dummy.txt file", () => {
            assert.file(["dummy-gradle.txt", "dummy-react.txt"]);
        });
    });
});
