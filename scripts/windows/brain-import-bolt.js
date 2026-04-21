#!/usr/bin/env node
// brain-import-bolt.js — Importa y mergea un export JSON en Neo4j via Bolt (compatible con Aura)
//
// Uso:
//   node brain-import-bolt.js --file <archivo.json> --uri <neo4j+s://...> --user neo4j --pass <password>
//
// Requiere: npm install neo4j-driver  (solo una vez en esta carpeta)

const neo4j = require('neo4j-driver');
const fs    = require('fs');

const args = process.argv.slice(2);
const get  = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };

const file = get('--file');
const uri  = get('--uri');
const user = get('--user') || 'neo4j';
const pass = get('--pass');
const db   = get('--db')   || 'neo4j';

if (!file || !uri || !pass) {
    console.error('\nUso: node brain-import-bolt.js --file <archivo.json> --uri <neo4j+s://...> --user neo4j --pass <password>\n');
    process.exit(1);
}

async function main() {
    const raw     = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
    const data    = JSON.parse(raw);
    const driver  = neo4j.driver(uri, neo4j.auth.basic(user, pass), {
        maxConnectionPoolSize: 1,
        connectionAcquisitionTimeout: 60000,
        maxTransactionRetryTime: 30000
    });
    const session = driver.session({ database: db });

    console.log('\nTeam Brain -- Importacion y merge de grafo (Bolt)');
    console.log('');
    console.log(`   Archivo    : ${file}`);
    console.log(`   Exportado  : ${data.meta?.exportedAt ?? 'N/A'}`);
    console.log(`   Origen     : ${data.meta?.exportedBy ?? 'N/A'} / ${data.meta?.exportedByUser ?? 'N/A'}`);
    console.log(`   Entidades  : ${data.meta?.entityCount ?? data.entities?.length ?? 0}`);
    console.log(`   Relaciones : ${data.meta?.connectionCount ?? data.connections?.length ?? 0}`);
    console.log('');

    console.log('   Conectando a Neo4j...\n');

    let entNew = 0, entUpd = 0, entSkip = 0, propsAdded = 0;

    console.log('   Procesando entidades...');
    for (const entity of (data.entities ?? [])) {
        try {
            const checkResult = await session.run(
                'MATCH (e:Entity {name: $name}) RETURN properties(e) AS props',
                { name: entity.name }
            );

            const incomingProps = entity.properties
                ? { ...entity.properties }
                : { name: entity.name, entityType: entity.entityType };

            if (checkResult.records.length === 0) {
                await session.run(
                    'MERGE (e:Entity {name: $name}) SET e += $props',
                    { name: entity.name, props: incomingProps }
                );
                entNew++;
                propsAdded += Object.keys(incomingProps).length;
                console.log(`   [NEW]  ${entity.name}`);
            } else {
                const masterProps = checkResult.records[0].get('props');
                const newProps = {};
                for (const key of Object.keys(incomingProps)) {
                    if (!(key in masterProps)) newProps[key] = incomingProps[key];
                }
                if (Object.keys(newProps).length > 0) {
                    await session.run(
                        'MATCH (e:Entity {name: $name}) SET e += $newProps',
                        { name: entity.name, newProps }
                    );
                    entUpd++;
                    propsAdded += Object.keys(newProps).length;
                    console.log(`   [UPD]  ${entity.name} (+${Object.keys(newProps).length} props: ${Object.keys(newProps).join(', ')})`);
                } else {
                    entSkip++;
                }
            }
        } catch (err) {
            console.error(`   [FAIL] ${entity.name}: ${err.message}`);
        }
    }

    console.log('');
    console.log(`   Entidades nuevas       : ${entNew}`);
    console.log(`   Entidades actualizadas : ${entUpd}`);
    console.log(`   Entidades sin cambios  : ${entSkip}`);
    console.log(`   Propiedades agregadas  : ${propsAdded}`);
    console.log('');

    console.log('   Procesando relaciones...');
    let relNew = 0, relSkip = 0;

    for (const conn of (data.connections ?? [])) {
        try {
            const relType = conn.relationType.replace(/[^A-Z0-9_]/g, '_');

            const checkRel = await session.run(
                `MATCH (a:Entity {name: $from})-[r:${relType}]->(b:Entity {name: $to}) RETURN count(r) AS cnt`,
                { from: conn.from, to: conn.to }
            );

            const exists = checkRel.records[0]?.get('cnt').toNumber() > 0;
            if (!exists) {
                await session.run(
                    `MATCH (a:Entity {name: $from}), (b:Entity {name: $to}) MERGE (a)-[:${relType}]->(b)`,
                    { from: conn.from, to: conn.to }
                );
                relNew++;
                console.log(`   [NEW]  ${conn.from} -[${relType}]-> ${conn.to}`);
            } else {
                relSkip++;
            }
        } catch (err) {
            console.error(`   [FAIL] ${conn.from} -> ${conn.to}: ${err.message}`);
        }
    }

    console.log('');
    console.log(`   Relaciones nuevas        : ${relNew}`);
    console.log(`   Relaciones ya existentes : ${relSkip}`);
    console.log('');
    console.log('======================================================');
    console.log('   Import completado.');
    console.log(`   Entidades  : ${entNew} nuevas, ${entUpd} actualizadas, ${entSkip} sin cambios`);
    console.log(`   Relaciones : ${relNew} nuevas, ${relSkip} sin cambios`);
    console.log(`   Propiedades agregadas: ${propsAdded}`);
    console.log('======================================================\n');

    await session.close();
    await driver.close();
}

main().catch(err => {
    console.error('\n[ERROR]', err.message);
    process.exit(1);
});
