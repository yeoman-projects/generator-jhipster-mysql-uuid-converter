const chalk = require('chalk');
// const yosay = require('yosay');
const glob = require('glob');
const jhipsterConstants = require('generator-jhipster/generators/generator-constants');
const _s = require('underscore.string');
const fs = require('fs');
const semver = require('semver');
const BaseGenerator = require('../common');
const packagejs = require('../../package.json');

const canChangeEntity = 'canChangeEntity';

module.exports = class extends BaseGenerator {
    get initializing() {
        return {
            init(args) {
                this.abort = false;
                this.log();
                this.log(`${chalk.blue.bold('args = ')} ${JSON.stringify(args)}\n`);
                this.log(`${chalk.blue.bold('Entity!')} Init complete...\n`);
            },

            readConfig() {
                this.log(`${chalk.blue.bold('Entity!')} Config start...\n`);

                this.entityConfig = this.options.entityConfig;

                // this.log(`${chalk.blue.bold('options:')} ${JSON.stringify(this.options)}\n`);

                this.jhAppConfig = this.getAllJhipsterConfig();

                this.log(`${chalk.blue.bold('jhAppConfig:')} ${JSON.stringify(this.jhAppConfig)}\n`);

                if (!this.jhAppConfig) {
                    this.error('Can\'t read .yo-rc.json');
                }

                this.log(`${chalk.blue.bold('Entity!')} Config complete...\n`);
            },

            checkDBType() {
                if (this.jhAppConfig.databaseType !== 'sql') {
                    // exit if DB type is not SQL
                    this.abort = true;
                    this.env.error(`${chalk.red.bold('ERROR!')}  I support only Sql database...`);
                } else {
                    this.log(`${chalk.blue.bold('Entity!')} Check DB complete...\n`);
                }
            },

            displayLogo() {
                this.printConverterLogo();
            },

            checkJHVersion() {
                const { jhipsterVersion } = this.jhAppConfig;
                const minimumJhipsterVersion = packagejs.dependencies['generator-jhipster'];
                if (!semver.satisfies(jhipsterVersion, minimumJhipsterVersion)) {
                    this.env.error(`${chalk.red.bold(
                        'ERROR!'
                    )}  I support only JHipster versions greater than ${minimumJhipsterVersion}...
                    If you want to use Entity Audit with an older JHipster version, download a previous version that supports the required JHipster version.`);
                }
            },

            validate() {
                // this shouldn't be run directly
                if (!this.entityConfig) {
                    this.abort = true;
                    this.env.error(
                        `${chalk.red.bold('ERROR!')} This sub generator should be used only from JHipster and cannot be run directly...\n`
                    );
                }
            },
        };
    }

    prompting() {
    // don't prompt if data are imported from a file
        if (
            this.entityConfig.useConfigurationFile === true
      && this.entityConfig.data
      && typeof this.entityConfig.data.yourOptionKey !== 'undefined'
        ) {
            this.yourOptionKey = this.entityConfig.data.yourOptionKey;
            return;
        }

        const entityName = this.entityConfig.entityClass;

        const done = this.async();
        const prompts = [
            {
                type: 'confirm',
                name: canChangeEntity,
                message: `Would you like to change the ${entityName} entity class?`,
                default: true,
            },
        ];

        this.prompt(prompts).then((answers) => {
            this.promptAnswers = answers;
            // this.log(`${chalk.red.bold('answers: ')}` + JSON.stringify(answers));
            this.abort = !this.promptAnswers[canChangeEntity];
            // To access props answers use this.promptAnswers.someOption;
            done();
        });
    }

    get writing() {
        return {
            updateFiles() {
                if (this.abort) {
                    return;
                }

                // read config from .yo-rc.json
                this.baseName = this.jhAppConfig.baseName;
                this.packageName = this.jhAppConfig.packageName;
                this.packageFolder = this.jhAppConfig.packageFolder;
                this.clientFramework = this.jhAppConfig.clientFramework;
                this.clientPackageManager = this.jhAppConfig.clientPackageManager;
                this.buildTool = this.jhAppConfig.buildTool;

                // use function in generator-base.js from generator-jhipster
                this.angularAppName = this.getAngularAppName();

                // use constants from generator-constants.js
                const javaDir = `${jhipsterConstants.SERVER_MAIN_SRC_DIR + this.packageFolder}/`;
                const javaTestDir = `${jhipsterConstants.SERVER_TEST_SRC_DIR + this.packageFolder}/`;
                // const resourceDir = jhipsterConstants.SERVER_MAIN_RES_DIR;
                // const webappDir = jhipsterConstants.CLIENT_MAIN_SRC_DIR;

                const entityName = this.entityConfig.entityClass;

                // do your stuff here
                // check if repositories are already annotated
                const uuidGeneratorAnnotation = '@GeneratedValue.*"UUIDGenerator"';
                const pattern = new RegExp(uuidGeneratorAnnotation, 'g');

                const content = this.fs.read(`${javaDir}domain/${entityName}.java`, 'utf8');

                if (!pattern.test(content)) {
                    // We need to convert this entity

                    // JAVA
                    this.convertIDtoUUIDForColumn(`${javaDir}domain/${entityName}.java`, '', 'id');

                    // DTO
                    if (fs.existsSync(`${javaDir}service/dto/${entityName}DTO.java`)) {
                        this.longToUUID(`${javaDir}service/dto/${entityName}DTO.java`);
                    }

                    // Mapper
                    if (fs.existsSync(`${javaDir}service/mapper/${entityName}Mapper.java`)) {
                        this.longToUUID(`${javaDir}service/mapper/${entityName}Mapper.java`);
                    }

                    // And the Repository
                    this.longToUUID(`${javaDir}repository/${entityName}Repository.java`);

                    // The Search Repository
                    if (fs.existsSync(`${javaDir}repository/search/${entityName}SearchRepository.java`)) {
                        this.longToUUID(`${javaDir}repository/search/${entityName}SearchRepository.java`);
                    }

                    // Service
                    if (fs.existsSync(`${javaDir}service/${entityName}Service.java`)) {
                        this.longToUUID(`${javaDir}service/${entityName}Service.java`);
                    }

                    // ServiceImp
                    if (fs.existsSync(`${javaDir}service/impl/${entityName}ServiceImpl.java`)) {
                        this.longToUUID(`${javaDir}service/impl/${entityName}ServiceImpl.java`);
                    }

                    // Resource
                    this.longToUUID(`${javaDir}web/rest/${entityName}Resource.java`);

                    // JavaScript
                    const entityNameSpinalCased = _s.dasherize(_s.decapitalize(entityName));
                    const stateFile = glob.sync(
                        `${this.webappDir}../webapp/app/entities/${entityNameSpinalCased}/${entityNameSpinalCased}*.state.js`
                    )[0];
                    this.replaceContent(
                        stateFile,
                        '{id:int}',
                        '{id:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}}',
                        'true'
                    );

                    // Liquidbase
                    const file = glob.sync(`src/main/resources/config/liquibase/changelog/*entity_${entityName}.xml`)[0];

                    this.replaceContent(file, 'type="bigint"', 'type="varchar(50)"', 'true');
                    this.replaceContent(file, 'type="BIGINT"', 'type="varchar(50)"', 'true');
                    this.replaceContent(file, 'type="numeric"', 'type="string"', 'true');
                    this.replaceContent(file, 'autoIncrement="\\$\\{autoIncrement\\}"', '', 'true');

                    // Test
                    // Handle the question of life check
                    this.replaceContent(
                        `${javaTestDir}/web/rest/${entityName}ResourceIT.java`,
                        '(42L|42)',
                        this.uuidString(42),
                        'true'
                    );
                    this.longToUUID(`${javaTestDir}/web/rest/${entityName}ResourceIT.java`);
                    this.replaceContent(
                        `${javaTestDir}/web/rest/${entityName}ResourceIT.java`,
                        '1L',
                        this.uuidString(1),
                        'true'
                    );
                    this.replaceContent(
                        `${javaTestDir}/web/rest/${entityName}ResourceIT.java`,
                        '2L',
                        this.uuidString(2),
                        'true'
                    );
                    this.replaceContent(
                        `${javaTestDir}/web/rest/${entityName}ResourceIT.java`,
                        'getId\\(\\)\\.intValue\\(\\)',
                        'getId().toString()',
                        'true'
                    );
                    this.replaceContent(
                        `${javaTestDir}/web/rest/${entityName}ResourceIT.java`,
                        '\\.intValue\\(\\)',
                        '.toString()',
                        'true'
                    );
                    this.replaceContent(`${javaTestDir}/web/rest/${entityName}ResourceIT.java`, 'MAX_VALUE', 'randomUUID()', 'true');

                    // domain Test
                    this.importUUID(`${javaTestDir}domain/${entityName}Test.java`);
                    this.replaceContent(
                        `${javaTestDir}domain/${entityName}Test.java`,
                        '1L',
                        this.uuidString(1),
                        'true'
                    );
                    this.replaceContent(
                        `${javaTestDir}domain/${entityName}Test.java`,
                        '2L',
                        this.uuidString(2),
                        'true'
                    );

                    for (let i = 10; i >= 1; i--) {
                        this.replaceContent(
                            `src/main/resources/config/liquibase/fake-data/${entityName.toLowerCase()}.csv`,
                            `\n${i};`,
                            `\n${this.uuidS(i)};`,
                            'true'
                        );
                    }

                    for (let i = 10; i >= 1; i--) {
                        this.replaceContent(
                            `src/main/resources/config/liquibase/fake-data/${entityName.toLowerCase()}.csv`,
                            `;${i}\n`,
                            `;${this.uuidS(i)}\n`,
                            'true'
                        );
                    }

                    for (let i = 10; i >= 1; i--) {
                        this.replaceContent(
                            `src/main/resources/config/liquibase/fake-data/${entityName.toLowerCase()}.csv`,
                            `;${i};`,
                            `;${this.uuidS(i)};`,
                            'true'
                        );
                    }
                }

                this.log(`${chalk.blue.bold('ENTITY!')} Update files complete...\n`);
            },

            writeFiles() {
                if (this.abort) {
                    return;
                }
                this.log(`${chalk.blue.bold('ENTITY!')} Write files complete...\n`);
            },

            updateConfig() {
                if (this.abort) {
                    return;
                }
                this.updateEntityConfig(this.entityConfig.filename, 'yourOptionKey', this.yourOptionKey);
                this.log(`${chalk.red.bold('yourOptionKey: ')}${JSON.stringify(this.yourOptionKey)}`);

                this.log(`${chalk.blue.bold('ENTITY!')} Update Config complete...\n`);
            },
        };
    }

    end() {
        if (this.abort) {
            return;
        }
        if (this.yourOptionKey) {
            this.log(`\n${chalk.bold.blue('mysql-uuid-converter enabled')}`);
        }

        this.log(`${chalk.blue.bold('ENTITY!')} End...\n`);
    }
};
