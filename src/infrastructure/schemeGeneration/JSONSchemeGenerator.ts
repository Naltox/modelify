import {SchemeGenerator} from "../../domain/schemeGeneration/SchemeGenerator";
import ClassScheme from "../../domain/schema/schema/ClassScheme";
import JSONSchemeSource from "./sources/JSONSchemeSource";
import {Type} from "../../domain/schema/types/Type";
import CustomType from "../../domain/schema/types/CustomType";
import VectorType from "../../domain/schema/types/VectorType";
import NumberType from "../../domain/schema/types/NumberType";
import StringType from "../../domain/schema/types/StringType";
import BooleanType from "../../domain/schema/types/BooleanType";
import AnyType from "../../domain/schema/types/AnyType";
import ClassField from "../../domain/schema/schema/ClassField";
import {toCamelCase} from "../codeGeneration/Utils";

export default class JSONSchemeGenerator extends SchemeGenerator {
    public generate(source: JSONSchemeSource): ClassScheme[] {
        return this.json2scheme(source.jsonData)
    }

    private json2scheme(
        json: Object,
        name: string = 'Root',
        schemesByName: { [key: string]: ClassScheme } = {}
    ): ClassScheme[] {
        let schemes: ClassScheme[] = []
        let fields: ClassField[] = []

        for (let key in json) {
            let value = (json as any)[key]

            let type = this.genTypeForPrimitive((json as any)[key], toCamelCase(key, true))

            let customType = this.hasCustomType(type, value)

            if (customType) {
                let customTypeSchemes: ClassScheme[]

                if (value instanceof Array) {
                    customTypeSchemes = this.json2scheme(customType.value, toCamelCase(key, true), schemesByName)
                }
                else
                    customTypeSchemes = this.json2scheme(value, toCamelCase(key, true), schemesByName)

                // get scheme for current key (its the last one)
                let scheme = customTypeSchemes[customTypeSchemes.length - 1]
                // remove last scheme
                customTypeSchemes = customTypeSchemes.slice(0, customTypeSchemes.length - 1)

                if (schemesByName[scheme.name]) {
                    if (!this.isClassSchemesEqual(schemesByName[scheme.name], scheme)) {
                        // if we had that name and schemes are not the same -> we change name
                        let newName = toCamelCase(key + this.getRandomInt(1, 1000), true)

                        customTypeSchemes.push(new ClassScheme(newName, scheme.fields))
                        type = this.genTypeForPrimitive((json as any)[key], newName)
                    }
                }
                else
                    customTypeSchemes.push(scheme)

                schemesByName[scheme.name] = scheme

                schemes.push(...customTypeSchemes)
            }

            fields.push(
                new ClassField(
                    key,
                    type,
                    ''
                )
            )
        }

        schemes.push(new ClassScheme(name, fields))

        return schemes
    }

    private genTypeForPrimitive(value: any, name: string): Type {
        let type = typeof value

        if (type == 'string')
            return new StringType()
        if (type == 'number')
            return new NumberType()
        if (type == 'boolean')
            return new BooleanType()
        if (value == null || value == undefined)
            return new AnyType()
        if (value instanceof Array) {
            if (value.length == 0)
                return new VectorType(new AnyType())

            let isUniform = true
            let prevType: Type|null = null
            let prevItem: any|null

            for (let item of value) {
                let type = this.genTypeForPrimitive(item, name)

                if (prevType && !this.isTypeEqual(type, prevType))
                    isUniform = false

                if (
                    prevItem &&
                    type instanceof CustomType &&
                    !this.isObjectsEqual(prevItem, item)
                )
                    isUniform = false

                prevType = type
                prevItem = item
            }

            if (isUniform)
                return new VectorType(prevType as Type)

            return new VectorType(new AnyType())
        }
        if (value instanceof Object) {
            return new CustomType(name)
        }

        throw new Error('Unknown type for value:' + value)
    }

    private isTypeEqual(firstType: Type, secondType: Type): boolean {
        if (
            firstType instanceof NumberType &&
            secondType instanceof NumberType
        )
            return true

        if (
            firstType instanceof StringType &&
            secondType instanceof StringType
        )
            return true

        if (
            firstType instanceof BooleanType &&
            secondType instanceof BooleanType
        )
            return true

        if (
            firstType instanceof VectorType &&
            secondType instanceof VectorType
        ) {
            return this.isTypeEqual(firstType.item, secondType.item)
        }

        if (
            firstType instanceof CustomType &&
            secondType instanceof CustomType
        )
            return firstType.name == secondType.name

        return false
    }

    private isObjectsEqual(firstObject: object, secondObject: object): boolean {
        let firstObjectKeys = Object.keys(firstObject)
        let secondObjectKeys = Object.keys(secondObject)

        if (firstObjectKeys.length != secondObjectKeys.length)
            return false

        for (let key in firstObjectKeys) {
            let firstObjectKey = firstObjectKeys[key]
            let secondObjectKey = secondObjectKeys[key]

            if (firstObjectKey !== secondObjectKey)
                return false

            let firstType = this.genTypeForPrimitive((firstObject as any)[firstObjectKey], firstObjectKey)
            let secondType = this.genTypeForPrimitive((secondObject as any)[secondObjectKey], secondObjectKey)

            if (!this.isTypeEqual(firstType, secondType))
                return false
        }

        return true
    }

    private isClassSchemesEqual(firstClassScheme: ClassScheme, secondClassScheme: ClassScheme): boolean {
        if (firstClassScheme.name !== secondClassScheme.name)
            return false

        if (firstClassScheme.fields.length !== secondClassScheme.fields.length)
            return false

        for (let i in firstClassScheme.fields) {
            if (firstClassScheme.fields[i].name !== secondClassScheme.fields[i].name)
                return false

            if (
                !this.isTypeEqual(
                    firstClassScheme.fields[i].type,
                    secondClassScheme.fields[i].type
                )
            )
                return false
        }

        return true
    }

    private hasCustomType(type: Type, value: any): { type: CustomType, value: any } | null {
        if (type instanceof VectorType)
            return this.hasCustomType(type.item, value[0])
        if (type instanceof CustomType)
            return { type, value }

        return null
    }

    private getRandomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min)) + min;
    }
}