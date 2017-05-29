import JSONSchemeGenerator from "../infrastructure/schemeGeneration/JSONSchemeGenerator";
import JSONSchemeSource from "../infrastructure/schemeGeneration/sources/JSONSchemeSource";
import {deepStrictEqual} from "assert";
import ClassScheme from "../domain/schema/schema/ClassScheme";
import ClassField from "../domain/schema/schema/ClassField";
import NumberType from "../domain/schema/types/NumberType";
import StringType from "../domain/schema/types/StringType";
import AnyType from "../domain/schema/types/AnyType";
import BooleanType from "../domain/schema/types/BooleanType";
import CustomType from "../domain/schema/types/CustomType";
import VectorType from "../domain/schema/types/VectorType";

let schemeGenerator = new JSONSchemeGenerator()

export function testBaseTypes() {
    let source = new JSONSchemeSource({
        a: 1,
        b: '2',
        c: true,
        d: null,
        e: undefined
    })

    let generatedScheme = schemeGenerator.generate(source)
    let expectedScheme = [
        new ClassScheme(
            'Root',
            [
                new ClassField('a', new NumberType(), ''),
                new ClassField('b', new StringType(), ''),
                new ClassField('c', new BooleanType(), ''),
                new ClassField('d', new AnyType(), ''),
                new ClassField('e', new AnyType(), '')
            ]
        )
    ]

    deepStrictEqual(expectedScheme, generatedScheme)
}

export function testCustomTypes() {
    let source = new JSONSchemeSource({
        a: {
            a: 1,
            b: '2',
            c: true,
            d: null,
            e: undefined
        }
    })

    let generatedScheme = schemeGenerator.generate(source)
    let expectedScheme = [
        new ClassScheme(
            'A',
            [
                new ClassField('a', new NumberType(), ''),
                new ClassField('b', new StringType(), ''),
                new ClassField('c', new BooleanType(), ''),
                new ClassField('d', new AnyType(), ''),
                new ClassField('e', new AnyType(), '')
            ]
        ),

        new ClassScheme(
            'Root',
            [
                new ClassField('a', new CustomType('A'), '')
            ]
        )
    ]

    deepStrictEqual(expectedScheme, generatedScheme)
}

export function testVectorType() {
    let source = new JSONSchemeSource({
        a: {
            a: [1],
            b: ['2'],
            c: [true],
            d: [null],
            e: [undefined],
            f: [{ a: 1 }]
        }
    })

    let generatedScheme = schemeGenerator.generate(source)
    let expectedScheme = [
        new ClassScheme(
            'F',
            [
                new ClassField('a', new NumberType(), '')
            ]
        ),

        new ClassScheme(
            'A',
            [
                new ClassField('a', new VectorType(new NumberType()), ''),
                new ClassField('b', new VectorType(new StringType()), ''),
                new ClassField('c', new VectorType(new BooleanType()), ''),
                new ClassField('d', new VectorType(new AnyType()), ''),
                new ClassField('e', new VectorType(new AnyType()), ''),
                new ClassField('f', new VectorType(new CustomType('F')), '')
            ]
        ),

        new ClassScheme(
            'Root',
            [
                new ClassField('a', new CustomType('A'), '')
            ]
        )
    ]

    deepStrictEqual(expectedScheme, generatedScheme)
}