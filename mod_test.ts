import { Converter } from './mod.ts'
import { assertEquals } from 'https://deno.land/std@0.168.0/testing/asserts.ts'

const expectedType1 = `export type selfPhilosopher = {
  label?: string | Array<string>;
  thumb: string;
  type: string;
  birthPlace?: Array<selfLocation>;
  birthDate?: Date;
}
`

const expectedType2 = `export type selfLocation = {
  type: string;
  name: string;
}
`

Deno.test('Output of transform', async () => {
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

    assertEquals(typeScriptTypes[0].text, expectedType1)
    assertEquals(typeScriptTypes[1].text, expectedType2)

})