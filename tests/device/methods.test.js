import chalk from 'chalk';
import JuBiterConnect from '../../src/js/index';
import fixtures from '../__fixtures__';

const { getController, setup, skipTest, conditionalTest, initJuBiterConnect } = global.Trezor;

let controller;

describe(`JuBiterConnect methods`, () => {
    afterAll(done => {
        // reset controller at the end
        if (controller) {
            controller.dispose();
            controller = undefined;
        }
        done();
    });

    fixtures.forEach(testCase => {
        describe(`JuBiterConnect.${testCase.method}`, () => {
            beforeAll(async done => {
                try {
                    if (!controller) {
                        controller = getController(testCase.method);
                        controller.on('error', () => {
                            controller = undefined;
                        });
                    }

                    await setup(controller, testCase.setup);

                    await initJuBiterConnect(controller);
                    done();
                } catch (error) {
                    console.log('Controller WS init error', error);
                    done(error);
                }
            }, 40000);

            afterAll(done => {
                JuBiterConnect.dispose();
                done();
            });

            testCase.tests.forEach(t => {
                // check if test should be skipped on current configuration
                conditionalTest(
                    t.skip,
                    t.description,
                    async done => {
                        // print current test case, `jest` default reporter doesn't log this. see https://github.com/facebook/jest/issues/4471
                        if (typeof jest !== 'undefined' && process.stderr) {
                            const log = chalk.black.bgYellow.bold(` ${testCase.method}: `);
                            process.stderr.write(`\n${log} ${chalk.bold(t.description)}\n`);
                        }

                        if (!controller) {
                            throw new Error('Controller not found');
                        }

                        // single test may require a different setup
                        await setup(controller, t.setup || testCase.setup);

                        controller.options.name = t.description;
                        const result = await JuBiterConnect[testCase.method](t.params);
                        let expected = t.result
                            ? { success: true, payload: t.result }
                            : { success: false };

                        // find legacy result
                        if (t.legacyResults) {
                            t.legacyResults.forEach(r => {
                                if (skipTest(r.rules)) {
                                    expected = r.payload
                                        ? { success: true, payload: r.payload }
                                        : { success: false };
                                }
                            });
                        }

                        expect(result).toMatchObject(expected);
                        done();
                    },
                    t.customTimeout || 20000,
                );
            });
        });
    });
});
