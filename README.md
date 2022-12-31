# SHACL meta type

Given a SHACL shape string, gives back the TypeScript types.

You also need to give an @vocab ontology alias.

## Usage

```TypeScript
await converter.transform(personShacl, 'dbp', {
    'label': 'rdfs:label',
    'type': 'rdf:type',
    'name': 'foaf:name',
    'thumb': 'dbo:thumbnail'
})
```