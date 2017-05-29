import {CodeGenerator} from "../../domain/codeGeneration/CodeGenerator";
import ClassScheme from "../../domain/schema/schema/ClassScheme";
import SourceCode from "../../domain/codeGeneration/SourceCode";
import StringType from "../../domain/schema/types/StringType";
import NumberType from "../../domain/schema/types/NumberType";
import AnyType from "../../domain/schema/types/AnyType";
import BooleanType from "../../domain/schema/types/BooleanType";
import CustomType from "../../domain/schema/types/CustomType";
import {Type} from "../../domain/schema/types/Type";
import VectorType from "../../domain/schema/types/VectorType";
import {toCamelCase} from "./Utils";
import ApiMethodScheme from "../../domain/schema/schema/ApiMethodScheme";
import IntBoolType from "../../domain/schema/types/IntBoolType";
import SourceFile from "../../domain/codeGeneration/SourceFile";

export default class TypescriptCodeGenerator implements CodeGenerator {
    public generateClass(scheme: ClassScheme): SourceFile {
        let code = new SourceCode()
        let imports = this.generateImports(scheme)
        let constructor = this.generateClassConstructor(scheme)
        let deserializeMethod = this.generateDeserializeMethod(scheme)
        let serializeMethod = this.generateSerializeMethod(scheme)

        code.append(imports)
        if (imports.lines.length > 0)
            code.add('')
        code.add(`export default class ${scheme.name} {`)
        code.append(constructor, 1)
        code.add('')
        code.append(deserializeMethod, 1)
        code.add('')
        code.append(serializeMethod, 1)
        code.add('}')

        return new SourceFile(`${scheme.name}.ts`, code)
    }

    public generateApiMethod(scheme: ApiMethodScheme): SourceCode {
        let code = new SourceCode()

        let methodName = toCamelCase(scheme.name, false, '.')
        let propsName = `MethodsProps.${toCamelCase(scheme.name, true, '.')}Params`
        let responseName = this.renderType(scheme.responseType, true)


        /**
         * Returns detailed information on users.
         *
         *
         * @param {{
         *   subview:string,
         *   el:(number|Element)
         * }} params
         */

        code.add(`/**`)
        code.add(` * ${scheme.description}`)
        code.add(' *')
        code.add(' * @param {{')
        scheme.params.forEach((param, index) => {
            let coma = this.genComa(scheme.params, index)

            code.add(` *   ${toCamelCase(param.name)}: (${this.renderType(param.type, true)}${param.required ? '' : '|undefined'})${coma}`)
        })
        code.add(' * }} params')
        code.add(' *')
        code.add(` * @returns {Promise<Responses.${responseName}>}`)
        code.add(` */`)
        code.add(`public async ${methodName}(params: ${propsName}): Promise<Responses.${responseName}> {`)
        code.add('return this.call(', 1)
        code.add(`'${scheme.name}',`, 2)
        code.add(`{`, 2)
        scheme.params.forEach((param, index) => {
            let coma = this.genComa(scheme.params, index)

            code.add(`${param.name}: params.${toCamelCase(param.name)}${coma}`, 3)
        })
        code.add(`},`, 2)
        code.add(`Responses.${responseName}`, 2)
        code.add(')', 1)
        code.add('}')

        return code
    }

    public generateApiMethodParamsInterface(scheme: ApiMethodScheme): SourceCode {
        let code = new SourceCode()

        code.add(`export interface ${toCamelCase(scheme.name, true, '.')}Params {`)

        scheme.params.forEach((prop, index) => {
            let coma = this.genComa(scheme.params, index)
            let isCustom = this.isCustomType(prop.type)

            code.add(`/**`, 1)
            code.add(` * ${prop.description}`, 1)
            code.add(` */`, 1)
            code.add(`${toCamelCase(prop.name)}${prop.required ? '' : '?'}: ${isCustom ? 'Models.' : ''}${this.renderType(prop.type, true)}${coma}`, 1)
        })

        code.add('}')

        return code
    }

    private generateImports(scheme: ClassScheme): SourceCode {
        let code = new SourceCode()

        scheme.fields.forEach((field, index) => {
            let customType = this.getCustomType(field.type)

            if (customType) {
                code.add(`import ${customType.name} from './${customType.name}'`)
            }
        })

        return code
    }

    private generateClassConstructor(scheme: ClassScheme): SourceCode {
        let code = new SourceCode()
        let jsdoc = this.generateClassConstructorJSDoc(scheme)

        code.append(jsdoc)

        code.add('constructor (')

        scheme.fields.forEach((field, index) => {
            let coma = this.genComa(scheme.fields, index)

            code.add(`readonly ${toCamelCase(field.name)}: ${this.renderType(field.type)}${coma}`, 1)
        })

        code.add(') {')
        code.add('')
        code.add('}')

        return code
    }

    private generateClassConstructorJSDoc(scheme: ClassScheme): SourceCode {
        let code = new SourceCode()

        code.add('/**')
        code.add(' * @class')

        scheme.fields.forEach(field => {
            code.add(` * @property {${this.renderType(field.type)}} ${toCamelCase(field.name)} ${field.description}`)
        })

        code.add(' */')

        return code
    }

    private generateDeserializeMethod(scheme: ClassScheme): SourceCode {
        let code = new SourceCode()

        code.add('/**')
        code.add(' * @param {Object} raw')
        code.add(` * @returns {${scheme.name}}`)
        code.add(' */')

        code.add(`static deserialize(raw: any): ${scheme.name} {`)
        code.add(`return new ${scheme.name} (`, 1)

        scheme.fields.forEach((field, index) => {
            let coma = this.genComa(scheme.fields, index)
            let fieldVar = `raw['${field.name}']`

            if (field.type instanceof VectorType)
                code.add(this.renderVectorDeserialize(fieldVar, field.type) + coma, 2)
            else if (field.type instanceof CustomType)
                code.add(`${fieldVar} ? ${field.type.name}.deserialize(${fieldVar}) : undefined${coma}`, 2)
            else if (field.type instanceof IntBoolType)
                code.add(`!!${fieldVar}${coma}`, 2)
            else
                code.add(fieldVar + coma, 2)
        })

        code.add(`)`, 1)
        code.add('}')

        return code
    }

    private generateSerializeMethod(scheme: ClassScheme): SourceCode {
        let code = new SourceCode()

        code.add('/**')
        code.add(` * @returns {Object}`)
        code.add(' */')

        code.add(`public serialize(): Object {`)

        code.add(`return {`, 1)


        scheme.fields.forEach((field, index) => {
            let coma = this.genComa(scheme.fields, index)
            let fieldVar = `${field.name}: this.${toCamelCase(field.name)}`

            if (field.type instanceof VectorType)
                code.add(`${field.name}: ${this.renderVectorSerialize(`this.${toCamelCase(field.name)}`, field.type) + coma}`, 2)
            else if (field.type instanceof CustomType)
                code.add(`${fieldVar} ? this.${toCamelCase(field.name)}.serialize() : undefined${coma}`, 2)
            else
                code.add(fieldVar + coma, 2)
        })


        code.add('}', 1)
        code.add('}')

        return code
    }

    private renderType(type: Type, withoutUndefined = false): string {
        if (type instanceof StringType)
            return 'string'

        if (type instanceof NumberType)
            return 'number'

        if (type instanceof AnyType)
            return 'any'

        if (type instanceof BooleanType)
            return 'boolean'

        if (type instanceof IntBoolType)
            return 'boolean'

        if (type instanceof CustomType)
            return type.name + `${!withoutUndefined ? '|undefined' : ''}`

        if (type instanceof VectorType) {
            return this.renderType(type.item, true) + `[]${!withoutUndefined ? '|undefined' : ''}`
        }

        throw new Error('UNSUPPORTED TYPE' + JSON.stringify(type))
    }

    private genComa(list: any[], index: number): string {
        return (index == list.length - 1) ? '' : ','
    }

    private renderVectorDeserialize(value: string, type: Type): string {
        let code = ''

        if (type instanceof VectorType)
            code += `${value} ? ${value}.map((v: any) => ${this.renderVectorDeserialize('v', type.item)}) : undefined`
        else if (type instanceof CustomType)
            code += `${value} ? ${type.name}.deserialize(${value}) : undefined`
        else
            code += value

        return code
    }

    private renderVectorSerialize(value: string, type: Type): string {
        let code = ''

        if (type instanceof VectorType)
            code += `${value} ? ${value}.map((v: any) => ${this.renderVectorSerialize('v', type.item)}) : undefined`
        else if (type instanceof CustomType)
            code += `${value}.serialize()`
        else
            code += value

        return code
    }

    private isCustomType(type: Type): boolean {
        if (type instanceof CustomType)
            return true
        if (type instanceof VectorType)
            return this.isCustomType(type.item)

        return false
    }

    private getCustomType(type: Type): CustomType | null {
        if (type instanceof VectorType)
            return this.getCustomType(type.item)
        if (type instanceof CustomType)
            return type

        return null
    }
}