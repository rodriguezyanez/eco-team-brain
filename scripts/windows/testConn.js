var neo4j = require('neo4j-driver');
(async () => {
    // URI examples: 'neo4j://localhost', 'neo4j+s://xxx.databases.neo4j.io'
        const URI = 'bolt://16.59.85.22:7687'
    const USER = 'neo4j'
    const PASSWORD = 'teamBrain'
    let driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD))
    const serverInfo = await driver.getServerInfo()
    console.log('Connection established')
    console.log(serverInfo)

    // Use the driver to run queries

    await driver.close()
})();