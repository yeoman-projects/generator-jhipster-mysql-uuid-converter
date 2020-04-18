'use strict';
const chalk = require('chalk');
const glob = require('glob');

const packagejs = require('../../package.json');
const semver = require('semver');

const jhipsterConstants = require('generator-jhipster/generators/generator-constants');
const _ = require('lodash');

const BaseGenerator = require('../common');

module.exports = class extends BaseGenerator {
    get initializing() {
        return {

            init(args) {
                if (args === 'default') {

                }
                this.registerPrettierTransform();

                this.log(`${chalk.blue.bold('App!')} Init complete...\n`);
            },

            readConfig() {
                this.jhAppConfig = this.getAllJhipsterConfig();

                if (!this.jhAppConfig) {
                    this.error('Can\'t read .yo-rc.json');
                }

                this.log(`${chalk.blue.bold('App!')} Read Config complete...\n`);
            },

            checkDBType() {
                if (this.jhAppConfig.databaseType !== 'sql') {
                    // exit if DB type is not SQL
                    this.abort = true;
                }
                this.log(`${chalk.blue.bold('App!')} Check DB complete...\n`);
            },

            displayLogo() {
                this.printConverterLogo();
            },

            checkJHVersion() {
                const jhipsterVersion = this.jhAppConfig.jhipsterVersion;
                const minimumJhipsterVersion = packagejs.dependencies['generator-jhipster'];
                if (!semver.satisfies(jhipsterVersion, minimumJhipsterVersion)) {
                    this.warning(`\nYour generated project used an old JHipster version (${jhipsterVersion})... you need at least (${minimumJhipsterVersion})\n`);
                }

                this.log(`${chalk.blue.bold('App!')} Check JH Version complete...\n`);
            }
        };
    }

    prompting() {
        const prompts = [];
        const done = this.async();
        this.prompt(prompts)
            .then((props) => {
                this.props = props;
                // To access props later use this.props.someOption;

                done();
            });
    }

    get writing() {

        return {
            updateYeomanConfig() {
                // this.config.set('auditFramework', this.auditFramework);
                //                 // this.config.set('auditPage', this.auditPage);

                this.log(`${chalk.green.bold('App!')} Update Yeoman Config complete...\n`);
            },

            setupGlobalVar() {
                // read config from .yo-rc.json
                this.baseName = this.jhAppConfig.baseName;
                this.packageName = this.jhAppConfig.packageName;
                this.buildTool = this.jhAppConfig.buildTool;
                this.databaseType = this.jhAppConfig.databaseType;
                this.devDatabaseType = this.jhAppConfig.devDatabaseType;
                this.prodDatabaseType = this.jhAppConfig.prodDatabaseType;
                this.enableTranslation = this.jhAppConfig.enableTranslation;
                this.languages = this.jhAppConfig.languages;
                this.clientFramework = this.jhAppConfig.clientFramework;
                this.hibernateCache = this.jhAppConfig.hibernateCache;
                this.packageFolder = this.jhAppConfig.packageFolder;
                this.clientPackageManager = this.jhAppConfig.clientPackageManager;
                this.cacheProvider = this.jhAppConfig.cacheProvider;
                this.skipFakeData = this.jhAppConfig.skipFakeData;
                this.skipServer = this.jhAppConfig.skipServer;
                this.skipClient = this.jhAppConfig.skipClient;

                // use function in generator-base.js from generator-jhipster
                this.angularAppName = this.getAngularAppName();
                this.angularXAppName = this.getAngularXAppName();
                this.changelogDate = this.dateFormatForLiquibase();
                this.jhiPrefix = this.jhAppConfig.jhiPrefix;
                this.jhiPrefixDashed = _.kebabCase(this.jhiPrefix);
                this.jhiTablePrefix = this.getTableName(this.jhiPrefix);

                // use constants from generator-constants.js
                this.webappDir = jhipsterConstants.CLIENT_MAIN_SRC_DIR;
                this.javaTemplateDir = 'src/main/java/package';
                this.javaDir = `${jhipsterConstants.SERVER_MAIN_SRC_DIR + this.packageFolder}/`;
                this.resourceDir = jhipsterConstants.SERVER_MAIN_RES_DIR;
                this.interpolateRegex = jhipsterConstants.INTERPOLATE_REGEX;
                this.javaTestDir = `${jhipsterConstants.SERVER_TEST_SRC_DIR + this.packageFolder}/`;

                // variable from questions
                this.message = this.props.message;

                this.log(`${chalk.green.bold('App!')} Setup Global Var complete...\n`);
            },

            writeBaseFiles() {
                const javaDir = this.javaDir;
                const javaTestDir = this.javaTestDir;
                const webappDir = this.webappDir;
                const resourceDir = this.resourceDir;

                // show all variables
                this.log('\n--- some config read from config ---');
                this.log(`baseName=${this.baseName}`);
                this.log(`packageName=${this.packageName}`);
                this.log(`clientFramework=${this.clientFramework}`);
                this.log(`clientPackageManager=${this.clientPackageManager}`);
                this.log(`buildTool=${this.buildTool}`);

                this.log('\n--- some function ---');
                this.log(`angularAppName=${this.angularAppName}`);

                this.log('\n--- some const ---');
                this.log(`javaDir=${javaDir}`);
                this.log(`resourceDir=${resourceDir}`);
                this.log(`webappDir=${webappDir}`);

                this.log('\n--- variables from questions ---');
                this.log(`\nmessage=${this.message}`);
                this.log('------\n');

                // Convert Code here
                this.convertIDtoUUIDForColumn(`${javaDir}domain/User.java`, '', 'id');
                this.convertIDtoUUIDForColumn(`${javaDir}domain/PersistentAuditEvent.java`, '', 'event_id');

                // And the Repository
                this.longToUUID(`${javaDir}repository/UserRepository.java`);
                this.longToUUID(`${javaDir}repository/PersistenceAuditEventRepository.java`);

                // And the Service
                this.longToUUID(`${javaDir}service/AuditEventService.java`);
                this.replaceContent(`${javaDir}service/UserService.java`, 'getUserWithAuthorities(Long id)', 'getUserWithAuthorities(UUID id)');
                this.importUUID(`${javaDir}service/mapper/UserMapper.java`);
                this.replaceContent(`${javaDir}service/mapper/UserMapper.java`, 'userFromId(Long id)', 'userFromId(UUID id)');
                this.longToUUID(`${javaDir}service/mapper/UserMapper.java`);
                this.longToUUID(`${javaDir}service/UserService.java`);

                // And the Web
                this.importUUID(`${javaDir}web/rest/AuditResource.java`);
                this.replaceContent(`${javaDir}web/rest/AuditResource.java`, 'get(@PathVariable Long id)', 'get(@PathVariable UUID id)');
                this.longToUUID(`${javaDir}web/rest/vm/ManagedUserVM.java`);
                this.longToUUID(`${javaDir}service/dto/UserDTO.java`);

                // Tests
                this.replaceContent(`${javaTestDir}web/rest/UserResourceIT.java`, 'Long', 'UUID', 'true');

                this.replaceContent(`${javaTestDir}web/rest/UserResourceIT.java`, '1L', 'UUID.fromString("00000000-0000-0000-0000-000000000001")', 'true');
                this.replaceContent(`${javaTestDir}web/rest/UserResourceIT.java`, '2L', 'UUID.fromString("00000000-0000-0000-0000-000000000002")', 'true');

                this.importUUID(`${javaTestDir}web/rest/AuditResourceIT.java`);
                this.replaceContent(`${javaTestDir}web/rest/AuditResourceIT.java`, '1L', 'UUID.fromString("00000000-0000-0000-0000-000000000001")', 'true');
                this.replaceContent(`${javaTestDir}web/rest/AuditResourceIT.java`, '2L', 'UUID.fromString("00000000-0000-0000-0000-000000000002")', 'true');

                this.longToUUID(`${javaTestDir}service/mapper/UserMapperTest.java`);
                this.replaceContent(`${javaTestDir}service/mapper/UserMapperTest.java`, '1L', 'UUID.fromString("00000000-0000-0000-0000-000000000001")', 'true');

                const file = glob.sync('src/main/resources/config/liquibase/changelog/*initial_schema.xml')[0];

                this.replaceContent(file, 'type="bigint"', 'type="varchar(50)"', 'true');
                this.replaceContent(file, 'type="BIGINT"', 'type="varchar(50)"', 'true');
                this.replaceContent(file, 'type="numeric"', 'type="string"', 'true');
                this.replaceContent(file, 'autoIncrement="\\$\\{autoIncrement\\}"', '', 'true');

                this.replaceContent('src/main/resources/config/liquibase/data/user.csv', '1;', '8d9b707a-ddf4-11e5-b86d-9a79f06e9478;', 'true');
                this.replaceContent('src/main/resources/config/liquibase/data/user.csv', '2;', '8d9b7412-ddf4-11e5-b86d-9a79f06e9478;', 'true');
                this.replaceContent('src/main/resources/config/liquibase/data/user.csv', '3;', '8d9b77f0-ddf4-11e5-b86d-9a79f06e9478;', 'true');
                this.replaceContent('src/main/resources/config/liquibase/data/user.csv', '4;', '8d9b79c6-ddf4-11e5-b86d-9a79f06e9478;', 'true');

                this.replaceContent('src/main/resources/config/liquibase/data/user_authority.csv', '1;', '8d9b707a-ddf4-11e5-b86d-9a79f06e9478;', 'true');
                this.replaceContent('src/main/resources/config/liquibase/data/user_authority.csv', '3;', '8d9b77f0-ddf4-11e5-b86d-9a79f06e9478;', 'true');
                this.replaceContent('src/main/resources/config/liquibase/data/user_authority.csv', '4;', '8d9b79c6-ddf4-11e5-b86d-9a79f06e9478;', 'true');

                this.log(`${chalk.green.bold('App!')} Update of core files complete...\n`);
            },

            updateFiles() {
                this.log(`${chalk.green.bold('App!')} Update files complete...\n`);
            },

            writeFiles() {
                this.log(`${chalk.green.bold('App!')} Write files complete...\n`);
            },

            updateEntityFiles() {
                this.log(`${chalk.green.bold('App!')} Update Entity files complete...\n`);
            },

            registering() {
                // Register this generator as a dev dependency
                // this.addNpmDevDependency('generator-jhipster-mysql-uuid-converter', packagejs.version);

                this.addNpmDependency('semver', '^7.0.0');

                // this.addNpmDevDependency('generator-jhipster-mysql-uuid-converter', packagejs.repository.url.replace('git+',''));

                // Register post-app and post-entity hook
                try {
                    // this.registerModule('generator-jhipster-mysql-uuid-converter', 'app', 'post', 'app', 'mysql Long to UUID converter');
                    this.registerModule('generator-jhipster-mysql-uuid-converter', 'entity', 'post', 'entity', 'mysql Long to UUID converter');
                    this.log(`${chalk.green.bold('App!')} Registering complete...\n`);
                } catch (err) {
                    this.log(`${chalk.red.bold('WARN!')} Could not register as a jhipster post app and entity creation hook......\n`);
                }
            }
        };
    }

    install() {
        const logMsg =
            `To install your dependencies manually, run: ${chalk.yellow.bold(`${this.clientPackageManager} install`)}`;

        const injectDependenciesAndConstants = (err) => {
            if (err) {
                this.warning('Install of dependencies failed!');
                this.log(logMsg);
            } else if (this.clientFramework === 'angularX') {
                this.spawnCommand(this.clientPackageManager, ['webpack:build']);
            }
        };

        const installConfig = {
            npm: this.clientPackageManager !== 'yarn',
            yarn: this.clientPackageManager === 'yarn',
            bower: false,
            callback: injectDependenciesAndConstants
        };

        if (this.options['skip-install']) {
            this.log(logMsg);
        } else {
            this.installDependencies(installConfig);
        }

        this.log(`\n${chalk.bold.green('App Install complete...')}`);
    }

    end() {
        this.log(`\n${chalk.bold.green('End of mysql-uuid-converter generator')}`);
        this.log(`\n${chalk.bold.green('I\'m running webpack now')}`);
    }
};
