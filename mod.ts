import { ParserOutput, ShaclProperty } from 'https://deno.land/x/shacl_meta@0.4/types.ts'
import { Parser } from 'https://deno.land/x/shacl_meta@0.4/mod.ts'
import { ContextParser, JsonLdContextNormalized } from 'npm:jsonld-context-parser'

export class Converter {

    /**
     * Converts a SHACL shape to TypeScript types.
     */
    async transform (shaclString: string, vocabAlias?: string, context: { [key: string]: string } = {}) {
        const parser = new Parser()
        const metas = await parser.parse(shaclString)
        const prefixes = { ...parser.shaclParser._prefixes, ...context }
        if (vocabAlias) prefixes['@vocab'] = parser.shaclParser._prefixes![vocabAlias]

        const contextParser = new ContextParser({
            skipValidation: true,
            expandContentTypeToBase: true,
        })

        return this.stringify(metas, await contextParser.parse(prefixes))
    }

    /**
     * Converts the metas to TypeScript types.
     */
    stringify (shapeMetas: ParserOutput, context: JsonLdContextNormalized) {
        const types: Array<{ text: string, iri: string, name: string }> = []

        for (const [iri, shapeMeta] of Object.entries(shapeMetas)) {
            let typeString = ''

            for (const shapeProperty of shapeMeta.properties) {
                typeString += '\n' + this.processPropery(shapeProperty, context)
            }

            const name = this.createTypeName(iri, context)

            types.push({
                text: `export type ${name} = {${typeString}\n}\n`,
                iri,
                name
            })
        }    

        return types
    }

    /**
     * The type names themselves should not have a colon.
     */
    createTypeName (iri: string, context: JsonLdContextNormalized) {
        const compactedIri = context.compactIri(iri, true)
        return compactedIri.replaceAll(':', '')
    }
    
    rdfToJsType = (iri: string) => {
        if (iri === 'http://www.w3.org/2001/XMLSchema#date') return 'Date'
        if (iri === 'http://www.w3.org/2001/XMLSchema#integer') return 'number'
        if (iri === 'http://www.w3.org/2001/XMLSchema#string') return 'string'
        if (iri === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString') return 'string'
    }
    
    /**
     * Processes one shacl property.
     */
    processPropery (shaclPropery: ShaclProperty, context: JsonLdContextNormalized, indent = '  ', typeOnly = false) {
        const name = shaclPropery.predicate ? context.compactIri(shaclPropery.predicate as string, true) : ''
        const required = !!shaclPropery.required as boolean
        const multiple = !!shaclPropery.multiple as boolean

        const nodeType = shaclPropery.nodeType as string ?? null
        const nodeTypeCompacted = nodeType ? this.createTypeName(nodeType, context) : null

        const dataType = shaclPropery.dataType ? this.rdfToJsType(shaclPropery.dataType as string) : null

        const strictType = nodeTypeCompacted ? nodeTypeCompacted : (dataType ?? 'string')

        let type = `${multiple ? 'Array<' : ''}${strictType}${multiple ? '>' : ''}`

        /**
         * At the moment this OR (sh:or) logic only supports alternative types. 
         * It is not possible to make more complex alternative nested types.
         */
        if (shaclPropery.or) {
            const nestedProperties = shaclPropery.or as unknown as Array<any>
            // We do not allow nested sh:or
            const nestedTypes: Array<string> = nestedProperties
                .map(nestedProperty => this.processPropery(nestedProperty, context, indent, true)) as Array<string>
            const nestedTypesSet = new Set(nestedTypes)
            type = [...nestedTypesSet.values()].join(' | ')
        }

        if (typeOnly) return type
        return `${indent}${name}${required ? '' : '?'}: ${type};`
    }
}
