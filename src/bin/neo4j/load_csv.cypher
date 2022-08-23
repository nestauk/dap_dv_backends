// files on linux system must be copied to /var/lib/neo4j/import for below to work
:param path => 'file:///<your_csv_file_here>';
CREATE INDEX URI_index IF NOT EXISTS FOR (n:Entity) ON (n.URI);

LOAD CSV WITH HEADERS FROM $path AS row
MERGE (a:Entity {URI: row.sourceNode, isSource: true});

LOAD CSV WITH HEADERS FROM $path AS row
MERGE (b:Entity {URI: row.abstractNode, isSource: false});

LOAD CSV WITH HEADERS FROM $path AS row
MATCH (a:Entity {URI: row.sourceNode})
MATCH (b:Entity {URI: row.abstractNode})
CREATE (a)<-[r:APPEARS_IN_ABSTRACT {confidence: toInteger(row.confidence)}]-(b);