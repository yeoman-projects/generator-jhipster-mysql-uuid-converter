'use strict';
const chalk = require('chalk');
const BaseGenerator = require('generator-jhipster/generators/generator-base');
const fs = require('fs');
const packagejs = require('../package.json');

const importAutoPlaces = [
    'import java.util.List;',
    'import java.util.Objects;',
    'import java.time.Instant;',
    'import java.io.Serializable;',
    'import java.util.Optional;',
    'import org.mapstruct.*;',
    'import org.springframework.data.jpa.repository.*;',
    'import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;',
    'import org.slf4j.LoggerFactory;'
];

const contentUUID = `
import java.util.UUID;`;

const contentForEntity = `
import org.hibernate.annotations.GenericGenerator;
import org.hibernate.annotations.Type;
import java.util.UUID;`;

const genContent = `@GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Type(type="uuid-char")`;

module.exports = class extends BaseGenerator {

    importUUID(file, importNeedle = '', forEntity = false) {
        const content = forEntity ? contentForEntity : contentUUID;
        const arrCheck = importNeedle ? [importNeedle] : importAutoPlaces;
        for(let i = 0; i < arrCheck.length; i++) {
            let importNeedle = arrCheck[i];
            if(this.replaceContent(file, importNeedle,
                `${importNeedle}${content}`,'true')) {
                break;
            }
        }
    }

    longToUUID(file, importNeedle = '', forEntity = false) {
        this.importUUID(file, importNeedle, forEntity);
        this.replaceContent(file, 'Long', 'UUID', 'true');
    }

    convertIDtoUUIDForColumn(file, importNeedle = '', columnName = '') {
        this.replaceContent(file, '@GeneratedValue.*', genContent, 'true');
        this.replaceContent(file, '.*@SequenceGenerator.*\n', '', 'true');
        this.longToUUID(file, importNeedle, true);
    }

    getEntityNames() {
        this.existingEntities = [];
        this.existingEntityChoices = [];
        let existingEntityNames = [];
        try {
            existingEntityNames = fs.readdirSync('.jhipster');
        } catch (e) {
            this.log(`${chalk.red.bold('ERROR!')} Could not read entities, you might not have generated any entities yet. I will continue to install audit files, entities will not be updated...\n`);
        }

        existingEntityNames.forEach((entry) => {
            if (entry.indexOf('.json') !== -1) {
                const entityName = entry.replace('.json', '');
                this.existingEntities.push(entityName);
                this.existingEntityChoices.push({
                    name: entityName,
                    value: entityName
                });
            }
        });
    }

    printConverterLogo() {
        this.log('\n');
        this.log(`${chalk.blue('  ███╗   ███╗██╗   ██╗ █████╗ █████╗ ║██     ║██   ██╗║██   ██╗██████╗██████╗ ')}`);
        this.log(`${chalk.blue('  ████╗ ████║ ██╗ ██╔╝██╔═══╝██   ██║║██     ║██   ██║║██   ██║╚═██╔═╝██   ██╗')}`);
        this.log(`${chalk.blue('  ██╔████╔██║  ████╔╝ ╚████╗ ██   ██║║██     ║██   ██║║██   ██║  ██║  ██   ██║')}`);
        this.log(`${chalk.blue('  ██║╚██╔╝██║  ╚██╔╝   ╚══██╗██   ██║║██     ║██   ██║║██   ██║  ██║  ██   ██║')}`);
        this.log(`${chalk.blue('  ██║ ╚═╝ ██║   ██║   █████╔╝║████ ╔╝ ╚████║  ╚█████╔╝ ╚█████╔╝██████╗█████╔═╝')}`);
        this.log(`${chalk.blue('  ╚═╝     ╚═╝   ╚═╝   ╚════╝ ╚════██   ╚═══╝   ╚════╝   ╚════╝ ╚═════╝╚════╝  ')}\n`);
        this.log(`\nWelcome to the ${chalk.bold.yellow('JHipster mysql-uuid')} converter! ${chalk.yellow(`v${packagejs.version}\n`)}`);
    }
};

