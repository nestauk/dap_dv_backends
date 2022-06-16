## getOntology.mjs

Script to parse the DBpedia ontology. 

Fetches DBpedia classes and associated parent classes using a SPARQL query
to the DBPedia endpoint. We assure classes are from the DBpedia ontology using
the following predicate object combination: 
`rdfs:isDefinedBy <http://dbpedia.org/ontology/> .`,
The full SPARQL query can be found [here](getOntology.sparql).

Once the pairs of Class/Parent are fetched, the script then runs logic to
produce a flat, Object based representation of the hierarchy, where keys
are the class URIs, and the values take the form
```js
{
   parentClass: "parentURI",
   children: [
        "childURI",
        "childURI",
        ...
   ],
   URI: "URI of this class"
   depth: "Depth at which this class is found in the hierarcy"
}
```
The parsed ontology can be found [here](../../../data/dbpedia/ontology.json)