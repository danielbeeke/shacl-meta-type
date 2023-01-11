# SHACL meta type

Given a SHACL shape string, gives back the TypeScript types.

You also need to give an @vocab ontology alias.

## Usage

```TypeScript
import { Converter } from 'https://deno.land/x/shacl_meta_type@0.2/mod.ts'
// NPM module will be created when this all is more stable and finished.

const response = await fetch('https://deno.land/x/shacl_meta@0.3/shapes/Person.ttl')
const personShacl = await response.text()

const converter = new Converter()
const context = {
    'label': 'rdfs:label',
    'type': 'rdf:type',
    'name': 'foaf:name',
    'thumb': 'dbo:thumbnail'
}

const typeScriptTypes = await converter.transform(personShacl, 'dbp', context)

// Returns this as a string
export type selfPhilosopher = {
  label?: string | Array<string>;
  thumb: string;
  type: string;
  birthPlace?: Array<selfLocation>;
  birthDate?: Date;
}

export type selfLocation = {
  type: string;
  name: string;
}

```